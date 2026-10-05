import { Pool, types } from "pg";
import { CURRICULUM_TASKS_TEMPLATE } from "@/data/curriculumScheduleData";

// Force PostgreSQL DATE column (OID 1082) to always parse as a clean 'YYYY-MM-DD' string
// to avoid local/UTC timezone shifts when serializing task dates.
types.setTypeParser(1082, (val: string) => val);

// Create a single shared PostgreSQL connection pool for server-side routes
let pool: Pool;

// Candidate passwords for self-healing pooler connection
const CANDIDATE_PASSWORDS = [
  "DebAyush@31",
  process.env.PGPASSWORD,
  "KoJPbri8cQ5rAwtN",
].filter((pw, idx, arr): pw is string => Boolean(pw) && arr.indexOf(pw) === idx);

let activePasswordIndex = 0;

// Helper function to resolve IPv4 pooler for Supabase in Vercel/serverless environments
function createPgPool(overridePassword?: string): Pool {
  const effectivePassword = overridePassword || CANDIDATE_PASSWORDS[activePasswordIndex] || "DebAyush@31";

  let host = process.env.PGHOST || "aws-0-ap-southeast-1.pooler.supabase.com";
  let port = parseInt(process.env.PGPORT || "6543", 10);
  let user = process.env.PGUSER || "postgres.bcpisnqisnhiuxwhjuvo";

  // Enforce the Supabase IPv4 pooler and tenant username so Vercel never attempts
  // direct IPv6 connections or un-namespaced 'postgres' auth which fails on poolers.
  if (!host || host.includes("db.bcpisnqisnhiuxwhjuvo.supabase.co")) {
    host = "aws-0-ap-southeast-1.pooler.supabase.com";
    port = 6543;
  }
  if (!user || user === "postgres" || !user.includes(".")) {
    user = "postgres.bcpisnqisnhiuxwhjuvo";
  }

  return new Pool({
    host,
    port,
    user,
    password: effectivePassword,
    database: process.env.PGDATABASE || "postgres",
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  });
}


if (!global._pgPool) {
  global._pgPool = createPgPool();
}
pool = global._pgPool;

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number | null }> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === "development") {
      console.log("[PostgreSQL Exec]", { text: text.slice(0, 80), duration: `${duration}ms`, rows: res.rowCount });
    }
    return res;
  } catch (error: any) {
    // If password authentication failed (error 28P01), automatically try alternate candidate credentials
    if (error?.code === "28P01" || error?.message?.includes("password authentication failed")) {
      console.warn(`[PostgreSQL Auth] Password authentication failed. Trying alternate credentials...`);
      for (let i = 0; i < CANDIDATE_PASSWORDS.length; i++) {
        if (i === activePasswordIndex) continue;
        const candidate = CANDIDATE_PASSWORDS[i];
        try {
          const fallbackPool = createPgPool(candidate);
          const res = await fallbackPool.query(text, params);
          const oldPool = pool;
          pool = fallbackPool;
          global._pgPool = fallbackPool;
          activePasswordIndex = i;
          oldPool.end().catch(() => {});
          console.log(`[PostgreSQL Auth] Successfully re-authenticated with candidate credential #${i}.`);
          return res;
        } catch (retryErr: any) {
          if (retryErr?.code === "28P01" || retryErr?.message?.includes("password authentication failed")) {
            continue;
          }
          throw retryErr;
        }
      }
    }
    console.error("[PostgreSQL Error]", { text, error: error.message });
    throw error;
  }
}

// ── User / Profiles Helpers ──
export async function getProfileByEmail(email: string) {
  const res = await query(
    `SELECT id, email, password_hash, full_name, role, avatar_url, phone, target_year, dream_school, preferences, created_at 
     FROM public.profiles 
     WHERE LOWER(email) = LOWER($1) 
     LIMIT 1`,
    [email]
  );
  return res.rows[0] || null;
}

export async function getProfileById(id: string) {
  const res = await query(
    `SELECT id, email, password_hash, full_name, role, avatar_url, phone, target_year, dream_school, preferences, created_at 
     FROM public.profiles 
     WHERE id = $1 
     LIMIT 1`,
    [id]
  );
  return res.rows[0] || null;
}

export async function updateProfilePassword(id: string, newPasswordHash: string) {
  await query(
    `UPDATE public.profiles 
     SET password_hash = $1 
     WHERE id = $2`,
    [newPasswordHash, id]
  );
}

export async function updateProfile(
  id: string,
  updates: {
    fullName?: string;
    avatarUrl?: string | null;
    phone?: string;
    targetYear?: string;
    dreamSchool?: string;
    preferences?: any;
  }
) {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (updates.fullName !== undefined) {
    fields.push(`full_name = $${paramIdx++}`);
    values.push(updates.fullName);
  }
  if (updates.avatarUrl !== undefined) {
    fields.push(`avatar_url = $${paramIdx++}`);
    values.push(updates.avatarUrl);
  }
  if (updates.phone !== undefined) {
    fields.push(`phone = $${paramIdx++}`);
    values.push(updates.phone);
  }
  if (updates.targetYear !== undefined) {
    fields.push(`target_year = $${paramIdx++}`);
    values.push(updates.targetYear);
  }
  if (updates.dreamSchool !== undefined) {
    fields.push(`dream_school = $${paramIdx++}`);
    values.push(updates.dreamSchool);
  }
  if (updates.preferences !== undefined) {
    fields.push(`preferences = $${paramIdx++}`);
    values.push(JSON.stringify(updates.preferences));
  }

  if (fields.length === 0) return null;

  values.push(id);
  const sql = `UPDATE public.profiles SET ${fields.join(", ")} WHERE id = $${paramIdx} RETURNING id, email, full_name, role, avatar_url, phone, target_year, dream_school, preferences, created_at`;
  const res = await query(sql, values);
  return res.rows[0] || null;
}

export async function deleteProfile(id: string) {
  try {
    await query(`DELETE FROM public.topic_progress WHERE user_id = $1`, [id]).catch(() => {});
    await query(`DELETE FROM public.study_tasks WHERE user_id = $1`, [id]).catch(() => {});
    await query(`DELETE FROM public.study_sessions WHERE user_id = $1`, [id]).catch(() => {});
    await query(`DELETE FROM public.pyq_attempts WHERE user_id = $1`, [id]).catch(() => {});
    await query(`DELETE FROM public.user_course_enrollments WHERE user_id = $1`, [id]).catch(() => {});
    await query(`DELETE FROM public.user_module_progress WHERE user_id = $1`, [id]).catch(() => {});
  } catch (err) {
    console.warn("[DeleteProfile non-fatal cleanup warning]", err);
  }

  const res = await query(`DELETE FROM public.profiles WHERE id = $1 RETURNING id`, [id]);
  return Boolean(res.rowCount && res.rowCount > 0);
}

export async function createProfile(email: string, passwordHash: string, fullName: string) {
  const res = await query(
    `INSERT INTO public.profiles (email, password_hash, full_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, full_name, role, avatar_url, created_at`,
    [email, passwordHash, fullName]
  );
  const user = res.rows[0];

  // NOTE: Only seed starter mock data if it is the demo account ("student@technocat.edu").
  // Real accounts start clean with real data and real progress.
  if (email.toLowerCase() === "student@technocat.edu") {
    try {
      await query(
        `INSERT INTO public.topic_progress (user_id, topic_id, progress_percent, completed_lessons, watching_time_minutes, points_earned)
         VALUES 
           ($1, 'qa-quantitative-ability', 74, '{l1,l2,l3}'::text[], 480, 240),
           ($1, 'varc-verbal-ability', 45, '{l1,l2}'::text[], 320, 160),
           ($1, 'dilr-data-interpretation', 30, '{l1}'::text[], 200, 100)
         ON CONFLICT (user_id, topic_id) DO NOTHING`,
        [user.id]
      );

      const todayStr = new Date().toISOString().split("T")[0];
      await query(
        `INSERT INTO public.study_tasks (user_id, title, task_date, is_completed)
         VALUES ($1, 'Begin QA-1.1 Percentage Foundations', $2, false)`,
        [user.id, todayStr]
      );

      const days = [6, 5, 4, 3, 2, 1, 0];
      for (const d of days) {
        const dateObj = new Date();
        dateObj.setDate(dateObj.getDate() - d);
        const dStr = dateObj.toISOString().split("T")[0];
        await query(
          `INSERT INTO public.study_sessions (user_id, study_date, learning_hours, challenge_hours, total_hours, topic_title)
           VALUES ($1, $2, 3.0, 2.0, 5.0, 'CAT Prep Orientation')`,
          [user.id, dStr]
        );
      }
    } catch (seedErr) {
      console.warn("[Seed Demo User Data Warning]", seedErr);
    }
  }

  return user;
}

// ── Dashboard Data Aggregation ──
export async function getDashboardData(userId: string) {
  // Check if this user is the demo user
  const userProfile = await getProfileById(userId);
  const isDemo = userProfile?.email?.toLowerCase() === "student@technocat.edu";

  // 1. Topic progress summary
  const progressRes = await query(
    `SELECT topic_id, progress_percent, completed_lessons, watching_time_minutes, points_earned, updated_at
     FROM public.topic_progress
     WHERE user_id = $1`,
    [userId]
  );

  const rows = progressRes.rows;
  const enrolledTopics = rows.map((r) => r.topic_id);
  // All enrolled topics with progress < 100% count as in-progress
  const inProgressTopics = rows.filter((r) => (r.progress_percent || 0) < 100);
  const completedTopics = rows.filter((r) => (r.progress_percent || 0) === 100);

  const inProgressCount = inProgressTopics.length;
  const completedCount = completedTopics.length;
  const totalWatchingMinutes = rows.reduce((sum, r) => sum + (r.watching_time_minutes || 0), 0);
  const totalPointsEarned = rows.reduce((sum, r) => sum + (r.points_earned || 0), 0);

  const hours = Math.floor(totalWatchingMinutes / 60);
  const mins = totalWatchingMinutes % 60;
  const watchingTimeString = `${hours}h ${mins} min`;

  // 2. Study sessions for the past 7 days (Sun through Sat)
  const sessionsRes = await query(
    `SELECT study_date, learning_hours, challenge_hours, total_hours 
     FROM public.study_sessions 
     WHERE user_id = $1 
     ORDER BY study_date ASC 
     LIMIT 7`,
    [userId]
  );

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const recordedSessions = sessionsRes.rows || [];

  let weeklyStats: any[] = [];
  if (recordedSessions.length > 0) {
    weeklyStats = recordedSessions.map((s, idx) => {
      const d = new Date(s.study_date);
      const dayName = dayNames[d.getDay()] || dayNames[idx % 7];
      return {
        day: dayName,
        learning: Math.round(parseFloat(s.learning_hours || "0") * 10),
        challenge: Math.round(parseFloat(s.challenge_hours || "0") * 10),
        rawLearning: parseFloat(s.learning_hours || "0"),
        rawChallenge: parseFloat(s.challenge_hours || "0"),
      };
    });
  } else if (isDemo) {
    // Demo user fallback
    weeklyStats = [
      { day: "Sun", learning: 50, challenge: 40, rawLearning: 2.5, rawChallenge: 1.8 },
      { day: "Mon", learning: 75, challenge: 60, rawLearning: 4.2, rawChallenge: 2.9 },
      { day: "Tue", learning: 50, challenge: 42, rawLearning: 3.1, rawChallenge: 2.0 },
      { day: "Wed", learning: 60, challenge: 50, rawLearning: 3.8, rawChallenge: 2.6 },
      { day: "Thu", learning: 60, challenge: 52, rawLearning: 4.0, rawChallenge: 3.1 },
      { day: "Fri", learning: 38, challenge: 32, rawLearning: 2.2, rawChallenge: 1.5 },
      { day: "Sat", learning: 28, challenge: 22, rawLearning: 1.8, rawChallenge: 1.0 },
    ];
  } else {
    // Real user with 0 sessions: 7 clean zero-days of the current week
    const today = new Date();
    weeklyStats = [6, 5, 4, 3, 2, 1, 0].map((dOffset) => {
      const date = new Date(today);
      date.setDate(date.getDate() - dOffset);
      return {
        day: dayNames[date.getDay()],
        learning: 0,
        challenge: 0,
        rawLearning: 0,
        rawChallenge: 0,
      };
    });
  }

  // Calculate weekly totals
  const totalLearning = weeklyStats.reduce((sum, item) => sum + (item.rawLearning || 0), 0);
  const totalChallenge = weeklyStats.reduce((sum, item) => sum + (item.rawChallenge || 0), 0);
  const totalWeek = Math.round(totalLearning + totalChallenge);
  const avgDay = Math.round((totalWeek / 7) * 10) / 10;

  // 3. Ensure study tasks are auto-populated from curriculum for enrolled topics if not present
  const topicsToUse = enrolledTopics.length > 0
    ? enrolledTopics
    : (isDemo ? ["qa-quantitative-ability", "dilr-data-interpretation", "varc-verbal-ability"] : []);
  if (topicsToUse.length > 0) {
    await ensureCurriculumTasksForUser(userId, topicsToUse);
  }

  const tasksRes = await query(
    `SELECT id, title, task_date, is_completed, category, code, time_range, duration, subtitle 
     FROM public.study_tasks 
     WHERE user_id = $1 
     ORDER BY task_date ASC, created_at ASC`,
    [userId]
  );

  return {
    isDemo,
    enrolledTopics,
    metrics: {
      inProgressCourses: inProgressCount,
      completedCourses: completedCount,
      watchingTime: watchingTimeString,
      watchingTimeMinutes: totalWatchingMinutes,
      pointsEarned: totalPointsEarned,
    },
    detailed: {
      inProgressTopics: inProgressTopics,
      completedTopics: completedTopics,
      watchingHistory: inProgressTopics.concat(completedTopics)
        .filter(t => t.watching_time_minutes > 0)
        .sort((a, b) => b.watching_time_minutes - a.watching_time_minutes),
      pointsHistory: inProgressTopics.concat(completedTopics)
        .filter(t => t.points_earned > 0)
        .sort((a, b) => b.points_earned - a.points_earned)
    },
    weeklyStats,
    summary: {
      totalHoursWeek: totalWeek,
      avgHoursDay: avgDay,
      courseHoursWeek: Math.round(totalLearning),
      challengeHoursWeek: Math.round(totalChallenge),
    },
    tasks: tasksRes.rows,
  };
}

// ── Automatic Curriculum Task Population (Continuous 30-Day Rolling Window) ──
export async function ensureCurriculumTasksForUser(userId: string, enrolledTopics: string[]) {
  try {
    const topicsToSchedule = enrolledTopics.length > 0
      ? enrolledTopics
      : ["qa-quantitative-ability", "dilr-data-interpretation", "varc-verbal-ability"];

    const isEnrolledQA = topicsToSchedule.some(t => t.includes("qa") || t.includes("quant"));
    const isEnrolledDILR = topicsToSchedule.some(t => t.includes("dilr") || t.includes("data"));
    const isEnrolledVARC = topicsToSchedule.some(t => t.includes("varc") || t.includes("verbal"));

    // Rolling 30-day window: starts at 1st of current month up through (today + 30 days)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const todayDay = now.getDate();

    const startDate = new Date(currentYear, currentMonth, 1); // 1st of current month (e.g. Oct 1)
    const todayDate = new Date(currentYear, currentMonth, todayDay);
    const rollingEndDate = new Date(currentYear, currentMonth, todayDay + 30); // 30-day rolling window

    const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-01`;
    const rollingEndStr = `${rollingEndDate.getFullYear()}-${String(rollingEndDate.getMonth() + 1).padStart(2, "0")}-${String(rollingEndDate.getDate()).padStart(2, "0")}`;
    const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, "0")}-${String(todayDate.getDate()).padStart(2, "0")}`;

    // Fetch existing task dates for this user in this rolling window range
    const existingDatesRes = await query(
      `SELECT DISTINCT task_date::text as task_date 
       FROM public.study_tasks 
       WHERE user_id = $1 AND task_date >= $2 AND task_date <= $3`,
      [userId, startDateStr, rollingEndStr]
    );

    const existingDateSet = new Set(existingDatesRes.rows.map((r: any) => r.task_date));

    // Iterate through every single day in the continuous range [startDate, rollingEndDate]
    const cur = new Date(startDate);
    while (cur <= rollingEndDate) {
      const curYear = cur.getFullYear();
      const curMonth = cur.getMonth(); // 0-indexed (9 for Oct, 10 for Nov)
      const curDay = cur.getDate();
      const curDateStr = `${curYear}-${String(curMonth + 1).padStart(2, "0")}-${String(curDay).padStart(2, "0")}`;

      // If this date is NOT yet populated, assign from curriculum template
      if (!existingDateSet.has(curDateStr)) {
        let templateMatches = CURRICULUM_TASKS_TEMPLATE.filter(
          (t) => t.monthIndex === curMonth && t.day === curDay && t.year === curYear
        );

        // Fallback: If template is keyed by general day, match day and appropriate month
        if (templateMatches.length === 0) {
          templateMatches = CURRICULUM_TASKS_TEMPLATE.filter(
            (t) => t.day === curDay && (t.monthIndex === curMonth || t.monthIndex === 9 || t.monthIndex === 10)
          );
        }

        // Filter by enrolled categories
        const filteredMatches = templateMatches.filter((t) => {
          if (t.category === "QA" && !isEnrolledQA) return false;
          if (t.category === "DILR" && !isEnrolledDILR) return false;
          if (t.category === "VARC" && !isEnrolledVARC) return false;
          return true;
        });

        // Insert tasks for this date
        for (const t of filteredMatches) {
          // Status: Day 1 of month marked completed; other past days uncompleted (overdue backlog); today & future uncompleted
          let isCompleted = false;
          if (curDateStr < todayStr && curDay === 1) {
            isCompleted = true;
          }

          await query(
            `INSERT INTO public.study_tasks 
             (user_id, title, task_date, is_completed, category, code, time_range, duration, subtitle)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              userId,
              t.title,
              curDateStr,
              isCompleted,
              t.category,
              t.code,
              t.timeRange,
              t.duration,
              t.subtitle,
            ]
          ).catch(() => {});
        }
      }

      // Increment by 1 day
      cur.setDate(cur.getDate() + 1);
    }
  } catch (err) {
    console.error("[ensureCurriculumTasksForUser Error]", err);
  }
}

// ── Calendar Task Operations ──
export async function addStudyTask(
  userId: string,
  title: string,
  taskDate: string,
  category: string = "QA",
  code: string = "STUDY",
  timeRange: string = "Flexible",
  duration: string = "45 min",
  subtitle: string = "Personal Target Task"
) {
  const res = await query(
    `INSERT INTO public.study_tasks (user_id, title, task_date, category, code, time_range, duration, subtitle)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, title, task_date, is_completed, category, code, time_range, duration, subtitle`,
    [userId, title, taskDate, category, code, timeRange, duration, subtitle]
  );
  return res.rows[0];
}

export async function toggleStudyTask(userId: string, taskId: string, isCompleted: boolean) {
  const res = await query(
    `UPDATE public.study_tasks 
     SET is_completed = $1 
     WHERE id = $2 AND (user_id = $3 OR user_id IS NULL)
     RETURNING id, title, task_date, is_completed, category, code, time_range, duration, subtitle`,
    [isCompleted, taskId, userId]
  );
  return res.rows[0] || null;
}

// ── Topic Progress Operations ──
export async function updateLessonCompletion(userId: string, topicId: string, lessonId: string, totalLessonsInTopic: number) {
  // 1. Fetch current progress
  const current = await query(
    `SELECT completed_lessons, points_earned, watching_time_minutes 
     FROM public.topic_progress 
     WHERE user_id = $1 AND topic_id = $2`,
    [userId, topicId]
  );

  let completedList: string[] = [];
  let points = 10;
  let watchingMins = 30;

  if (current.rows.length > 0) {
    completedList = current.rows[0].completed_lessons || [];
    points = (current.rows[0].points_earned || 0) + 5;
    watchingMins = (current.rows[0].watching_time_minutes || 0) + 25;
  }

  if (!completedList.includes(lessonId)) {
    completedList.push(lessonId);
  }

  const percent = Math.min(100, Math.round((completedList.length / Math.max(1, totalLessonsInTopic)) * 100));

  const upsert = await query(
    `INSERT INTO public.topic_progress (user_id, topic_id, progress_percent, completed_lessons, watching_time_minutes, points_earned, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())
     ON CONFLICT (user_id, topic_id) DO UPDATE
     SET progress_percent = EXCLUDED.progress_percent,
         completed_lessons = EXCLUDED.completed_lessons,
         watching_time_minutes = EXCLUDED.watching_time_minutes,
         points_earned = EXCLUDED.points_earned,
         updated_at = now()
     RETURNING *`,
    [userId, topicId, percent, completedList, watchingMins, points]
  );

  return upsert.rows[0];
}

export async function getUserTopicProgress(userId: string) {
  const res = await query(
    `SELECT topic_id, progress_percent, completed_lessons, watching_time_minutes, points_earned 
     FROM public.topic_progress 
     WHERE user_id = $1`,
    [userId]
  );
  return res.rows || [];
}

export async function enrollUserInTopic(userId: string, topicId: string) {
  const res = await query(
    `INSERT INTO public.topic_progress (user_id, topic_id, progress_percent, completed_lessons, watching_time_minutes, points_earned, updated_at)
     VALUES ($1, $2, 0, '{}'::text[], 0, 0, now())
     ON CONFLICT (user_id, topic_id) DO NOTHING
     RETURNING *`,
    [userId, topicId]
  );

  // Auto-schedule curriculum tasks for this newly enrolled topic
  await ensureCurriculumTasksForUser(userId, [topicId]).catch(() => {});

  if (res.rows.length > 0) {
    return res.rows[0];
  }
  const existing = await query(
    `SELECT * FROM public.topic_progress WHERE user_id = $1 AND topic_id = $2`,
    [userId, topicId]
  );
  return existing.rows[0] || null;
}

// ── PYQ Attempts & Lockout Operations ──
export async function savePYQAttempt(attempt: {
  userId: string;
  year: number;
  slot: string;
  section: string;
  attemptNum: number;
  score: number;
  total: number;
  percentage: number;
  mcqCorrect?: number;
  mcqWrong?: number;
  titaCorrect?: number;
  titaWrong?: number;
  unattempted?: number;
  strikes?: number;
  timeTakenSeconds?: number;
  answers?: any;
  analysis?: any;
  isLocked?: boolean;
  weakAreas?: any;
}) {
  const res = await query(
    `INSERT INTO public.pyq_attempts (
      user_id, year, slot, section, attempt_num, score, total, percentage,
      mcq_correct, mcq_wrong, tita_correct, tita_wrong, unattempted,
      strikes, time_taken_seconds, answers, analysis, is_locked, weak_areas, completed_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, now())
    RETURNING *`,
    [
      attempt.userId,
      attempt.year,
      attempt.slot,
      attempt.section,
      attempt.attemptNum,
      attempt.score,
      attempt.total,
      attempt.percentage,
      attempt.mcqCorrect || 0,
      attempt.mcqWrong || 0,
      attempt.titaCorrect || 0,
      attempt.titaWrong || 0,
      attempt.unattempted || 0,
      attempt.strikes || 0,
      attempt.timeTakenSeconds || 0,
      JSON.stringify(attempt.answers || {}),
      JSON.stringify(attempt.analysis || {}),
      Boolean(attempt.isLocked),
      JSON.stringify(attempt.weakAreas || []),
    ]
  );
  return res.rows[0];
}

export async function getPYQAttempts(userId: string, section?: string, year?: number) {
  let q = `SELECT * FROM public.pyq_attempts WHERE user_id = $1`;
  const params: any[] = [userId];
  if (section) {
    params.push(section);
    q += ` AND section = $${params.length}`;
  }
  if (year) {
    params.push(year);
    q += ` AND year = $${params.length}`;
  }
  q += ` ORDER BY completed_at DESC`;
  const res = await query(q, params);
  return res.rows;
}

export async function unlockPYQSubject(userId: string, section: string) {
  // Clear locked state for this subject across all attempts
  await query(
    `UPDATE public.pyq_attempts 
     SET is_locked = false 
     WHERE user_id = $1 AND section = $2 AND is_locked = true`,
    [userId, section]
  );
}

