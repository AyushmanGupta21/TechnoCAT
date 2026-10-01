"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import styles from "./learning-community.module.css";
import {
  CommunityCategory,
  CommunityPayload,
  CommunityPostItem,
  ContributorItem,
  getCommunityDataAction,
  createCommunityPostAction,
  togglePostUpvoteAction,
  toggleSavePostAction,
  addCommentOrReplyAction,
  deleteCommunityPostAction,
  reportCommunityPostAction,
} from "./actions";

interface CategoryMeta {
  name: CommunityCategory;
  icon: string;
}

const CATEGORIES_CONFIG: CategoryMeta[] = [
  { name: "General Discussion", icon: "💬" },
  { name: "CAT Strategy", icon: "🎯" },
  { name: "Doubt Solving", icon: "❓" },
  { name: "Study Resources", icon: "📖" },
  { name: "Mocks & Analysis", icon: "📊" },
  { name: "College Discussions", icon: "🎓" },
  { name: "Motivation & Journey", icon: "⭐" },
  { name: "Off-topic", icon: "☕" },
];

const DEFAULT_CONTRIBUTORS: ContributorItem[] = [
  {
    authorId: "user-priya",
    authorName: "priya_singh",
    authorAvatar: "/community/contrib-priya.png",
    postCount: 55,
    commentCount: 0,
    totalScore: 55,
    rank: 1,
  },
  {
    authorId: "user-aniket",
    authorName: "aniket_verma",
    authorAvatar: "/community/contrib-aniket.png",
    postCount: 41,
    commentCount: 0,
    totalScore: 41,
    rank: 2,
  },
  {
    authorId: "user-shruti",
    authorName: "shruti_agarwal",
    authorAvatar: "/community/contrib-shruti.png",
    postCount: 37,
    commentCount: 0,
    totalScore: 37,
    rank: 3,
  },
  {
    authorId: "user-karthik",
    authorName: "karthik_r",
    authorAvatar: "/community/contrib-karthik.png",
    postCount: 31,
    commentCount: 0,
    totalScore: 31,
    rank: 4,
  },
  {
    authorId: "user-neha",
    authorName: "neha_14",
    authorAvatar: "/community/contrib-neha.png",
    postCount: 28,
    commentCount: 0,
    totalScore: 28,
    rank: 5,
  },
];

type SidebarSection = "HOME" | "MY_POSTS" | "SAVED_POSTS" | "BOOKMARKS";
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

function getAuthorAvatar(authorName: string): string | null {
  const map: Record<string, string> = {
    aditi_sharma: "/community/avatar-aditi.png",
    rahul_k: "/community/avatar-rahul.png",
    megha_17: "/community/avatar-megha.png",
    priya_singh: "/community/contrib-priya.png",
    aniket_verma: "/community/contrib-aniket.png",
    shruti_agarwal: "/community/contrib-shruti.png",
    karthik_r: "/community/contrib-karthik.png",
    neha_14: "/community/contrib-neha.png",
  };
  return map[authorName] || null;
}

function getCategoryBadgeClass(cat: CommunityCategory): string {
  switch (cat) {
    case "General Discussion":
      return `${styles.categoryBadge} ${styles.catGeneral}`;
    case "CAT Strategy":
      return `${styles.categoryBadge} ${styles.catStrategy}`;
    case "Doubt Solving":
      return `${styles.categoryBadge} ${styles.catDoubt}`;
    case "Study Resources":
      return `${styles.categoryBadge} ${styles.catResources}`;
    case "Mocks & Analysis":
      return `${styles.categoryBadge} ${styles.catMocks}`;
    case "College Discussions":
      return `${styles.categoryBadge} ${styles.catCollege}`;
    case "Motivation & Journey":
      return `${styles.categoryBadge} ${styles.catMotivation}`;
    case "Off-topic":
      return `${styles.categoryBadge} ${styles.catOfftopic}`;
    default:
      return `${styles.categoryBadge} ${styles.catGeneral}`;
  }
}

export default function LearningCommunityPage() {
  const [data, setData] = useState<CommunityPayload | null>(null);
  const [loading, setLoading] = useState(true);

  // Navigation & filter state
  const [sidebarView, setSidebarView] = useState<SidebarSection>("HOME");
  const [selectedCategory, setSelectedCategory] = useState<CommunityCategory | null>(null);
  const [activeTab, setActiveTab] = useState<FeedFilterTab>("Recent");
  const [searchQuery, setSearchQuery] = useState("");

  // Mobile drawer state
  const [mobileDrawer, setMobileDrawer] = useState<"MENU" | "CATEGORIES" | "STATS" | null>(null);

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
    } else if (sidebarView === "SAVED_POSTS" || sidebarView === "BOOKMARKS") {
      list = list.filter((p) => p.isSaved);
    }

    // 2. Category filtering
    if (selectedCategory) {
      list = list.filter((p) => p.category === selectedCategory);
    }

    // 3. Tab filtering
    if (activeTab === "Unanswered") {
      list = list.filter((p) => p.commentsCount === 0);
    }

    // 4. Search query filtering
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

    // 5. Sorting
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
  }, [posts, sidebarView, selectedCategory, activeTab, searchQuery]);

  const myPostsCount = useMemo(() => posts.filter((p) => p.isOwnPost).length, [posts]);
  const savedPostsCount = useMemo(() => posts.filter((p) => p.isSaved).length, [posts]);

  const topContributorsList = useMemo(() => {
    if (data?.topContributors && data.topContributors.length > 0) {
      return data.topContributors;
    }
    return DEFAULT_CONTRIBUTORS;
  }, [data]);

  // Handlers
  const handleSelectHome = () => {
    setSidebarView("HOME");
    setSelectedCategory(null);
    if (activeTab === "My Posts") setActiveTab("Recent");
    setMobileDrawer(null);
  };

  const handleSelectMyPosts = () => {
    setSidebarView("MY_POSTS");
    setSelectedCategory(null);
    setActiveTab("My Posts");
    setMobileDrawer(null);
  };

  const handleSelectSavedPosts = () => {
    setSidebarView("SAVED_POSTS");
    setSelectedCategory(null);
    if (activeTab === "My Posts") setActiveTab("Recent");
    setMobileDrawer(null);
  };

  const handleSelectBookmarks = () => {
    setSidebarView("BOOKMARKS");
    setSelectedCategory(null);
    if (activeTab === "My Posts") setActiveTab("Recent");
    setMobileDrawer(null);
  };

  const handleToggleCategory = (cat: CommunityCategory) => {
    if (selectedCategory === cat) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(cat);
      setSidebarView("HOME");
      if (activeTab === "My Posts") setActiveTab("Recent");
    }
    setMobileDrawer(null);
  };

  const handleTabChange = (tab: FeedFilterTab) => {
    setActiveTab(tab);
    if (tab === "My Posts") {
      setSidebarView("MY_POSTS");
      setSelectedCategory(null);
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
      setSelectedCategory(null);
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

      {/* 1. Breadcrumb Navigation */}
      <div className={styles.breadcrumb}>
        <Link href="/intelligence" className={styles.breadcrumbLink}>
          Intelligence Hub
        </Link>{" "}
        &gt; <span>Learning Community</span>
      </div>

      <div className={styles.outerContainer}>
        {/* 2. Hero Section Matching Reference Image */}
        <section className={styles.heroBannerCard}>
          <div className={styles.heroLeftGroup}>
            <div className={styles.heroIconSquare}>
              <img
                src="/community/hero-community-icon.png"
                alt="Learning Community"
                className={styles.heroIconImg}
              />
            </div>
            <div className={styles.heroTextCol}>
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
          </div>

          <div className={styles.heroCenterIllustration}>
            <img
              src="/community/hero-students.png"
              alt="CAT aspirants discussing"
              className={styles.heroStudentsImg}
            />
          </div>

          <div className={styles.heroRightCallout}>
            <img
              src="/community/hero-target-badge.png"
              alt="Good Discussions Lead to Better Preparation"
              className={styles.heroBadgeImg}
            />
          </div>
        </section>

        {/* Mobile Drawers Toggle for Small Screens */}
        <div className={styles.mobileDrawersBar}>
          <div className={styles.mobileDrawerToggleRow}>
            <button
              type="button"
              className={`${styles.mobileDrawerBtn} ${
                mobileDrawer === "MENU" ? styles.mobileDrawerBtnActive : ""
              }`}
              onClick={() => setMobileDrawer(mobileDrawer === "MENU" ? null : "MENU")}
            >
              <span>🏠</span> Menu
            </button>
            <button
              type="button"
              className={`${styles.mobileDrawerBtn} ${
                mobileDrawer === "CATEGORIES" ? styles.mobileDrawerBtnActive : ""
              }`}
              onClick={() => setMobileDrawer(mobileDrawer === "CATEGORIES" ? null : "CATEGORIES")}
            >
              <span>🏷️</span> Categories
            </button>
            <button
              type="button"
              className={`${styles.mobileDrawerBtn} ${
                mobileDrawer === "STATS" ? styles.mobileDrawerBtnActive : ""
              }`}
              onClick={() => setMobileDrawer(mobileDrawer === "STATS" ? null : "STATS")}
            >
              <span>📊</span> Stats
            </button>
          </div>

          {mobileDrawer === "MENU" && (
            <div className={styles.mobileDrawerPanel}>
              <div className={styles.sidebarNavList}>
                <button
                  type="button"
                  className={`${styles.sidebarNavItem} ${
                    sidebarView === "HOME" && !selectedCategory ? styles.sidebarNavItemActive : ""
                  }`}
                  onClick={handleSelectHome}
                >
                  <span className={styles.sidebarNavItemLeft}>
                    <span>🏠</span>
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
                    <span>📝</span>
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
                    <span>🔖</span>
                    <span>Saved Posts</span>
                  </span>
                  {savedPostsCount > 0 && (
                    <span className={styles.sidebarCountBadge}>{savedPostsCount}</span>
                  )}
                </button>
                <button
                  type="button"
                  className={`${styles.sidebarNavItem} ${
                    sidebarView === "BOOKMARKS" ? styles.sidebarNavItemActive : ""
                  }`}
                  onClick={handleSelectBookmarks}
                >
                  <span className={styles.sidebarNavItemLeft}>
                    <span>📑</span>
                    <span>Bookmarks</span>
                  </span>
                  {savedPostsCount > 0 && (
                    <span className={styles.sidebarCountBadge}>{savedPostsCount}</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {mobileDrawer === "CATEGORIES" && (
            <div className={styles.mobileDrawerPanel}>
              <div className={styles.sidebarNavList}>
                {CATEGORIES_CONFIG.map((cat) => {
                  const count = posts.filter((p) => p.category === cat.name).length;
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      className={`${styles.sidebarCategoryItem} ${
                        isSelected ? styles.sidebarCategoryItemActive : ""
                      }`}
                      onClick={() => handleToggleCategory(cat.name)}
                    >
                      <span className={styles.sidebarCategoryLeft}>
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </span>
                      {count > 0 && <span className={styles.sidebarCategoryCount}>{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {mobileDrawer === "STATS" && (
            <div className={styles.mobileDrawerPanel}>
              <div className={styles.statsGrid}>
                <div className={`${styles.statBox} ${styles.statBoxBlue}`}>
                  <span className={styles.statNumber}>{data ? data.stats.members : "2.4K"}</span>
                  <span className={styles.statLabel}>Members</span>
                </div>
                <div className={`${styles.statBox} ${styles.statBoxCyan}`}>
                  <span className={styles.statNumber}>{data ? data.stats.discussions : "1.2K"}</span>
                  <span className={styles.statLabel}>Discussions</span>
                </div>
                <div className={`${styles.statBox} ${styles.statBoxPurple}`}>
                  <span className={styles.statNumber}>{data ? data.stats.solutions : "3.1K"}</span>
                  <span className={styles.statLabel}>Solutions</span>
                </div>
                <div className={`${styles.statBox} ${styles.statBoxAmber}`}>
                  <span className={styles.statNumber}>{data ? data.stats.helpfulRate : "92%"}</span>
                  <span className={styles.statLabel}>Helpful Rate</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Main 3-Column Layout (~20% Sidebar, ~55% Feed, ~25% Widgets) */}
        <main className={styles.mainContainer}>
          {/* Left Sidebar Navigation */}
          <aside className={styles.leftSidebar} aria-label="Community Navigation">
            <div className={styles.sidebarNavList}>
              <button
                type="button"
                className={`${styles.sidebarNavItem} ${
                  sidebarView === "HOME" && !selectedCategory ? styles.sidebarNavItemActive : ""
                }`}
                onClick={handleSelectHome}
              >
                <span className={styles.sidebarNavItemLeft}>
                  <span className={styles.sidebarIconWrap}>🏠</span>
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
                  <span className={styles.sidebarIconWrap}>📝</span>
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
                  <span className={styles.sidebarIconWrap}>🔖</span>
                  <span>Saved Posts</span>
                </span>
                {savedPostsCount > 0 && (
                  <span className={styles.sidebarCountBadge}>{savedPostsCount}</span>
                )}
              </button>

              <button
                type="button"
                className={`${styles.sidebarNavItem} ${
                  sidebarView === "BOOKMARKS" ? styles.sidebarNavItemActive : ""
                }`}
                onClick={handleSelectBookmarks}
              >
                <span className={styles.sidebarNavItemLeft}>
                  <span className={styles.sidebarIconWrap}>📑</span>
                  <span>Bookmarks</span>
                </span>
                {savedPostsCount > 0 && (
                  <span className={styles.sidebarCountBadge}>{savedPostsCount}</span>
                )}
              </button>
            </div>

            <div className={styles.sidebarDivider} />

            <div className={styles.sidebarSectionTitle}>
              <span>DISCUSS CATEGORIES</span>
            </div>

            <div className={styles.sidebarNavList}>
              {CATEGORIES_CONFIG.map((cat) => {
                const count = posts.filter((p) => p.category === cat.name).length;
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    className={`${styles.sidebarCategoryItem} ${
                      isSelected ? styles.sidebarCategoryItemActive : ""
                    }`}
                    onClick={() => handleToggleCategory(cat.name)}
                  >
                    <span className={styles.sidebarCategoryLeft}>
                      <span className={styles.sidebarCategoryIcon}>{cat.icon}</span>
                      <span className={styles.sidebarCategoryName}>{cat.name}</span>
                    </span>
                    {count > 0 && <span className={styles.sidebarCategoryCount}>{count}</span>}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Center Feed Column */}
          <section className={styles.feedColumn} aria-label="Discussions">
            {/* Inline 2-Row Create Post Card */}
            <div className={styles.createPostPromptCard}>
              <div className={styles.composerTopRow}>
                <div className={styles.userAvatarCircle}>
                  <img
                    src="/community/avatar-user.png"
                    alt={data?.currentUser.fullName || "User"}
                    className={styles.userAvatarImg}
                  />
                </div>
                <input
                  type="text"
                  readOnly
                  placeholder="Share your thoughts, ask a doubt, or start a discussion..."
                  className={styles.createPostTriggerInput}
                  onClick={() => {
                    if (selectedCategory) setNewCategory(selectedCategory);
                    setIsCreateModalOpen(true);
                  }}
                  aria-label="Share your thoughts, ask a doubt, or start a discussion"
                />
              </div>

              <div className={styles.composerBottomRow}>
                <div className={styles.composerToolsLeft}>
                  <button
                    type="button"
                    className={styles.composerToolBtn}
                    onClick={() => {
                      if (selectedCategory) setNewCategory(selectedCategory);
                      setIsCreateModalOpen(true);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>Add Image</span>
                  </button>

                  <div className={styles.composerToolDivider} />

                  <button
                    type="button"
                    className={styles.composerToolBtn}
                    onClick={() => {
                      if (selectedCategory) setNewCategory(selectedCategory);
                      setIsCreateModalOpen(true);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    <span>{selectedCategory || "Choose Category"}</span>
                  </button>
                </div>

                <button
                  type="button"
                  className={styles.createPostQuickBtn}
                  onClick={() => {
                    if (selectedCategory) setNewCategory(selectedCategory);
                    setIsCreateModalOpen(true);
                  }}
                >
                  <span>Post</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filter Tabs & Search Toolbar */}
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

            {/* Contextual Filter Banners */}
            {selectedCategory && (
              <div className={styles.activeFilterBanner}>
                <span>Filtered by Category: <strong>{selectedCategory}</strong></span>
                <button
                  type="button"
                  className={styles.clearFilterBtn}
                  onClick={() => setSelectedCategory(null)}
                >
                  Clear Filter ✕
                </button>
              </div>
            )}

            {(sidebarView === "SAVED_POSTS" || sidebarView === "BOOKMARKS") && (
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

            {/* Discussion Feed Cards List */}
            {loading ? (
              <div className={styles.emptyStateCard}>
                <div className={styles.emptyStateIcon}>⏳</div>
                <p className={styles.emptyStateTitle}>Loading community discussions...</p>
              </div>
            ) : visiblePosts.length === 0 ? (
              <div className={styles.emptyStateCard}>
                <div className={styles.emptyStateIcon}>💬</div>
                <p className={styles.emptyStateTitle}>
                  {searchQuery.trim().length > 0
                    ? "No discussions found for your search."
                    : selectedCategory
                    ? `No discussions yet under ${selectedCategory}.`
                    : sidebarView === "SAVED_POSTS" || sidebarView === "BOOKMARKS"
                    ? "You haven't saved any discussions yet."
                    : "No discussions yet.\nBe the first to start a conversation."}
                </p>
                <button
                  type="button"
                  className={styles.emptyStateCtaBtn}
                  onClick={() => {
                    if (searchQuery) setSearchQuery("");
                    else if (selectedCategory) setSelectedCategory(null);
                    else setIsCreateModalOpen(true);
                  }}
                >
                  {searchQuery
                    ? "Reset Search"
                    : selectedCategory
                    ? "View All Discussions"
                    : "Start a Discussion"}
                </button>
              </div>
            ) : (
              <div className={styles.postsList}>
                {visiblePosts.map((post) => {
                  const avatarSrc = getAuthorAvatar(post.authorName) || post.authorAvatar;
                  return (
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
                            {avatarSrc ? (
                              <img
                                src={avatarSrc}
                                alt={post.authorName}
                                className={styles.userAvatarImg}
                              />
                            ) : (
                              getInitials(post.authorName)
                            )}
                          </div>
                          <div className={styles.authorMetaStack}>
                            <div className={styles.authorNameAndBadgeRow}>
                              <span className={styles.authorName}>{post.authorName}</span>
                              <span className={styles.postTime}>
                                &bull; {formatRelativeTime(post.createdAt)}
                              </span>
                              <span className={getCategoryBadgeClass(post.category)}>
                                {post.category}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Three-dot dropdown menu */}
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

                      {/* Post Body (Indented to align under username) */}
                      <div className={styles.postContentIndented}>
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

                        {/* Indented Post Action Metrics Bar */}
                        <div className={styles.postActionsBar}>
                          <div className={styles.postActionsLeft}>
                            <button
                              type="button"
                              className={`${styles.actionMetricBtn} ${
                                post.isUpvoted ? styles.actionMetricUpvoted : ""
                              }`}
                              onClick={(e) => handleToggleUpvote(post.id, e)}
                              aria-label={`Upvote (${post.upvotesCount})`}
                            >
                              <span className={styles.upvoteArrowIcon}>▲</span>
                              <span>Upvote &bull; {post.upvotesCount}</span>
                            </button>

                            <div className={styles.actionMetricDivider} />

                            <button
                              type="button"
                              className={styles.actionMetricBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePostId(post.id);
                                setReplyingToCommentId(null);
                              }}
                            >
                              <span>💬</span>
                              <span>
                                {post.commentsCount}{" "}
                                {post.commentsCount === 1 ? "Comment" : "Comments"}
                              </span>
                            </button>
                          </div>

                          <button
                            type="button"
                            className={`${styles.bookmarkIconBtn} ${
                              post.isSaved ? styles.bookmarkIconActive : ""
                            }`}
                            onClick={(e) => handleToggleSave(post.id, e)}
                            title={post.isSaved ? "Saved" : "Save discussion"}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill={post.isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Right Sidebar Widgets */}
          <aside className={styles.rightSidebar} aria-label="Community Insights">
            {/* Widget 1: Community Stats */}
            <div className={styles.widgetCard}>
              <div className={styles.widgetTitleRow}>
                <h3 className={styles.widgetTitle}>COMMUNITY STATS</h3>
                <button
                  type="button"
                  className={styles.widgetViewAllBtn}
                  onClick={() => showToast("Viewing overall community activity statistics.")}
                >
                  View All
                </button>
              </div>
              <div className={styles.statsGrid}>
                <div className={`${styles.statBox} ${styles.statBoxBlue}`}>
                  <div className={styles.statIconCircle} style={{ background: "#EFF6FF", color: "#2563EB" }}>
                    👥
                  </div>
                  <div>
                    <span className={styles.statNumber}>{data ? data.stats.members : "2.4K"}</span>
                    <span className={styles.statLabel}>Members</span>
                  </div>
                </div>
                <div className={`${styles.statBox} ${styles.statBoxCyan}`}>
                  <div className={styles.statIconCircle} style={{ background: "#E0F2FE", color: "#0284C7" }}>
                    💬
                  </div>
                  <div>
                    <span className={styles.statNumber}>{data ? data.stats.discussions : "1.2K"}</span>
                    <span className={styles.statLabel}>Discussions</span>
                  </div>
                </div>
                <div className={`${styles.statBox} ${styles.statBoxPurple}`}>
                  <div className={styles.statIconCircle} style={{ background: "#F5F3FF", color: "#7C3AED" }}>
                    ✅
                  </div>
                  <div>
                    <span className={styles.statNumber}>{data ? data.stats.solutions : "3.1K"}</span>
                    <span className={styles.statLabel}>Solutions</span>
                  </div>
                </div>
                <div className={`${styles.statBox} ${styles.statBoxAmber}`}>
                  <div className={styles.statIconCircle} style={{ background: "#FFFBEB", color: "#D97706" }}>
                    📈
                  </div>
                  <div>
                    <span className={styles.statNumber}>{data ? data.stats.helpfulRate : "92%"}</span>
                    <span className={styles.statLabel}>Helpful Rate</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Widget 2: Top Contributors */}
            <div className={styles.widgetCard}>
              <div className={styles.widgetTitleRow}>
                <div>
                  <h3 className={styles.widgetTitle}>TOP CONTRIBUTORS</h3>
                  <p className={styles.widgetSub}>This Month</p>
                </div>
                <button
                  type="button"
                  className={styles.widgetViewAllBtn}
                  onClick={() => showToast("Top contributor leaderboard for this month.")}
                >
                  View All
                </button>
              </div>

              <div className={styles.contributorsList}>
                {topContributorsList.map((contributor) => {
                  const avatarSrc = getAuthorAvatar(contributor.authorName) || contributor.authorAvatar;
                  return (
                    <div key={contributor.authorId} className={styles.contributorRow}>
                      <div className={styles.contributorLeft}>
                        {contributor.rank === 1 ? (
                          <img src="/community/medal-gold.png" alt="1st" className={styles.rankMedalImg} />
                        ) : contributor.rank === 2 ? (
                          <img src="/community/medal-silver.png" alt="2nd" className={styles.rankMedalImg} />
                        ) : contributor.rank === 3 ? (
                          <img src="/community/medal-bronze.png" alt="3rd" className={styles.rankMedalImg} />
                        ) : (
                          <span className={styles.rankNumberCircle}>{contributor.rank}</span>
                        )}

                        <div className={styles.contributorAvatar}>
                          {avatarSrc ? (
                            <img
                              src={avatarSrc}
                              alt={contributor.authorName}
                              className={styles.userAvatarImg}
                            />
                          ) : (
                            getInitials(contributor.authorName)
                          )}
                        </div>

                        <div className={styles.contributorInfoStack}>
                          <span className={styles.contributorName}>{contributor.authorName}</span>
                          <span className={styles.contributorPostSub}>{contributor.postCount} posts</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Widget 3: Community Guidelines */}
            <div className={styles.widgetCard}>
              <div className={styles.guidelinesHeaderRow}>
                <span className={styles.guidelinesShieldIcon}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </span>
                <h3 className={styles.guidelinesTitle}>Community Guidelines</h3>
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
      </div>

      {/* Create Post Modal */}
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
                    placeholder="e.g., How to approach DILR sets effectively?"
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
                    {CATEGORIES_CONFIG.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.icon} {cat.name}
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
                    placeholder="Share your thoughts, ask a doubt, or start a discussion..."
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

      {/* Full Discussion View Modal */}
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
                  {getAuthorAvatar(activePost.authorName) || activePost.authorAvatar ? (
                    <img
                      src={getAuthorAvatar(activePost.authorName) || activePost.authorAvatar!}
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
                    className={`${styles.actionMetricBtn} ${
                      activePost.isUpvoted ? styles.actionMetricUpvoted : ""
                    }`}
                    onClick={() => handleToggleUpvote(activePost.id)}
                  >
                    <span className={styles.upvoteArrowIcon}>▲</span>
                    <span>Upvote &bull; {activePost.upvotesCount}</span>
                  </button>

                  <div className={styles.actionMetricDivider} />

                  <button
                    type="button"
                    className={`${styles.actionMetricBtn} ${
                      activePost.isSaved ? styles.bookmarkIconActive : ""
                    }`}
                    onClick={() => handleToggleSave(activePost.id)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={activePost.isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>{activePost.isSaved ? "Saved" : "Save"}</span>
                  </button>
                </div>

                {activePost.isOwnPost && (
                  <button
                    type="button"
                    className={`${styles.actionMetricBtn} ${styles.dropdownItemDanger}`}
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
                    const commentAvatar = getAuthorAvatar(comment.authorName) || comment.authorAvatar;
                    return (
                      <div key={comment.id} className={styles.commentCard}>
                        <div className={styles.postAuthorMeta}>
                          <div
                            className={styles.userAvatarCircle}
                            style={{ width: "32px", height: "32px", fontSize: "12px" }}
                          >
                            {commentAvatar ? (
                              <img
                                src={commentAvatar}
                                alt={comment.authorName}
                                className={styles.userAvatarImg}
                              />
                            ) : (
                              getInitials(comment.authorName)
                            )}
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
                            {replies.map((rep) => {
                              const repAvatar = getAuthorAvatar(rep.authorName) || rep.authorAvatar;
                              return (
                                <div key={rep.id} className={styles.nestedReplyCard}>
                                  <div className={styles.postAuthorMeta} style={{ marginBottom: "4px" }}>
                                    <div
                                      className={styles.userAvatarCircle}
                                      style={{ width: "26px", height: "26px", fontSize: "10px" }}
                                    >
                                      {repAvatar ? (
                                        <img
                                          src={repAvatar}
                                          alt={rep.authorName}
                                          className={styles.userAvatarImg}
                                        />
                                      ) : (
                                        getInitials(rep.authorName)
                                      )}
                                    </div>
                                    <div className={styles.authorNameRow}>
                                      <span className={styles.authorName} style={{ fontSize: "12.5px" }}>
                                        {rep.authorName}
                                      </span>
                                      <span className={styles.postTime}>
                                        &bull; {formatRelativeTime(rep.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                  <p className={styles.commentText} style={{ margin: "2px 0 0" }}>
                                    {rep.content}
                                  </p>
                                </div>
                              );
                            })}
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
