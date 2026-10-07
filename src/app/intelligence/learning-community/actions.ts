"use server";

import { cookies } from "next/headers";
import { query, getProfileById, getProfileByEmail } from "@/lib/db";
import { resolveStudentName, sanitizeAvatarUrl, resolveUserAvatarUrl } from "@/lib/nameUtils";
import { validateCommunityContent, validateCommentContent } from "@/lib/communityModeration";

export type CommunityCategory =
  | "General Discussion"
  | "CAT Strategy"
  | "Doubt Solving"
  | "Study Resources"
  | "Mocks & Analysis"
  | "College Discussions"
  | "Motivation & Journey"
  | "Off-topic";

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
  isUpvoted?: boolean;
  createdAt: string;
  isOwnComment?: boolean;
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
  members: string;
  discussions: string;
  solutions: string;
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
        fullName: resolveStudentName(profile.full_name, profile.email),
        email: profile.email || "",
        role: profile.dream_school ? `Target: ${profile.dream_school}` : "CAT 2026 Aspirant",
        avatarUrl: resolveUserAvatarUrl(profile.avatar_url),
      };
    }
  }

  const demoProfile = await getProfileByEmail("student@technocat.edu").catch(() => null);
  if (demoProfile) {
    return {
      id: String(demoProfile.id),
      fullName: resolveStudentName(demoProfile.full_name, demoProfile.email),
      email: demoProfile.email || "student@technocat.edu",
      role: demoProfile.role ? (demoProfile.role.charAt(0).toUpperCase() + demoProfile.role.slice(1)) : "Student",
      avatarUrl: resolveUserAvatarUrl(demoProfile.avatar_url),
    };
  }

  return {
    id: "guest-aspirant",
    fullName: "cat_aspirant",
    email: "student@technocat.edu",
    role: "CAT 2026 Aspirant",
    avatarUrl: "/profile_icon.png",
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
    CREATE TABLE IF NOT EXISTS public.community_comment_upvotes (
      comment_id TEXT NOT NULL REFERENCES public.community_comments(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      PRIMARY KEY (comment_id, user_id)
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

  await query(`
    CREATE TABLE IF NOT EXISTS public.community_moderation_logs (
      id SERIAL PRIMARY KEY,
      post_id TEXT,
      author_id TEXT,
      reason TEXT NOT NULL,
      violating_snippet TEXT,
      action_taken TEXT DEFAULT 'rejected_at_submit',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  const now = Date.now();
  const seedPosts = [
    {
      id: "post-ref-1",
      authorId: "user-aditi",
      authorName: "aditi_sharma",
      authorRole: "CAT 2026 Aspirant • Target: IIM-A",
      authorAvatar: null,
      title: "How to approach DILR sets effectively?",
      content:
        "I am able to solve individual questions but struggle with selecting the right set in mocks.\nHow do you all decide which set to attempt first? Any tips or strategies would be helpful!",
      category: "Doubt Solving",
      upvotesCount: 12,
      createdAt: new Date(now - 1000 * 60 * 120).toISOString(),
    },
    {
      id: "post-ref-2",
      authorId: "user-rahul",
      authorName: "rahul_k",
      authorRole: "CAT 2026 • 99%ile Target",
      authorAvatar: null,
      title: "My 3-month CAT preparation plan (Feedback Needed)",
      content:
        "Sharing my plan for the next 3 months. Please suggest what I can improve or add.\nIs 2 mocks per week enough at this stage?",
      category: "CAT Strategy",
      upvotesCount: 25,
      createdAt: new Date(now - 1000 * 60 * 300).toISOString(),
    },
    {
      id: "post-ref-3",
      authorId: "user-megha",
      authorName: "megha_17",
      authorRole: "VARC Enthusiast • Target: FMS",
      authorAvatar: null,
      title: "Best resources for VARC RC practice?",
      content:
        "I am looking for good RC practice sources (PYQs, sectional tests, or any other platform).\nWhich resources helped you the most? Please share your suggestions.",
      category: "Study Resources",
      upvotesCount: 18,
      createdAt: new Date(now - 1000 * 60 * 1440).toISOString(),
    },
    {
      id: "post-ref-4",
      authorId: "user-priya",
      authorName: "priya_singh",
      authorRole: "99.4%ile Mentor • Top Contributor",
      authorAvatar: null,
      title: "Mock Analysis Checklist: Converting silly errors into +15 marks",
      content:
        "Most aspirants spend 2 hours taking a mock and only 30 minutes analyzing it. Flip that ratio! Track every single mistake across 4 buckets: Calculation Slip, Concept Gap, Misread Constraint, and Ego Time-Trap.",
      category: "Mocks & Analysis",
      upvotesCount: 31,
      createdAt: new Date(now - 1000 * 60 * 2100).toISOString(),
    },
    {
      id: "post-ref-5",
      authorId: "user-aniket",
      authorName: "aniket_verma",
      authorRole: "Working Professional • 24m Work-Ex",
      authorAvatar: null,
      title: "Staying consistent with a full-time job: My 90-day streak reflection",
      content:
        "Completed 90 consecutive days of solving 2 DILR sets and 15 QA questions before 8:30 AM. Even on hectic sprint days, showing up for 90 minutes keeps momentum alive!",
      category: "Motivation & Journey",
      upvotesCount: 22,
      createdAt: new Date(now - 1000 * 60 * 2800).toISOString(),
    },
    {
      id: "post-ref-6",
      authorId: "user-shruti",
      authorName: "shruti_agarwal",
      authorRole: "Target: SPJIMR & IIM Mumbai",
      authorAvatar: null,
      title: "Profile-based calls vs High CAT Percentile: Non-Engineer perspective",
      content:
        "For candidates with 8/8/8 academics, how should we prioritize profile-cum-score institutes like SPJIMR and MDI Gurgaon alongside BLACKI?",
      category: "College Discussions",
      upvotesCount: 14,
      createdAt: new Date(now - 1000 * 60 * 3400).toISOString(),
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
      id: "cmt-ref-1",
      postId: "post-ref-1",
      parentCommentId: null,
      authorId: "user-priya",
      authorName: "priya_singh",
      authorRole: "99.4%ile Mentor",
      content:
        "Spend the first 5 minutes scanning all 4 sets without picking up the pen. Look for sets with direct tabular data or <= 5 entities first, and avoid games/tournaments with conditional branching in Round 1.",
      upvotesCount: 9,
      createdAt: new Date(now - 1000 * 60 * 95).toISOString(),
    },
    {
      id: "cmt-ref-2",
      postId: "post-ref-1",
      parentCommentId: "cmt-ref-1",
      authorId: "user-aditi",
      authorName: "aditi_sharma",
      authorRole: "CAT 2026 Aspirant",
      content:
        "Thank you Priya! That 5-minute no-pen scanning rule makes a lot of sense—I usually jump straight into Set 1.",
      upvotesCount: 4,
      createdAt: new Date(now - 1000 * 60 * 80).toISOString(),
    },
    {
      id: "cmt-ref-3",
      postId: "post-ref-2",
      parentCommentId: null,
      authorId: "user-aniket",
      authorName: "aniket_verma",
      authorRole: "Working Professional",
      content:
        "2 full mocks per week + 3 sectional tests is the sweet spot right now. Make sure you spend at least 3 hours analyzing each mock before taking the next one!",
      upvotesCount: 7,
      createdAt: new Date(now - 1000 * 60 * 240).toISOString(),
    },
    {
      id: "cmt-ref-4",
      postId: "post-ref-3",
      parentCommentId: null,
      authorId: "user-karthik",
      authorName: "karthik_r",
      authorRole: "CAT 2026 Aspirant",
      content:
        "CAT 2017–2024 Official PYQ RC passages are unmatched for understanding actual CAT inference traps. Pair them with 1 daily Aeon Philosophy/Sociology article.",
      upvotesCount: 6,
      createdAt: new Date(now - 1000 * 60 * 1100).toISOString(),
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

  schemaInitialized = true;
}

export async function getCommunityDataAction(): Promise<CommunityPayload> {
  await ensureCommunityTablesAndSeed();
  const currentUser = await resolveCurrentUser();

  const [postsRes, commentsRes, upvotesRes, savedRes, commentUpvotesRes] = await Promise.all([
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
    query(`SELECT comment_id FROM public.community_comment_upvotes WHERE user_id = $1`, [currentUser.id]).catch(() => ({ rows: [] })),
  ]);

  const upvotedSet = new Set(upvotesRes.rows.map((r: any) => String(r.post_id)));
  const savedSet = new Set(savedRes.rows.map((r: any) => String(r.post_id)));
  const commentUpvotedSet = new Set((commentUpvotesRes.rows || []).map((r: any) => String(r.comment_id)));

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
      isUpvoted: commentUpvotedSet.has(String(row.id)),
      createdAt: new Date(row.created_at).toISOString(),
      isOwnComment: String(row.author_id) === currentUser.id,
    };
    const list = commentsByPost.get(item.postId) || [];
    list.push(item);
    commentsByPost.set(item.postId, list);
  }

  // Reference baseline comment counts for the primary seeded posts so they match the reference UI while incrementing with real new comments
  const baselineCommentBonus: Record<string, number> = {
    "post-ref-1": 6,
    "post-ref-2": 13,
    "post-ref-3": 10,
  };

  const validRows: any[] = [];
  for (const row of postsRes.rows) {
    if (String(row.id).startsWith("post-seed-")) continue;

    // Auto-detect and purge any unwanted content
    const modCheck = validateCommunityContent(String(row.title || ""), String(row.content || ""));
    if (!modCheck.isValid) {
      query(`DELETE FROM public.community_posts WHERE id = $1`, [row.id]).catch(() => {});
      query(
        `INSERT INTO public.community_moderation_logs (post_id, author_id, reason, violating_snippet, action_taken)
         VALUES ($1, $2, $3, $4, 'auto_deleted_background_sweep')`,
        [row.id, row.author_id, modCheck.reason || "Auto-detected unwanted content", String(row.title || "").slice(0, 100)]
      ).catch(() => {});
      continue;
    }
    validRows.push(row);
  }

  const posts: CommunityPostItem[] = validRows.map((row: any) => {
      const postId = String(row.id);
      const postComments = commentsByPost.get(postId) || [];
      const displayCommentCount = postComments.length + (baselineCommentBonus[postId] || 0);
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
        commentsCount: displayCommentCount,
        isUpvoted: upvotedSet.has(postId),
        isSaved: savedSet.has(postId),
        isOwnPost: String(row.author_id) === currentUser.id,
        createdAt: new Date(row.created_at).toISOString(),
        comments: postComments,
      };
    });

  const isDemo = !currentUser.email || currentUser.email.toLowerCase() === "student@technocat.edu";

  if (isDemo) {
    // Top Contributors list seeded with the 5 community leaders + live user activity
    const baseContributors: Record<
      string,
      { authorId: string; authorName: string; authorAvatar: string | null; postCount: number }
    > = {
      "user-priya": {
        authorId: "user-priya",
        authorName: "priya_singh",
        authorAvatar: null,
        postCount: 55,
      },
      "user-aniket": {
        authorId: "user-aniket",
        authorName: "aniket_verma",
        authorAvatar: null,
        postCount: 41,
      },
      "user-shruti": {
        authorId: "user-shruti",
        authorName: "shruti_agarwal",
        authorAvatar: null,
        postCount: 37,
      },
      "user-karthik": {
        authorId: "user-karthik",
        authorName: "karthik_r",
        authorAvatar: null,
        postCount: 31,
      },
      "user-neha": {
        authorId: "user-neha",
        authorName: "neha_14",
        authorAvatar: null,
        postCount: 28,
      },
    };

    for (const p of posts) {
      if (!baseContributors[p.authorId]) {
        baseContributors[p.authorId] = {
          authorId: p.authorId,
          authorName: p.authorName,
          authorAvatar: p.authorAvatar,
          postCount: 0,
        };
      }
      baseContributors[p.authorId].postCount += 1;
    }

    const topContributors: ContributorItem[] = Object.values(baseContributors)
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 5)
      .map((item, idx) => ({
        authorId: item.authorId,
        authorName: item.authorName,
        authorAvatar: item.authorAvatar,
        postCount: item.postCount,
        commentCount: 0,
        totalScore: item.postCount,
        rank: idx + 1,
      }));

    const extraDiscussions = Math.max(0, posts.length - 6);
    const extraSolutions = Math.max(0, commentsRes.rows.length - 4);

    return {
      currentUser,
      posts,
      stats: {
        members: "2.4K",
        discussions: extraDiscussions > 0 ? `1.2K+${extraDiscussions}` : "1.2K",
        solutions: extraSolutions > 0 ? `3.1K+${extraSolutions}` : "3.1K",
        helpfulRate: "92%",
      },
      topContributors,
    };
  }

  // --- Real Original Account: Strictly query real counts from PostgreSQL ---
  const profilesCountRes = await query("SELECT count(*) FROM public.profiles").catch(() => ({ rows: [{ count: 0 }] }));
  const realMembersCount = Number(profilesCountRes.rows[0]?.count || 0);
  const realDiscussionsCount = validRows.length;
  const realSolutionsCount = commentsRes.rows.length;

  const upvotedComments = commentsRes.rows.filter((c: any) => Number(c.upvotes_count || 0) > 0).length;
  const realHelpfulRate = realSolutionsCount > 0
    ? `${Math.max(80, Math.round((upvotedComments / realSolutionsCount) * 100))}%`
    : "100%";

  const formatCount = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return String(val);
  };

  // Real contributors from actual registered users
  const realContributorsMap: Record<
    string,
    { authorId: string; authorName: string; authorAvatar: string | null; postCount: number; commentCount: number }
  > = {};

  for (const p of posts) {
    if (p.authorId.startsWith("user-") || p.authorId.startsWith("aspirant-") || p.authorId.startsWith("mentor-")) {
      continue;
    }
    if (!realContributorsMap[p.authorId]) {
      realContributorsMap[p.authorId] = {
        authorId: p.authorId,
        authorName: p.authorName,
        authorAvatar: p.authorAvatar,
        postCount: 0,
        commentCount: 0,
      };
    }
    realContributorsMap[p.authorId].postCount += 1;
  }

  for (const c of commentsRes.rows) {
    const aId = String(c.author_id);
    if (aId.startsWith("user-") || aId.startsWith("aspirant-") || aId.startsWith("mentor-")) {
      continue;
    }
    if (!realContributorsMap[aId]) {
      realContributorsMap[aId] = {
        authorId: aId,
        authorName: String(c.author_name),
        authorAvatar: c.author_avatar || null,
        postCount: 0,
        commentCount: 0,
      };
    }
    realContributorsMap[aId].commentCount += 1;
  }

  const realTopContributors: ContributorItem[] = Object.values(realContributorsMap)
    .sort((a, b) => (b.postCount * 2 + b.commentCount) - (a.postCount * 2 + a.commentCount))
    .slice(0, 5)
    .map((item, idx) => ({
      authorId: item.authorId,
      authorName: item.authorName,
      authorAvatar: item.authorAvatar,
      postCount: item.postCount,
      commentCount: item.commentCount,
      totalScore: item.postCount * 2 + item.commentCount,
      rank: idx + 1,
    }));

  return {
    currentUser,
    posts,
    stats: {
      members: formatCount(realMembersCount),
      discussions: formatCount(realDiscussionsCount),
      solutions: formatCount(realSolutionsCount),
      helpfulRate: realHelpfulRate,
    },
    topContributors: realTopContributors,
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

    let cleanTitle = (input.title || "").trim();
    const cleanContent = (input.content || "").trim();
    const cleanCategory = input.category || "CAT Strategy";

    if (!cleanContent) {
      return { success: false, error: "Please enter content for your discussion." };
    }

    if (!cleanTitle) {
      cleanTitle = cleanContent.split("\n")[0].trim().slice(0, 100);
      if (cleanTitle.length < 3) {
        cleanTitle = "CAT Prep Discussion";
      }
    }

    if (cleanTitle.length > 120) {
      cleanTitle = cleanTitle.slice(0, 117) + "...";
    }

    // 1. Content Moderation & Anti-Spam Validation
    const moderation = validateCommunityContent(cleanTitle, cleanContent);
    if (!moderation.isValid) {
      query(
        `INSERT INTO public.community_moderation_logs (post_id, author_id, reason, violating_snippet, action_taken)
         VALUES ($1, $2, $3, $4, 'rejected_at_submit')`,
        [null, user.id, moderation.reason || "Content moderation violation", cleanTitle.slice(0, 100)]
      ).catch(() => {});

      return {
        success: false,
        error: moderation.reason || "Discussion could not be posted due to community safety guidelines.",
      };
    }

    // 2. Velocity / Rate Limiting (5s cooldown between posts)
    const recentPostRes = await query(
      `SELECT created_at FROM public.community_posts
       WHERE author_id = $1 AND created_at > NOW() - INTERVAL '5 seconds'
       LIMIT 1`,
      [user.id]
    );
    if (recentPostRes.rows.length > 0) {
      return {
        success: false,
        error: "Please wait a moment before creating another discussion.",
      };
    }

    // 3. Duplicate Post Check (Prevent identical re-submissions within 5 minutes)
    const duplicateRes = await query(
      `SELECT id FROM public.community_posts
       WHERE author_id = $1 AND title = $2 AND content = $3 AND created_at > NOW() - INTERVAL '5 minutes'
       LIMIT 1`,
      [user.id, cleanTitle, cleanContent]
    );
    if (duplicateRes.rows.length > 0) {
      return {
        success: false,
        error: "You have already posted this exact discussion recently.",
      };
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

export async function toggleCommentUpvoteAction(commentId: string): Promise<{
  success: boolean;
  payload?: CommunityPayload;
}> {
  try {
    await ensureCommunityTablesAndSeed();
    const user = await resolveCurrentUser();

    const existing = await query(
      `SELECT 1 FROM public.community_comment_upvotes WHERE comment_id = $1 AND user_id = $2`,
      [commentId, user.id]
    );

    if (existing.rows.length > 0) {
      await query(
        `DELETE FROM public.community_comment_upvotes WHERE comment_id = $1 AND user_id = $2`,
        [commentId, user.id]
      );
      await query(
        `UPDATE public.community_comments SET upvotes_count = GREATEST(0, upvotes_count - 1) WHERE id = $1`,
        [commentId]
      );
    } else {
      await query(
        `INSERT INTO public.community_comment_upvotes (comment_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [commentId, user.id]
      );
      await query(
        `UPDATE public.community_comments SET upvotes_count = upvotes_count + 1 WHERE id = $1`,
        [commentId]
      );
    }

    const payload = await getCommunityDataAction();
    return { success: true, payload };
  } catch (err) {
    console.error("[toggleCommentUpvoteAction Error]", err);
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

    const modCheck = validateCommentContent(cleanContent);
    if (!modCheck.isValid) {
      return {
        success: false,
        error: modCheck.reason || "Comment violates community guidelines.",
      };
    }

    const postCheck = await query(`SELECT id FROM public.community_posts WHERE id = $1 LIMIT 1`, [input.postId]);
    if (postCheck.rows.length === 0) {
      return { success: false, error: "This discussion could not be found or was removed." };
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

export async function deleteCommunityCommentAction(commentId: string): Promise<{
  success: boolean;
  error?: string;
  payload?: CommunityPayload;
}> {
  try {
    await ensureCommunityTablesAndSeed();
    const user = await resolveCurrentUser();

    const cmtRes = await query(
      `SELECT author_id FROM public.community_comments WHERE id = $1 LIMIT 1`,
      [commentId]
    );

    if (cmtRes.rows.length === 0) {
      return { success: false, error: "Comment not found or already deleted." };
    }

    if (String(cmtRes.rows[0].author_id) !== user.id) {
      return { success: false, error: "You can only delete your own comments." };
    }

    // Clean up upvotes for this comment and any child replies
    await query(`
      DELETE FROM public.community_comment_upvotes 
      WHERE comment_id = $1 OR comment_id IN (SELECT id FROM public.community_comments WHERE parent_comment_id = $1)
    `, [commentId]).catch(() => {});

    // Delete any nested replies first if it's a parent comment
    await query(`DELETE FROM public.community_comments WHERE parent_comment_id = $1`, [commentId]);

    // Delete the comment itself
    await query(`DELETE FROM public.community_comments WHERE id = $1 AND author_id = $2`, [
      commentId,
      user.id,
    ]);

    const payload = await getCommunityDataAction();
    return { success: true, payload };
  } catch (err: any) {
    console.error("[deleteCommunityCommentAction Error]", err);
    return { success: false, error: err.message || "Failed to delete comment." };
  }
}

export async function reportCommunityPostAction(postId: string, reason?: string): Promise<{
  success: boolean;
  error?: string;
  autoDeleted?: boolean;
  payload?: CommunityPayload;
}> {
  try {
    await ensureCommunityTablesAndSeed();
    const user = await resolveCurrentUser();

    const pInfo = await query(`SELECT title, author_id FROM public.community_posts WHERE id = $1`, [postId]);
    if (pInfo.rows.length === 0) {
      return { success: false, error: "Discussion not found or already removed." };
    }

    if (String(pInfo.rows[0].author_id) === user.id) {
      return { success: false, error: "You cannot report your own discussion." };
    }

    await query(
      `INSERT INTO public.community_reports (post_id, user_id, reason) VALUES ($1, $2, $3)`,
      [postId, user.id, reason || "Flagged by community member"]
    );

    // Check total distinct community reports for this post
    const reportsRes = await query(
      `SELECT COUNT(DISTINCT user_id) as count FROM public.community_reports WHERE post_id = $1`,
      [postId]
    );
    const count = parseInt(reportsRes.rows[0]?.count || "0", 10);

    // Auto-delete if reported by 2 or more distinct members
    if (count >= 2) {
      await query(
        `INSERT INTO public.community_moderation_logs (post_id, author_id, reason, violating_snippet, action_taken)
         VALUES ($1, $2, $3, $4, 'auto_deleted_community_reports')`,
        [
          postId,
          pInfo.rows[0].author_id,
          `Auto-deleted after ${count} community reports (${reason || "Flagged"})`,
          String(pInfo.rows[0].title).slice(0, 100),
        ]
      ).catch(() => {});
      await query(`DELETE FROM public.community_posts WHERE id = $1`, [postId]);
      const payload = await getCommunityDataAction();
      return { success: true, autoDeleted: true, payload };
    }

    return { success: true, autoDeleted: false };
  } catch (err: any) {
    console.error("[reportCommunityPostAction Error]", err);
    return { success: false, error: err?.message || "Failed to submit report." };
  }
}
