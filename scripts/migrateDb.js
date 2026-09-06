const { Client } = require('pg');

const client = new Client({
  host: 'db.bcpisnqisnhiuxwhjuvo.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'DebAyush@31',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log("Connecting to Supabase PostgreSQL database...");
    await client.connect();
    console.log("Connected!");

    console.log("Creating database tables...");

    // 1. Profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT DEFAULT 'Student',
        avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log("✓ Created table: public.profiles");

    // 2. Study Sessions table (for real daily learning & challenge hours)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.study_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        study_date DATE NOT NULL,
        learning_hours NUMERIC(4,1) DEFAULT 0,
        challenge_hours NUMERIC(4,1) DEFAULT 0,
        total_hours NUMERIC(4,1) DEFAULT 0,
        topic_title TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log("✓ Created table: public.study_sessions");

    // 3. Topic Progress table (for live course completion %, completed lessons, points)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.topic_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        topic_id TEXT NOT NULL,
        progress_percent INT DEFAULT 0,
        completed_lessons TEXT[] DEFAULT '{}',
        watching_time_minutes INT DEFAULT 0,
        points_earned INT DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(user_id, topic_id)
      );
    `);
    console.log("✓ Created table: public.topic_progress");

    // 4. Study Tasks table (for the dashboard calendar and + Add Task feature)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.study_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        task_date DATE NOT NULL,
        is_completed BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log("✓ Created table: public.study_tasks");

    // 5. AI Chat Messages table (stores conversation with Ask AI tutor)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        topic_id TEXT NOT NULL,
        lesson_id TEXT,
        role TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log("✓ Created table: public.ai_chat_messages");

    // 6. Seed Demo User: Sabrina Gomez
    console.log("Seeding default demo student profile...");
    const userRes = await client.query(`
      INSERT INTO public.profiles (email, password_hash, full_name, role, avatar_url)
      VALUES (
        'student@technocat.edu',
        'techno123',
        'Sabrina Gomez',
        'Student',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
      )
      ON CONFLICT (email) DO UPDATE 
      SET full_name = EXCLUDED.full_name
      RETURNING id, full_name, email;
    `);

    const demoUserId = userRes.rows[0].id;
    console.log(`Demo student user ID: ${demoUserId}`);

    // Seed Study Sessions for the past 7 days matching the realistic Sun-Sat hours
    console.log("Seeding study sessions...");
    await client.query(`DELETE FROM public.study_sessions WHERE user_id = $1`, [demoUserId]);

    const sessions = [
      { dayOffset: 6, learning: 5.0, challenge: 4.0, title: 'Speed Maths & Fractions' },
      { dayOffset: 5, learning: 7.5, challenge: 6.0, title: 'Percentages & Profit Loss' },
      { dayOffset: 4, learning: 5.0, challenge: 4.2, title: 'Ratio & Mixtures' },
      { dayOffset: 3, learning: 6.0, challenge: 5.0, title: 'Time Speed Distance' },
      { dayOffset: 2, learning: 6.0, challenge: 5.2, title: 'Number Systems' },
      { dayOffset: 1, learning: 3.8, challenge: 3.2, title: 'Reading Comprehension' },
      { dayOffset: 0, learning: 2.8, challenge: 2.2, title: 'DILR Tournaments' },
    ];

    for (const s of sessions) {
      const d = new Date();
      d.setDate(d.getDate() - s.dayOffset);
      const dateStr = d.toISOString().split('T')[0];
      const total = (s.learning + s.challenge).toFixed(1);

      await client.query(`
        INSERT INTO public.study_sessions (user_id, study_date, learning_hours, challenge_hours, total_hours, topic_title)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [demoUserId, dateStr, s.learning, s.challenge, total, s.title]);
    }
    console.log("✓ Seeded 7 days of realistic study sessions");

    // Seed Topic Progress
    console.log("Seeding topic progress records...");
    const topicsProgress = [
      {
        topic_id: 'qa-quantitative-ability',
        percent: 32,
        lessons: ['qa-0-1', 'qa-0-2', 'qa-0-3', 'qa-1-1'],
        watching: 280,
        points: 40
      },
      {
        topic_id: 'dilr-data-interpretation',
        percent: 25,
        lessons: ['dilr-1-1', 'dilr-1-2'],
        watching: 160,
        points: 25
      },
      {
        topic_id: 'varc-verbal-ability',
        percent: 20,
        lessons: ['varc-1-1', 'varc-1-2'],
        watching: 140,
        points: 20
      },
      {
        topic_id: 'mastering-illustration',
        percent: 15,
        lessons: ['1'],
        watching: 150,
        points: 15
      }
    ];

    for (const tp of topicsProgress) {
      await client.query(`
        INSERT INTO public.topic_progress (user_id, topic_id, progress_percent, completed_lessons, watching_time_minutes, points_earned)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, topic_id) DO UPDATE
        SET progress_percent = EXCLUDED.progress_percent,
            completed_lessons = EXCLUDED.completed_lessons,
            watching_time_minutes = EXCLUDED.watching_time_minutes,
            points_earned = EXCLUDED.points_earned;
      `, [demoUserId, tp.topic_id, tp.percent, tp.lessons, tp.watching, tp.points]);
    }
    console.log("✓ Seeded topic progress");

    // Seed Calendar Tasks
    console.log("Seeding calendar study tasks...");
    await client.query(`DELETE FROM public.study_tasks WHERE user_id = $1`, [demoUserId]);

    const tasks = [
      { title: 'Complete QA-1.2 Successive Percentage drill', date: '2026-05-24', done: true },
      { title: 'Watch Gejo RC Inference lecture', date: '2026-05-24', done: false },
      { title: 'Solve 4 DILR Tournament Sets', date: '2026-05-25', done: false },
      { title: 'TechnoCAT Weekly Sectional Mock Test', date: '2026-05-27', done: false }
    ];

    for (const t of tasks) {
      await client.query(`
        INSERT INTO public.study_tasks (user_id, title, task_date, is_completed)
        VALUES ($1, $2, $3, $4)
      `, [demoUserId, t.title, t.date, t.done]);
    }
    console.log("✓ Seeded calendar tasks");

    console.log("\n✅ All database tables created and seeded successfully!");
    await client.end();
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

runMigration();
