const { Pool } = require('pg');

const pool = new Pool({ 
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.bcpisnqisnhiuxwhjuvo',
  password: 'DebAyush@31',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const run = async () => {
  try {
    const userRes = await pool.query("SELECT id FROM profiles WHERE email = 'student@technocat.edu'");
    if (userRes.rows.length === 0) {
      console.log('User not found');
      return;
    }
    const userId = userRes.rows[0].id;

    const mockRes = await pool.query(
      "INSERT INTO mock_tests (title, total_questions) VALUES ('CAT 2026 Mock #1', 66) RETURNING id"
    );
    const mockId = mockRes.rows[0].id;

    const attemptRes = await pool.query(
      "INSERT INTO mock_attempts (user_id, mock_test_id, score, accuracy_percent, attempted_questions, time_used_seconds) VALUES ($1, $2, 72, 81, 48, 7120) RETURNING id",
      [userId, mockId]
    );
    const attemptId = attemptRes.rows[0].id;

    await pool.query(
      "INSERT INTO mock_section_results (attempt_id, section_name, score, accuracy_percent, attempted, average_time_seconds, correct, wrong, unanswered) VALUES ($1, 'VARC', 30, 85, 15, 120, 12, 3, 9), ($1, 'DILR', 18, 75, 12, 200, 8, 4, 8), ($1, 'QA', 24, 82, 14, 150, 10, 4, 8)",
      [attemptId]
    );

    console.log('Seed successful');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
};
run();
