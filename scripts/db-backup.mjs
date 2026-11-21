#!/usr/bin/env node
// Read-only logical backup: exports every table in the public schema to
// backups/<timestamp>/<table>.json plus a schema.json describing the columns.
//
//   npm run db:backup
//
// The backups folder is git-ignored: it contains personal data (emails, password hashes).
// Run this before applying migrations to the production database.

import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { ROOT, loadEnvFile, buildPoolConfig } from "./lib/db-env.mjs";

async function main() {
  loadEnvFile();
  const client = new pg.Client(buildPoolConfig());
  await client.connect();

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(ROOT, "backups", stamp);
  fs.mkdirSync(dir, { recursive: true });

  try {
    // Consistent snapshot across all tables.
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");

    const tables = (
      await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`)
    ).rows.map((r) => r.tablename);

    const schema = {};
    let total = 0;
    for (const t of tables) {
      schema[t] = (
        await client.query(
          `SELECT column_name, data_type, is_nullable, column_default
           FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1
           ORDER BY ordinal_position`,
          [t]
        )
      ).rows;
      const rows = (await client.query(`SELECT * FROM public."${t.replace(/"/g, '""')}"`)).rows;
      fs.writeFileSync(path.join(dir, `${t}.json`), JSON.stringify(rows, null, 2));
      total += rows.length;
      console.log(`${t.padEnd(32)} ${String(rows.length).padStart(6)} rows`);
    }
    fs.writeFileSync(path.join(dir, "schema.json"), JSON.stringify(schema, null, 2));
    await client.query("COMMIT");
    console.log(`\nBacked up ${tables.length} tables (${total} rows) to ${path.relative(ROOT, dir)}`);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(`Backup error: ${err.message}`);
  process.exit(1);
});
