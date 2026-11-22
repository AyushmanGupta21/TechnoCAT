"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowBigUp,
  ArrowRight,
  Bookmark,
  BookOpen,
  Camera,
  ChartColumn,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleExclamationPoint,
  CircleQuestionMark,
  Clock,
  CloudUpload,
  Coffee,
  Ellipsis,
  Flag,
  FolderOpen,
  GraduationCap,
  House,
  ImagePlus,
  MessageCircle,
  MessageSquare,
  Reply,
  Search,
  Send,
  ShieldCheck,
  SquareCheck,
  SquarePen,
  Star,
  Target,
  ThumbsUp,
  Trash,
  TrendingUp,
  Trophy,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { resolveStudentName, sanitizeAvatarUrl } from "@/lib/nameUtils";
import AppNav from "@/components/app/AppNav";
import BackLink from "@/components/app/BackLink";
import { Reveal, RevealGroup, RevealItem, SpotlightCard, CountUp, GradientText } from "@/components/landing/motion";
import styles from "./learning-community.module.css";
import {
  CommunityCategory,
  CommunityPayload,
  CommunityPostItem,
  ContributorItem,
  getCommunityDataAction,
  createCommunityPostAction,
  togglePostUpvoteAction,
  toggleCommentUpvoteAction,
  toggleSavePostAction,
  addCommentOrReplyAction,
  deleteCommunityPostAction,
  deleteCommunityCommentAction,
  reportCommunityPostAction,
} from "./actions";

interface CategoryMeta {
  name: CommunityCategory;
  desc: string;
  iconBg: string;
  iconColor: string;
}

const CATEGORIES_CONFIG: CategoryMeta[] = [
  {
    name: "General Discussion",
    desc: "Casual talk, introductions & general queries",
    iconBg: "#EFF6FF",
    iconColor: "#2563EB",
  },
  {
    name: "CAT Strategy",
    desc: "Prep plans, section-wise strategy & tips",
    iconBg: "#F5F3FF",
    iconColor: "#7C3AED",
  },
  {
    name: "Doubt Solving",
    desc: "Get help with QA, DILR & VARC questions",
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
  },
  {
    name: "Study Resources",
    desc: "Share & find notes, formula sheets, prep material",
    iconBg: "#ECFDF5",
    iconColor: "#059669",
  },
  {
    name: "Mocks & Analysis",
    desc: "Score reviews, percentile targets & analysis",
    iconBg: "#FFF1F2",
    iconColor: "#E11D48",
  },
  {
    name: "College Discussions",
    desc: "IIMs, FMS, XLRI, cutoffs & GDPI prep",
    iconBg: "#F0F9FF",
    iconColor: "#0284C7",
  },
  {
    name: "Motivation & Journey",
    desc: "Success stories, daily struggles & inspiration",
    iconBg: "#FAF5FF",
    iconColor: "#9333EA",
  },
  {
    name: "Off-topic",
    desc: "Non-prep chats, hobbies & relaxing talks",
    iconBg: "#FDF2F8",
    iconColor: "#DB2777",
  },
];

const MODAL_CATEGORIES_CONFIG: {
  name: CommunityCategory;
  desc: string;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    name: "General Discussion",
    desc: "Open discussion on anything related to CAT",
    iconBg: "#EFF6FF",
    iconColor: "#2563EB",
  },
  {
    name: "CAT Strategy",
    desc: "Preparation strategies, study plans, tips",
    iconBg: "#FFF1F2",
    iconColor: "#E11D48",
  },
  {
    name: "Doubt Solving",
    desc: "Ask and solve your doubts",
    iconBg: "#FEF2F2",
    iconColor: "#F43F5E",
  },
  {
    name: "Study Resources",
    desc: "Books, notes, PYQs and useful materials",
    iconBg: "#EFF6FF",
    iconColor: "#2563EB",
  },
  {
    name: "Mocks & Analysis",
    desc: "Mock tests, analysis and performance",
    iconBg: "#F0FDF4",
    iconColor: "#0284C7",
  },
  {
    name: "College Discussions",
    desc: "Colleges, admissions, cutoffs, selection",
    iconBg: "#F5F3FF",
    iconColor: "#7C3AED",
  },
  {
    name: "Motivation & Journey",
    desc: "Share your journey and stay motivated",
    iconBg: "#FFFBEB",
    iconColor: "#D97706",
  },
  {
    name: "Off-topic",
    desc: "Fun, general chat and more",
    iconBg: "#FDF2F8",
    iconColor: "#7C3AED",
  },
];

const DEFAULT_CONTRIBUTORS: ContributorItem[] = [
  {
    authorId: "user-priya",
    authorName: "priya_singh",
    authorAvatar: "/community/contrib-priya.png",
    postCount: 56,
    commentCount: 0,
    totalScore: 56,
    rank: 1,
  },
  {
    authorId: "user-aniket",
    authorName: "aniket_verma",
    authorAvatar: "/community/contrib-aniket.png",
    postCount: 42,
    commentCount: 0,
    totalScore: 42,
    rank: 2,
  },
  {
    authorId: "user-shruti",
    authorName: "shruti_agarwal",
    authorAvatar: "/community/contrib-shruti.png",
    postCount: 38,
    commentCount: 0,
    totalScore: 38,
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

/* Category colours come from the shared data palette (set as --cat by these classes). */
const CATEGORY_TONE: Record<CommunityCategory, string> = {
  "General Discussion": styles.catGeneral,
  "CAT Strategy": styles.catStrategy,
  "Doubt Solving": styles.catDoubt,
  "Study Resources": styles.catResources,
  "Mocks & Analysis": styles.catMocks,
  "College Discussions": styles.catCollege,
  "Motivation & Journey": styles.catMotivation,
  "Off-topic": styles.catOfftopic,
};

function getCategoryToneClass(cat: CommunityCategory): string {
  return CATEGORY_TONE[cat] || styles.catGeneral;
}

function getCategoryBadgeClass(cat: CommunityCategory): string {
  return `${styles.categoryBadge} ${getCategoryToneClass(cat)}`;
}

const CATEGORY_ICONS: Record<CommunityCategory, LucideIcon> = {
  "General Discussion": MessageSquare,
  "CAT Strategy": Target,
  "Doubt Solving": CircleQuestionMark,
  "Study Resources": BookOpen,
  "Mocks & Analysis": ChartColumn,
  "College Discussions": GraduationCap,
  "Motivation & Journey": Star,
  "Off-topic": Coffee,
};

export function getCategoryOutlineIcon(category: CommunityCategory, className?: string) {
  const Icon = CATEGORY_ICONS[category];
  if (!Icon) return null;
  return <Icon className={className} size={18} strokeWidth={1.9} aria-hidden="true" />;
}

const FEED_TAB_LABELS: Record<FeedFilterTab, string> = {
  Recent: "Recent",
  "Most Helpful": "Most helpful",
  Trending: "Trending",
  Unanswered: "Unanswered",
  "My Posts": "My posts",
};

/* Round avatar with a safe fallback image */
function Avatar({ src, alt, size = 40 }: { src: string; alt: string; size?: number }) {
  return (
    <span className={styles.avatar} style={{ width: size, height: size }}>
      <img
        src={src}
        alt={alt}
        onError={(e) => {
          e.currentTarget.src = "/profile_icon.png";
        }}
      />
    </span>
  );
}

/* Stat value in mono; plain numbers ("12", "2.4K", "92%") count up once in view */
function StatFigure({ value, className }: { value: string | null | undefined; className?: string }) {
  if (!value) return <span className={className}>&mdash;</span>;
  const match = /^(\d+(?:\.\d+)?)([K%]?)$/.exec(value.trim());
  if (!match) return <span className={className}>{value}</span>;
  const decimals = match[1].includes(".") ? match[1].split(".")[1].length : 0;
  return <CountUp to={parseFloat(match[1])} decimals={decimals} suffix={match[2]} className={className} />;
}

/* Leaderboard rank: mono numeral, metal ring for the top three */
function RankBadge({ rank }: { rank: number }) {
  const tone =
    rank === 1 ? styles.rankGold : rank === 2 ? styles.rankSilver : rank === 3 ? styles.rankBronze : "";
  return (
    <span className={`${styles.rankBadge} ${tone}`} aria-label={`Rank ${rank}`}>
      {rank}
    </span>
  );
}

export default function LearningCommunityPage() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();

  const [data, setData] = useState<CommunityPayload | null>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic user profile resolution
  const isDemo = !user || user.isGuest || user.email?.toLowerCase() === "student@technocat.edu";
  const isGuest = false;

  const currentUserName = isGuest
    ? "Guest Aspirant"
    : resolveStudentName(user?.fullName || data?.currentUser.fullName, user?.email || data?.currentUser.email);

  const currentUserRole = isGuest
    ? "Browse Mode • Click to Sign In"
    : user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : user?.dreamSchool
    ? `Target: ${user.dreamSchool}`
    : "Student";

  const cleanCommunityAvatar = sanitizeAvatarUrl(user?.avatarUrl || data?.currentUser.avatarUrl);
  const currentUserAvatarUrl = isGuest
    ? "/community/avatar-user.png"
    : cleanCommunityAvatar || "/profile_icon.png";

  const currentUserInitials = useMemo(() => {
    if (isGuest || !currentUserName) return "ST";
    const parts = currentUserName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [isGuest, currentUserName]);

  const handleProfileCardClick = () => {
    if (isGuest) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("technocat_auth_redirect", "/intelligence/community");
      }
      openAuthModal("signin");
    } else {
      router.push("/profile/edit");
    }
  };

  const handleOpenCreateModal = (categoryOverride?: CommunityCategory, expandCategory = false, expandImage = false) => {
    if (categoryOverride) {
      setNewCategory(categoryOverride);
    } else if (selectedCategory) {
      setNewCategory(selectedCategory);
    } else {
      setNewCategory("General Discussion");
    }
    if (expandImage) {
      setIsImageUploadExpanded(true);
    }
    setIsModalCategoryOpen(expandCategory);
    setIsCreateModalOpen(true);
  };

  // Navigation & filter state
  const [sidebarView, setSidebarView] = useState<SidebarSection>("HOME");
  const [selectedCategory, setSelectedCategory] = useState<CommunityCategory | null>(null);
  const [activeTab, setActiveTab] = useState<FeedFilterTab>("Recent");
  const [searchQuery, setSearchQuery] = useState("");

  // Mobile drawer state
  const [mobileDrawer, setMobileDrawer] = useState<"MENU" | "CATEGORIES" | "STATS" | null>(null);

  // Card 3-dot menu state
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);

  // Create Post Modal state - closed by default on initial page load
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<CommunityCategory>("General Discussion");
  const [isModalCategoryOpen, setIsModalCategoryOpen] = useState(false);
  const modalCategoryRef = useRef<HTMLDivElement | null>(null);
  const selectedCategoryRowRef = useRef<HTMLDivElement | null>(null);

  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = contentTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const defaultHeight = 130;
    const maxHeight = 380;
    if (el.scrollHeight > maxHeight) {
      el.style.height = `${maxHeight}px`;
      el.style.overflowY = "auto";
    } else {
      el.style.height = `${Math.max(defaultHeight, el.scrollHeight)}px`;
      el.style.overflowY = "hidden";
    }
  }, [newContent, isCreateModalOpen]);

  useEffect(() => {
    if (isModalCategoryOpen && selectedCategoryRowRef.current) {
      selectedCategoryRowRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isModalCategoryOpen]);

  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [newImageMeta, setNewImageMeta] = useState<{ name: string; sizeFormatted: string } | null>(null);
  const [isImageUploadExpanded, setIsImageUploadExpanded] = useState(true);
  const [imageValidationError, setImageValidationError] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal live camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);
  const modalMediaStreamRef = useRef<MediaStream | null>(null);

  // Inline feed composer state matching reference image
  const [composerText, setComposerText] = useState("");
  const [composerCategory, setComposerCategory] = useState<CommunityCategory>("General Discussion");
  const [composerImageUrl, setComposerImageUrl] = useState<string | null>(null);
  const [composerImageMeta, setComposerImageMeta] = useState<{ name: string; sizeFormatted: string } | null>(null);
  const [composerImageError, setComposerImageError] = useState<string | null>(null);
  const [isAddImageOpen, setIsAddImageOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isFeedDragging, setIsFeedDragging] = useState(false);
  const [isPostingFromFeed, setIsPostingFromFeed] = useState(false);

  const feedFileInputRef = useRef<HTMLInputElement | null>(null);
  const feedCameraInputRef = useRef<HTMLInputElement | null>(null);
  const addImagePopoverRef = useRef<HTMLDivElement | null>(null);
  const categoryPopoverRef = useRef<HTMLDivElement | null>(null);

  // Feed composer live camera state
  const [isFeedCameraActive, setIsFeedCameraActive] = useState(false);
  const [feedCameraError, setFeedCameraError] = useState<string | null>(null);
  const feedVideoRef = useRef<HTMLVideoElement | null>(null);
  const feedMediaStreamRef = useRef<MediaStream | null>(null);

  // Community Stats Right Drawer state
  const [isStatsDrawerOpen, setIsStatsDrawerOpen] = useState(false);
  const [activityPeriod, setActivityPeriod] = useState<"7D" | "30D" | "90D">("30D");
  const [showAllCategoriesInDrawer, setShowAllCategoriesInDrawer] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);
  const statsDrawerBodyRef = useRef<HTMLDivElement | null>(null);

  // Top Contributors Right Drawer state
  const [isContributorsDrawerOpen, setIsContributorsDrawerOpen] = useState(false);
  const [contributorTab, setContributorTab] = useState<"This Month" | "This Week" | "All Time">("This Month");

  // Individual Community Stat Detail Popover state
  const [activeStatPopup, setActiveStatPopup] = useState<
    "MEMBERS" | "DISCUSSIONS" | "SOLUTIONS" | "HELPFUL_RATE" | null
  >(null);

  // Full Discussion Modal state
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = commentTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const defaultHeight = 82;
    const maxHeight = 300;
    if (el.scrollHeight > maxHeight) {
      el.style.height = `${maxHeight}px`;
      el.style.overflowY = "auto";
    } else {
      el.style.height = `${Math.max(defaultHeight, el.scrollHeight)}px`;
      el.style.overflowY = "hidden";
    }
  }, [commentInput, activePostId]);

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

  // Comprehensive scroll lock when modal, panel, or drawer is open
  const isAnyModalOrPanelOpen = Boolean(
    isCreateModalOpen ||
    isAddImageOpen ||
    activePostId ||
    isStatsDrawerOpen ||
    isContributorsDrawerOpen ||
    activeStatPopup ||
    mobileDrawer
  );

  useEffect(() => {
    if (!isAnyModalOrPanelOpen) return;

    // Save previous overflow values
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    // Lock body and html scroll so background page cannot move
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Prevent wheel, trackpad, and touchmove from scrolling background page
    const preventBackgroundScroll = (e: TouchEvent | WheelEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Allow internal scrolling ONLY inside active scrollable modal/panel containers
      const scrollable = target.closest(
        `.${styles.modalBody}, .${styles.floatingAddImagePopover}, .${styles.drawerBody}, .${styles.statsDrawerBody}, .${styles.statsDrawerPanel}, .${styles.contributorDrawerBody}, .${styles.contributorDrawerPanel}, .${styles.statPopupContent}`
      );
      if (!scrollable) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener("wheel", preventBackgroundScroll, { passive: false });
    window.addEventListener("touchmove", preventBackgroundScroll, { passive: false });

    return () => {
      // Cleanly restore previous overflow values upon close or unmount
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener("wheel", preventBackgroundScroll);
      window.removeEventListener("touchmove", preventBackgroundScroll);
    };
  }, [isAnyModalOrPanelOpen]);

  // Close 3-dot dropdown, modals, drawer, or stat popovers on outside click or Escape
  useEffect(() => {
    const handleGlobalClick = () => {
      if (openMenuPostId) setOpenMenuPostId(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenuPostId(null);
        setIsCreateModalOpen(false);
        setActivePostId(null);
        setIsStatsDrawerOpen(false);
        setIsContributorsDrawerOpen(false);
        setActiveStatPopup(null);
        setIsAddImageOpen(false);
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

  // Activity chart data for selected timeframe
  const activityData = useMemo(() => {
    if (isDemo) {
      if (activityPeriod === "7D") {
        return [
          { label: "Sep 25", fullDate: "Sep 25", value: 38 },
          { label: "Sep 26", fullDate: "Sep 26", value: 45 },
          { label: "Sep 27", fullDate: "Sep 27", value: 42 },
          { label: "Sep 28", fullDate: "Sep 28", value: 68 },
          { label: "Sep 29", fullDate: "Sep 29", value: 74 },
          { label: "Sep 30", fullDate: "Sep 30", value: 61 },
          { label: "Oct 01", fullDate: "Oct 01", value: 89 + (posts.length > 6 ? (posts.length - 6) * 4 : 0) },
        ];
      }
      if (activityPeriod === "90D") {
        return [
          { label: "Jul 10", fullDate: "Jul 10", value: 120 },
          { label: "Jul 24", fullDate: "Jul 24", value: 165 },
          { label: "Aug 07", fullDate: "Aug 07", value: 190 },
          { label: "Aug 21", fullDate: "Aug 21", value: 240 },
          { label: "Sep 04", fullDate: "Sep 04", value: 310 },
          { label: "Sep 18", fullDate: "Sep 18", value: 380 },
          { label: "Oct 01", fullDate: "Oct 01", value: 465 + (posts.length > 6 ? (posts.length - 6) * 5 : 0) },
        ];
      }
      // Default 30D
      return [
        { label: "Sep 02", fullDate: "Sep 02", value: 48 },
        { label: "Sep 06", fullDate: "Sep 06", value: 55 },
        { label: "Sep 10", fullDate: "Sep 10", value: 62 },
        { label: "Sep 14", fullDate: "Sep 14", value: 58 },
        { label: "Sep 18", fullDate: "Sep 18", value: 79 },
        { label: "Sep 22", fullDate: "Sep 22", value: 84 },
        { label: "Sep 26", fullDate: "Sep 26", value: 92 },
        { label: "Sep 30", fullDate: "Sep 30", value: 108 },
        { label: "Oct 01", fullDate: "Oct 01", value: 124 + (posts.length > 6 ? (posts.length - 6) * 5 : 0) },
      ];
    }

    // Real account: aggregate real posts & comments by date
    const daysCount = activityPeriod === "7D" ? 7 : activityPeriod === "90D" ? 90 : 30;
    const step = activityPeriod === "90D" ? 14 : activityPeriod === "30D" ? 4 : 1;
    const now = new Date();
    const result: { label: string; fullDate: string; value: number }[] = [];

    const dateCounts: Record<string, number> = {};
    for (const p of posts) {
      const d = new Date(p.createdAt);
      if (!isNaN(d.getTime())) {
        const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        dateCounts[key] = (dateCounts[key] || 0) + 1 + p.commentsCount;
      }
    }

    for (let i = daysCount; i >= 0; i -= step) {
      const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const label = targetDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      result.push({
        label,
        fullDate: label,
        value: dateCounts[label] || 0,
      });
    }

    return result;
  }, [activityPeriod, posts, isDemo]);

  const chartPaths = useMemo(() => {
    const dataList = activityData;
    if (dataList.length === 0) return { lineD: "", areaD: "", points: [] };

    const width = 500;
    const height = 150;
    const padX = 20;
    const padTop = 20;
    const padBottom = 22;
    const plotWidth = width - padX * 2;
    const plotHeight = height - padTop - padBottom;

    const maxVal = Math.max(...dataList.map((d) => d.value), 10) * 1.15;

    const points = dataList.map((item, idx) => {
      const x = padX + (idx / Math.max(1, dataList.length - 1)) * plotWidth;
      const y = height - padBottom - (item.value / maxVal) * plotHeight;
      return { x, y, item };
    });

    const lineD = points.reduce(
      (acc, pt, idx) => (idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
      ""
    );

    const firstPt = points[0];
    const lastPt = points[points.length - 1];
    const baseY = height - padBottom;
    const areaD = `${lineD} L ${lastPt.x},${baseY} L ${firstPt.x},${baseY} Z`;

    return { lineD, areaD, points };
  }, [activityData]);

  const categoryActivityCounts = useMemo(() => {
    if (isDemo) {
      const baseCounts: Record<CommunityCategory, number> = {
        "Doubt Solving": 298,
        "CAT Strategy": 256,
        "Study Resources": 210,
        "Mocks & Analysis": 186,
        "General Discussion": 156,
        "College Discussions": 112,
        "Motivation & Journey": 94,
        "Off-topic": 68,
      };

      const extraCounts: Record<string, number> = {};
      for (const p of posts) {
        if (!p.id.startsWith("post-ref-")) {
          extraCounts[p.category] = (extraCounts[p.category] || 0) + 1;
        }
      }

      const list = CATEGORIES_CONFIG.map((cat) => {
        const total = (baseCounts[cat.name] || 50) + (extraCounts[cat.name] || 0);
        return {
          name: cat.name,
          count: total,
        };
      });

      list.sort((a, b) => b.count - a.count);
      return list;
    }

    // Real account: counts strictly reflect real posts by category
    const realCounts: Record<string, number> = {};
    for (const p of posts) {
      realCounts[p.category] = (realCounts[p.category] || 0) + 1;
    }

    const list = CATEGORIES_CONFIG.map((cat) => ({
      name: cat.name,
      count: realCounts[cat.name] || 0,
    }));

    list.sort((a, b) => b.count - a.count);
    return list;
  }, [posts, isDemo]);

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
    if (isDemo) {
      if (data?.topContributors && data.topContributors.length > 0) {
        return data.topContributors;
      }
      return DEFAULT_CONTRIBUTORS;
    }
    return data?.topContributors || [];
  }, [data, isDemo]);

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

  const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

  const processImageFile = (file: File) => {
    setImageValidationError(null);

    const isFormatValid =
      SUPPORTED_IMAGE_TYPES.includes(file.type.toLowerCase()) ||
      /\.(jpe?g|png|webp)$/i.test(file.name);

    if (!isFormatValid || file.size > MAX_IMAGE_SIZE) {
      setImageValidationError("Please upload a JPG, PNG or WEBP image under 5MB.");
      return;
    }

    const formattedSize =
      file.size < 1024 * 1024
        ? `${Math.round(file.size / 1024)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setNewImageUrl(reader.result);
        setNewImageMeta({
          name: file.name,
          sizeFormatted: formattedSize,
        });
        setIsImageUploadExpanded(true);
        setImageValidationError(null);
        setCreateError(null);
      }
    };
    reader.onerror = () => {
      setImageValidationError("Failed to read image file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
  };

  const handleImageDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
  };

  const handleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingImage(false);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  const handleRemoveImage = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    stopCameraStream();
    setIsCameraActive(false);
    setNewImageUrl(null);
    setNewImageMeta(null);
    setImageValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const stopCameraStream = () => {
    if (modalMediaStreamRef.current) {
      modalMediaStreamRef.current.getTracks().forEach((track) => track.stop());
      modalMediaStreamRef.current = null;
    }
    if (modalVideoRef.current) {
      modalVideoRef.current.srcObject = null;
    }
  };

  const startCameraStream = async (facing: "user" | "environment" = cameraFacingMode) => {
    stopCameraStream();
    setCameraError(null);
    setIsCameraActive(true);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraError("Camera is not available on this device.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      modalMediaStreamRef.current = stream;
      if (modalVideoRef.current) {
        modalVideoRef.current.srcObject = stream;
        modalVideoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn("[Camera Access Error]", err);
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setCameraError("Camera access was denied. Please allow camera access to take a photo.");
      } else if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
        setCameraError("Camera is not available on this device.");
      } else {
        setCameraError("Camera access was denied. Please allow camera access to take a photo.");
      }
    }
  };

  const handleCapturePhoto = () => {
    if (!modalVideoRef.current) return;
    const video = modalVideoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      const approxBytes = Math.round((dataUrl.length * 3) / 4);
      const sizeFormatted =
        approxBytes < 1024 * 1024
          ? `${(approxBytes / 1024).toFixed(1)} KB`
          : `${(approxBytes / (1024 * 1024)).toFixed(1)} MB`;

      setNewImageUrl(dataUrl);
      setNewImageMeta({
        name: "camera-photo.jpg",
        sizeFormatted,
      });
      setImageValidationError(null);
    }

    stopCameraStream();
    setIsCameraActive(false);
  };

  const handleSwitchCamera = () => {
    const nextFacing = cameraFacingMode === "user" ? "environment" : "user";
    setCameraFacingMode(nextFacing);
    startCameraStream(nextFacing);
  };

  const handleBackToUploadOptions = () => {
    stopCameraStream();
    setIsCameraActive(false);
    setCameraError(null);
  };

  const handleRetakePhoto = () => {
    startCameraStream(cameraFacingMode);
  };

  const closeCreateModal = () => {
    stopCameraStream();
    setIsCameraActive(false);
    setCameraError(null);
    setIsModalCategoryOpen(false);
    setIsCreateModalOpen(false);
  };

  useEffect(() => {
    if (!isCreateModalOpen) {
      stopCameraStream();
      setIsCameraActive(false);
      setCameraError(null);
      setIsModalCategoryOpen(false);
    }
  }, [isCreateModalOpen]);

  const stopFeedCameraStream = () => {
    if (feedMediaStreamRef.current) {
      feedMediaStreamRef.current.getTracks().forEach((track) => track.stop());
      feedMediaStreamRef.current = null;
    }
    if (feedVideoRef.current) {
      feedVideoRef.current.srcObject = null;
    }
  };

  const startFeedCameraStream = async () => {
    stopFeedCameraStream();
    setFeedCameraError(null);
    setIsFeedCameraActive(true);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setFeedCameraError("Camera access is required to take a photo.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      feedMediaStreamRef.current = stream;
      if (feedVideoRef.current) {
        feedVideoRef.current.srcObject = stream;
        feedVideoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn("[Feed Camera Access Error]", err);
      setFeedCameraError("Camera access is required to take a photo.");
    }
  };

  const handleCaptureFeedPhoto = () => {
    if (!feedVideoRef.current) return;
    const video = feedVideoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      const approxBytes = Math.round((dataUrl.length * 3) / 4);
      const sizeFormatted =
        approxBytes < 1024 * 1024
          ? `${(approxBytes / 1024).toFixed(1)} KB`
          : `${(approxBytes / (1024 * 1024)).toFixed(1)} MB`;

      setComposerImageUrl(dataUrl);
      setComposerImageMeta({
        name: "camera-photo.jpg",
        sizeFormatted,
      });
      setComposerImageError(null);
    }

    stopFeedCameraStream();
    setIsFeedCameraActive(false);
  };

  const handleCancelFeedCamera = () => {
    stopFeedCameraStream();
    setIsFeedCameraActive(false);
    setFeedCameraError(null);
  };

  const handleRetakeFeedPhoto = () => {
    startFeedCameraStream();
  };

  const closeAddImagePopover = () => {
    stopFeedCameraStream();
    setIsFeedCameraActive(false);
    setFeedCameraError(null);
    setIsAddImageOpen(false);
  };

  useEffect(() => {
    if (!isAddImageOpen) {
      stopFeedCameraStream();
      setIsFeedCameraActive(false);
      setFeedCameraError(null);
    }
  }, [isAddImageOpen]);

  useEffect(() => {
    return () => {
      stopCameraStream();
      stopFeedCameraStream();
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        addImagePopoverRef.current &&
        !addImagePopoverRef.current.contains(e.target as Node)
      ) {
        closeAddImagePopover();
      }
      if (
        categoryPopoverRef.current &&
        !categoryPopoverRef.current.contains(e.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
      if (
        modalCategoryRef.current &&
        !modalCategoryRef.current.contains(e.target as Node)
      ) {
        setIsModalCategoryOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAddImagePopover();
        setIsCategoryOpen(false);
        setIsModalCategoryOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const processComposerImage = (file: File) => {
    setComposerImageError(null);

    const isFormatValid =
      SUPPORTED_IMAGE_TYPES.includes(file.type.toLowerCase()) ||
      /\.(jpe?g|png|webp)$/i.test(file.name);

    if (!isFormatValid || file.size > MAX_IMAGE_SIZE) {
      setComposerImageError("Please upload a JPG, PNG or WEBP image under 5MB.");
      return;
    }

    const formattedSize =
      file.size < 1024 * 1024
        ? `${Math.round(file.size / 1024)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setComposerImageUrl(reader.result);
        setComposerImageMeta({
          name: file.name,
          sizeFormatted: formattedSize,
        });
        setComposerImageError(null);
      }
    };
    reader.onerror = () => {
      setComposerImageError("Could not read image file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleComposerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processComposerImage(file);
    }
  };

  const handleRemoveComposerImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    stopFeedCameraStream();
    setIsFeedCameraActive(false);
    setComposerImageUrl(null);
    setComposerImageMeta(null);
    setComposerImageError(null);
    if (feedFileInputRef.current) feedFileInputRef.current.value = "";
    if (feedCameraInputRef.current) feedCameraInputRef.current.value = "";
  };

  const handleFeedPostSubmit = async () => {
    if (isGuest) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("technocat_auth_redirect", "/intelligence/community");
      }
      openAuthModal("signin");
      return;
    }

    const text = composerText.trim();
    if (!text) {
      handleOpenCreateModal();
      return;
    }

    setIsPostingFromFeed(true);
    try {
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      let title = lines[0] || text.slice(0, 100);
      if (title.length > 100) {
        title = title.slice(0, 97) + "...";
      }
      if (title.length < 3) {
        title = "CAT Discussion: " + text.slice(0, 50);
      }
      const res = await createCommunityPostAction({
        title,
        content: text,
        category: composerCategory,
        imageUrl: composerImageUrl,
      });

      if (res.success && res.payload) {
        setData(res.payload);
        setComposerText("");
        setComposerImageUrl(null);
        setComposerImageMeta(null);
        setComposerImageError(null);
        setIsAddImageOpen(false);
        setIsCategoryOpen(false);
        showToast("Discussion published to Learning Community!");
      } else {
        showToast(res.error || "Could not publish discussion.");
      }
    } catch (err: any) {
      showToast(err?.message || "Could not publish discussion.");
    } finally {
      setIsPostingFromFeed(false);
    }
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
        const errMsg = res.error || "Could not publish discussion.";
        setCreateError(errMsg);
        showToast(errMsg);
        return;
      }

      setData(res.payload);
      setNewTitle("");
      setNewContent("");
      setNewImageUrl(null);
      setNewImageMeta(null);
      setImageValidationError(null);
      stopCameraStream();
      setIsCameraActive(false);
      setIsImageUploadExpanded(true);
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

  const handleToggleCommentUpvote = async (commentId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        posts: prev.posts.map((p) => ({
          ...p,
          comments: p.comments.map((c) => {
            if (c.id !== commentId) return c;
            const nextUpvoted = !c.isUpvoted;
            return {
              ...c,
              isUpvoted: nextUpvoted,
              upvotesCount: Math.max(0, (c.upvotesCount || 0) + (nextUpvoted ? 1 : -1)),
            };
          }),
        })),
      };
    });

    const res = await toggleCommentUpvoteAction(commentId);
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

  const handleDeleteComment = async (commentId: string) => {
    const res = await deleteCommunityCommentAction(commentId);
    if (res.success && res.payload) {
      setData(res.payload);
      showToast("Your comment has been deleted.");
    } else if (res.error) {
      showToast(res.error);
    }
  };

  const handleReportPost = async (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenMenuPostId(null);
    const targetPost = (data?.posts || []).find((p) => p.id === postId);
    if (targetPost?.isOwnPost) {
      showToast("You cannot report your own discussion.");
      return;
    }
    const res = await reportCommunityPostAction(postId);
    if (res?.error) {
      showToast(res.error);
      return;
    }
    if (res?.autoDeleted && res?.payload) {
      setData(res.payload);
      if (activePostId === postId) {
        setActivePostId(null);
      }
      showToast("Discussion received multiple reports and was automatically removed.");
    } else {
      showToast("Thank you. Discussion reported to moderators for review.");
    }
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
      } else {
        showToast(res.error || "Could not post comment. Please try again.");
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to post comment.");
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
      } else {
        showToast(res.error || "Could not post reply. Please try again.");
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to post reply.");
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


  // Presentation helpers (derived from existing state only)
  const postCountByCategory = posts.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  const sidebarNavItems: {
    key: SidebarSection;
    label: string;
    icon: LucideIcon;
    count: number;
    active: boolean;
    onClick: () => void;
  }[] = [
    {
      key: "HOME",
      label: "Community home",
      icon: House,
      count: 0,
      active: sidebarView === "HOME" && !selectedCategory,
      onClick: handleSelectHome,
    },
    {
      key: "MY_POSTS",
      label: "My posts",
      icon: SquareCheck,
      count: myPostsCount,
      active: sidebarView === "MY_POSTS",
      onClick: handleSelectMyPosts,
    },
    {
      key: "SAVED_POSTS",
      label: "Saved posts",
      icon: Bookmark,
      count: savedPostsCount,
      active: sidebarView === "SAVED_POSTS" || sidebarView === "BOOKMARKS",
      onClick: handleSelectSavedPosts,
    },
  ];

  const statCells: {
    key: "MEMBERS" | "DISCUSSIONS" | "SOLUTIONS" | "HELPFUL_RATE";
    label: string;
    value: string | undefined;
    color: string;
  }[] = [
    { key: "MEMBERS", label: "Members", value: data?.stats.members, color: "var(--data-blue)" },
    { key: "DISCUSSIONS", label: "Discussions", value: data?.stats.discussions, color: "var(--data-teal)" },
    { key: "SOLUTIONS", label: "Solutions", value: data?.stats.solutions, color: "var(--data-violet)" },
    { key: "HELPFUL_RATE", label: "Helpful rate", value: data?.stats.helpfulRate, color: "var(--data-amber)" },
  ];

  const activityPeriodLabel =
    activityPeriod === "7D" ? "last 7 days" : activityPeriod === "90D" ? "last 90 days" : "last 30 days";

  const helpfulPercentRaw = parseFloat(data?.stats.helpfulRate || "");
  const helpfulPercent = Number.isFinite(helpfulPercentRaw)
    ? Math.min(100, Math.max(0, helpfulPercentRaw))
    : isDemo
    ? 92
    : 0;

  const mostAnsweredPosts = [...posts]
    .filter((p) => p.commentsCount > 0)
    .sort((a, b) => b.commentsCount - a.commentsCount)
    .slice(0, 3);

  const canDeleteComment = (authorId: string, isOwnComment?: boolean) =>
    Boolean(
      isOwnComment ||
        (user && user.id === authorId) ||
        (data?.currentUser && data.currentUser.id === authorId)
    );

  const renderStatPopoverHeader = (
    titleId: string,
    title: string,
    sub: string,
    color: string,
    closeLabel: string
  ) => (
    <div className={styles.statPopoverHeader}>
      <div>
        <span className={styles.statPopoverKicker}>
          <span className={styles.dot} style={{ background: color }} aria-hidden="true" />
          {sub}
        </span>
        <h3 id={titleId} className={styles.statPopoverTitle}>
          {title}
        </h3>
      </div>
      <button
        type="button"
        className={styles.iconBtn}
        onClick={() => setActiveStatPopup(null)}
        aria-label={closeLabel}
      >
        <X size={18} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );

  const renderStatPopoverFooter = (note: string, cta: string) => (
    <div className={styles.statPopoverFooter}>
      <span className={styles.footNote}>{note}</span>
      <button
        type="button"
        className={styles.linkBtn}
        onClick={() => {
          setActiveStatPopup(null);
          setIsStatsDrawerOpen(true);
        }}
      >
        <span>{cta}</span>
        <ArrowRight size={15} aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <div className={styles.pageWrapper}>
      <AppNav />

      <div className={styles.container}>
        {/* Page header */}
        <Reveal className={styles.pageHeader}>
          <div className={styles.pageHeaderText}>
            <BackLink href="/intelligence" label="Back to Intelligence Hub" />
            <h1 className={styles.pageTitle}>
              Learning <GradientText>community</GradientText>
            </h1>
            <p className={styles.pageSubtitle}>
              Ask doubts, share strategies and learn from other CAT aspirants&apos; preparation.
            </p>
          </div>
          <button type="button" className={styles.primaryBtn} onClick={() => handleOpenCreateModal()}>
            <SquarePen size={18} strokeWidth={2} aria-hidden="true" />
            <span>Start a discussion</span>
          </button>
        </Reveal>

        {/* Mobile / tablet: views and categories as horizontal chips */}
        <div className={styles.mobileChips} role="toolbar" aria-label="Browse discussions">
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                className={`${styles.chip} ${item.active ? styles.chipActive : ""}`}
                onClick={item.onClick}
                aria-pressed={item.active}
              >
                <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
                <span>{item.key === "HOME" ? "All" : item.label}</span>
                {item.count > 0 && <span className={styles.chipCount}>{item.count}</span>}
              </button>
            );
          })}
          <span className={styles.chipDivider} aria-hidden="true" />
          {CATEGORIES_CONFIG.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            const count = postCountByCategory[cat.name] || 0;
            return (
              <button
                key={cat.name}
                type="button"
                className={`${styles.chip} ${getCategoryToneClass(cat.name)} ${
                  isSelected ? styles.chipCatActive : ""
                }`}
                onClick={() => handleToggleCategory(cat.name)}
                aria-pressed={isSelected}
              >
                {getCategoryOutlineIcon(cat.name, styles.catIcon)}
                <span>{cat.name}</span>
                {count > 0 && <span className={styles.chipCount}>{count}</span>}
              </button>
            );
          })}
        </div>

        <main className={styles.layout}>
          {/* Left: views + categories */}
          <aside className={styles.leftCol} aria-label="Community navigation">
            <div className={styles.navList}>
              {sidebarNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`${styles.navItem} ${item.active ? styles.navItemActive : ""}`}
                    onClick={item.onClick}
                    aria-current={item.active ? "page" : undefined}
                  >
                    <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
                    <span className={styles.navLabel}>{item.label}</span>
                    {item.count > 0 && <span className={styles.navCount}>{item.count}</span>}
                  </button>
                );
              })}
            </div>

            <div className={styles.sideLabel}>Categories</div>

            <div className={styles.navList}>
              {CATEGORIES_CONFIG.map((cat) => {
                const count = postCountByCategory[cat.name] || 0;
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    className={`${styles.navItem} ${styles.catItem} ${getCategoryToneClass(cat.name)} ${
                      isSelected ? styles.catItemActive : ""
                    }`}
                    onClick={() => handleToggleCategory(cat.name)}
                    aria-pressed={isSelected}
                    title={cat.desc}
                  >
                    {getCategoryOutlineIcon(cat.name, styles.catIcon)}
                    <span className={styles.navLabel}>{cat.name}</span>
                    {count > 0 && <span className={styles.navCount}>{count}</span>}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className={styles.profileCard}
              onClick={handleProfileCardClick}
              title={isGuest ? "Sign in to TechnoCAT" : "View profile"}
            >
              <Avatar src={currentUserAvatarUrl} alt={currentUserName} size={38} />
              <span className={styles.profileText}>
                <span className={styles.profileName}>{currentUserName}</span>
                <span className={styles.profileRole}>{currentUserRole}</span>
              </span>
              <ChevronRight size={16} className={styles.profileArrow} aria-hidden="true" />
            </button>
          </aside>

          {/* Centre: composer, filters, feed */}
          <section className={styles.feedCol} aria-label="Discussions">
            <Reveal delay={0.05} className={styles.composerLayer}>
              <div className={`glass-card ${styles.composer}`} data-tint="blue">
                <div className={styles.composerTop}>
                  <Avatar src={currentUserAvatarUrl} alt={currentUserName} size={42} />
                  <input
                    type="text"
                    placeholder="Share your thoughts, ask a doubt, or start a discussion..."
                    className={styles.composerInput}
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    onClick={() => handleOpenCreateModal()}
                    readOnly
                    aria-label="Share your thoughts, ask a doubt, or start a discussion"
                  />
                </div>

                {composerImageUrl && (
                  <div className={styles.attachChip}>
                    <span className={styles.attachThumb}>
                      <img src={composerImageUrl} alt="Attached thumbnail" />
                    </span>
                    <span className={styles.attachName} title={composerImageMeta?.name || "Attached image"}>
                      {composerImageMeta?.name || "Attached image"}
                    </span>
                    <span className={styles.attachSize}>{composerImageMeta?.sizeFormatted || ""}</span>
                    <button
                      type="button"
                      className={styles.attachRemove}
                      onClick={handleRemoveComposerImage}
                      title="Remove attachment"
                      aria-label="Remove attachment"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                )}

                <div className={styles.composerBar}>
                  <div className={styles.composerTools}>
                    <input
                      ref={feedFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleComposerFileChange}
                      style={{ display: "none" }}
                    />
                    <input
                      ref={feedCameraInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      onChange={handleComposerFileChange}
                      style={{ display: "none" }}
                    />

                    <div className={styles.popoverWrap} ref={addImagePopoverRef}>
                      <button
                        type="button"
                        className={`${styles.toolBtn} ${isAddImageOpen ? styles.toolBtnActive : ""}`}
                        onClick={() => {
                          setIsAddImageOpen((prev) => !prev);
                          setIsCategoryOpen(false);
                        }}
                        aria-expanded={isAddImageOpen}
                      >
                        <ImagePlus size={17} strokeWidth={1.9} aria-hidden="true" />
                        <span>Add image</span>
                        <ChevronDown
                          size={14}
                          className={`${styles.chev} ${isAddImageOpen ? styles.chevOpen : ""}`}
                          aria-hidden="true"
                        />
                      </button>

                      {isAddImageOpen && (
                        <div className={styles.floatingAddImagePopover} role="dialog" aria-label="Add image">
                          <div className={styles.popoverHeader}>
                            <span className={styles.popoverTitle}>Add image</span>
                            <button
                              type="button"
                              className={styles.iconBtnSm}
                              onClick={closeAddImagePopover}
                              aria-label="Close"
                            >
                              <X size={16} aria-hidden="true" />
                            </button>
                          </div>

                          {isFeedCameraActive ? (
                            <div className={styles.cameraWrap}>
                              <div className={styles.cameraViewport}>
                                <video
                                  ref={feedVideoRef}
                                  autoPlay
                                  playsInline
                                  muted
                                  className={styles.cameraVideo}
                                />
                                {feedCameraError && (
                                  <div className={styles.cameraError} role="alert">
                                    <span>{feedCameraError}</span>
                                    <button
                                      type="button"
                                      className={styles.ghostBtnSm}
                                      onClick={startFeedCameraStream}
                                    >
                                      Try again
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className={styles.popoverActions}>
                                <button
                                  type="button"
                                  className={styles.secondaryBtnSm}
                                  onClick={handleCancelFeedCamera}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  className={styles.primaryBtnSm}
                                  onClick={handleCaptureFeedPhoto}
                                  disabled={Boolean(feedCameraError)}
                                >
                                  <Camera size={15} aria-hidden="true" />
                                  <span>Capture photo</span>
                                </button>
                              </div>
                            </div>
                          ) : composerImageUrl && composerImageMeta ? (
                            <div className={styles.popoverSelected}>
                              <div className={styles.fileRow}>
                                <span className={styles.fileThumb}>
                                  <img src={composerImageUrl} alt={composerImageMeta.name || "Attached preview"} />
                                </span>
                                <span className={styles.fileMeta}>
                                  <span className={styles.fileName} title={composerImageMeta.name}>
                                    {composerImageMeta.name}
                                  </span>
                                  <span className={styles.fileSize}>{composerImageMeta.sizeFormatted}</span>
                                </span>
                                <button
                                  type="button"
                                  className={styles.iconBtnSm}
                                  onClick={handleRemoveComposerImage}
                                  title="Remove image"
                                  aria-label="Remove image"
                                >
                                  <X size={15} aria-hidden="true" />
                                </button>
                              </div>

                              <div className={styles.popoverActions}>
                                {composerImageMeta.name === "camera-photo.jpg" ? (
                                  <>
                                    <button
                                      type="button"
                                      className={styles.secondaryBtnSm}
                                      onClick={handleRetakeFeedPhoto}
                                    >
                                      <Camera size={15} aria-hidden="true" />
                                      <span>Retake</span>
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.secondaryBtnSm}
                                      onClick={() => feedFileInputRef.current?.click()}
                                    >
                                      <FolderOpen size={15} aria-hidden="true" />
                                      <span>Replace image</span>
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    className={`${styles.secondaryBtnSm} ${styles.fullWidth}`}
                                    onClick={() => feedFileInputRef.current?.click()}
                                  >
                                    <FolderOpen size={15} aria-hidden="true" />
                                    <span>Choose a different image</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <>
                              <div
                                className={`${styles.dropzone} ${isFeedDragging ? styles.dropzoneActive : ""}`}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  setIsFeedDragging(true);
                                }}
                                onDragLeave={(e) => {
                                  e.preventDefault();
                                  setIsFeedDragging(false);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setIsFeedDragging(false);
                                  const files = e.dataTransfer?.files;
                                  if (files && files.length > 0) {
                                    processComposerImage(files[0]);
                                  }
                                }}
                                onClick={() => feedFileInputRef.current?.click()}
                                role="button"
                                tabIndex={0}
                              >
                                <CloudUpload size={24} strokeWidth={1.8} className={styles.dropIcon} aria-hidden="true" />
                                <span className={styles.dropPrimary}>Drag &amp; drop an image here</span>
                                <span className={styles.dropSecondary}>or click to browse</span>
                                <button
                                  type="button"
                                  className={styles.secondaryBtnSm}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    feedFileInputRef.current?.click();
                                  }}
                                >
                                  Browse files
                                </button>
                                <span className={styles.dropHelper}>JPG, PNG, WEBP &middot; max 5 MB</span>
                              </div>

                              {composerImageError && (
                                <div className={styles.fieldError} role="alert">
                                  <CircleExclamationPoint size={15} aria-hidden="true" />
                                  <span>{composerImageError}</span>
                                </div>
                              )}

                              <div className={styles.quickLabel}>Quick options</div>
                              <div className={styles.popoverActions}>
                                <button
                                  type="button"
                                  className={styles.secondaryBtnSm}
                                  onClick={startFeedCameraStream}
                                >
                                  <Camera size={15} aria-hidden="true" />
                                  <span>Take photo</span>
                                </button>
                                <button
                                  type="button"
                                  className={styles.secondaryBtnSm}
                                  onClick={() => feedFileInputRef.current?.click()}
                                >
                                  <FolderOpen size={15} aria-hidden="true" />
                                  <span>From device</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className={`${styles.toolBtn} ${getCategoryToneClass(composerCategory)}`}
                      onClick={() => handleOpenCreateModal(composerCategory || "General Discussion")}
                    >
                      <span className={styles.catDot} aria-hidden="true" />
                      <span>{composerCategory || "Choose category"}</span>
                      <ChevronDown size={14} className={styles.chev} aria-hidden="true" />
                    </button>
                  </div>

                  <button
                    type="button"
                    className={styles.postBtn}
                    onClick={() => {
                      if (!composerText.trim()) {
                        handleOpenCreateModal(composerCategory || "General Discussion");
                      } else {
                        handleFeedPostSubmit();
                      }
                    }}
                    disabled={isPostingFromFeed}
                  >
                    <span>{isPostingFromFeed ? "Posting..." : "Post"}</span>
                    <Send size={15} strokeWidth={2} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </Reveal>

            {/* Sort tabs + search */}
            <div className={styles.toolbar}>
              <div className={styles.tabs} role="tablist" aria-label="Discussion filters">
                {(["Recent", "Most Helpful", "Trending", "Unanswered", "My Posts"] as FeedFilterTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab}
                    className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
                    onClick={() => handleTabChange(tab)}
                  >
                    {FEED_TAB_LABELS[tab]}
                  </button>
                ))}
              </div>

              <div className={styles.search}>
                <Search size={16} className={styles.searchIcon} aria-hidden="true" />
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
                    className={styles.searchClear}
                    onClick={() => setSearchQuery("")}
                    title="Clear search"
                    aria-label="Clear search"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {selectedCategory && (
              <div className={`${styles.filterBanner} ${getCategoryToneClass(selectedCategory)}`}>
                <span className={styles.filterBannerText}>
                  {getCategoryOutlineIcon(selectedCategory, styles.catIcon)}
                  <span>
                    Showing <strong>{selectedCategory}</strong>
                  </span>
                </span>
                <button type="button" className={styles.linkBtn} onClick={() => setSelectedCategory(null)}>
                  <span>Clear filter</span>
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            )}

            {(sidebarView === "SAVED_POSTS" || sidebarView === "BOOKMARKS") && (
              <div className={styles.filterBanner}>
                <span className={styles.filterBannerText}>
                  <Bookmark size={16} aria-hidden="true" />
                  <span>
                    Your saved discussions <span className={styles.mono}>({savedPostsCount})</span>
                  </span>
                </span>
                <button type="button" className={styles.linkBtn} onClick={handleSelectHome}>
                  <span>Back to all discussions</span>
                </button>
              </div>
            )}

            {/* Feed */}
            {loading ? (
              <div className={styles.postList} aria-busy="true">
                <p className={styles.srOnly}>Loading community discussions...</p>
                {[0, 1, 2].map((i) => (
                  <div key={i} className={styles.skeletonCard} aria-hidden="true">
                    <span className={styles.skeletonAvatar} />
                    <span className={styles.skeletonLines}>
                      <span style={{ width: "38%" }} />
                      <span style={{ width: "82%" }} />
                      <span style={{ width: "64%" }} />
                    </span>
                  </div>
                ))}
              </div>
            ) : visiblePosts.length === 0 ? (
              <div className={styles.emptyCard}>
                <MessageSquare size={28} strokeWidth={1.6} className={styles.emptyIcon} aria-hidden="true" />
                <p className={styles.emptyTitle}>
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
                  className={styles.primaryBtnSm}
                  onClick={() => {
                    if (searchQuery) setSearchQuery("");
                    else if (selectedCategory) setSelectedCategory(null);
                    else handleOpenCreateModal();
                  }}
                >
                  {searchQuery ? "Reset search" : selectedCategory ? "View all discussions" : "Start a discussion"}
                </button>
              </div>
            ) : (
              <RevealGroup className={styles.postList}>
                {visiblePosts.map((post) => {
                  const avatarSrc = getAuthorAvatar(post.authorName) || post.authorAvatar || "/profile_icon.png";
                  const menuOpen = openMenuPostId === post.id;
                  return (
                    <RevealItem key={post.id} className={`${styles.postItem} ${menuOpen ? styles.postItemRaised : ""}`}>
                      <SpotlightCard
                        as="article"
                        className={`${styles.postCard} ${getCategoryToneClass(post.category)}`}
                        onClick={() => {
                          setActivePostId(post.id);
                          setReplyingToCommentId(null);
                        }}
                      >
                        <div className={styles.voteRail}>
                          <button
                            type="button"
                            className={`${styles.voteBtn} ${post.isUpvoted ? styles.voteBtnOn : ""}`}
                            onClick={(e) => handleToggleUpvote(post.id, e)}
                            aria-label={`Upvote (${post.upvotesCount})`}
                            aria-pressed={post.isUpvoted}
                          >
                            <ArrowBigUp
                              size={22}
                              strokeWidth={1.7}
                              fill={post.isUpvoted ? "currentColor" : "none"}
                              aria-hidden="true"
                            />
                            <span className={styles.voteCount}>{post.upvotesCount}</span>
                          </button>
                        </div>

                        <div className={styles.postMain}>
                          <div className={styles.postHead}>
                            <Avatar src={avatarSrc} alt={post.authorName} size={34} />
                            <div className={styles.byline}>
                              <span className={styles.authorName}>{post.authorName}</span>
                              <span className={styles.postTime}>{formatRelativeTime(post.createdAt)}</span>
                            </div>
                            <span className={getCategoryBadgeClass(post.category)}>{post.category}</span>

                            <div className={styles.menuWrap} onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className={styles.iconBtnSm}
                                aria-label="Discussion options"
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                                onClick={() => setOpenMenuPostId((prev) => (prev === post.id ? null : post.id))}
                              >
                                <Ellipsis size={18} aria-hidden="true" />
                              </button>

                              {menuOpen && (
                                <div className={styles.menu} role="menu">
                                  <button
                                    type="button"
                                    role="menuitem"
                                    className={styles.menuItem}
                                    onClick={(e) => handleToggleSave(post.id, e)}
                                  >
                                    <Bookmark size={15} aria-hidden="true" />
                                    <span>{post.isSaved ? "Unsave" : "Save"}</span>
                                  </button>
                                  {!post.isOwnPost && (
                                    <button
                                      type="button"
                                      role="menuitem"
                                      className={styles.menuItem}
                                      onClick={(e) => handleReportPost(post.id, e)}
                                    >
                                      <Flag size={15} aria-hidden="true" />
                                      <span>Report</span>
                                    </button>
                                  )}
                                  {post.isOwnPost && (
                                    <button
                                      type="button"
                                      role="menuitem"
                                      className={`${styles.menuItem} ${styles.menuItemDanger}`}
                                      onClick={(e) => handleDeletePost(post.id, e)}
                                    >
                                      <Trash size={15} aria-hidden="true" />
                                      <span>Delete</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <h2 className={styles.postTitle}>{post.title}</h2>
                          <p className={styles.postExcerpt}>{post.content}</p>

                          {post.imageUrl && (
                            <div className={styles.postImage}>
                              <img src={post.imageUrl} alt={post.title} />
                            </div>
                          )}

                          <div className={styles.postFoot}>
                            <button
                              type="button"
                              className={styles.metaBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePostId(post.id);
                                setReplyingToCommentId(null);
                              }}
                            >
                              <MessageCircle size={16} strokeWidth={1.9} aria-hidden="true" />
                              <span className={styles.mono}>{post.commentsCount}</span>
                              <span>{post.commentsCount === 1 ? "comment" : "comments"}</span>
                            </button>

                            <button
                              type="button"
                              className={`${styles.saveBtn} ${post.isSaved ? styles.saveBtnOn : ""}`}
                              onClick={(e) => handleToggleSave(post.id, e)}
                              title={post.isSaved ? "Saved" : "Save discussion"}
                              aria-label={post.isSaved ? "Saved" : "Save discussion"}
                              aria-pressed={post.isSaved}
                            >
                              <Bookmark
                                size={18}
                                strokeWidth={1.9}
                                fill={post.isSaved ? "currentColor" : "none"}
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </div>
                      </SpotlightCard>
                    </RevealItem>
                  );
                })}
              </RevealGroup>
            )}
          </section>

          {/* Right: stats, contributors, guidelines */}
          <aside className={styles.rightCol} aria-label="Community insights">
            <RevealGroup className={styles.rightStack}>
              <RevealItem>
                <section className={styles.pulseCard} aria-labelledby="community-stats-title">
                  <div className={styles.cardHead}>
                    <h3 id="community-stats-title" className={styles.pulseTitle}>
                      Community stats
                    </h3>
                    <button type="button" className={styles.pulseLink} onClick={() => setIsStatsDrawerOpen(true)}>
                      <span>View all</span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  </div>

                  <div className={styles.pulseGrid}>
                    {statCells.map((cell) => (
                      <button
                        key={cell.key}
                        type="button"
                        className={styles.pulseCell}
                        onClick={() => setActiveStatPopup(cell.key)}
                        title={`View ${cell.label.toLowerCase()} details`}
                      >
                        <span className={styles.pulseLabel}>
                          <span className={styles.dot} style={{ background: cell.color }} aria-hidden="true" />
                          {cell.label}
                        </span>
                        <StatFigure value={cell.value} className={styles.pulseValue} />
                      </button>
                    ))}
                  </div>

                  <div className={styles.pulseSpark}>
                    <div className={styles.pulseSparkHead}>
                      <span>Activity</span>
                      <span className={styles.mono}>{activityPeriodLabel}</span>
                    </div>
                    <svg viewBox="0 0 500 150" preserveAspectRatio="none" className={styles.pulseSvg} aria-hidden="true">
                      <defs>
                        <linearGradient id="communityPulseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {chartPaths.areaD && <path d={chartPaths.areaD} fill="url(#communityPulseGrad)" />}
                      {chartPaths.lineD && (
                        <path
                          d={chartPaths.lineD}
                          fill="none"
                          stroke="#67e8f9"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      )}
                    </svg>
                  </div>
                </section>
              </RevealItem>

              <RevealItem>
                <section className={`glass-card ${styles.sideCard}`} data-tint="violet" aria-labelledby="top-contributors-title">
                  <div className={styles.cardHead}>
                    <div>
                      <h3 id="top-contributors-title" className={styles.cardTitle}>
                        Top contributors
                      </h3>
                      <p className={styles.cardSub}>This month</p>
                    </div>
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() => setIsContributorsDrawerOpen(true)}
                      aria-label="View all top contributors"
                    >
                      <span>View all</span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  </div>

                  {topContributorsList.length === 0 ? (
                    <div className={styles.miniEmpty}>
                      <Trophy size={22} strokeWidth={1.7} className={styles.emptyIcon} aria-hidden="true" />
                      <p className={styles.miniEmptyTitle}>No contributors yet</p>
                      <p className={styles.miniEmptyText}>
                        Start a discussion or share a solution to lead the leaderboard.
                      </p>
                    </div>
                  ) : (
                    <ol className={styles.contribList}>
                      {topContributorsList.map((contributor) => {
                        const avatarSrc =
                          getAuthorAvatar(contributor.authorName) || contributor.authorAvatar || "/profile_icon.png";
                        return (
                          <li key={contributor.authorId} className={styles.contribRow}>
                            <RankBadge rank={contributor.rank} />
                            <Avatar src={avatarSrc} alt={contributor.authorName} size={32} />
                            <span className={styles.contribName}>{contributor.authorName}</span>
                            <span className={styles.contribCount}>
                              <span className={styles.mono}>{contributor.postCount}</span> posts
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </section>
              </RevealItem>

              <RevealItem>
                <section className={`glass-card ${styles.sideCard}`} data-tint="teal" aria-labelledby="guidelines-title">
                  <h3 id="guidelines-title" className={`${styles.cardTitle} ${styles.cardTitleIcon}`}>
                    <ShieldCheck size={18} strokeWidth={1.9} className={styles.tealIcon} aria-hidden="true" />
                    Community guidelines
                  </h3>
                  <ul className={styles.guideList}>
                    {[
                      "Be respectful and supportive",
                      "Keep discussions relevant to CAT preparation",
                      "No spam or promotional content",
                      "Help others and share genuine insights",
                    ].map((rule) => (
                      <li key={rule}>
                        <Check size={15} strokeWidth={2.2} className={styles.tealIcon} aria-hidden="true" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </RevealItem>
            </RevealGroup>
          </aside>
        </main>
      </div>

      {/* Create discussion modal */}
      {isCreateModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={closeCreateModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-post-modal-title"
        >
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="create-post-modal-title" className={styles.modalTitle}>
                  Start a new discussion
                </h2>
                <p className={styles.modalSubtitle}>
                  Ask a doubt, share a strategy or start a conversation with other aspirants.
                </p>
              </div>
              <button type="button" className={styles.iconBtn} onClick={closeCreateModal} aria-label="Close modal">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreatePostSubmit} className={styles.modalForm}>
              <div className={styles.modalBody}>
                {createError && (
                  <div className={styles.formError} role="alert">
                    <CircleExclamationPoint size={16} aria-hidden="true" />
                    <span>{createError}</span>
                  </div>
                )}

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="post-title-input">
                    Title <span className={styles.labelHint}>max 50 characters</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <input
                      id="post-title-input"
                      type="text"
                      className={styles.input}
                      placeholder="e.g., How to approach DILR sets effectively?"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      maxLength={50}
                      required
                    />
                    <span className={styles.counter}>{newTitle.length}/50</span>
                  </div>
                </div>

                <div className={styles.field} ref={modalCategoryRef}>
                  <label className={styles.label} id="modal-category-label">
                    Category
                  </label>
                  <button
                    id="modal-category-trigger"
                    type="button"
                    className={`${styles.selectTrigger} ${getCategoryToneClass(newCategory)} ${
                      isModalCategoryOpen ? styles.selectTriggerOpen : ""
                    }`}
                    onClick={() => setIsModalCategoryOpen((prev) => !prev)}
                    aria-expanded={isModalCategoryOpen}
                    aria-haspopup="listbox"
                    aria-labelledby="modal-category-label modal-category-trigger"
                  >
                    <span className={styles.selectTriggerLeft}>
                      {getCategoryOutlineIcon(newCategory, styles.catIcon)}
                      <span>{newCategory}</span>
                    </span>
                    <ChevronDown
                      size={16}
                      className={`${styles.chev} ${isModalCategoryOpen ? styles.chevOpen : ""}`}
                      aria-hidden="true"
                    />
                  </button>

                  {isModalCategoryOpen && (
                    <div className={styles.optionList} role="listbox" aria-label="Category options">
                      {MODAL_CATEGORIES_CONFIG.map((cat) => {
                        const isSelected = newCategory === cat.name;
                        return (
                          <div
                            key={cat.name}
                            ref={isSelected ? selectedCategoryRowRef : undefined}
                            className={`${styles.option} ${getCategoryToneClass(cat.name)} ${
                              isSelected ? styles.optionSelected : ""
                            }`}
                            onClick={() => {
                              setNewCategory(cat.name);
                              setIsModalCategoryOpen(false);
                            }}
                            role="option"
                            aria-selected={isSelected}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setNewCategory(cat.name);
                                setIsModalCategoryOpen(false);
                              }
                            }}
                          >
                            {getCategoryOutlineIcon(cat.name, styles.catIcon)}
                            <span className={styles.optionText}>
                              <span className={styles.optionName}>{cat.name}</span>
                              <span className={styles.optionDesc}>{cat.desc}</span>
                            </span>
                            <span className={`${styles.radio} ${isSelected ? styles.radioOn : ""}`} aria-hidden="true" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="post-content-textarea">
                    Content <span className={styles.labelHint}>min 15 characters</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <textarea
                      ref={contentTextareaRef}
                      id="post-content-textarea"
                      className={styles.textarea}
                      placeholder="Share your thoughts, ask a doubt, or start a discussion..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      maxLength={2000}
                      required
                    />
                    <span className={`${styles.counter} ${styles.counterBottom}`}>{newContent.length}/2000</span>
                  </div>
                </div>

                <div className={styles.field}>
                  <span className={styles.label}>
                    Image <span className={styles.labelHint}>optional</span>
                  </span>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageFileChange}
                    style={{ display: "none" }}
                  />

                  <div
                    className={`${styles.dropzoneWide} ${isDraggingImage ? styles.dropzoneActive : ""}`}
                    onDragOver={handleImageDragOver}
                    onDragEnter={handleImageDragEnter}
                    onDragLeave={handleImageDragLeave}
                    onDrop={handleImageDrop}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    <CloudUpload size={26} strokeWidth={1.8} className={styles.dropIcon} aria-hidden="true" />
                    <span className={styles.dropText}>
                      <span className={styles.dropPrimary}>Drag &amp; drop an image here</span>
                      <span className={styles.dropSecondary}>
                        or <span className={styles.dropLink}>click to browse</span> &middot; JPG, PNG, WEBP up to 5 MB
                      </span>
                    </span>
                    <button
                      type="button"
                      className={styles.secondaryBtnSm}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <FolderOpen size={15} aria-hidden="true" />
                      <span>Browse files</span>
                    </button>
                  </div>

                  {newImageUrl && (
                    <div className={styles.fileRow}>
                      <span className={styles.fileThumb}>
                        <img src={newImageUrl} alt={newImageMeta?.name || "Attached file"} />
                      </span>
                      <span className={styles.fileMeta}>
                        <span className={styles.fileName} title={newImageMeta?.name || "cat_notes_diagram.png"}>
                          {newImageMeta?.name || "cat_notes_diagram.png"}
                        </span>
                        <span className={styles.fileSize}>{newImageMeta?.sizeFormatted || "2.3 MB"}</span>
                      </span>
                      <button
                        type="button"
                        className={styles.iconBtnSm}
                        onClick={handleRemoveImage}
                        title="Remove image"
                        aria-label="Remove image"
                      >
                        <X size={15} aria-hidden="true" />
                      </button>
                    </div>
                  )}

                  {imageValidationError && (
                    <div className={styles.fieldError} role="alert">
                      <CircleExclamationPoint size={15} aria-hidden="true" />
                      <span>{imageValidationError}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.secondaryBtn} onClick={closeCreateModal}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn} disabled={isSubmittingPost}>
                  <Send size={16} aria-hidden="true" />
                  <span>{isSubmittingPost ? "Posting..." : "Post"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thread view */}
      {activePost && (
        <div
          className={styles.modalOverlay}
          onClick={() => setActivePostId(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="discussion-modal-title"
        >
          <div className={`${styles.modalCard} ${styles.threadCard}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.threadAuthor}>
                <Avatar
                  src={getAuthorAvatar(activePost.authorName) || activePost.authorAvatar || "/profile_icon.png"}
                  alt={activePost.authorName}
                  size={40}
                />
                <div className={styles.byline}>
                  <span className={styles.authorName}>
                    {activePost.authorName}
                    <span className={styles.postTime}> &middot; {formatRelativeTime(activePost.createdAt)}</span>
                  </span>
                  <span className={styles.authorRole}>{activePost.authorRole}</span>
                </div>
              </div>

              <div className={styles.threadHeadRight}>
                <span className={getCategoryBadgeClass(activePost.category)}>{activePost.category}</span>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => setActivePostId(null)}
                  aria-label="Close discussion"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className={styles.modalBody}>
              <h2 id="discussion-modal-title" className={styles.threadTitle}>
                {activePost.title}
              </h2>
              <div className={styles.threadContent}>{activePost.content}</div>

              {activePost.imageUrl && (
                <div className={styles.threadImage}>
                  <img src={activePost.imageUrl} alt={activePost.title} />
                </div>
              )}

              <div className={styles.threadActions}>
                <div className={styles.threadActionsLeft}>
                  <button
                    type="button"
                    className={`${styles.pillBtn} ${activePost.isUpvoted ? styles.pillBtnOn : ""}`}
                    onClick={() => handleToggleUpvote(activePost.id)}
                    aria-pressed={activePost.isUpvoted}
                  >
                    <ArrowBigUp
                      size={18}
                      strokeWidth={1.8}
                      fill={activePost.isUpvoted ? "currentColor" : "none"}
                      aria-hidden="true"
                    />
                    <span>Upvote</span>
                    <span className={styles.mono}>{activePost.upvotesCount}</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.pillBtn} ${activePost.isSaved ? styles.pillBtnOn : ""}`}
                    onClick={() => handleToggleSave(activePost.id)}
                    aria-pressed={activePost.isSaved}
                  >
                    <Bookmark
                      size={16}
                      strokeWidth={1.9}
                      fill={activePost.isSaved ? "currentColor" : "none"}
                      aria-hidden="true"
                    />
                    <span>{activePost.isSaved ? "Saved" : "Save"}</span>
                  </button>
                </div>

                {activePost.isOwnPost ? (
                  <button
                    type="button"
                    className={`${styles.pillBtn} ${styles.pillBtnDanger}`}
                    onClick={() => handleDeletePost(activePost.id)}
                  >
                    <Trash size={15} aria-hidden="true" />
                    <span>Delete post</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.pillBtn}
                    onClick={(e) => handleReportPost(activePost.id, e)}
                    title="Report discussion"
                  >
                    <Flag size={15} aria-hidden="true" />
                    <span>Report</span>
                  </button>
                )}
              </div>

              <form className={styles.replyComposer} onSubmit={handleAddComment}>
                <textarea
                  ref={commentTextareaRef}
                  className={styles.textarea}
                  placeholder="Write a helpful response, share your solution, or ask a follow-up..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  aria-label="Write a comment"
                />
                <div className={styles.replyComposerBar}>
                  <button
                    type="submit"
                    className={styles.primaryBtnSm}
                    disabled={isSubmittingComment || !commentInput.trim()}
                  >
                    <Send size={15} aria-hidden="true" />
                    <span>{isSubmittingComment ? "Posting..." : "Post comment"}</span>
                  </button>
                </div>
              </form>

              <div className={styles.threadSectionHead}>
                <span>Comments</span>
                <span className={styles.mono}>{activePost.commentsCount}</span>
              </div>

              {rootComments.length === 0 ? (
                <div className={styles.threadEmpty}>
                  <MessageCircle size={22} strokeWidth={1.7} className={styles.emptyIcon} aria-hidden="true" />
                  <p>{"No replies yet.\nStart the conversation."}</p>
                </div>
              ) : (
                <div className={styles.thread}>
                  {rootComments.map((comment) => {
                    const replies = getRepliesForComment(comment.id);
                    const commentAvatar =
                      getAuthorAvatar(comment.authorName) || comment.authorAvatar || "/profile_icon.png";
                    return (
                      <div key={comment.id} className={styles.comment}>
                        <div className={styles.commentHead}>
                          <Avatar src={commentAvatar} alt={comment.authorName} size={32} />
                          <div className={styles.byline}>
                            <span className={styles.authorName}>
                              {comment.authorName}
                              <span className={styles.postTime}> &middot; {formatRelativeTime(comment.createdAt)}</span>
                            </span>
                            <span className={styles.authorRole}>{comment.authorRole}</span>
                          </div>
                        </div>

                        <div className={styles.commentBody}>
                          <p className={styles.commentText}>{comment.content}</p>

                          <div className={styles.commentActions}>
                            <button
                              type="button"
                              className={`${styles.textBtn} ${comment.isUpvoted ? styles.textBtnOn : ""}`}
                              onClick={(e) => handleToggleCommentUpvote(comment.id, e)}
                              aria-label={`Upvote comment (${comment.upvotesCount || 0})`}
                              aria-pressed={Boolean(comment.isUpvoted)}
                            >
                              <ArrowBigUp
                                size={17}
                                strokeWidth={1.8}
                                fill={comment.isUpvoted ? "currentColor" : "none"}
                                aria-hidden="true"
                              />
                              <span className={styles.mono}>{comment.upvotesCount || 0}</span>
                            </button>

                            <button
                              type="button"
                              className={`${styles.textBtn} ${replyingToCommentId === comment.id ? styles.textBtnOn : ""}`}
                              onClick={() => {
                                setReplyingToCommentId((prev) => (prev === comment.id ? null : comment.id));
                                setReplyInput("");
                              }}
                            >
                              <Reply size={15} aria-hidden="true" />
                              <span>Reply</span>
                            </button>

                            {canDeleteComment(comment.authorId, comment.isOwnComment) && (
                              <button
                                type="button"
                                className={`${styles.textBtn} ${styles.textBtnDanger}`}
                                onClick={() => handleDeleteComment(comment.id)}
                                title="Delete comment"
                              >
                                <Trash size={14} aria-hidden="true" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>

                          {replyingToCommentId === comment.id && (
                            <form className={styles.inlineReply} onSubmit={(e) => handleAddNestedReply(comment.id, e)}>
                              <input
                                type="text"
                                className={styles.input}
                                placeholder={`Reply to ${comment.authorName}...`}
                                value={replyInput}
                                onChange={(e) => setReplyInput(e.target.value)}
                                autoFocus
                              />
                              <button
                                type="submit"
                                className={styles.primaryBtnSm}
                                disabled={isSubmittingComment || !replyInput.trim()}
                              >
                                Reply
                              </button>
                            </form>
                          )}

                          {replies.length > 0 && (
                            <div className={styles.replies}>
                              {replies.map((rep) => {
                                const repAvatar =
                                  getAuthorAvatar(rep.authorName) || rep.authorAvatar || "/profile_icon.png";
                                return (
                                  <div key={rep.id} className={styles.reply}>
                                    <div className={styles.commentHead}>
                                      <Avatar src={repAvatar} alt={rep.authorName} size={26} />
                                      <span className={styles.authorName}>
                                        {rep.authorName}
                                        <span className={styles.postTime}> &middot; {formatRelativeTime(rep.createdAt)}</span>
                                      </span>
                                    </div>
                                    <div className={styles.replyBody}>
                                      <p className={styles.commentText}>{rep.content}</p>
                                      <div className={styles.commentActions}>
                                        <button
                                          type="button"
                                          className={`${styles.textBtn} ${rep.isUpvoted ? styles.textBtnOn : ""}`}
                                          onClick={(e) => handleToggleCommentUpvote(rep.id, e)}
                                          aria-label={`Upvote reply (${rep.upvotesCount || 0})`}
                                          aria-pressed={Boolean(rep.isUpvoted)}
                                        >
                                          <ArrowBigUp
                                            size={16}
                                            strokeWidth={1.8}
                                            fill={rep.isUpvoted ? "currentColor" : "none"}
                                            aria-hidden="true"
                                          />
                                          <span className={styles.mono}>{rep.upvotesCount || 0}</span>
                                        </button>

                                        {canDeleteComment(rep.authorId, rep.isOwnComment) && (
                                          <button
                                            type="button"
                                            className={`${styles.textBtn} ${styles.textBtnDanger}`}
                                            onClick={() => handleDeleteComment(rep.id)}
                                            title="Delete reply"
                                          >
                                            <Trash size={13} aria-hidden="true" />
                                            <span>Delete</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top contributors drawer */}
      {isContributorsDrawerOpen && (
        <div
          className={styles.drawerOverlay}
          onClick={() => setIsContributorsDrawerOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="top-contributors-drawer-title"
        >
          <div className={`${styles.drawerPanel} ${styles.contributorDrawerPanel}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <h2 id="top-contributors-drawer-title" className={styles.drawerTitle}>
                  Top <GradientText>contributors</GradientText>
                </h2>
                <p className={styles.drawerSubtitle}>
                  {contributorTab === "This Month"
                    ? "Community leaders this month"
                    : contributorTab === "This Week"
                    ? "Community leaders this week"
                    : "Community leaders of all time"}
                </p>
              </div>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => setIsContributorsDrawerOpen(false)}
                aria-label="Close top contributors drawer"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className={styles.drawerTabsWrap}>
              <div className={styles.segmented}>
                {(["This Month", "This Week", "All Time"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`${styles.segment} ${contributorTab === tab ? styles.segmentActive : ""}`}
                    onClick={() => setContributorTab(tab)}
                    aria-pressed={contributorTab === tab}
                  >
                    {tab === "This Month" ? "This month" : tab === "This Week" ? "This week" : "All time"}
                  </button>
                ))}
              </div>
            </div>

            <div className={`${styles.drawerBody} ${styles.contributorDrawerBody}`}>
              {topContributorsList.length === 0 ? (
                <div className={styles.miniEmpty}>
                  <Trophy size={26} strokeWidth={1.7} className={styles.emptyIcon} aria-hidden="true" />
                  <p className={styles.miniEmptyTitle}>Leaderboard reset</p>
                  <p className={styles.miniEmptyText}>
                    Active contributions will appear here as students ask and answer CAT questions.
                  </p>
                </div>
              ) : (
                <ol className={styles.leaderList}>
                  {topContributorsList.map((contributor) => {
                    const avatarSrc =
                      getAuthorAvatar(contributor.authorName) || contributor.authorAvatar || "/profile_icon.png";
                    return (
                      <li
                        key={contributor.authorId}
                        className={`${styles.leaderRow} ${contributor.rank <= 3 ? styles.leaderRowTop : ""}`}
                      >
                        <RankBadge rank={contributor.rank} />
                        <Avatar src={avatarSrc} alt={contributor.authorName} size={44} />
                        <div className={styles.leaderInfo}>
                          <span className={styles.leaderName}>
                            {contributor.authorName}
                            {contributor.rank === 1 && (
                              <Trophy
                                size={15}
                                strokeWidth={2}
                                className={styles.trophyIcon}
                                aria-label="Community leader, first place"
                              />
                            )}
                          </span>
                          <span className={styles.leaderMeta}>
                            <span className={styles.mono}>{contributor.postCount}</span> posts
                          </span>
                          <span className={styles.leaderBadges}>
                            <span className={styles.activeBadge}>
                              <span className={styles.liveDot} aria-hidden="true" />
                              Active
                            </span>
                            {contributor.rank <= 3 && <span className={styles.topBadge}>Top contributor</span>}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}

              <div className={styles.impactCard}>
                <h4 className={styles.impactTitle}>Community contribution</h4>
                <p className={styles.impactSub}>
                  {contributorTab === "This Month"
                    ? "Total impact this month"
                    : contributorTab === "This Week"
                    ? "Total impact this week"
                    : "Total impact of all time"}
                </p>
                <div className={styles.impactGrid}>
                  <div className={styles.impactCell}>
                    <StatFigure value={data?.stats.discussions} className={styles.impactValue} />
                    <span className={styles.impactLabel}>Discussions started</span>
                  </div>
                  <div className={styles.impactCell}>
                    <StatFigure value={data?.stats.helpfulRate} className={styles.impactValue} />
                    <span className={styles.impactLabel}>Helpful answers</span>
                  </div>
                  <div className={styles.impactCell}>
                    <StatFigure value={data?.stats.solutions} className={styles.impactValue} />
                    <span className={styles.impactLabel}>Solutions shared</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Community stats drawer */}
      {isStatsDrawerOpen && (
        <div
          className={styles.drawerOverlay}
          onClick={() => setIsStatsDrawerOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="community-stats-drawer-title"
        >
          <div
            className={`${styles.drawerPanel} ${styles.statsDrawerPanel}`}
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              if (statsDrawerBodyRef.current && !statsDrawerBodyRef.current.contains(e.target as Node)) {
                statsDrawerBodyRef.current.scrollTop += e.deltaY;
              }
            }}
          >
            <div className={styles.drawerHeader}>
              <div>
                <h2 id="community-stats-drawer-title" className={styles.drawerTitle}>
                  Community <GradientText>stats</GradientText>
                </h2>
                <p className={styles.drawerSubtitle}>A quick overview of community activity and impact.</p>
              </div>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => setIsStatsDrawerOpen(false)}
                aria-label="Close community stats drawer"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div ref={statsDrawerBodyRef} className={`${styles.drawerBody} ${styles.statsDrawerBody}`}>
              <div className={styles.drawerStatsGrid}>
                {[
                  { label: "Members", value: data?.stats.members, desc: "CAT aspirants in the community", tint: "blue" },
                  { label: "Discussions", value: data?.stats.discussions, desc: "Questions and discussions started", tint: "teal" },
                  { label: "Solutions", value: data?.stats.solutions, desc: "Replies shared by the community", tint: "violet" },
                  { label: "Helpful rate", value: data?.stats.helpfulRate, desc: "Questions getting helpful responses", tint: "amber" },
                ].map((s) => (
                  <div key={s.label} className={`glass-card ${styles.drawerStat}`} data-tint={s.tint}>
                    <span className={styles.drawerStatLabel}>{s.label}</span>
                    <StatFigure value={s.value} className={styles.drawerStatValue} />
                    <span className={styles.drawerStatDesc}>{s.desc}</span>
                  </div>
                ))}
              </div>

              <div className={styles.drawerSection}>
                <div className={styles.drawerSectionHead}>
                  <div>
                    <h3 className={styles.cardTitle}>Community activity</h3>
                    <p className={styles.cardSub}>Posts and comments over time.</p>
                  </div>
                  <select
                    className={styles.select}
                    value={activityPeriod}
                    onChange={(e) => setActivityPeriod(e.target.value as "7D" | "30D" | "90D")}
                    aria-label="Select activity timeframe"
                  >
                    <option value="7D">Last 7 days</option>
                    <option value="30D">Last 30 days</option>
                    <option value="90D">Last 90 days</option>
                  </select>
                </div>

                <div className={styles.chart}>
                  {hoveredPoint && (
                    <div className={styles.chartTooltip}>
                      <span>{hoveredPoint.date}</span>
                      <strong className={styles.mono}>{hoveredPoint.value} activities</strong>
                    </div>
                  )}

                  <svg viewBox="0 0 500 150" className={styles.chartSvg} role="img" aria-label="Community activity chart">
                    <defs>
                      <linearGradient id="communityActivityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <line x1="20" y1="28" x2="480" y2="28" stroke="#e4e9f2" strokeWidth="1" strokeDasharray="3 4" />
                    <line x1="20" y1="70" x2="480" y2="70" stroke="#e4e9f2" strokeWidth="1" strokeDasharray="3 4" />
                    <line x1="20" y1="112" x2="480" y2="112" stroke="#e4e9f2" strokeWidth="1" strokeDasharray="3 4" />
                    <path d={chartPaths.areaD} fill="url(#communityActivityGrad)" />
                    <path
                      d={chartPaths.lineD}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {chartPaths.points.map((pt, idx) => (
                      <g
                        key={idx}
                        onMouseEnter={() =>
                          setHoveredPoint({ date: pt.item.fullDate, value: pt.item.value, x: pt.x, y: pt.y })
                        }
                        onMouseLeave={() => setHoveredPoint(null)}
                        style={{ cursor: "pointer" }}
                      >
                        <circle cx={pt.x} cy={pt.y} r="9" fill="transparent" />
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={hoveredPoint?.date === pt.item.fullDate ? "5.5" : "3.5"}
                          fill="#ffffff"
                          stroke="#3b82f6"
                          strokeWidth="2.2"
                        />
                      </g>
                    ))}
                  </svg>

                  <div className={styles.chartAxis}>
                    {activityData.map((item, idx) => (
                      <span key={idx}>{item.label}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.drawerSection}>
                <div className={styles.drawerSectionHead}>
                  <div>
                    <h3 className={styles.cardTitle}>Most active categories</h3>
                    <p className={styles.cardSub}>Discussions by preparation topic.</p>
                  </div>
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => setShowAllCategoriesInDrawer((prev) => !prev)}
                  >
                    {showAllCategoriesInDrawer ? "Show less" : "View all"}
                  </button>
                </div>

                <div className={styles.barList}>
                  {(showAllCategoriesInDrawer ? categoryActivityCounts : categoryActivityCounts.slice(0, 5)).map(
                    (cat) => {
                      const maxCount = categoryActivityCounts[0]?.count || 300;
                      const percent = Math.min(100, Math.max(12, Math.round((cat.count / maxCount) * 100)));
                      return (
                        <div
                          key={cat.name}
                          className={`${styles.barRow} ${getCategoryToneClass(cat.name as CommunityCategory)}`}
                        >
                          <span className={styles.barName} title={cat.name}>
                            {getCategoryOutlineIcon(cat.name as CommunityCategory, styles.catIcon)}
                            <span>{cat.name}</span>
                          </span>
                          <span className={styles.barTrack}>
                            <span className={styles.barFill} style={{ width: `${percent}%` }} />
                          </span>
                          <span className={styles.barCount}>{cat.count}</span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stat detail popovers */}
      {activeStatPopup === "MEMBERS" && (
        <div
          className={styles.statPopoverOverlay}
          onClick={() => setActiveStatPopup(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="stat-members-title"
        >
          <div className={styles.statPopoverCard} onClick={(e) => e.stopPropagation()}>
            {renderStatPopoverHeader(
              "stat-members-title",
              "Community members",
              "TechnoCAT aspirant network",
              "var(--data-blue)",
              "Close members detail"
            )}

            <div className={`${styles.statPopoverBody} ${styles.statPopupContent}`}>
              <div className={styles.highlight}>
                <div className={styles.highlightRow}>
                  <span className={styles.highlightNumber}>
                    {data ? data.stats.members : isDemo ? "2.4K" : "0"}
                  </span>
                  <span className={`${styles.trendBadge} ${styles.trendGreen}`}>
                    {isDemo ? (
                      <>
                        <TrendingUp size={13} aria-hidden="true" /> +14.2% this month
                      </>
                    ) : (
                      "Registered"
                    )}
                  </span>
                </div>
                <p className={styles.highlightDesc}>
                  {isDemo
                    ? "Community members across TechnoCAT actively preparing for CAT & OMETs."
                    : "Verified student accounts currently registered in the TechnoCAT community."}
                </p>
              </div>

              {isDemo ? (
                <div className={styles.statBlock}>
                  <h4 className={styles.statBlockTitle}>30-day growth trend</h4>
                  <div className={styles.miniChart}>
                    <svg viewBox="0 0 320 80" className={styles.miniChartSvg} aria-label="30-day membership growth chart">
                      <defs>
                        <linearGradient id="membersTrendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <line x1="10" y1="20" x2="310" y2="20" stroke="#e4e9f2" strokeWidth="1" strokeDasharray="3 4" />
                      <line x1="10" y1="50" x2="310" y2="50" stroke="#e4e9f2" strokeWidth="1" strokeDasharray="3 4" />
                      <path
                        d="M 15 65 L 55 58 L 105 52 L 155 45 L 205 38 L 255 24 L 305 14 L 305 75 L 15 75 Z"
                        fill="url(#membersTrendGrad)"
                      />
                      <path
                        d="M 15 65 L 55 58 L 105 52 L 155 45 L 205 38 L 255 24 L 305 14"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="15" cy="65" r="3" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
                      <circle cx="155" cy="45" r="3" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
                      <circle cx="305" cy="14" r="4" fill="#fff" stroke="#3b82f6" strokeWidth="2.5" />
                    </svg>
                    <div className={styles.miniChartLabels}>
                      <span>Sep 01 (1,840)</span>
                      <span>Mid-Sep (2.1K)</span>
                      <span className={styles.miniChartNow}>Today ({data ? data.stats.members : "2.4K"})</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.statBlock}>
                  <h4 className={styles.statBlockTitle}>Membership status</h4>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Active accounts</span>
                    <span className={styles.infoRowValue}>
                      <span className={styles.mono}>{data ? data.stats.members : "0"}</span> aspirants
                    </span>
                  </div>
                </div>
              )}

              <div className={styles.statBlock}>
                <h4 className={styles.statBlockTitle}>Engagement highlights</h4>
                <div className={styles.factChips}>
                  <span className={styles.factChip}>
                    <Users size={14} className={styles.iconBlue} aria-hidden="true" />
                    <strong className={styles.mono}>{isDemo ? "480+" : data ? data.stats.members : "0"}</strong>
                    {isDemo ? "active this week" : "enrolled"}
                  </span>
                  {isDemo && (
                    <>
                      <span className={styles.factChip}>
                        <Target size={14} className={styles.iconViolet} aria-hidden="true" />
                        <strong className={styles.mono}>85%</strong> CAT 2026 target
                      </span>
                      <span className={styles.factChip}>
                        <GraduationCap size={14} className={styles.iconTeal} aria-hidden="true" />
                        <strong className={styles.mono}>99+</strong> %ile mentors
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {renderStatPopoverFooter(
              isDemo ? "Updated every 15 minutes" : "Synchronised with the database",
              "Full community overview"
            )}
          </div>
        </div>
      )}

      {activeStatPopup === "DISCUSSIONS" && (
        <div
          className={styles.statPopoverOverlay}
          onClick={() => setActiveStatPopup(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="stat-discussions-title"
        >
          <div className={styles.statPopoverCard} onClick={(e) => e.stopPropagation()}>
            {renderStatPopoverHeader(
              "stat-discussions-title",
              "Total discussions",
              "Threads, doubts & debates",
              "var(--data-teal)",
              "Close discussions detail"
            )}

            <div className={`${styles.statPopoverBody} ${styles.statPopupContent}`}>
              <div className={styles.highlight}>
                <div className={styles.highlightRow}>
                  <span className={styles.highlightNumber}>
                    {data ? data.stats.discussions : isDemo ? "1.2K" : "0"}
                  </span>
                  <span className={`${styles.trendBadge} ${styles.trendBlue}`}>
                    {isDemo ? (
                      <>
                        <TrendingUp size={13} aria-hidden="true" /> +18 this week
                      </>
                    ) : (
                      "Live discussions"
                    )}
                  </span>
                </div>
                <p className={styles.highlightDesc}>
                  Peer discussions, strategy plans and mock analysis across categories.
                </p>
              </div>

              <div className={styles.statBlock}>
                <h4 className={styles.statBlockTitle}>Top discussion topics</h4>
                <div className={styles.barList}>
                  {(isDemo
                    ? [
                        { name: "CAT Strategy", count: 410, percent: 35 },
                        { name: "Doubt Solving", count: 345, percent: 29 },
                        { name: "Study Resources", count: 230, percent: 19 },
                        { name: "Mocks & Analysis", count: 175, percent: 14 },
                        { name: "General Discussion", count: 120, percent: 10 },
                      ]
                    : categoryActivityCounts.slice(0, 5).map((cat) => ({
                        name: cat.name,
                        count: cat.count,
                        percent: posts.length > 0 ? Math.round((cat.count / posts.length) * 100) : 0,
                      }))
                  ).map((topic) => (
                    <div
                      key={topic.name}
                      className={`${styles.barRow} ${getCategoryToneClass(topic.name as CommunityCategory)}`}
                    >
                      <span className={styles.barName} title={topic.name}>
                        {getCategoryOutlineIcon(topic.name as CommunityCategory, styles.catIcon)}
                        <span>{topic.name}</span>
                      </span>
                      <span className={styles.barTrack}>
                        <span
                          className={styles.barFill}
                          style={{ width: `${Math.min(100, Math.max(4, topic.percent * 2.8))}%` }}
                        />
                      </span>
                      <span className={styles.barCount}>{topic.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.statBlock}>
                <h4 className={styles.statBlockTitle}>Response activity</h4>
                <div className={styles.factChips}>
                  {isDemo && (
                    <span className={styles.factChip}>
                      <Zap size={14} className={styles.iconAmber} aria-hidden="true" />
                      <strong className={styles.mono}>95%</strong> answered in under 4 hours
                    </span>
                  )}
                  <span className={styles.factChip}>
                    <MessageCircle size={14} className={styles.iconTeal} aria-hidden="true" />
                    <strong className={styles.mono}>{isDemo ? "4.2" : data?.stats.solutions || "0"}</strong>
                    {isDemo ? "replies per thread" : "total community replies"}
                  </span>
                </div>
              </div>
            </div>

            {renderStatPopoverFooter(
              isDemo ? "Sorted by overall community volume" : "Aggregated from real discussions",
              "Full breakdown"
            )}
          </div>
        </div>
      )}

      {activeStatPopup === "SOLUTIONS" && (
        <div
          className={styles.statPopoverOverlay}
          onClick={() => setActiveStatPopup(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="stat-solutions-title"
        >
          <div className={styles.statPopoverCard} onClick={(e) => e.stopPropagation()}>
            {renderStatPopoverHeader(
              "stat-solutions-title",
              "Solutions provided",
              "Peer & mentor problem solving",
              "var(--data-violet)",
              "Close solutions detail"
            )}

            <div className={`${styles.statPopoverBody} ${styles.statPopupContent}`}>
              <div className={styles.highlight}>
                <div className={styles.highlightRow}>
                  <span className={styles.highlightNumber}>
                    {data ? data.stats.solutions : isDemo ? "3.1K" : "0"}
                  </span>
                  <span className={`${styles.trendBadge} ${styles.trendGreen}`}>
                    <CircleCheck size={13} aria-hidden="true" />
                    {isDemo ? "2,820 verified" : "Peer replies"}
                  </span>
                </div>
                <p className={styles.highlightDesc}>
                  Step-by-step answers shared by peers for QA, DILR and VARC questions.
                </p>
              </div>

              {isDemo ? (
                <>
                  <div className={styles.statBlock}>
                    <h4 className={styles.statBlockTitle}>Resolution speed</h4>
                    <div className={styles.speedHead}>
                      <span>
                        <strong className={styles.mono}>88%</strong> solved in under 2 hours
                      </span>
                      <span className={styles.speedTag}>Fast response</span>
                    </div>
                    <div className={styles.speedBar}>
                      <span className={styles.speed1} style={{ width: "54%" }} title="< 30 mins (54%)" />
                      <span className={styles.speed2} style={{ width: "34%" }} title="< 2 hrs (34%)" />
                      <span className={styles.speed3} style={{ width: "12%" }} title="< 6 hrs (12%)" />
                    </div>
                    <div className={styles.speedLegend}>
                      <span>
                        <span className={`${styles.dot} ${styles.speed1}`} aria-hidden="true" /> &lt; 30m{" "}
                        <strong className={styles.mono}>54%</strong>
                      </span>
                      <span>
                        <span className={`${styles.dot} ${styles.speed2}`} aria-hidden="true" /> &lt; 2h{" "}
                        <strong className={styles.mono}>34%</strong>
                      </span>
                      <span>
                        <span className={`${styles.dot} ${styles.speed3}`} aria-hidden="true" /> &lt; 6h{" "}
                        <strong className={styles.mono}>12%</strong>
                      </span>
                    </div>
                  </div>

                  <div className={styles.statBlock}>
                    <h4 className={styles.statBlockTitle}>Recently solved doubts</h4>
                    <div className={styles.solvedList}>
                      {[
                        { title: "P&C circular seating with restricted pairs", time: "18m", cat: "Doubt Solving" },
                        { title: "RC inference tone vs author attitude nuance", time: "35m", cat: "Study Resources" },
                        { title: "DILR matrix missing distribution clue", time: "52m", cat: "Mocks & Analysis" },
                      ].map((item) => (
                        <div key={item.title} className={`${styles.solvedItem} ${getCategoryToneClass(item.cat as CommunityCategory)}`}>
                          <span className={styles.solvedTitle}>
                            {getCategoryOutlineIcon(item.cat as CommunityCategory, styles.catIcon)}
                            <span>{item.title}</span>
                          </span>
                          <span className={styles.solvedTime}>
                            <Clock size={12} aria-hidden="true" /> {item.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.statBlock}>
                  <h4 className={styles.statBlockTitle}>Most answered discussions</h4>
                  {mostAnsweredPosts.length === 0 ? (
                    <p className={styles.footNote}>No answered discussions yet. Reply to a doubt to get things going.</p>
                  ) : (
                    <div className={styles.solvedList}>
                      {mostAnsweredPosts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`${styles.solvedItem} ${getCategoryToneClass(p.category)}`}
                          onClick={() => {
                            setActiveStatPopup(null);
                            setActivePostId(p.id);
                            setReplyingToCommentId(null);
                          }}
                        >
                          <span className={styles.solvedTitle}>
                            {getCategoryOutlineIcon(p.category, styles.catIcon)}
                            <span>{p.title}</span>
                          </span>
                          <span className={styles.solvedTime}>
                            <MessageCircle size={12} aria-hidden="true" /> {p.commentsCount}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {renderStatPopoverFooter(
              isDemo ? "Verified by top scorers & mentors" : "Counted from community replies",
              "View activity history"
            )}
          </div>
        </div>
      )}

      {activeStatPopup === "HELPFUL_RATE" && (
        <div
          className={styles.statPopoverOverlay}
          onClick={() => setActiveStatPopup(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="stat-helpful-title"
        >
          <div className={styles.statPopoverCard} onClick={(e) => e.stopPropagation()}>
            {renderStatPopoverHeader(
              "stat-helpful-title",
              "Helpful rate",
              "Quality benchmark",
              "var(--data-amber)",
              "Close helpful rate detail"
            )}

            <div className={`${styles.statPopoverBody} ${styles.statPopupContent}`}>
              <div className={styles.donutCard}>
                <div className={styles.donutWrap}>
                  <svg viewBox="0 0 100 100" className={styles.donutSvg} aria-label={`Helpful rate ${helpfulPercent}%`}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#eef2f8" strokeWidth="10" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="var(--data-emerald)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="251.3"
                      strokeDashoffset={251.3 * (1 - helpfulPercent / 100)}
                    />
                  </svg>
                  <div className={styles.donutCenter}>
                    <span className={styles.donutValue}>
                      {data ? data.stats.helpfulRate : isDemo ? "92%" : "100%"}
                    </span>
                    <span className={styles.donutLabel}>Helpful</span>
                  </div>
                </div>

                <div className={styles.donutInfo}>
                  <span className={`${styles.trendBadge} ${styles.trendGreen}`}>
                    {isDemo ? (
                      <>
                        <TrendingUp size={13} aria-hidden="true" /> +3.4%
                      </>
                    ) : (
                      "Live"
                    )}
                  </span>
                  <p className={styles.highlightDesc}>
                    {isDemo
                      ? "Positive feedback compared with last month's baseline."
                      : "Ratio of helpful responses and upvoted solutions across questions."}
                  </p>
                </div>
              </div>

              <div className={styles.statBlock}>
                <h4 className={styles.statBlockTitle}>What this metric means</h4>
                <p className={styles.noteBox}>
                  The <strong>helpful rate</strong> measures the percentage of CAT questions that receive answers,
                  peer upvotes, or a thank-you from the student who asked.
                </p>
              </div>

              <div className={styles.statBlock}>
                <h4 className={styles.statBlockTitle}>Satisfaction</h4>
                <div className={styles.factChips}>
                  {isDemo && (
                    <span className={styles.factChip}>
                      <Star size={14} className={styles.iconAmber} aria-hidden="true" />
                      <strong className={styles.mono}>4.8 / 5.0</strong> community rating
                    </span>
                  )}
                  <span className={styles.factChip}>
                    <ThumbsUp size={14} className={styles.iconTeal} aria-hidden="true" />
                    <strong className={styles.mono}>{data ? data.stats.helpfulRate : "100%"}</strong> positive response
                  </span>
                  {isDemo && (
                    <span className={styles.factChip}>
                      <ShieldCheck size={14} className={styles.iconBlue} aria-hidden="true" />
                      <strong className={styles.mono}>0</strong> flagged answers
                    </span>
                  )}
                </div>
              </div>
            </div>

            {renderStatPopoverFooter(
              isDemo ? "Based on 3,400+ peer ratings" : "Calculated from peer votes & responses",
              "View full report"
            )}
          </div>
        </div>
      )}

      {toastMessage && (
        <div className={styles.toast} role="status" aria-live="polite">
          <CircleCheck size={17} aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
