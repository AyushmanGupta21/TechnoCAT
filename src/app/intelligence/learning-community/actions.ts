"use server";

import { cookies } from "next/headers";
import { query, getProfileById, getProfileByEmail } from "@/lib/db";

export type CommunityCategory =
  | "CAT Strategy"
  | "Doubt Solving"
  | "Study Resources"
  | "Mocks & Analysis"
  | "Motivation & Journey";

export interface CommunityCommentItem {
  id: string;
  postId: string;
  parentCommentId: string | null;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string | null;
  content: string;
  upvotesCount: number;
  createdAt: string;
}

export interface CommunityPostItem {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string | null;
  title: string;
  content: string;
  category: CommunityCategory;
  imageUrl: string | null;
  upvotesCount: number;
  commentsCount: number;
  isUpvoted: boolean;
  isSaved: boolean;
  isOwnPost: boolean;
  createdAt: string;
  comments: CommunityCommentItem[];
}

export interface ContributorItem {
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  postCount: number;
  commentCount: number;
  totalScore: number;
  rank: number;
}

export interface CommunityStatsData {
  members: number;
  discussions: number;
  solutions: number;
  helpfulRate: string;
}

export interface CommunityPayload {
  currentUser: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl: string | null;
  };
  posts: CommunityPostItem[];
  stats: CommunityStatsData;
  topContributors: ContributorItem[];
}

let schemaInitialized = false;

async function resolveCurrentUser() {
  const cookieStore = await cookies();
  const cookieUserId = cookieStore.get("technocat_user_id")?.value;

  if (cookieUserId) {
    const profile = await getProfileById(cookieUserId).catch(() => null);
    if (profile) {
      return {
        id: String(profile.id),
        fullName: profile.full_name || "CAT Aspirant",
        email: profile.email || "",
        role: profile.dream_school ? `Target: ${profile.dream_school}` : "CAT 2026 Aspirant",
        avatarUrl: profile.avatar_url || null,
      };
    }
  }

  const demoProfile = await getProfileByEmail("student@technocat.edu").catch(() => null);
  if (demoProfile) {
    return {
      id: String(demoProfile.id),
      fullName: demoProfile.full_name || "Aarav Sharma",
      email: demoProfile.email || "student@technocat.edu",
      role: demoProfile.dream_school ? `Target: ${demoProfile.dream_school}` : "CAT 2026 Aspirant",
      avatarUrl: demoProfile.avatar_url || null,
    };
  }

  return {
    id: "guest-aspirant",
    fullName: "CAT Aspirant",
    email: "student@technocat.edu",
    role: "CAT 2026 Aspirant",
    avatarUrl: null,
  };
}

async function ensureCommunityTablesAndSeed() {
  if (schemaInitialized) return;

  await query(`
    CREATE TABLE IF NOT EXISTS public.community_posts (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_role TEXT DEFAULT 'CAT 2026 Aspirant',
      author_avatar TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT,
      upvotes_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS public.community_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
      parent_comment_id TEXT,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_role TEXT DEFAULT 'CAT 2026 Aspirant',
      author_avatar TEXT,
      content TEXT NOT NULL,
      upvotes_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS public.community_post_upvotes (
      post_id TEXT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      PRIMARY KEY (post_id, user_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS public.community_saved_posts (
      post_id TEXT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      PRIMARY KEY (post_id, user_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS public.community_reports (
      id SERIAL PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Check if initial seed data is needed
  const countRes = await query<{ cnt: string }>(`SELECT COUNT(*)::text as cnt FROM public.community_posts`);
  const existingCount = parseInt(countRes.rows[0]?.cnt || "0", 10);

  if (existingCount === 0) {
    const now = Date.now();
    const seedPosts = [
      {
        id: "post-seed-1",
        authorId: "mentor-rohan",
        authorName: "Rohan Deshmukh",
        authorRole: "99.64 %ile • IIM Calcutta Cohort",
        authorAvatar: null,
        title: "My 2-Round DILR Set Selection Framework that took me from 18 to 42 marks",
        content:
          "Most aspirants lose DILR in the first 7 minutes because they start solving Set 1 immediately without scanning all 4 sets.\n\nHere is the exact 2-round protocol I used in my last 12 mocks:\n1. Spend the first 5 minutes reading ONLY the intro constraints and question stems of all 4 sets.\n2. Rate each set on Familiarity (Familiar Arrangement/Venn vs Unseen Game Theory) and Variable Count (<= 5 variables vs 7+ variables).\n3. Pick your 2 Anchor Sets and commit 16 minutes per set. Never jump between sets mid-way!\n\nDrop your current DILR attempt rate below and I can suggest how to calibrate your scanning timer.",
        category: "CAT Strategy",
        upvotesCount: 34,
        createdAt: new Date(now - 1000 * 60 * 145).toISOString(),
      },
      {
        id: "post-seed-2",
        authorId: "aspirant-ananya",
        authorName: "Ananya Iyer",
        authorRole: "Target: SPJIMR / IIM Kozhikode",
        authorAvatar: null,
        title: "Fastest way to eliminate 50/50 close options in Philosophy RC passages?",
        content:
          "Whenever I attempt dense Philosophy or Abstract Art RCs in VARC, I easily eliminate 2 options, but between the remaining 2 I end up picking the trap option almost 60% of the time.\n\nSpecifically, how do you distinguish between an 'extreme distortion' option and a legitimate 'inference' when the passage uses hedged language?",
        category: "Doubt Solving",
        upvotesCount: 21,
        createdAt: new Date(now - 1000 * 60 * 320).toISOString(),
      },
      {
        id: "post-seed-3",
        authorId: "aspirant-kabir",
        authorName: "Kabir Verma",
        authorRole: "CAT 2026 • QA 99%ile Scorer",
        authorAvatar: null,
        title: "Complete Formula & Trap Checklist for QA Arithmetic + Algebra (CAT 2017–2024 PYQs)",
        content:
          "After analyzing every single CAT slot from 2017 to 2024, I noticed 72% of QA questions revolve around 14 core templates: Successive Percentage Change, Alligation Ratios, Harmonic Mean in Time-Speed-Distance, AM-GM in Algebra, and Integral Solutions of Linear Equations.\n\nI have summarized the top 5 recurring traps where students lose -1 mark—especially forgetting negative roots in quadratics and non-distinct cases in PNC.",
        category: "Study Resources",
        upvotesCount: 29,
        createdAt: new Date(now - 1000 * 60 * 680).toISOString(),
      },
      {
        id: "post-seed-4",
        authorId: "aspirant-sneha",
        authorName: "Sneha Nair",
        authorRole: "Working Professional • 22m Work-Ex",
        authorAvatar: null,
        title: "Mock Score Plateau at 64–70 Marks: How to break into the 85+ zone (98+ %ile)?",
        content:
          "My last 5 full-length mocks have been 66, 68, 63, 71, and 67. My VARC is stable around 32, DILR around 18, and QA around 18.\n\nIn QA, I know how to solve 14 questions during post-mock analysis without a timer, but during the 40-minute sectional clock I only manage 7–8 attempts. How should I restructure my mock analysis to convert unattempted easy questions?",
        category: "Mocks & Analysis",
        upvotesCount: 19,
        createdAt: new Date(now - 1000 * 60 * 1120).toISOString(),
      },
      {
        id: "post-seed-5",
        authorId: "aspirant-vikram",
        authorName: "Vikramaditya Rao",
        authorRole: "CAT 2026 Aspirant",
        authorAvatar: null,
        title: "Balancing a 10-hour software job with daily CAT prep — my realistic 3.5h routine",
        content:
          "For everyone juggling corporate sprints with CAT prep: consistency beats 10-hour weekend marathons.\n\nMy daily split:\n• 6:30 AM – 8:00 AM: 1 QA topic drill + 2 DILR sets (fresh mind before standup)\n• Commute / Lunch: 2 Aeon essays + 4 Para-jumbles\n• 9:30 PM – 11:00 PM: Error log review + 25-min timed sectional.\n\nStay steady—even 3 focused hours a day compounds to 450+ hours before exam day!",
        category: "Motivation & Journey",
        upvotesCount: 26,
        createdAt: new Date(now - 1000 * 60 * 1540).toISOString(),
      },
      {
        id: "post-seed-6",
        authorId: "aspirant-meera",
        authorName: "Meera Krishnan",
        authorRole: "Target: FMS Delhi",
        authorAvatar: null,
        title: "Doubt in Remainder Theorem: Finding remainder when 7^84 is divided by 342",
        content:
          "Can someone walk through the cleanest Euler / Binomial step for finding the remainder when 7^84 is divided by 342? I noticed 7^3 = 343 = 342 + 1, which gives remainder 1 immediately, but what if the divisor was 344 instead of 342? How does the negative remainder parity work when the power is odd?",
        category: "Doubt Solving",
        upvotesCount: 11,
        createdAt: new Date(now - 1000 * 60 * 90).toISOString(),
      },
    ];

    for (const p of seedPosts) {
      await query(
        `INSERT INTO public.community_posts (
          id, author_id, author_name, author_role, author_avatar, title, content, category, upvotes_count, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING`,
        [
          p.id,
          p.authorId,
          p.authorName,
          p.authorRole,
          p.authorAvatar,
          p.title,
          p.content,
          p.category,
          p.upvotesCount,
          p.createdAt,
        ]
      );
    }

    const seedComments = [
      {
        id: "cmt-seed-1",
        postId: "post-seed-1",
        parentCommentId: null,
        authorId: "aspirant-ananya",
        authorName: "Ananya Iyer",
        authorRole: "Target: SPJIMR / IIM Kozhikode",
        content:
          "This 5-minute scanning rule is gold! Earlier I used to get ego-attached to the first arrangement puzzle and waste 18 minutes. Switching to a strict 2-set target immediately raised my DILR score from 15 to 27.",
        upvotesCount: 8,
        createdAt: new Date(now - 1000 * 60 * 120).toISOString(),
      },
      {
        id: "cmt-seed-2",
        postId: "post-seed-1",
        parentCommentId: "cmt-seed-1",
        authorId: "mentor-rohan",
        authorName: "Rohan Deshmukh",
        authorRole: "99.64 %ile • IIM Calcutta Cohort",
        content:
          "Spot on, Ananya! Once your 2 anchor sets are locked in 32 minutes, the remaining 8 minutes feel completely stress-free for picking 1–2 TITA questions from Set 3.",
        upvotesCount: 5,
        createdAt: new Date(now - 1000 * 60 * 105).toISOString(),
      },
      {
        id: "cmt-seed-3",
        postId: "post-seed-2",
        parentCommentId: null,
        authorId: "aspirant-kabir",
        authorName: "Kabir Verma",
        authorRole: "CAT 2026 • QA 99%ile Scorer",
        content:
          "Check the 'degree of modifier' in the two shortlisted options. Trap options usually swap 'some/often' from the passage with 'always/primarily/never', or introduce a comparison that the author never made.",
        upvotesCount: 11,
        createdAt: new Date(now - 1000 * 60 * 280).toISOString(),
      },
      {
        id: "cmt-seed-4",
        postId: "post-seed-3",
        parentCommentId: null,
        authorId: "aspirant-sneha",
        authorName: "Sneha Nair",
        authorRole: "Working Professional • 22m Work-Ex",
        content:
          "Bookmarked! The quadratic +/- root trap caught me in Mock 2 just last week. Having a pre-mock checklist helps a ton.",
        upvotesCount: 6,
        createdAt: new Date(now - 1000 * 60 * 540).toISOString(),
      },
      {
        id: "cmt-seed-5",
        postId: "post-seed-4",
        parentCommentId: null,
        authorId: "mentor-rohan",
        authorName: "Rohan Deshmukh",
        authorRole: "99.64 %ile • IIM Calcutta Cohort",
        content:
          "For QA, switch to the A-B-C round method: Round 1 (first 20 mins) ONLY solve questions you can crack in under 90 seconds. Skip lengthy geometry or multi-case algebra for Round 2. That guarantees you see Question #22 before minute 25!",
        upvotesCount: 9,
        createdAt: new Date(now - 1000 * 60 * 980).toISOString(),
      },
    ];

    for (const c of seedComments) {
      await query(
        `INSERT INTO public.community_comments (
          id, post_id, parent_comment_id, author_id, author_name, author_role, content, upvotes_count, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING`,
        [
          c.id,
          c.postId,
          c.parentCommentId,
          c.authorId,
          c.authorName,
          c.authorRole,
          c.content,
          c.upvotesCount,
          c.createdAt,
        ]
      );
    }
  }

  schemaInitialized = true;
}

export async function getCommunityDataAction(): Promise<CommunityPayload> {
  await ensureCommunityTablesAndSeed();
  const currentUser = await resolveCurrentUser();

  const [postsRes, commentsRes, upvotesRes, savedRes, profilesCountRes] = await Promise.all([
    query(`
      SELECT id, author_id, author_name, author_role, author_avatar, title, content, category, image_url, upvotes_count, created_at
      FROM public.community_posts
      ORDER BY created_at DESC
    `),
    query(`
      SELECT id, post_id, parent_comment_id, author_id, author_name, author_role, author_avatar, content, upvotes_count, created_at
      FROM public.community_comments
      ORDER BY created_at ASC
    `),
    query(`SELECT post_id FROM public.community_post_upvotes WHERE user_id = $1`, [currentUser.id]),
    query(`SELECT post_id FROM public.community_saved_posts WHERE user_id = $1`, [currentUser.id]),
    query<{ cnt: string }>(`SELECT COUNT(*)::text as cnt FROM public.profiles`).catch(() => ({
      rows: [{ cnt: "0" }],
    })),
  ]);

  const upvotedSet = new Set(upvotesRes.rows.map((r: any) => String(r.post_id)));
  const savedSet = new Set(savedRes.rows.map((r: any) => String(r.post_id)));

  const commentsByPost = new Map<string, CommunityCommentItem[]>();
  for (const row of commentsRes.rows) {
    const item: CommunityCommentItem = {
      id: String(row.id),
      postId: String(row.post_id),
      parentCommentId: row.parent_comment_id ? String(row.parent_comment_id) : null,
      authorId: String(row.author_id),
      authorName: String(row.author_name),
      authorRole: String(row.author_role || "CAT 2026 Aspirant"),
      authorAvatar: row.author_avatar || null,
      content: String(row.content),
      upvotesCount: Number(row.upvotes_count || 0),
      createdAt: new Date(row.created_at).toISOString(),
    };
    const list = commentsByPost.get(item.postId) || [];
    list.push(item);
    commentsByPost.set(item.postId, list);
  }

  const posts: CommunityPostItem[] = postsRes.rows.map((row: any) => {
    const postId = String(row.id);
    const postComments = commentsByPost.get(postId) || [];
    return {
      id: postId,
      authorId: String(row.author_id),
      authorName: String(row.author_name),
      authorRole: String(row.author_role || "CAT 2026 Aspirant"),
      authorAvatar: row.author_avatar || null,
      title: String(row.title),
      content: String(row.content),
      category: (row.category || "CAT Strategy") as CommunityCategory,
      imageUrl: row.image_url || null,
      upvotesCount: Number(row.upvotes_count || 0),
      commentsCount: postComments.length,
      isUpvoted: upvotedSet.has(postId),
      isSaved: savedSet.has(postId),
      isOwnPost: String(row.author_id) === currentUser.id,
      createdAt: new Date(row.created_at).toISOString(),
      comments: postComments,
    };
  });

  // Compute Top Contributors from real post + comment activity
  const contributorMap = new Map<
    string,
    {
      authorId: string;
      authorName: string;
      authorAvatar: string | null;
      postCount: number;
      commentCount: number;
      upvotesReceived: number;
    }
  >();

  for (const p of posts) {
    const existing = contributorMap.get(p.authorId) || {
      authorId: p.authorId,
      authorName: p.authorName,
      authorAvatar: p.authorAvatar,
      postCount: 0,
      commentCount: 0,
      upvotesReceived: 0,
    };
    existing.postCount += 1;
    existing.upvotesReceived += p.upvotesCount;
    contributorMap.set(p.authorId, existing);
  }

  for (const c of commentsRes.rows) {
    const aid = String(c.author_id);
    const existing = contributorMap.get(aid) || {
      authorId: aid,
      authorName: String(c.author_name),
      authorAvatar: c.author_avatar || null,
      postCount: 0,
      commentCount: 0,
      upvotesReceived: 0,
    };
    existing.commentCount += 1;
    existing.upvotesReceived += Number(c.upvotes_count || 0);
    contributorMap.set(aid, existing);
  }

  const topContributors: ContributorItem[] = Array.from(contributorMap.values())
    .map((item) => ({
      authorId: item.authorId,
      authorName: item.authorName,
      authorAvatar: item.authorAvatar,
      postCount: item.postCount + item.commentCount,
      commentCount: item.commentCount,
      totalScore: item.postCount * 5 + item.commentCount * 3 + item.upvotesReceived,
      rank: 0,
    }))
    .sort((a, b) => b.totalScore - a.totalScore || b.postCount - a.postCount)
    .slice(0, 5)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  // Compute real Community Stats
  const distinctAuthors = new Set<string>();
  posts.forEach((p) => distinctAuthors.add(p.authorId));
  commentsRes.rows.forEach((c: any) => distinctAuthors.add(String(c.author_id)));
  const dbProfilesCount = parseInt(profilesCountRes.rows[0]?.cnt || "0", 10);
  const totalMembers = Math.max(distinctAuthors.size, dbProfilesCount);

  const totalDiscussions = posts.length;
  const totalSolutions = commentsRes.rows.length;
  const helpfulPostsCount = posts.filter((p) => p.commentsCount > 0 || p.upvotesCount > 0).length;
  const helpfulRate =
    totalDiscussions > 0 ? `${Math.round((helpfulPostsCount / totalDiscussions) * 100)}%` : "—";

  return {
    currentUser,
    posts,
    stats: {
      members: totalMembers,
      discussions: totalDiscussions,
      solutions: totalSolutions,
      helpfulRate,
    },
    topContributors,
  };
}

export async function createCommunityPostAction(input: {
  title: string;
  content: string;
  category: CommunityCategory;
  imageUrl?: string | null;
}): Promise<{ success: boolean; error?: string; payload?: CommunityPayload }> {
  try {
    await ensureCommunityTablesAndSeed();
    const user = await resolveCurrentUser();

    const cleanTitle = (input.title || "").trim();
    const cleanContent = (input.content || "").trim();
    const cleanCategory = input.category || "CAT Strategy";

    if (!cleanTitle || !cleanContent) {
      return { success: false, error: "Please enter both a title and content for your discussion." };
    }

    const postId = `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    await query(
      `INSERT INTO public.community_posts (
        id, author_id, author_name, author_role, author_avatar, title, content, category, image_url, upvotes_count, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1, NOW())`,
      [
        postId,
        user.id,
        user.fullName,
        user.role,
        user.avatarUrl,
        cleanTitle,
        cleanContent,
        cleanCategory,
        input.imageUrl || null,
      ]
    );

    // Automatically upvote user's own post
    await query(
      `INSERT INTO public.community_post_upvotes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [postId, user.id]
    );

    const payload = await getCommunityDataAction();
    return { success: true, payload };
  } catch (err: any) {
    console.error("[createCommunityPostAction Error]", err);
    return { success: false, error: err.message || "Failed to create post." };
  }
}

export async function togglePostUpvoteAction(postId: string): Promise<{
  success: boolean;
  payload?: CommunityPayload;
}> {
  try {
    await ensureCommunityTablesAndSeed();
    const user = await resolveCurrentUser();

    const existing = await query(
      `SELECT 1 FROM public.community_post_upvotes WHERE post_id = $1 AND user_id = $2`,
      [postId, user.id]
    );

    if (existing.rows.length > 0) {
      await query(
        `DELETE FROM public.community_post_upvotes WHERE post_id = $1 AND user_id = $2`,
        [postId, user.id]
      );
      await query(
        `UPDATE public.community_posts SET upvotes_count = GREATEST(0, upvotes_count - 1) WHERE id = $1`,
        [postId]
      );
    } else {
      await query(
        `INSERT INTO public.community_post_upvotes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [postId, user.id]
      );
      await query(
        `UPDATE public.community_posts SET upvotes_count = upvotes_count + 1 WHERE id = $1`,
        [postId]
      );
    }

    const payload = await getCommunityDataAction();
    return { success: true, payload };
  } catch (err) {
    console.error("[togglePostUpvoteAction Error]", err);
    return { success: false };
  }
}

export async function toggleSavePostAction(postId: string): Promise<{
  success: boolean;
  payload?: CommunityPayload;
}> {
  try {
    await ensureCommunityTablesAndSeed();
    const user = await resolveCurrentUser();

    const existing = await query(
      `SELECT 1 FROM public.community_saved_posts WHERE post_id = $1 AND user_id = $2`,
      [postId, user.id]
    );

    if (existing.rows.length > 0) {
      await query(
        `DELETE FROM public.community_saved_posts WHERE post_id = $1 AND user_id = $2`,
        [postId, user.id]
      );
    } else {
      await query(
        `INSERT INTO public.community_saved_posts (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [postId, user.id]
      );
    }

    const payload = await getCommunityDataAction();
    return { success: true, payload };
  } catch (err) {
    console.error("[toggleSavePostAction Error]", err);
    return { success: false };
  }
}

export async function addCommentOrReplyAction(input: {
  postId: string;
  content: string;
  parentCommentId?: string | null;
}): Promise<{ success: boolean; error?: string; payload?: CommunityPayload }> {
  try {
    await ensureCommunityTablesAndSeed();
    const user = await resolveCurrentUser();
    const cleanContent = (input.content || "").trim();

    if (!cleanContent) {
      return { success: false, error: "Comment cannot be empty." };
    }

    const commentId = `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    await query(
      `INSERT INTO public.community_comments (
        id, post_id, parent_comment_id, author_id, author_name, author_role, author_avatar, content, upvotes_count, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, NOW())`,
      [
        commentId,
        input.postId,
        input.parentCommentId || null,
        user.id,
        user.fullName,
        user.role,
        user.avatarUrl,
        cleanContent,
      ]
    );

    const payload = await getCommunityDataAction();
    return { success: true, payload };
  } catch (err: any) {
    console.error("[addCommentOrReplyAction Error]", err);
    return { success: false, error: err.message || "Failed to post comment." };
  }
}

export async function deleteCommunityPostAction(postId: string): Promise<{
  success: boolean;
  error?: string;
  payload?: CommunityPayload;
}> {
  try {
    await ensureCommunityTablesAndSeed();
    const user = await resolveCurrentUser();

    const postRes = await query(
      `SELECT author_id FROM public.community_posts WHERE id = $1 LIMIT 1`,
      [postId]
    );

    if (postRes.rows.length === 0) {
      return { success: false, error: "Discussion not found." };
    }

    if (String(postRes.rows[0].author_id) !== user.id) {
      return { success: false, error: "You can only delete your own discussions." };
    }

    await query(`DELETE FROM public.community_posts WHERE id = $1 AND author_id = $2`, [
      postId,
      user.id,
    ]);

    const payload = await getCommunityDataAction();
    return { success: true, payload };
  } catch (err: any) {
    console.error("[deleteCommunityPostAction Error]", err);
    return { success: false, error: err.message || "Failed to delete discussion." };
  }
}

export async function reportCommunityPostAction(postId: string, reason?: string): Promise<{
  success: boolean;
}> {
  try {
    await ensureCommunityTablesAndSeed();
    const user = await resolveCurrentUser();
    await query(
      `INSERT INTO public.community_reports (post_id, user_id, reason) VALUES ($1, $2, $3)`,
      [postId, user.id, reason || "Flagged by community member"]
    );
    return { success: true };
  } catch (err) {
    console.error("[reportCommunityPostAction Error]", err);
    return { success: false };
  }
}
