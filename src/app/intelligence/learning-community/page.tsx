"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import styles from "./learning-community.module.css";
import {
  CommunityCategory,
  CommunityPayload,
  CommunityPostItem,
  getCommunityDataAction,
  createCommunityPostAction,
  togglePostUpvoteAction,
  toggleSavePostAction,
  addCommentOrReplyAction,
  deleteCommunityPostAction,
  reportCommunityPostAction,
} from "./actions";

const CATEGORIES: CommunityCategory[] = [
  "CAT Strategy",
  "Doubt Solving",
  "Study Resources",
  "Mocks & Analysis",
  "Motivation & Journey",
];

type SidebarSection = "HOME" | "MY_POSTS" | "SAVED_POSTS" | "TOPIC";
type FeedFilterTab = "Recent" | "Most Helpful" | "Trending" | "Unanswered" | "My Posts";

function formatRelativeTime(isoDate: string): string {
  const timestamp = new Date(isoDate).getTime();
  if (isNaN(timestamp)) return "Just now";
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getInitials(name: string): string {
  const parts = (name || "CAT Aspirant").trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) || "CA").toUpperCase();
}

function getCategoryBadgeClass(cat: CommunityCategory): string {
  switch (cat) {
    case "CAT Strategy":
      return `${styles.categoryBadge} ${styles.catStrategy}`;
    case "Doubt Solving":
      return `${styles.categoryBadge} ${styles.catDoubt}`;
    case "Study Resources":
      return `${styles.categoryBadge} ${styles.catResources}`;
    case "Mocks & Analysis":
      return `${styles.categoryBadge} ${styles.catMocks}`;
    case "Motivation & Journey":
      return `${styles.categoryBadge} ${styles.catMotivation}`;
    default:
      return `${styles.categoryBadge} ${styles.catStrategy}`;
  }
}

export default function LearningCommunityPage() {
  const [data, setData] = useState<CommunityPayload | null>(null);
  const [loading, setLoading] = useState(true);

  // Navigation & filter state
  const [sidebarView, setSidebarView] = useState<SidebarSection>("HOME");
  const [topicsExpanded, setTopicsExpanded] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<CommunityCategory | null>(null);
  const [activeTab, setActiveTab] = useState<FeedFilterTab>("Recent");
  const [searchQuery, setSearchQuery] = useState("");

  // Mobile drawer state
  const [mobileDrawer, setMobileDrawer] = useState<"MENU" | "TOPICS" | "STATS" | null>(null);

  // Card 3-dot menu state
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);

  // Create Post Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<CommunityCategory>("CAT Strategy");
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Full Discussion Modal state
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  useEffect(() => {
    let mounted = true;
    getCommunityDataAction()
      .then((payload) => {
        if (mounted) {
          setData(payload);
        }
      })
      .catch((err) => {
        console.error("[LearningCommunity Load Error]", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Close 3-dot dropdown on outside click or Escape
  useEffect(() => {
    const handleGlobalClick = () => {
      if (openMenuPostId) setOpenMenuPostId(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenuPostId(null);
        setIsCreateModalOpen(false);
        setActivePostId(null);
      }
    };
    window.addEventListener("click", handleGlobalClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuPostId]);

  const posts = data?.posts || [];
  const activePost: CommunityPostItem | null = useMemo(
    () => posts.find((p) => p.id === activePostId) || null,
    [posts, activePostId]
  );

  // Compute filtered & sorted posts
  const visiblePosts = useMemo(() => {
    let list = [...posts];

    // 1. Sidebar view filtering
    if (sidebarView === "MY_POSTS" || activeTab === "My Posts") {
      list = list.filter((p) => p.isOwnPost);
    } else if (sidebarView === "SAVED_POSTS") {
      list = list.filter((p) => p.isSaved);
    } else if (sidebarView === "TOPIC" && selectedTopic) {
      list = list.filter((p) => p.category === selectedTopic);
    }

    // 2. Tab filtering
    if (activeTab === "Unanswered") {
      list = list.filter((p) => p.commentsCount === 0);
    }

    // 3. Search query filtering
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q)
      );
    }

    // 4. Sorting
    if (activeTab === "Most Helpful") {
      list.sort(
        (a, b) =>
          b.upvotesCount - a.upvotesCount ||
          b.commentsCount - a.commentsCount ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (activeTab === "Trending") {
      list.sort(
        (a, b) =>
          b.upvotesCount * 2 +
          b.commentsCount * 3 -
          (a.upvotesCount * 2 + a.commentsCount * 3) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      // Recent / default
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [posts, sidebarView, selectedTopic, activeTab, searchQuery]);

  const myPostsCount = useMemo(() => posts.filter((p) => p.isOwnPost).length, [posts]);
  const savedPostsCount = useMemo(() => posts.filter((p) => p.isSaved).length, [posts]);

  // Handlers
  const handleSelectHome = () => {
    setSidebarView("HOME");
    setSelectedTopic(null);
    if (activeTab === "My Posts") setActiveTab("Recent");
    setMobileDrawer(null);
  };

  const handleSelectMyPosts = () => {
    setSidebarView("MY_POSTS");
    setSelectedTopic(null);
    setActiveTab("My Posts");
    setMobileDrawer(null);
  };

  const handleSelectSavedPosts = () => {
    setSidebarView("SAVED_POSTS");
    setSelectedTopic(null);
    if (activeTab === "My Posts") setActiveTab("Recent");
    setMobileDrawer(null);
  };

  const handleSelectTopic = (topic: CommunityCategory) => {
    setSidebarView("TOPIC");
    setSelectedTopic(topic);
    setTopicsExpanded(true);
    if (activeTab === "My Posts") setActiveTab("Recent");
    setMobileDrawer(null);
  };

  const handleTabChange = (tab: FeedFilterTab) => {
    setActiveTab(tab);
    if (tab === "My Posts") {
      setSidebarView("MY_POSTS");
      setSelectedTopic(null);
    } else if (sidebarView === "MY_POSTS") {
      setSidebarView("HOME");
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setCreateError("Image size must be under 3 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setNewImageUrl(reader.result);
        setCreateError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newTitle.trim() || !newContent.trim()) {
      setCreateError("Please provide both a discussion title and content.");
      return;
    }

    setIsSubmittingPost(true);
    try {
      const res = await createCommunityPostAction({
        title: newTitle,
        content: newContent,
        category: newCategory,
        imageUrl: newImageUrl,
      });

      if (!res.success || !res.payload) {
        setCreateError(res.error || "Could not publish discussion.");
        return;
      }

      setData(res.payload);
      setNewTitle("");
      setNewContent("");
      setNewImageUrl(null);
      setIsCreateModalOpen(false);
      setSidebarView("HOME");
      setSelectedTopic(null);
      setActiveTab("Recent");
      showToast("Discussion published to Learning Community!");
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleToggleUpvote = async (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        posts: prev.posts.map((p) => {
          if (p.id !== postId) return p;
          const nextUpvoted = !p.isUpvoted;
          return {
            ...p,
            isUpvoted: nextUpvoted,
            upvotesCount: Math.max(0, p.upvotesCount + (nextUpvoted ? 1 : -1)),
          };
        }),
      };
    });

    const res = await togglePostUpvoteAction(postId);
    if (res.success && res.payload) {
      setData(res.payload);
    }
  };

  const handleToggleSave = async (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenMenuPostId(null);

    const targetPost = posts.find((p) => p.id === postId);
    const willSave = targetPost ? !targetPost.isSaved : true;

    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        posts: prev.posts.map((p) => (p.id === postId ? { ...p, isSaved: !p.isSaved } : p)),
      };
    });

    showToast(willSave ? "Discussion saved to your bookmarks." : "Removed from saved discussions.");

    const res = await toggleSavePostAction(postId);
    if (res.success && res.payload) {
      setData(res.payload);
    }
  };

  const handleDeletePost = async (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenMenuPostId(null);

    const res = await deleteCommunityPostAction(postId);
    if (res.success && res.payload) {
      setData(res.payload);
      if (activePostId === postId) setActivePostId(null);
      showToast("Your discussion has been deleted.");
    } else if (res.error) {
      showToast(res.error);
    }
  };

  const handleReportPost = async (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenMenuPostId(null);
    await reportCommunityPostAction(postId);
    showToast("Thank you. Discussion reported to moderators for review.");
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePost || !commentInput.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await addCommentOrReplyAction({
        postId: activePost.id,
        content: commentInput,
        parentCommentId: null,
      });
      if (res.success && res.payload) {
        setData(res.payload);
        setCommentInput("");
        showToast("Comment added to discussion.");
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleAddNestedReply = async (parentCommentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!activePost || !replyInput.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await addCommentOrReplyAction({
        postId: activePost.id,
        content: replyInput,
        parentCommentId,
      });
      if (res.success && res.payload) {
        setData(res.payload);
        setReplyInput("");
        setReplyingToCommentId(null);
        showToast("Reply posted.");
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const rootComments = useMemo(
    () => (activePost?.comments || []).filter((c) => !c.parentCommentId),
    [activePost]
  );

  const getRepliesForComment = (commentId: string) =>
    (activePost?.comments || []).filter((c) => c.parentCommentId === commentId);

  return (
    <div className={styles.pageWrapper}>
      {/* Sticky App Header */}
      <header className={styles.darkHeader}>
        <div className={styles.headerInner}>
          <nav className={styles.topNav} aria-label="Learning Community Navigation">
            <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
              <img src="/logo.jpg" alt="TechnoCAT Logo" className={styles.logoImage} />
            </Link>

            <div className={styles.navLinks}>
              <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
              <Link href="/browse" className={styles.navLink}>Browse</Link>
              <Link href="/topics" className={styles.navLink}>My Topics</Link>
              <Link href="/intelligence" className={`${styles.navLink} ${styles.navLinkActive}`}>
                Intelligence Hub
              </Link>
              <Link href="#" onClick={(e) => e.preventDefault()} className={styles.navLink}>
                Mock Viva Prep
              </Link>
            </div>

            <PostLoginNavActions />
          </nav>
        </div>
      </header>

      {/* 1. Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/intelligence" className={styles.breadcrumbLink}>
          Intelligence Hub
        </Link>{" "}
        &gt; <span>Learning Community</span>
      </div>

      {/* 2. Community Hero */}
      <section className={styles.heroSection}>
        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <div className={styles.heroBadge}>
              <span>✦</span> CAT ASPIRANT PEER NETWORK
            </div>
            <h1 className={styles.heroTitle}>
              Learning <span>Community</span>
            </h1>
            <p className={styles.heroSubtitleTag}>
              Connect &bull; Learn &bull; Discuss &bull; Grow Together
            </p>
            <p className={styles.heroDescription}>
              A space for CAT aspirants to ask questions, share strategies, discuss doubts and learn
              from each other&apos;s journey.
            </p>
          </div>

          {/* Subtle Student/Community Illustration on the Right */}
          <div className={styles.heroRightIllustration} aria-hidden="true">
            <svg width="68" height="68" viewBox="0 0 72 72" fill="none">
              <circle cx="36" cy="36" r="34" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2" />
              <circle cx="24" cy="28" r="7" fill="#2563EB" />
              <path
                d="M13 46C13 40.5 17.8 37 24 37C30.2 37 35 40.5 35 46"
                stroke="#2563EB"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <circle cx="48" cy="26" r="6.5" fill="#0EA5E9" />
              <path
                d="M38 44C38 39 42.3 36 48 36C53.7 36 58 39 58 44"
                stroke="#0EA5E9"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <rect x="26" y="48" width="22" height="12" rx="6" fill="#DBEAFE" />
              <circle cx="32" cy="54" r="1.8" fill="#1D4ED8" />
              <circle cx="37" cy="54" r="1.8" fill="#1D4ED8" />
              <circle cx="42" cy="54" r="1.8" fill="#1D4ED8" />
            </svg>
            <div className={styles.illustrationCardContent}>
              <div className={styles.illusPillRow}>
                <span className={styles.illusAvatarDot} style={{ background: "#2563EB" }}>
                  RD
                </span>
                <span>DILR 2-Round Strategy Shared</span>
              </div>
              <div className={styles.illusPillRow}>
                <span className={styles.illusAvatarDot} style={{ background: "#0EA5E9" }}>
                  AI
                </span>
                <span>VARC Inference Doubt Solved</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 17. Mobile Collapsible Sections (Community Menu, Topics, Community Stats) */}
      <div className={styles.mobileDrawersBar}>
        <div className={styles.mobileDrawerToggleRow}>
          <button
            type="button"
            className={`${styles.mobileDrawerBtn} ${
              mobileDrawer === "MENU" ? styles.mobileDrawerBtnActive : ""
            }`}
            onClick={() => setMobileDrawer(mobileDrawer === "MENU" ? null : "MENU")}
          >
            <span>🏠</span> Community Menu
          </button>
          <button
            type="button"
            className={`${styles.mobileDrawerBtn} ${
              mobileDrawer === "TOPICS" ? styles.mobileDrawerBtnActive : ""
            }`}
            onClick={() => setMobileDrawer(mobileDrawer === "TOPICS" ? null : "TOPICS")}
          >
            <span>📚</span> Topics
          </button>
          <button
            type="button"
            className={`${styles.mobileDrawerBtn} ${
              mobileDrawer === "STATS" ? styles.mobileDrawerBtnActive : ""
            }`}
            onClick={() => setMobileDrawer(mobileDrawer === "STATS" ? null : "STATS")}
          >
            <span>📊</span> Community Stats
          </button>
        </div>

        {mobileDrawer === "MENU" && (
          <div className={styles.mobileDrawerPanel}>
            <div className={styles.sidebarNavList}>
              <button
                type="button"
                className={`${styles.sidebarNavItem} ${
                  sidebarView === "HOME" ? styles.sidebarNavItemActive : ""
                }`}
                onClick={handleSelectHome}
              >
                <span className={styles.sidebarNavItemLeft}>
                  <span className={styles.sidebarNavIcon}>🏠</span>
                  <span>Community Home</span>
                </span>
              </button>
              <button
                type="button"
                className={`${styles.sidebarNavItem} ${
                  sidebarView === "MY_POSTS" ? styles.sidebarNavItemActive : ""
                }`}
                onClick={handleSelectMyPosts}
              >
                <span className={styles.sidebarNavItemLeft}>
                  <span className={styles.sidebarNavIcon}>📝</span>
                  <span>My Posts</span>
                </span>
                {myPostsCount > 0 && (
                  <span className={styles.sidebarCountBadge}>{myPostsCount}</span>
                )}
              </button>
              <button
                type="button"
                className={`${styles.sidebarNavItem} ${
                  sidebarView === "SAVED_POSTS" ? styles.sidebarNavItemActive : ""
                }`}
                onClick={handleSelectSavedPosts}
              >
                <span className={styles.sidebarNavItemLeft}>
                  <span className={styles.sidebarNavIcon}>🔖</span>
                  <span>Saved Posts</span>
                </span>
                {savedPostsCount > 0 && (
                  <span className={styles.sidebarCountBadge}>{savedPostsCount}</span>
                )}
              </button>
            </div>
          </div>
        )}

        {mobileDrawer === "TOPICS" && (
          <div className={styles.mobileDrawerPanel}>
            <div className={styles.sidebarNavList}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.topicSubItem} ${
                    sidebarView === "TOPIC" && selectedTopic === cat
                      ? styles.topicSubItemActive
                      : ""
                  }`}
                  onClick={() => handleSelectTopic(cat)}
                >
                  <span>{cat}</span>
                  <span className={styles.sidebarCountBadge}>
                    {posts.filter((p) => p.category === cat).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {mobileDrawer === "STATS" && (
          <div className={styles.mobileDrawerPanel}>
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <span className={styles.statNumber}>{data ? data.stats.members : "—"}</span>
                <span className={styles.statLabel}>Members</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNumber}>{data ? data.stats.discussions : "—"}</span>
                <span className={styles.statLabel}>Discussions</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNumber}>{data ? data.stats.solutions : "—"}</span>
                <span className={styles.statLabel}>Solutions</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNumber}>{data ? data.stats.helpfulRate : "—"}</span>
                <span className={styles.statLabel}>Helpful Rate</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Main 3-Column Layout */}
      <main className={styles.mainContainer}>
        {/* 4. Left Sidebar */}
        <aside className={styles.leftSidebar} aria-label="Community Sidebar Navigation">
          <div className={styles.sidebarSectionTitle}>COMMUNITY</div>
          <div className={styles.sidebarNavList}>
            <button
              type="button"
              className={`${styles.sidebarNavItem} ${
                sidebarView === "HOME" ? styles.sidebarNavItemActive : ""
              }`}
              onClick={handleSelectHome}
            >
              <span className={styles.sidebarNavItemLeft}>
                <span className={styles.sidebarNavIcon}>🏠</span>
                <span>Community Home</span>
              </span>
            </button>

            <button
              type="button"
              className={`${styles.sidebarNavItem} ${
                sidebarView === "MY_POSTS" ? styles.sidebarNavItemActive : ""
              }`}
              onClick={handleSelectMyPosts}
            >
              <span className={styles.sidebarNavItemLeft}>
                <span className={styles.sidebarNavIcon}>📝</span>
                <span>My Posts</span>
              </span>
              {myPostsCount > 0 && <span className={styles.sidebarCountBadge}>{myPostsCount}</span>}
            </button>

            <button
              type="button"
              className={`${styles.sidebarNavItem} ${
                sidebarView === "SAVED_POSTS" ? styles.sidebarNavItemActive : ""
              }`}
              onClick={handleSelectSavedPosts}
            >
              <span className={styles.sidebarNavItemLeft}>
                <span className={styles.sidebarNavIcon}>🔖</span>
                <span>Saved Posts</span>
              </span>
              {savedPostsCount > 0 && (
                <span className={styles.sidebarCountBadge}>{savedPostsCount}</span>
              )}
            </button>

            {/* Expandable Topics Item */}
            <div>
              <button
                type="button"
                className={`${styles.sidebarNavItem} ${
                  sidebarView === "TOPIC" ? styles.sidebarNavItemActive : ""
                }`}
                onClick={() => setTopicsExpanded((prev) => !prev)}
                aria-expanded={topicsExpanded}
              >
                <span className={styles.sidebarNavItemLeft}>
                  <span className={styles.sidebarNavIcon}>📚</span>
                  <span>Topics</span>
                </span>
                <span
                  className={`${styles.topicsChevron} ${
                    topicsExpanded ? styles.topicsChevronOpen : ""
                  }`}
                >
                  ▾
                </span>
              </button>

              {topicsExpanded && (
                <div className={styles.topicsSubList}>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`${styles.topicSubItem} ${
                        sidebarView === "TOPIC" && selectedTopic === cat
                          ? styles.topicSubItemActive
                          : ""
                      }`}
                      onClick={() => handleSelectTopic(cat)}
                    >
                      <span>{cat}</span>
                      <span style={{ fontSize: "11px", color: "#64748B" }}>
                        {posts.filter((p) => p.category === cat).length}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Center Discussion Feed */}
        <section className={styles.feedColumn} aria-label="Discussion Feed">
          {/* 5. Create Post Prompt */}
          <div className={styles.createPostPromptCard}>
            <div className={styles.userAvatarCircle}>
              {data?.currentUser.avatarUrl ? (
                <img
                  src={data.currentUser.avatarUrl}
                  alt={data.currentUser.fullName}
                  className={styles.userAvatarImg}
                />
              ) : (
                getInitials(data?.currentUser.fullName || "CAT Aspirant")
              )}
            </div>
            <button
              type="button"
              className={styles.createPostTriggerInput}
              onClick={() => {
                if (selectedTopic) setNewCategory(selectedTopic);
                setIsCreateModalOpen(true);
              }}
            >
              Share your thoughts, ask a doubt, or start a discussion…
            </button>
            <button
              type="button"
              className={styles.createPostQuickBtn}
              onClick={() => {
                if (selectedTopic) setNewCategory(selectedTopic);
                setIsCreateModalOpen(true);
              }}
            >
              + New Post
            </button>
          </div>

          {/* 6. Discussion Filters & Search */}
          <div className={styles.filtersToolbar}>
            <div className={styles.filterTabsGroup} role="tablist" aria-label="Discussion Filters">
              {(
                ["Recent", "Most Helpful", "Trending", "Unanswered", "My Posts"] as FeedFilterTab[]
              ).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  className={`${styles.filterTabBtn} ${
                    activeTab === tab ? styles.filterTabBtnActive : ""
                  }`}
                  onClick={() => handleTabChange(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className={styles.searchBoxWrap}>
              <span className={styles.searchIcon} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search discussions..."
                className={styles.searchInput}
                aria-label="Search discussions"
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Contextual Banner when viewing Saved Posts or a Specific Topic */}
          {sidebarView === "SAVED_POSTS" && (
            <div className={styles.activeFilterBanner}>
              <span>🔖 Viewing your Saved Discussions ({savedPostsCount})</span>
              <button
                type="button"
                className={styles.clearFilterBtn}
                onClick={handleSelectHome}
              >
                Back to All Discussions
              </button>
            </div>
          )}

          {sidebarView === "TOPIC" && selectedTopic && (
            <div className={styles.activeFilterBanner}>
              <span>📚 Topic Filter: {selectedTopic}</span>
              <button
                type="button"
                className={styles.clearFilterBtn}
                onClick={handleSelectHome}
              >
                Clear Topic ✕
              </button>
            </div>
          )}

          {/* 7. Discussion Feed List or Empty States */}
          {loading ? (
            <div className={styles.emptyStateCard}>
              <div className={styles.emptyStateIcon}>⏳</div>
              <p className={styles.emptyStateTitle}>Loading community discussions...</p>
            </div>
          ) : visiblePosts.length === 0 ? (
            /* 14. Empty States */
            sidebarView === "SAVED_POSTS" ? (
              <div className={styles.emptyStateCard}>
                <div className={styles.emptyStateIcon}>🔖</div>
                <p className={styles.emptyStateTitle}>No saved discussions yet.</p>
                <button
                  type="button"
                  className={styles.emptyStateCtaBtn}
                  onClick={handleSelectHome}
                >
                  Explore Community
                </button>
              </div>
            ) : sidebarView === "MY_POSTS" || activeTab === "My Posts" ? (
              <div className={styles.emptyStateCard}>
                <div className={styles.emptyStateIcon}>📝</div>
                <p className={styles.emptyStateTitle}>
                  You haven&apos;t created any discussions yet.
                </p>
                <button
                  type="button"
                  className={styles.emptyStateCtaBtn}
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Start a Discussion
                </button>
              </div>
            ) : searchQuery.trim().length > 0 ? (
              <div className={styles.emptyStateCard}>
                <div className={styles.emptyStateIcon}>🔍</div>
                <p className={styles.emptyStateTitle}>No discussions found.</p>
                <button
                  type="button"
                  className={styles.emptyStateCtaBtn}
                  onClick={() => setSearchQuery("")}
                >
                  Reset Search
                </button>
              </div>
            ) : (
              <div className={styles.emptyStateCard}>
                <div className={styles.emptyStateIcon}>💬</div>
                <p className={styles.emptyStateTitle}>
                  {"No discussions yet.\nBe the first to start a conversation."}
                </p>
                <button
                  type="button"
                  className={styles.emptyStateCtaBtn}
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Start a Discussion
                </button>
              </div>
            )
          ) : (
            <div className={styles.postsList}>
              {visiblePosts.map((post) => (
                <article
                  key={post.id}
                  className={styles.postCard}
                  onClick={() => {
                    setActivePostId(post.id);
                    setReplyingToCommentId(null);
                  }}
                >
                  <div className={styles.postHeaderRow}>
                    <div className={styles.postAuthorMeta}>
                      <div className={styles.userAvatarCircle}>
                        {post.authorAvatar ? (
                          <img
                            src={post.authorAvatar}
                            alt={post.authorName}
                            className={styles.userAvatarImg}
                          />
                        ) : (
                          getInitials(post.authorName)
                        )}
                      </div>
                      <div>
                        <div className={styles.authorNameRow}>
                          <span className={styles.authorName}>{post.authorName}</span>
                          <span className={styles.postTime}>
                            &bull; {formatRelativeTime(post.createdAt)}
                          </span>
                        </div>
                        <div className={styles.authorSubRole}>{post.authorRole}</div>
                      </div>
                    </div>

                    <div className={styles.postHeaderRight}>
                      <span className={getCategoryBadgeClass(post.category)}>
                        {post.category}
                      </span>

                      {/* Three-dot Menu */}
                      <div
                        className={styles.menuWrap}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className={styles.threeDotBtn}
                          aria-label="Discussion options"
                          onClick={() =>
                            setOpenMenuPostId((prev) => (prev === post.id ? null : post.id))
                          }
                        >
                          ⋯
                        </button>

                        {openMenuPostId === post.id && (
                          <div className={styles.dropdownMenu}>
                            <button
                              type="button"
                              className={styles.dropdownItem}
                              onClick={(e) => handleToggleSave(post.id, e)}
                            >
                              <span>🔖</span>
                              <span>{post.isSaved ? "Unsave" : "Save"}</span>
                            </button>
                            <button
                              type="button"
                              className={styles.dropdownItem}
                              onClick={(e) => handleReportPost(post.id, e)}
                            >
                              <span>🚩</span>
                              <span>Report</span>
                            </button>
                            {post.isOwnPost && (
                              <button
                                type="button"
                                className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                                onClick={(e) => handleDeletePost(post.id, e)}
                              >
                                <span>🗑️</span>
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <h2 className={styles.postTitle}>{post.title}</h2>
                  <p className={styles.postSnippet}>{post.content}</p>

                  {post.imageUrl && (
                    <div className={styles.postImageThumbWrap}>
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className={styles.postImageThumb}
                      />
                    </div>
                  )}

                  <div className={styles.postActionsBar}>
                    <div className={styles.postActionsLeft}>
                      <button
                        type="button"
                        className={`${styles.actionPillBtn} ${
                          post.isUpvoted ? styles.actionPillUpvoted : ""
                        }`}
                        onClick={(e) => handleToggleUpvote(post.id, e)}
                        aria-label={`Upvote (${post.upvotesCount})`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={post.isUpvoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 4l-8 8h5v8h6v-8h5z" />
                        </svg>
                        <span>Upvote &bull; {post.upvotesCount}</span>
                      </button>

                      <button
                        type="button"
                        className={styles.actionPillBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePostId(post.id);
                          setReplyingToCommentId(null);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <span>
                          {post.commentsCount}{" "}
                          {post.commentsCount === 1 ? "Comment" : "Comments"}
                        </span>
                      </button>
                    </div>

                    <button
                      type="button"
                      className={`${styles.actionPillBtn} ${
                        post.isSaved ? styles.actionPillSaved : ""
                      }`}
                      onClick={(e) => handleToggleSave(post.id, e)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={post.isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>{post.isSaved ? "Saved" : "Save"}</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* 9. Right Sidebar (Strictly 3 Widgets) */}
        <aside className={styles.rightSidebar} aria-label="Community Insights">
          {/* Widget 1: Community Stats */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetTitleRow}>
              <h3 className={styles.widgetTitle}>COMMUNITY STATS</h3>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <span className={styles.statNumber}>{data ? data.stats.members : "—"}</span>
                <span className={styles.statLabel}>Members</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNumber}>{data ? data.stats.discussions : "—"}</span>
                <span className={styles.statLabel}>Discussions</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNumber}>{data ? data.stats.solutions : "—"}</span>
                <span className={styles.statLabel}>Solutions</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNumber}>{data ? data.stats.helpfulRate : "—"}</span>
                <span className={styles.statLabel}>Helpful Rate</span>
              </div>
            </div>
          </div>

          {/* Widget 2: Top Contributors */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetTitleRow}>
              <h3 className={styles.widgetTitle}>TOP CONTRIBUTORS</h3>
            </div>
            <p className={styles.widgetSub}>Top contributors this month</p>

            {!data || data.topContributors.length === 0 ? (
              <div style={{ fontSize: "12.5px", color: "#64748B" }}>
                No contributor activity recorded yet.
              </div>
            ) : (
              <div className={styles.contributorsList}>
                {data.topContributors.map((contributor) => (
                  <div key={contributor.authorId} className={styles.contributorRow}>
                    <div className={styles.contributorLeft}>
                      <span
                        className={`${styles.rankBadge} ${
                          contributor.rank === 1 ? styles.rankBadgeGold : ""
                        }`}
                      >
                        #{contributor.rank}
                      </span>
                      <div className={styles.contributorAvatar}>
                        {contributor.authorAvatar ? (
                          <img
                            src={contributor.authorAvatar}
                            alt={contributor.authorName}
                            className={styles.userAvatarImg}
                          />
                        ) : (
                          getInitials(contributor.authorName)
                        )}
                      </div>
                      <span className={styles.contributorName}>{contributor.authorName}</span>
                    </div>
                    <span className={styles.contributorPostCount}>
                      {contributor.postCount} {contributor.postCount === 1 ? "post" : "posts"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget 3: Community Guidelines */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetTitleRow}>
              <h3 className={styles.widgetTitle}>Community Guidelines</h3>
            </div>
            <ul className={styles.guidelinesList}>
              <li>
                <span className={styles.guidelineBullet}>&bull;</span>
                <span>Be respectful and supportive</span>
              </li>
              <li>
                <span className={styles.guidelineBullet}>&bull;</span>
                <span>Keep discussions relevant to CAT preparation</span>
              </li>
              <li>
                <span className={styles.guidelineBullet}>&bull;</span>
                <span>No spam or promotional content</span>
              </li>
              <li>
                <span className={styles.guidelineBullet}>&bull;</span>
                <span>Help others and share genuine insights</span>
              </li>
            </ul>
          </div>
        </aside>
      </main>

      {/* 5. Create Post Modal */}
      {isCreateModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsCreateModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-post-modal-title"
        >
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 id="create-post-modal-title" className={styles.modalTitle}>
                Start a New Discussion
              </h2>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePostSubmit}>
              <div className={styles.modalBody}>
                {createError && (
                  <div
                    style={{
                      background: "#FEF2F2",
                      border: "1px solid #FECACA",
                      color: "#DC2626",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      fontSize: "12.5px",
                      fontWeight: 600,
                    }}
                  >
                    {createError}
                  </div>
                )}

                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="post-title-input">
                    Title
                  </label>
                  <input
                    id="post-title-input"
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g., How to approach Maxima-Minima DILR sets under time pressure?"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="post-category-select">
                    Category
                  </label>
                  <select
                    id="post-category-select"
                    className={styles.formSelect}
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as CommunityCategory)}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="post-content-textarea">
                    Content
                  </label>
                  <textarea
                    id="post-content-textarea"
                    className={styles.formTextarea}
                    placeholder="Share your question, mock breakdown, formula shortcut, or preparation strategy..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <span className={styles.formLabel}>Image Attachment (Optional)</span>
                  <div className={styles.imageAttachRow}>
                    <label className={styles.imageUploadLabel}>
                      <span>📷 Attach Screenshot / Diagram</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        style={{ display: "none" }}
                      />
                    </label>
                    {newImageUrl && (
                      <button
                        type="button"
                        className={styles.btnCancel}
                        onClick={() => setNewImageUrl(null)}
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                  {newImageUrl && (
                    <div className={styles.postImageThumbWrap} style={{ marginTop: "8px" }}>
                      <img
                        src={newImageUrl}
                        alt="Attachment preview"
                        className={styles.postImageThumb}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={isSubmittingPost}
                >
                  {isSubmittingPost ? "Posting..." : "Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Full Discussion View Modal */}
      {activePost && (
        <div
          className={styles.modalOverlay}
          onClick={() => setActivePostId(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="discussion-modal-title"
        >
          <div
            className={`${styles.modalCard} ${styles.discussionModalCard}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.postAuthorMeta}>
                <div className={styles.userAvatarCircle}>
                  {activePost.authorAvatar ? (
                    <img
                      src={activePost.authorAvatar}
                      alt={activePost.authorName}
                      className={styles.userAvatarImg}
                    />
                  ) : (
                    getInitials(activePost.authorName)
                  )}
                </div>
                <div>
                  <div className={styles.authorNameRow}>
                    <span className={styles.authorName}>{activePost.authorName}</span>
                    <span className={styles.postTime}>
                      &bull; {formatRelativeTime(activePost.createdAt)}
                    </span>
                  </div>
                  <div className={styles.authorSubRole}>{activePost.authorRole}</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className={getCategoryBadgeClass(activePost.category)}>
                  {activePost.category}
                </span>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setActivePostId(null)}
                  aria-label="Close discussion"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className={styles.modalBody}>
              <h2 id="discussion-modal-title" className={styles.postTitle}>
                {activePost.title}
              </h2>
              <div className={styles.fullPostContent}>{activePost.content}</div>

              {activePost.imageUrl && (
                <div className={styles.postImageThumbWrap} style={{ maxHeight: "360px" }}>
                  <img
                    src={activePost.imageUrl}
                    alt={activePost.title}
                    className={styles.postImageThumb}
                    style={{ maxHeight: "360px", objectFit: "contain" }}
                  />
                </div>
              )}

              {/* Upvote / Save / Delete bar */}
              <div className={styles.postActionsBar}>
                <div className={styles.postActionsLeft}>
                  <button
                    type="button"
                    className={`${styles.actionPillBtn} ${
                      activePost.isUpvoted ? styles.actionPillUpvoted : ""
                    }`}
                    onClick={() => handleToggleUpvote(activePost.id)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={activePost.isUpvoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 4l-8 8h5v8h6v-8h5z" />
                    </svg>
                    <span>Upvote &bull; {activePost.upvotesCount}</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.actionPillBtn} ${
                      activePost.isSaved ? styles.actionPillSaved : ""
                    }`}
                    onClick={() => handleToggleSave(activePost.id)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={activePost.isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>{activePost.isSaved ? "Saved" : "Save"}</span>
                  </button>
                </div>

                {activePost.isOwnPost && (
                  <button
                    type="button"
                    className={`${styles.actionPillBtn} ${styles.dropdownItemDanger}`}
                    onClick={() => handleDeletePost(activePost.id)}
                  >
                    <span>🗑️ Delete Post</span>
                  </button>
                )}
              </div>

              {/* Reply / Comment Box */}
              <form className={styles.commentComposerBox} onSubmit={handleAddComment}>
                <textarea
                  className={styles.formTextarea}
                  style={{ minHeight: "82px", background: "#FFFFFF" }}
                  placeholder="Write a helpful response, share your solution, or ask a follow-up..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                />
                <div className={styles.commentComposerActions}>
                  <button
                    type="submit"
                    className={styles.btnSubmit}
                    disabled={isSubmittingComment || !commentInput.trim()}
                  >
                    {isSubmittingComment ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              </form>

              {/* Comments & Replies Thread */}
              <div className={styles.commentsSectionHeader}>
                <span>Comments ({activePost.commentsCount})</span>
              </div>

              {rootComments.length === 0 ? (
                <div className={styles.emptyStateCard} style={{ padding: "28px 20px" }}>
                  <p className={styles.emptyStateTitle} style={{ fontSize: "14px" }}>
                    {"No replies yet.\nStart the conversation."}
                  </p>
                </div>
              ) : (
                <div className={styles.commentsThreadList}>
                  {rootComments.map((comment) => {
                    const replies = getRepliesForComment(comment.id);
                    return (
                      <div key={comment.id} className={styles.commentCard}>
                        <div className={styles.postAuthorMeta}>
                          <div
                            className={styles.userAvatarCircle}
                            style={{ width: "32px", height: "32px", fontSize: "12px" }}
                          >
                            {getInitials(comment.authorName)}
                          </div>
                          <div>
                            <div className={styles.authorNameRow}>
                              <span className={styles.authorName} style={{ fontSize: "13px" }}>
                                {comment.authorName}
                              </span>
                              <span className={styles.postTime}>
                                &bull; {formatRelativeTime(comment.createdAt)}
                              </span>
                            </div>
                            <div className={styles.authorSubRole}>{comment.authorRole}</div>
                          </div>
                        </div>

                        <p className={styles.commentText}>{comment.content}</p>

                        <button
                          type="button"
                          className={styles.commentReplyTriggerBtn}
                          onClick={() => {
                            setReplyingToCommentId((prev) =>
                              prev === comment.id ? null : comment.id
                            );
                            setReplyInput("");
                          }}
                        >
                          ↩ Reply
                        </button>

                        {replyingToCommentId === comment.id && (
                          <form
                            className={styles.inlineReplyForm}
                            onSubmit={(e) => handleAddNestedReply(comment.id, e)}
                          >
                            <input
                              type="text"
                              className={styles.formInput}
                              placeholder={`Reply to ${comment.authorName}...`}
                              value={replyInput}
                              onChange={(e) => setReplyInput(e.target.value)}
                              autoFocus
                            />
                            <button
                              type="submit"
                              className={styles.btnSubmit}
                              disabled={isSubmittingComment || !replyInput.trim()}
                            >
                              Reply
                            </button>
                          </form>
                        )}

                        {replies.length > 0 && (
                          <div className={styles.nestedRepliesList}>
                            {replies.map((rep) => (
                              <div key={rep.id} className={styles.nestedReplyCard}>
                                <div className={styles.authorNameRow}>
                                  <span className={styles.authorName} style={{ fontSize: "12.5px" }}>
                                    {rep.authorName}
                                  </span>
                                  <span className={styles.postTime}>
                                    &bull; {formatRelativeTime(rep.createdAt)}
                                  </span>
                                </div>
                                <p className={styles.commentText} style={{ margin: "4px 0 0" }}>
                                  {rep.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && <div className={styles.toastBanner}>{toastMessage}</div>}
    </div>
  );
}
