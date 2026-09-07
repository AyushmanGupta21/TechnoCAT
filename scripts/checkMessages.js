const { Pool } = require('pg');

const pool = new Pool({
  host: 'db.bcpisnqisnhiuxwhjuvo.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'KoJPbri8cQ5rAwtN',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query('SELECT role, message, created_at FROM public.ai_chat_messages ORDER BY created_at DESC LIMIT 6');
    console.log('Last 6 AI Chat Messages in Supabase:');
    for (const r of res.rows) {
      console.log('--- [' + r.role.toUpperCase() + '] (' + r.created_at.toISOString() + ') ---');
      console.log(r.message.slice(0, 160) + '...\n');
    }
    await pool.end();
  } catch (e) {
    console.error(e);
  }
}

main();
