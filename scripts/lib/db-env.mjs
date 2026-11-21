// Shared helpers for DB maintenance scripts (migrations, introspection).
// Reads .env.local (without overriding variables already set in the environment) and
// builds the same pg connection config the app uses in src/lib/db.ts.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export function loadEnvFile(file = path.join(ROOT, ".env.local")) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export function buildPoolConfig() {
  const ssl = process.env.DATABASE_CA_CERT
    ? { ca: process.env.DATABASE_CA_CERT.replace(/\\n/g, "\n"), rejectUnauthorized: true }
    : { rejectUnauthorized: false };

  if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD) {
    return {
      ssl,
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || "5432", 10),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE || "postgres",
    };
  }
  if (process.env.DATABASE_URL) {
    return { ssl, connectionString: process.env.DATABASE_URL };
  }
  throw new Error("Database is not configured: set PG* variables or DATABASE_URL in .env.local");
}
