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

    // Delete existing mocks for this user to start fresh with a nice sequence
    await pool.query("DELETE FROM mock_attempts WHERE user_id = $1", [userId]);

    const mocksToCreate = [
      { title: 'CAT 2025 Mock #1', score: 45, acc: 60, att: 32, time: 7000, 
        sec: { v_s: 18, v_a: 65, v_att: 10, d_s: 12, d_a: 55, d_att: 8, q_s: 15, q_a: 60, q_att: 14 } },
      { title: 'CAT 2025 Mock #2', score: 52, acc: 65, att: 35, time: 7100, 
        sec: { v_s: 22, v_a: 70, v_att: 12, d_s: 14, d_a: 60, d_att: 9, q_s: 16, q_a: 62, q_att: 14 } },
      { title: 'CAT 2025 Mock #3', score: 60, acc: 72, att: 40, time: 7150, 
        sec: { v_s: 25, v_a: 75, v_att: 13, d_s: 15, d_a: 65, d_att: 10, q_s: 20, q_a: 72, q_att: 17 } },
      { title: 'CAT 2026 Mock #1', score: 68, acc: 78, att: 44, time: 7200, 
        sec: { v_s: 28, v_a: 80, v_att: 14, d_s: 18, d_a: 70, d_att: 11, q_s: 22, q_a: 78, q_att: 19 } },
      { title: 'CAT 2026 Mock #2', score: 76, acc: 83, att: 48, time: 7120, 
        sec: { v_s: 32, v_a: 85, v_att: 15, d_s: 20, d_a: 75, d_att: 12, q_s: 24, q_a: 82, q_att: 21 } }
    ];

    for (let i = 0; i < mocksToCreate.length; i++) {
      const mock = mocksToCreate[i];
      const mockRes = await pool.query(
        "INSERT INTO mock_tests (title, total_questions) VALUES ($1, 66) RETURNING id",
        [mock.title]
      );
      const mockId = mockRes.rows[0].id;

      const attemptRes = await pool.query(
        "INSERT INTO mock_attempts (user_id, mock_test_id, score, accuracy_percent, attempted_questions, time_used_seconds) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [userId, mockId, mock.score, mock.acc, mock.att, mock.time]
      );
      const attemptId = attemptRes.rows[0].id;

      await pool.query(
        "INSERT INTO mock_section_results (attempt_id, section_name, score, accuracy_percent, attempted, average_time_seconds, correct, wrong, unanswered) VALUES ($1, 'VARC', $2, $3, $4, 130, 0, 0, 0), ($1, 'DILR', $5, $6, $7, 210, 0, 0, 0), ($1, 'QA', $8, $9, $10, 160, 0, 0, 0)",
        [attemptId, mock.sec.v_s, mock.sec.v_a, mock.sec.v_att, mock.sec.d_s, mock.sec.d_a, mock.sec.d_att, mock.sec.q_s, mock.sec.q_a, mock.sec.q_att]
      );
    }
    
    console.log('Seeded 5 mocks successfully');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
};
run();
