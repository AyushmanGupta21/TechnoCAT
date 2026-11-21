#!/usr/bin/env node
// Publish live classes and notices shown on every student's dashboard.
//
//   npm run announcements -- list
//   npm run announcements -- add-class --title "DILR: Games & Tournaments" --starts "2026-11-25 19:00" \
//        [--ends "2026-11-25 20:00"] [--section DILR] [--host "Faculty name"] [--link https://…] [--body "…"]
//   npm run announcements -- add-notice --title "Slot 3 PYQs are live" [--body "…"] [--link /browse] \
//        [--section GENERAL] [--expires "2026-12-01 00:00"]
//   npm run announcements -- remove <id>
//
// Times are interpreted as India time (IST, +05:30) unless they include an explicit offset.

import pg from "pg";
import { loadEnvFile, buildPoolConfig } from "./lib/db-env.mjs";

const SECTIONS = new Set(["VARC", "DILR", "QA", "GENERAL"]);

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const opts = {};
  const positional = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith("--")) opts[rest[i].slice(2)] = rest[++i];
    else positional.push(rest[i]);
  }
  return { command, opts, positional };
}

function parseIst(value, name) {
  if (!value) return null;
  const hasOffset = /([+-]\d{2}:?\d{2}|Z)$/.test(value.trim());
  const iso = value.trim().replace(" ", "T") + (hasOffset ? "" : "+05:30");
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid --${name}: "${value}" (use "YYYY-MM-DD HH:MM")`);
  return d.toISOString();
}

function section(value) {
  if (!value) return null;
  const s = value.toUpperCase();
  if (!SECTIONS.has(s)) throw new Error(`--section must be one of ${[...SECTIONS].join(", ")}`);
  return s;
}

async function main() {
  loadEnvFile();
  const { command, opts, positional } = parseArgs(process.argv.slice(2));
  const client = new pg.Client(buildPoolConfig());
  await client.connect();
  try {
    if (command === "list") {
      const res = await client.query(
        `SELECT id, kind, title, section, starts_at, expires_at, publish_at FROM public.announcements ORDER BY created_at DESC LIMIT 50`
      );
      if (res.rows.length === 0) console.log("No announcements.");
      for (const r of res.rows) {
        const when = r.kind === "live_class" ? `starts ${new Date(r.starts_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}` : `published ${new Date(r.publish_at).toLocaleDateString("en-IN")}`;
        console.log(`${r.id}  ${r.kind.padEnd(10)} ${(r.section || "").padEnd(7)} ${r.title}  (${when})`);
      }
    } else if (command === "add-class" || command === "add-notice") {
      if (!opts.title) throw new Error("--title is required");
      const isClass = command === "add-class";
      const startsAt = parseIst(opts.starts, "starts");
      if (isClass && !startsAt) throw new Error("--starts is required for a live class");
      const res = await client.query(
        `INSERT INTO public.announcements (kind, title, body, section, host, link_url, starts_at, ends_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          isClass ? "live_class" : "notice", opts.title, opts.body ?? null, section(opts.section), opts.host ?? null,
          opts.link ?? null, startsAt, parseIst(opts.ends, "ends"), parseIst(opts.expires, "expires"),
        ]
      );
      console.log(`Published ${isClass ? "live class" : "notice"} ${res.rows[0].id}`);
    } else if (command === "remove") {
      const id = positional[0];
      if (!id) throw new Error("Usage: remove <id>");
      const res = await client.query(`DELETE FROM public.announcements WHERE id = $1`, [id]);
      console.log(res.rowCount ? `Removed ${id}` : `No announcement with id ${id}`);
    } else {
      console.log("Commands: list | add-class | add-notice | remove <id>   (see header of scripts/announcements.mjs)");
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
