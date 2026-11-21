#!/usr/bin/env node
// Minimal, transactional SQL migration runner.
//
//   npm run db:migrate                 apply all pending migrations in db/migrations
//   npm run db:status                  list applied / pending migrations
//   node scripts/migrate.mjs --mark-applied 0001_baseline
//                                      record a migration as applied WITHOUT running it
//                                      (used once on the existing database for the baseline)
//
// Each file in db/migrations (NNNN_name.sql) runs inside its own transaction and is
// recorded in public.schema_migrations together with a checksum of its contents.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import pg from "pg";
import { ROOT, loadEnvFile, buildPoolConfig } from "./lib/db-env.mjs";

const MIGRATIONS_DIR = path.join(ROOT, "db", "migrations");

function listMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{4}_[\w-]+\.sql$/.test(f))
    .sort()
    .map((file) => {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      return {
        version: file.replace(/\.sql$/, ""),
        file,
        sql,
        checksum: crypto.createHash("sha256").update(sql).digest("hex").slice(0, 16),
      };
    });
}

async function main() {
  loadEnvFile();
  const args = process.argv.slice(2);
  const client = new pg.Client(buildPoolConfig());
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        version    TEXT PRIMARY KEY,
        checksum   TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const applied = new Map(
      (await client.query(`SELECT version, checksum FROM public.schema_migrations`)).rows.map((r) => [
        r.version,
        r.checksum,
      ])
    );
    const migrations = listMigrations();

    if (args[0] === "--status") {
      for (const m of migrations) {
        const state = applied.has(m.version)
          ? applied.get(m.version) === m.checksum
            ? "applied"
            : "applied (file changed since!)"
          : "PENDING";
        console.log(`${state.padEnd(30)} ${m.file}`);
      }
      return;
    }

    if (args[0] === "--mark-applied") {
      const target = migrations.find((m) => m.version === args[1]);
      if (!target) throw new Error(`Unknown migration: ${args[1]}`);
      await client.query(
        `INSERT INTO public.schema_migrations (version, checksum) VALUES ($1, $2)
         ON CONFLICT (version) DO UPDATE SET checksum = EXCLUDED.checksum`,
        [target.version, target.checksum]
      );
      console.log(`Marked ${target.file} as applied (not executed).`);
      return;
    }

    const pending = migrations.filter((m) => !applied.has(m.version));
    for (const m of migrations) {
      if (applied.has(m.version) && applied.get(m.version) !== m.checksum) {
        console.warn(`WARNING: ${m.file} was modified after being applied. Create a new migration instead.`);
      }
    }
    if (pending.length === 0) {
      console.log("Database is up to date.");
      return;
    }

    for (const m of pending) {
      process.stdout.write(`Applying ${m.file} ... `);
      try {
        await client.query("BEGIN");
        await client.query(m.sql);
        await client.query(`INSERT INTO public.schema_migrations (version, checksum) VALUES ($1, $2)`, [
          m.version,
          m.checksum,
        ]);
        await client.query("COMMIT");
        console.log("done");
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        console.log("FAILED");
        throw err;
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(`\nMigration error: ${err.message}`);
  process.exit(1);
});
