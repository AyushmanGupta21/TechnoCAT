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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.mock_tests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        total_questions INTEGER DEFAULT 66,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.mock_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        mock_test_id UUID REFERENCES public.mock_tests(id) ON DELETE CASCADE,
        score INTEGER DEFAULT 0,
        accuracy_percent INTEGER DEFAULT 0,
        attempted_questions INTEGER DEFAULT 0,
        time_used_seconds INTEGER DEFAULT 0,
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.mock_section_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        attempt_id UUID REFERENCES public.mock_attempts(id) ON DELETE CASCADE,
        section_name TEXT NOT NULL, -- 'VARC', 'DILR', 'QA'
        score INTEGER DEFAULT 0,
        accuracy_percent INTEGER DEFAULT 0,
        attempted INTEGER DEFAULT 0,
        average_time_seconds INTEGER DEFAULT 0,
        correct INTEGER DEFAULT 0,
        wrong INTEGER DEFAULT 0,
        unanswered INTEGER DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS public.mock_answers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        attempt_id UUID REFERENCES public.mock_attempts(id) ON DELETE CASCADE,
        section_name TEXT NOT NULL,
        topic_name TEXT,
        is_correct BOOLEAN,
        is_unanswered BOOLEAN,
        time_spent_seconds INTEGER DEFAULT 0
      );
    `);
    console.log('Mock tables created successfully.');
  } catch (err) {
    console.error('Error creating mock tables:', err);
  } finally {
    pool.end();
  }
};

run();
