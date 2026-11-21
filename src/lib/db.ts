import { Pool, types, type PoolConfig, type PoolClient } from "pg";
import { CURRICULUM_TASKS_TEMPLATE, type CurriculumTaskTemplate } from "@/data/curriculumScheduleData";
import { todayInAppTz, addDays } from "@/lib/time";
import { getTopicById } from "@/data/topicsData";
import { awardPoints } from "@/lib/points";
import { isDemoEmail } from "@/lib/demo";

// Force PostgreSQL DATE column (OID 1082) to always parse as a clean 'YYYY-MM-DD' string
// to avoid local/UTC timezone shifts when serializing task dates.
types.setTypeParser(1082, (val: string) => val);

// Create a single shared PostgreSQL connection pool for server-side routes.
//
// Credentials come ONLY from the environment (.env.local locally, project env vars in
// deployment). Either set PGHOST / PGPORT / PGUSER / PGPASSWORD / PGDATABASE, or a single
// DATABASE_URL. For Supabase on IPv4-only hosts (e.g. Vercel) use the pooler host
// (aws-0-<region>.pooler.supabase.com:6543) with the tenant user "postgres.<project-ref>".
//
// TLS: set DATABASE_CA_CERT to the Supabase CA certificate (PEM) to enable full
// certificate verification; without it the connection is encrypted but unverified.

function buildPoolConfig(): PoolConfig {
  const ssl = process.env.DATABASE_CA_CERT
    ? { ca: process.env.DATABASE_CA_CERT.replace(/\\n/g, "\n"), rejectUnauthorized: true }
    : { rejectUnauthorized: false };

  const shared = { ssl, max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 15000 };

  if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD) {
    return {
      ...shared,
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || "5432", 10),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE || "postgres",
    };
  }

  if (process.env.DATABASE_URL) {
    return { ...shared, connectionString: process.env.DATABASE_URL };
  }

  throw new Error(
    "Database is not configured. Set PGHOST, PGUSER, PGPASSWORD (and optionally PGPORT, PGDATABASE) " +
      "or DATABASE_URL in .env.local / deployment environment."
  );
}

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

// Created lazily so a missing configuration fails the request (with a clear log line)
// instead of crashing the build or module import.
function getPool(): Pool {
  if (!global._pgPool) {
    global._pgPool = new Pool(buildPoolConfig());
    global._pgPool.on("error", (err) => {
      console.error("[PostgreSQL Pool Error]", err.message);
    });
  }
  return global._pgPool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number | null }> {
  const start = Date.now();
  try {
    const res = await getPool().query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === "development") {
      console.log("[PostgreSQL Exec]", { text: text.slice(0, 80), duration: `${duration}ms`, rows: res.rowCount });
    }
    return res;
  } catch (error: any) {
    if (error?.code === "28P01") {
      console.error("[PostgreSQL Auth] Password authentication failed. Check PGPASSWORD / DATABASE_URL.");
    } else {
      console.error("[PostgreSQL Error]", { text: text.slice(0, 120), code: error?.code, error: error?.message });
    }
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

/** Anything that can run a query: the shared `query` helper or a transaction client. */
export type Queryable = { query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }> };

/** Run `fn` inside a single transaction on one pooled connection. */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Permanently deletes an account and everything it owns, atomically.
 * Tables with a FOREIGN KEY to profiles (topic_progress, study_tasks, study_sessions,
 * pyq_attempts, mock_attempts -> answers/sections, ai_chat_messages) are removed by
 * ON DELETE CASCADE. Tables keyed by a plain user id column are cleaned up explicitly.
 */
export async function deleteProfile(id: string) {
  return withTransaction(async (client) => {
    // Community: the user's votes/saves/reports, their comments (and replies to them via
    // post cascade), and their posts (cascade removes comments/votes/saves on those posts).
    await client.query(`DELETE FROM public.community_post_upvotes WHERE user_id = $1`, [id]);
    await client.query(`DELETE FROM public.community_comment_upvotes WHERE user_id = $1`, [id]);
    await client.query(`DELETE FROM public.community_saved_posts WHERE user_id = $1`, [id]);
    await client.query(`DELETE FROM public.community_reports WHERE user_id = $1`, [id]);
    await client.query(`DELETE FROM public.community_comments WHERE author_id = $1`, [id]);
    await client.query(`DELETE FROM public.community_posts WHERE author_id = $1`, [id]);
    // Intelligence Hub tracking.
    await client.query(`DELETE FROM public.analysis_views WHERE user_id = $1`, [id]);
    await client.query(`DELETE FROM public.user_challenges WHERE user_id = $1`, [id]);

    const res = await client.query(`DELETE FROM public.profiles WHERE id = $1 RETURNING id`, [id]);
    return Boolean(res.rowCount && res.rowCount > 0);
  });
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
  if (isDemoEmail(email)) {
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
  const isDemo = isDemoEmail(userProfile?.email);

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
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let weeklyStats: any[] = [];
  let totalWatchingMinutes = 0;
  let totalPointsEarned = 0;

  if (isDemo) {
    // Showcase account: prefilled sample numbers (see src/lib/demo.ts).
    totalWatchingMinutes = rows.reduce((sum, r) => sum + (r.watching_time_minutes || 0), 0);
    totalPointsEarned = rows.reduce((sum, r) => sum + (r.points_earned || 0), 0);
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
    // Real account: everything is derived from recorded activity and the points ledger.
    const [ledgerRes, activityRes] = await Promise.all([
      query(`SELECT points, reason, ref FROM public.points_ledger WHERE user_id = $1`, [userId]),
      query(
        `SELECT activity_date::text AS d, kind, topic_id, seconds FROM public.study_activity WHERE user_id = $1`,
        [userId]
      ),
    ]);

    // Per-topic lesson minutes and points, written onto the topic rows used by the UI.
    const lessonSecondsByTopic: Record<string, number> = {};
    for (const a of activityRes.rows) {
      if (a.kind === "lesson" && a.topic_id) lessonSecondsByTopic[a.topic_id] = (lessonSecondsByTopic[a.topic_id] || 0) + a.seconds;
    }
    const pointsByTopic: Record<string, number> = {};
    for (const p of ledgerRes.rows) {
      totalPointsEarned += p.points;
      let topicId: string | null = null;
      if (p.reason === "grand_quiz_passed") topicId = p.ref;
      else if (p.reason === "module_quiz_passed") topicId = String(p.ref).split("::")[0];
      else if (p.reason === "lesson_completed") topicId = rows.find((r) => getTopicLessonIds(r.topic_id).has(p.ref))?.topic_id ?? null;
      if (topicId) pointsByTopic[topicId] = (pointsByTopic[topicId] || 0) + p.points;
    }
    for (const r of rows) {
      r.watching_time_minutes = Math.round((lessonSecondsByTopic[r.topic_id] || 0) / 60);
      r.points_earned = pointsByTopic[r.topic_id] || 0;
    }
    totalWatchingMinutes = Math.round(
      activityRes.rows.filter((a) => a.kind === "lesson").reduce((s, a) => s + a.seconds, 0) / 60
    );

    // Last 7 days ending today (app timezone): lessons = learning, quizzes/PYQs = challenge.
    const today = todayInAppTz();
    weeklyStats = [6, 5, 4, 3, 2, 1, 0].map((offset) => {
      const date = addDays(today, -offset);
      const dayRows = activityRes.rows.filter((a) => a.d === date);
      const learningHours = dayRows.filter((a) => a.kind === "lesson").reduce((s, a) => s + a.seconds, 0) / 3600;
      const challengeHours = dayRows.filter((a) => a.kind !== "lesson").reduce((s, a) => s + a.seconds, 0) / 3600;
      const [y, m, d] = date.split("-").map(Number);
      return {
        day: dayNames[new Date(Date.UTC(y, m - 1, d)).getUTCDay()],
        date,
        learning: Math.round(learningHours * 10),
        challenge: Math.round(challengeHours * 10),
        rawLearning: Math.round(learningHours * 100) / 100,
        rawChallenge: Math.round(challengeHours * 100) / 100,
      };
    });
  }

  const hours = Math.floor(totalWatchingMinutes / 60);
  const mins = totalWatchingMinutes % 60;
  const watchingTimeString = `${hours}h ${mins} min`;

  // Calculate weekly totals
  const totalLearning = weeklyStats.reduce((sum, item) => sum + (item.rawLearning || 0), 0);
  const totalChallenge = weeklyStats.reduce((sum, item) => sum + (item.rawChallenge || 0), 0);
  const totalWeek = Math.round(totalLearning + totalChallenge);
  const avgDay = Math.round((totalWeek / 7) * 10) / 10;

  // 3. Study tasks are scheduled once at enrollment (scheduleCurriculumForTopic); only the
  //    demo showcase account is re-anchored around today.
  if (isDemo) {
    await ensureDemoShowcaseSchedule(userId);
  }

  const tasksRes = await query(
    `SELECT id, title, task_date, is_completed, category, code, time_range, duration, subtitle 
     FROM public.study_tasks 
     WHERE user_id = $1 
     ORDER BY task_date ASC, created_at ASC`,
    [userId]
  );

  // 4. Calculate real CAT Readiness metrics
  const readiness = await getUserReadinessMetrics(userId, rows);

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
    readiness,
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

export interface ReadinessMetrics {
  readiness: number;
  concepts: number;
  accuracy: number;
  speed: number;
  consistency: number;
  hasActivity: boolean;
}

export async function getUserReadinessMetrics(
  userId: string,
  preloadedTopicRows?: any[]
): Promise<ReadinessMetrics> {
  const zeroState: ReadinessMetrics = {
    readiness: 0,
    concepts: 0,
    accuracy: 0,
    speed: 0,
    consistency: 0,
    hasActivity: false,
  };

  try {
    const userProfile = await getProfileById(userId);
    const isDemo = isDemoEmail(userProfile?.email);

    // 1. Fetch real topic progress for Concept mastery (or use preloaded)
    let topicRows = preloadedTopicRows;
    if (!topicRows) {
      const progressRes = await query(
        `SELECT topic_id, progress_percent, completed_lessons, points_earned
         FROM public.topic_progress
         WHERE user_id = $1`,
        [userId]
      );
      topicRows = progressRes.rows || [];
    }

    const totalLessonsCompleted = topicRows.reduce((sum: number, r: any) => {
      if (Array.isArray(r.completed_lessons)) return sum + r.completed_lessons.length;
      if (typeof r.completed_lessons === "string") {
        const cleaned = r.completed_lessons.replace(/^\{|\}$/g, "").trim();
        return sum + (cleaned ? cleaned.split(",").length : 0);
      }
      return sum;
    }, 0);

    const avgProgressPercent = topicRows.length > 0
      ? Math.round(topicRows.reduce((sum: number, r: any) => sum + (Number(r.progress_percent) || 0), 0) / topicRows.length)
      : 0;

    // 2. Fetch real PYQ / Mock attempts for Accuracy, Speed, and Consistency
    const attemptsRes = await query(
      `SELECT score, total, percentage, mcq_correct, mcq_wrong, tita_correct, tita_wrong, unattempted, time_taken_seconds, completed_at
       FROM public.pyq_attempts
       WHERE user_id = $1
       ORDER BY completed_at DESC`,
      [userId]
    );
    const attempts = attemptsRes.rows || [];

    const hasLessons = totalLessonsCompleted > 0 || avgProgressPercent > 0;
    const hasAttempts = attempts.length > 0;

    // Demo showcase account fallback
    if (isDemo && !hasAttempts) {
      const demoConcepts = Math.min(100, Math.round(Math.max(avgProgressPercent, (totalLessonsCompleted / 50) * 100))) || 85;
      const demoAccuracy = 72;
      const demoSpeed = 64;
      const demoConsistency = 90;
      return {
        readiness: Math.round((demoConcepts + demoAccuracy + demoSpeed + demoConsistency) / 4),
        concepts: demoConcepts,
        accuracy: demoAccuracy,
        speed: demoSpeed,
        consistency: demoConsistency,
        hasActivity: true,
      };
    }

    // For any real user with zero activity:
    if (!hasLessons && !hasAttempts) {
      return zeroState;
    }

    // Calculate Concepts (0-100) based strictly on real completed lessons
    let concepts = 0;
    if (hasLessons) {
      concepts = Math.min(100, Math.round(Math.max(avgProgressPercent, (totalLessonsCompleted / 50) * 100)));
    }

    // Calculate Accuracy (0-100) based strictly on real mock attempts
    let accuracy = 0;
    if (hasAttempts) {
      let totalCorrect = 0;
      let totalAnswered = 0;
      attempts.forEach((a: any) => {
        const corr = (Number(a.mcq_correct) || 0) + (Number(a.tita_correct) || 0);
        const wrng = (Number(a.mcq_wrong) || 0) + (Number(a.tita_wrong) || 0);
        totalCorrect += corr;
        totalAnswered += corr + wrng;
      });

      if (totalAnswered > 0) {
        accuracy = Math.min(100, Math.round((totalCorrect / totalAnswered) * 100));
      } else {
        const avgPct = attempts.reduce((sum: number, a: any) => sum + (Number(a.percentage) || 0), 0) / attempts.length;
        accuracy = Math.min(100, Math.round(avgPct));
      }
    }

    // Calculate Speed (0-100) based strictly on real mock attempts
    let speed = 0;
    if (hasAttempts) {
      let totalAttempted = 0;
      let totalQuestions = 0;
      let totalTimeSec = 0;
      attempts.forEach((a: any) => {
        const att = (Number(a.mcq_correct) || 0) + (Number(a.mcq_wrong) || 0) + (Number(a.tita_correct) || 0) + (Number(a.tita_wrong) || 0);
        const unatt = Number(a.unattempted) || 0;
        totalAttempted += att;
        totalQuestions += att + unatt;
        totalTimeSec += Number(a.time_taken_seconds) || 0;
      });

      if (totalQuestions > 0 && totalAttempted > 0) {
        const attemptRate = totalAttempted / totalQuestions;
        const avgTimePerQ = totalTimeSec > 0 ? (totalTimeSec / totalAttempted) : 120;
        const paceFactor = Math.min(1, Math.max(0.2, 1 - Math.max(0, avgTimePerQ - 100) / 200));
        speed = Math.min(100, Math.round((attemptRate * 0.7 + paceFactor * 0.3) * 100));
      } else if (totalAttempted > 0) {
        speed = Math.min(100, Math.round((totalAttempted / 22) * 100));
      }
    }

    // Calculate Consistency (0-100) based strictly on real mock attempts
    let consistency = 0;
    if (hasAttempts) {
      if (attempts.length === 1) {
        consistency = Math.min(100, Math.max(20, Math.round(Number(attempts[0].percentage) || 50)));
      } else {
        const pcts = attempts.map((a: any) => Number(a.percentage) || 0);
        const mean = pcts.reduce((sum: number, p: number) => sum + p, 0) / pcts.length;
        const variance = pcts.reduce((sum: number, p: number) => sum + Math.pow(p - mean, 2), 0) / pcts.length;
        const stdDev = Math.sqrt(variance);
        consistency = Math.min(100, Math.max(20, Math.round(100 - stdDev * 1.5)));
      }
    }

    // Calculate Overall Readiness
    let readiness = 0;
    if (hasAttempts && hasLessons) {
      readiness = Math.min(100, Math.round((concepts + accuracy + speed + consistency) / 4));
    } else if (hasAttempts) {
      readiness = Math.min(100, Math.round((accuracy + speed + consistency) / 3));
    } else if (hasLessons) {
      readiness = Math.min(100, Math.round(concepts * 0.4));
    }

    return {
      readiness,
      concepts,
      accuracy,
      speed,
      consistency,
      hasActivity: true,
    };
  } catch (err) {
    console.warn("[getUserReadinessMetrics Error]", err);
    return zeroState;
  }
}

// ── Curriculum scheduling (study plan relative to each student's enrollment) ──

/** Maps a topic id to its curriculum section. */
function sectionForTopic(topicId: string): "QA" | "DILR" | "VARC" | null {
  const id = topicId.toLowerCase();
  if (id.startsWith("qa")) return "QA";
  if (id.startsWith("dilr")) return "DILR";
  if (id.startsWith("varc")) return "VARC";
  return null;
}

async function insertCurriculumTasks(
  db: Queryable,
  userId: string,
  rows: { date: string; task: CurriculumTaskTemplate; completed: boolean }[]
): Promise<number> {
  if (rows.length === 0) return 0;
  const res = await db.query(
    `INSERT INTO public.study_tasks
       (user_id, title, task_date, is_completed, category, code, time_range, duration, subtitle, template_code)
     SELECT $1, t.title, t.task_date::date, t.is_completed, t.category, t.code, t.time_range, t.duration, t.subtitle, t.code
     FROM UNNEST($2::text[], $3::text[], $4::boolean[], $5::text[], $6::text[], $7::text[], $8::text[], $9::text[])
          AS t(title, task_date, is_completed, category, code, time_range, duration, subtitle)
     ON CONFLICT (user_id, template_code) WHERE template_code IS NOT NULL DO NOTHING
     RETURNING id`,
    [
      userId,
      rows.map((r) => r.task.title),
      rows.map((r) => r.date),
      rows.map((r) => r.completed),
      rows.map((r) => r.task.category),
      rows.map((r) => r.task.code),
      rows.map((r) => r.task.timeRange),
      rows.map((r) => r.task.duration),
      rows.map((r) => r.task.subtitle),
    ]
  );
  return res.rows.length;
}

/**
 * Schedules the standard study plan for the section of `topicId`, starting on `startDate`
 * (default: today in the app timezone) and keeping the template's day spacing. Mock tasks
 * are scheduled once, anchored to the student's first enrollment. Idempotent: tasks that
 * are already scheduled (same template code) are never duplicated or moved.
 */
export async function scheduleCurriculumForTopic(
  userId: string,
  topicId: string,
  startDate: string = todayInAppTz(),
  db: Queryable = { query }
): Promise<number> {
  const section = sectionForTopic(topicId);
  if (!section) return 0;

  const sectionTasks = CURRICULUM_TASKS_TEMPLATE.filter((t) => t.category === section);
  const firstDay = Math.min(...sectionTasks.map((t) => t.planDay));
  const rows = sectionTasks.map((task) => ({ date: addDays(startDate, task.planDay - firstDay), task, completed: false }));

  // Mock tests follow the overall plan from day 1 of the student's first enrollment.
  const mocks = CURRICULUM_TASKS_TEMPLATE.filter((t) => t.category === "Mock");
  rows.push(...mocks.map((task) => ({ date: addDays(startDate, task.planDay - 1), task, completed: false })));

  return insertCurriculumTasks(db, userId, rows);
}

/**
 * Demo showcase only: keeps the demo account's plan positioned around today (started three
 * weeks ago, mostly done, a short backlog) so the dashboard always looks like an active student.
 * Re-anchors at most once per day, when no curriculum task falls on today.
 */
export async function ensureDemoShowcaseSchedule(userId: string): Promise<void> {
  const today = todayInAppTz();
  const hasToday = await query(
    `SELECT 1 FROM public.study_tasks WHERE user_id = $1 AND template_code IS NOT NULL AND task_date = $2 LIMIT 1`,
    [userId, today]
  );
  if (hasToday.rows.length > 0) return;

  const start = addDays(today, -21);
  const backlogFrom = addDays(today, -2);
  await withTransaction(async (client) => {
    await client.query(`DELETE FROM public.study_tasks WHERE user_id = $1 AND template_code IS NOT NULL`, [userId]);
    const rows = CURRICULUM_TASKS_TEMPLATE.map((task) => {
      const date = addDays(start, task.planDay - 1);
      return { date, task, completed: date < backlogFrom };
    });
    await insertCurriculumTasks(client, userId, rows);
  });
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
     WHERE id = $2 AND user_id = $3
     RETURNING id, title, task_date, is_completed, category, code, time_range, duration, subtitle`,
    [isCompleted, taskId, userId]
  );
  return res.rows[0] || null;
}

// ── Topic Progress Operations ──
/** All lesson ids that belong to a topic (flat list + module lists), from the curriculum data. */
export function getTopicLessonIds(topicId: string): Set<string> {
  const topic = getTopicById(topicId);
  const ids = new Set<string>();
  if (!topic) return ids;
  for (const l of topic.lessons || []) ids.add(l.id);
  for (const m of topic.modules || []) for (const l of m.lessons || []) ids.add(l.id);
  return ids;
}

/**
 * Marks a lesson complete exactly once (repeat calls change nothing) and awards the lesson
 * points through the points ledger. Progress % is computed from the topic's real lesson
 * count on the server. Returns null if the topic/lesson does not exist.
 */
export async function updateLessonCompletion(userId: string, topicId: string, lessonId: string) {
  const lessonIds = getTopicLessonIds(topicId);
  if (!lessonIds.has(lessonId)) return null;
  const total = lessonIds.size;

  return withTransaction(async (client) => {
    const upsert = await client.query(
      `INSERT INTO public.topic_progress AS tp (user_id, topic_id, progress_percent, completed_lessons, updated_at)
       VALUES ($1, $2, LEAST(100, ROUND(100.0 / $4)), ARRAY[$3]::text[], NOW())
       ON CONFLICT (user_id, topic_id) DO UPDATE SET
         completed_lessons = CASE WHEN $3 = ANY(tp.completed_lessons) THEN tp.completed_lessons
                                  ELSE array_append(tp.completed_lessons, $3) END,
         progress_percent  = LEAST(100, ROUND(100.0 * cardinality(
                               CASE WHEN $3 = ANY(tp.completed_lessons) THEN tp.completed_lessons
                                    ELSE array_append(tp.completed_lessons, $3) END) / $4)),
         updated_at        = NOW()
       RETURNING *`,
      [userId, topicId, lessonId, total]
    );
    const pointsAwarded = await awardPoints(userId, "lesson_completed", lessonId, client);
    return { ...upsert.rows[0], pointsAwarded };
  });
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

  // Schedule this section's study plan starting today (idempotent).
  await scheduleCurriculumForTopic(userId, topicId);

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

