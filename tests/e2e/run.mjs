#!/usr/bin/env node
// End-to-end tests against a running server (default http://localhost:3001).
//   npm run build && npm run start      (in one terminal)
//   npm run test:e2e                    (in another)
// Creates throwaway accounts (deleted at the end of each suite) in the configured database.
// The demo-account checks sign a session with JWT_SECRET from .env.local.

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { loadEnvFile, buildPoolConfig } from "../../scripts/lib/db-env.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
loadEnvFile();

const client = new pg.Client(buildPoolConfig());
await client.connect();
const demo = (await client.query(`SELECT id, email FROM profiles WHERE lower(email) = 'student@technocat.edu'`)).rows[0];
// Local runs create several accounts: reset signup/login limits for local client keys only.
await client.query(`DELETE FROM rate_limits WHERE key = ANY($1::text[]) OR key LIKE 'quiz-generate:%'`, [
  ["signup:unknown", "signup:::1", "signup:127.0.0.1", "login-ip:unknown", "login-ip:::1", "login-ip:127.0.0.1"],
]);
await client.end();
if (!demo) {
  console.error("Demo account not found");
  process.exit(1);
}

// Demo session token (same format as src/lib/auth/session.ts)
const now = Math.floor(Date.now() / 1000);
const payload = Buffer.from(JSON.stringify({ v: 1, sub: demo.id, email: demo.email, iat: now, exp: now + 3600 })).toString("base64url");
const demoToken = `${payload}.${crypto.createHmac("sha256", process.env.JWT_SECRET).update(payload).digest("base64url")}`;

const suites = [
  ["activity.test.mjs", [root, demoToken]],
  ["metrics.test.mjs", [root, demoToken]],
  ["quiz-generator.test.mjs", [demoToken]],
];

let failed = 0;
for (const [file, args] of suites) {
  console.log(`\n▶ ${file}`);
  const r = spawnSync(process.execPath, [path.join(here, file), ...args], { encoding: "utf8" });
  process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  failed += (r.stdout.match(/^FAIL/gm) || []).length + (r.status ? 1 : 0);
}
console.log(failed ? `\n${failed} failure(s)` : "\nAll e2e checks passed");
process.exit(failed ? 1 : 0);
