const { Client } = require('pg');

const client = new Client({
  host: 'db.bcpisnqisnhiuxwhjuvo.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'KoJPbri8cQ5rAwtN',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    console.log("Connecting to Supabase PostgreSQL at db.bcpisnqisnhiuxwhjuvo.supabase.co...");
    await client.connect();
    console.log("Connected successfully to Supabase PostgreSQL!");

    const res = await client.query('SELECT current_database(), current_user, version()');
    console.log("Database & User:", res.rows[0]);

    // Check existing tables in public schema
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Existing tables in public schema:", tablesRes.rows.map(r => r.table_name));

    await client.end();
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1);
  }
}

testConnection();
