"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { resolveStudentName, sanitizeAvatarUrl } from "@/lib/nameUtils";
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
  desc: string;
  iconBg: string;
  iconColor: string;
}

function getCategoryPopoverIcon(category: CommunityCategory) {
  switch (category) {
    case "General Discussion":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "CAT Strategy":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "Doubt Solving":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "Study Resources":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "Mocks & Analysis":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case "College Discussions":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 21h18" />
          <path d="M3 10h18" />
          <path d="M5 6l7-3 7 3" />
          <path d="M4 10v11" />
          <path d="M20 10v11" />
          <path d="M8 14v4" />
          <path d="M12 14v4" />
          <path d="M16 14v4" />
        </svg>
      );
    case "Motivation & Journey":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "Off-topic":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      );
    default:
      return null;
  }
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

export function getCategoryOutlineIcon(category: CommunityCategory, className?: string) {
  switch (category) {
    case "General Discussion":
      return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="8" y1="9" x2="16" y2="9" />
          <line x1="8" y1="13" x2="13" y2="13" />
        </svg>
      );
    case "CAT Strategy":
      return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "Doubt Solving":
      return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "Study Resources":
      return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    case "Mocks & Analysis":
      return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case "College Discussions":
      return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      );
    case "Motivation & Journey":
      return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "Off-topic":
      return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      );
    default:
      return null;
  }
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
        `.${styles.modalBody}, .${styles.floatingAddImagePopover}, .${styles.statsDrawerBody}, .${styles.contributorDrawerBody}, .${styles.contributorDrawerPanel}, .${styles.statPopupContent}, .${styles.mobileDrawerBody}`
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
                <polyline points="9 21 9 12 15 12 15 21" />
              </svg>
              <span>Menu</span>
            </button>
            <button
              type="button"
              className={`${styles.mobileDrawerBtn} ${
                mobileDrawer === "CATEGORIES" ? styles.mobileDrawerBtnActive : ""
              }`}
              onClick={() => setMobileDrawer(mobileDrawer === "CATEGORIES" ? null : "CATEGORIES")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <span>Categories</span>
            </button>
            <button
              type="button"
              className={`${styles.mobileDrawerBtn} ${
                mobileDrawer === "STATS" ? styles.mobileDrawerBtnActive : ""
              }`}
              onClick={() => setMobileDrawer(mobileDrawer === "STATS" ? null : "STATS")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>Stats</span>
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
                  onClick={() => {
                    handleSelectHome();
                    setMobileDrawer(null);
                  }}
                >
                  <span className={styles.sidebarNavItemLeft}>
                    <span className={styles.sidebarNavIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
                        <polyline points="9 21 9 12 15 12 15 21" />
                      </svg>
                    </span>
                    <span className={styles.sidebarNavLabel}>Community Home</span>
                  </span>
                </button>

                <button
                  type="button"
                  className={`${styles.sidebarNavItem} ${
                    sidebarView === "MY_POSTS" ? styles.sidebarNavItemActive : ""
                  }`}
                  onClick={() => {
                    handleSelectMyPosts();
                    setMobileDrawer(null);
                  }}
                >
                  <span className={styles.sidebarNavItemLeft}>
                    <span className={styles.sidebarNavIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="4" />
                        <polyline points="8.5 12.5 11 15 16 9" />
                      </svg>
                    </span>
                    <span className={styles.sidebarNavLabel}>My Posts</span>
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
                  onClick={() => {
                    handleSelectSavedPosts();
                    setMobileDrawer(null);
                  }}
                >
                  <span className={styles.sidebarNavItemLeft}>
                    <span className={styles.sidebarNavIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>
                    <span className={styles.sidebarNavLabel}>Saved Posts</span>
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
                  onClick={() => {
                    handleSelectBookmarks();
                    setMobileDrawer(null);
                  }}
                >
                  <span className={styles.sidebarNavItemLeft}>
                    <span className={styles.sidebarNavIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>
                    <span className={styles.sidebarNavLabel}>Bookmarks</span>
                  </span>
                  {savedPostsCount > 0 && (
                    <span className={styles.sidebarCountBadge}>{savedPostsCount}</span>
                  )}
                </button>
              </div>

              {/* Bottom profile card on mobile */}
              <div
                className={styles.sidebarUserProfileCard}
                style={{ marginTop: "12px" }}
                onClick={() => {
                  setMobileDrawer(null);
                  handleProfileCardClick();
                }}
                title={isGuest ? "Sign in to TechnoCAT" : "View Profile"}
              >
                <div className={styles.sidebarUserAvatarWrap}>
                  {currentUserAvatarUrl ? (
                    <img
                      src={currentUserAvatarUrl}
                      alt={currentUserName}
                      className={styles.sidebarUserAvatarImg}
                      onError={(e) => {
                        e.currentTarget.src = "/profile_icon.png";
                      }}
                    />
                  ) : (
                    <span className={styles.sidebarUserInitials}>{currentUserInitials}</span>
                  )}
                </div>
                <div className={styles.sidebarUserInfoStack}>
                  <span className={styles.sidebarUserName}>{currentUserName}</span>
                  <span className={styles.sidebarUserRole}>{currentUserRole}</span>
                </div>
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
                      onClick={() => {
                        handleToggleCategory(cat.name);
                        setMobileDrawer(null);
                      }}
                    >
                      <span className={styles.sidebarCategoryLeft}>
                        <span className={styles.sidebarCategoryIcon}>
                          {getCategoryOutlineIcon(cat.name)}
                        </span>
                        <span className={styles.sidebarCategoryName}>{cat.name}</span>
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
                <div
                  className={`${styles.statBox} ${styles.statBoxBlue} ${styles.statBoxClickable}`}
                  onClick={() => {
                    setMobileDrawer(null);
                    setActiveStatPopup("MEMBERS");
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setMobileDrawer(null);
                      setActiveStatPopup("MEMBERS");
                    }
                  }}
                  title="Click to view Members details"
                >
                  <span className={styles.statNumber}>{data ? data.stats.members : "2.4K"}</span>
                  <span className={styles.statLabel}>Members</span>
                </div>

                <div
                  className={`${styles.statBox} ${styles.statBoxCyan} ${styles.statBoxClickable}`}
                  onClick={() => {
                    setMobileDrawer(null);
                    setActiveStatPopup("DISCUSSIONS");
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setMobileDrawer(null);
                      setActiveStatPopup("DISCUSSIONS");
                    }
                  }}
                  title="Click to view Discussions details"
                >
                  <span className={styles.statNumber}>{data ? data.stats.discussions : "1.2K"}</span>
                  <span className={styles.statLabel}>Discussions</span>
                </div>

                <div
                  className={`${styles.statBox} ${styles.statBoxPurple} ${styles.statBoxClickable}`}
                  onClick={() => {
                    setMobileDrawer(null);
                    setActiveStatPopup("SOLUTIONS");
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setMobileDrawer(null);
                      setActiveStatPopup("SOLUTIONS");
                    }
                  }}
                  title="Click to view Solutions details"
                >
                  <span className={styles.statNumber}>{data ? data.stats.solutions : "3.1K"}</span>
                  <span className={styles.statLabel}>Solutions</span>
                </div>

                <div
                  className={`${styles.statBox} ${styles.statBoxAmber} ${styles.statBoxClickable}`}
                  onClick={() => {
                    setMobileDrawer(null);
                    setActiveStatPopup("HELPFUL_RATE");
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setMobileDrawer(null);
                      setActiveStatPopup("HELPFUL_RATE");
                    }
                  }}
                  title="Click to view Helpful Rate details"
                >
                  <span className={styles.statNumber}>{data ? data.stats.helpfulRate : "92%"}</span>
                  <span className={styles.statLabel}>Helpful Rate</span>
                </div>
              </div>
              <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className={styles.viewAllCategoriesBtn}
                  onClick={() => {
                    setMobileDrawer(null);
                    setIsStatsDrawerOpen(true);
                  }}
                >
                  View All Stats &amp; Activity &rarr;
                </button>
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
                  <span className={styles.sidebarNavIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
                      <polyline points="9 21 9 12 15 12 15 21" />
                    </svg>
                  </span>
                  <span className={styles.sidebarNavLabel}>Community Home</span>
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
                  <span className={styles.sidebarNavIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="4" />
                      <polyline points="8.5 12.5 11 15 16 9" />
                    </svg>
                  </span>
                  <span className={styles.sidebarNavLabel}>My Posts</span>
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
                  <span className={styles.sidebarNavIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </span>
                  <span className={styles.sidebarNavLabel}>Saved Posts</span>
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
                  <span className={styles.sidebarNavIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </span>
                  <span className={styles.sidebarNavLabel}>Bookmarks</span>
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
                      <span className={styles.sidebarCategoryIcon}>
                        {getCategoryOutlineIcon(cat.name)}
                      </span>
                      <span className={styles.sidebarCategoryName}>{cat.name}</span>
                    </span>
                    {count > 0 && <span className={styles.sidebarCategoryCount}>{count}</span>}
                  </button>
                );
              })}
            </div>

            {/* Bottom User Profile */}
            <div
              className={styles.sidebarUserProfileCard}
              onClick={handleProfileCardClick}
              title={isGuest ? "Sign in to TechnoCAT" : "View Profile"}
            >
              <div className={styles.sidebarUserAvatarWrap}>
                {currentUserAvatarUrl ? (
                  <img
                    src={currentUserAvatarUrl}
                    alt={currentUserName}
                    className={styles.sidebarUserAvatarImg}
                    onError={(e) => {
                      e.currentTarget.src = "/profile_icon.png";
                    }}
                  />
                ) : (
                  <span className={styles.sidebarUserInitials}>{currentUserInitials}</span>
                )}
              </div>
              <div className={styles.sidebarUserInfoStack}>
                <span className={styles.sidebarUserName}>{currentUserName}</span>
                <span className={styles.sidebarUserRole}>{currentUserRole}</span>
              </div>
              <span className={styles.sidebarUserArrow} aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </div>
          </aside>

          {/* Center Feed Column */}
          <section className={styles.feedColumn} aria-label="Discussions">
            {/* Inline Interactive Create Post Card with Floating Popovers */}
            <div className={styles.createPostPromptCard}>
              <div className={styles.composerTopRow}>
                <div className={styles.userAvatarCircle}>
                  {currentUserAvatarUrl ? (
                    <img
                      src={currentUserAvatarUrl}
                      alt={currentUserName}
                      className={styles.userAvatarImg}
                      onError={(e) => {
                        e.currentTarget.src = "/profile_icon.png";
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#2563EB" }}>
                      {currentUserInitials}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Share your thoughts, ask a doubt, or start a discussion..."
                  className={styles.createPostTriggerInput}
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  onClick={() => handleOpenCreateModal()}
                  readOnly
                  style={{ cursor: "pointer" }}
                  aria-label="Share your thoughts, ask a doubt, or start a discussion"
                />
              </div>

              {/* If image is attached, show compact preview chip inside composer */}
              {composerImageUrl && (
                <div className={styles.composerAttachmentBadge}>
                  <div className={styles.composerAttachmentThumb}>
                    <img src={composerImageUrl} alt="Attached thumbnail" />
                  </div>
                  <span className={styles.composerAttachmentName} title={composerImageMeta?.name || "Attached image"}>
                    {composerImageMeta?.name || "Attached image"} ({composerImageMeta?.sizeFormatted || ""})
                  </span>
                  <button
                    type="button"
                    className={styles.composerAttachmentRemove}
                    onClick={handleRemoveComposerImage}
                    title="Remove attachment"
                    aria-label="Remove attachment"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}

              <div className={styles.composerBottomRow}>
                <div className={styles.composerToolsLeft}>
                  {/* Hidden inputs for feed file upload */}
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

                  {/* 1. ADD IMAGE BUTTON & FLOATING POPOVER */}
                  <div className={styles.popoverTriggerWrap} ref={addImagePopoverRef}>
                    <button
                      type="button"
                      className={`${styles.composerToolBtn} ${
                        isAddImageOpen ? styles.composerToolBtnActive : ""
                      }`}
                      onClick={() => {
                        setIsAddImageOpen((prev) => !prev);
                        setIsCategoryOpen(false);
                      }}
                      aria-expanded={isAddImageOpen}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                      <span>Add Image</span>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: isAddImageOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.18s ease",
                        }}
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {/* Floating Add Image Popover */}
                    {isAddImageOpen && (
                      <div className={styles.floatingAddImagePopover} role="dialog" aria-label="Add Image">
                        <div className={styles.popoverHeader}>
                          <span className={styles.popoverTitleBlue}>Add Image</span>
                          <button
                            type="button"
                            className={styles.popoverCloseBtn}
                            onClick={closeAddImagePopover}
                            aria-label="Close"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>

                        {isFeedCameraActive ? (
                          <div className={styles.popoverCameraWrap}>
                            <div className={styles.popoverCameraViewport}>
                              <video
                                ref={feedVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className={styles.popoverCameraVideo}
                              />
                              {feedCameraError && (
                                <div className={styles.popoverCameraErrorBox} role="alert">
                                  <span>{feedCameraError}</span>
                                  <button
                                    type="button"
                                    className={styles.popoverCameraRetryBtn}
                                    onClick={startFeedCameraStream}
                                  >
                                    Try Again
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className={styles.popoverCameraControlsRow}>
                              <button
                                type="button"
                                className={styles.popoverCameraCancelBtn}
                                onClick={handleCancelFeedCamera}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className={styles.popoverCameraCaptureBtn}
                                onClick={handleCaptureFeedPhoto}
                                disabled={Boolean(feedCameraError)}
                              >
                                Capture Photo
                              </button>
                            </div>
                          </div>
                        ) : composerImageUrl && composerImageMeta ? (
                          <div className={styles.popoverSelectedWrap}>
                            <div className={styles.popoverSelectedCard}>
                              <div className={styles.popoverSelectedThumbWrap}>
                                <img
                                  src={composerImageUrl}
                                  alt={composerImageMeta.name || "Attached preview"}
                                  className={styles.popoverSelectedThumb}
                                />
                              </div>
                              <div className={styles.popoverSelectedMeta}>
                                <span className={styles.popoverSelectedName} title={composerImageMeta.name}>
                                  {composerImageMeta.name}
                                </span>
                                <span className={styles.popoverSelectedSize}>
                                  {composerImageMeta.sizeFormatted}
                                </span>
                              </div>
                              <button
                                type="button"
                                className={styles.popoverSelectedRemoveBtn}
                                onClick={handleRemoveComposerImage}
                                title="Remove image"
                                aria-label="Remove image"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </div>

                            <div className={styles.popoverSelectedActionsRow}>
                              {composerImageMeta.name === "camera-photo.jpg" ? (
                                <>
                                  <button
                                    type="button"
                                    className={styles.popoverSelectedActionBtn}
                                    onClick={handleRetakeFeedPhoto}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                      <circle cx="12" cy="13" r="4" />
                                    </svg>
                                    <span>Retake</span>
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.popoverSelectedActionBtn}
                                    onClick={() => feedFileInputRef.current?.click()}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                                    </svg>
                                    <span>Replace Image</span>
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className={styles.popoverSelectedActionBtnFull}
                                  onClick={() => feedFileInputRef.current?.click()}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                                  </svg>
                                  <span>Choose Different Image</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div
                              className={`${styles.popoverDropzone} ${
                                isFeedDragging ? styles.popoverDropzoneActive : ""
                              }`}
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
                              <div className={styles.popoverUploadIconWrap} aria-hidden="true">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                  <circle cx="9" cy="9" r="2" />
                                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                  <path d="M12 11v5" strokeWidth="2.5" />
                                  <path d="m9.5 13.5 2.5-2.5 2.5 2.5" strokeWidth="2.5" />
                                </svg>
                              </div>

                              <div className={styles.popoverDropPrimaryText}>Drag & drop image here</div>
                              <div className={styles.popoverDropSecondaryText}>or click to browse</div>

                              <button
                                type="button"
                                className={styles.popoverBrowseBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  feedFileInputRef.current?.click();
                                }}
                              >
                                Browse Files
                              </button>

                              <div className={styles.popoverDropHelperText}>JPG, PNG, WEBP • Max 5MB</div>
                            </div>

                            {composerImageError && (
                              <div className={styles.popoverValidationMsg} role="alert">
                                <span>{composerImageError}</span>
                              </div>
                            )}

                            <div className={styles.quickOptionsTitle}>QUICK OPTIONS</div>
                            <div className={styles.quickOptionsRow}>
                              <button
                                type="button"
                                className={styles.quickOptionBtn}
                                onClick={startFeedCameraStream}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                  <circle cx="12" cy="13" r="4" />
                                </svg>
                                <span>Take Photo</span>
                              </button>
                              <button
                                type="button"
                                className={styles.quickOptionBtn}
                                onClick={() => feedFileInputRef.current?.click()}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                                </svg>
                                <span>From Device</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. CHOOSE CATEGORY BUTTON */}
                  <div className={styles.popoverTriggerWrap}>
                    <button
                      type="button"
                      className={styles.composerToolBtn}
                      onClick={() => handleOpenCreateModal(composerCategory || "General Discussion")}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      <span>{composerCategory || "Choose Category"}</span>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 3. POST BUTTON */}
                <button
                  type="button"
                  className={styles.createPostQuickBtn}
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
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
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
                  Clear Filter
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: "4px" }}>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}

            {(sidebarView === "SAVED_POSTS" || sidebarView === "BOOKMARKS") && (
              <div className={styles.activeFilterBanner}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  Viewing your Saved Discussions ({savedPostsCount})
                </span>
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
                <div className={styles.emptyStateIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <p className={styles.emptyStateTitle}>Loading community discussions...</p>
              </div>
            ) : visiblePosts.length === 0 ? (
              <div className={styles.emptyStateCard}>
                <div className={styles.emptyStateIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
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
                    else handleOpenCreateModal();
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
                  const avatarSrc = getAuthorAvatar(post.authorName) || post.authorAvatar || "/profile_icon.png";
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
                            <img
                              src={avatarSrc}
                              alt={post.authorName}
                              className={styles.userAvatarImg}
                              onError={(e) => {
                                e.currentTarget.src = "/profile_icon.png";
                              }}
                            />
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
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                </svg>
                                <span>{post.isSaved ? "Unsave" : "Save"}</span>
                              </button>
                              {!post.isOwnPost && (
                                <button
                                  type="button"
                                  className={styles.dropdownItem}
                                  onClick={(e) => handleReportPost(post.id, e)}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                    <line x1="4" y1="22" x2="4" y2="15" />
                                  </svg>
                                  <span>Report</span>
                                </button>
                              )}
                              {post.isOwnPost && (
                                <button
                                  type="button"
                                  className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                                  onClick={(e) => handleDeletePost(post.id, e)}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
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
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                  onClick={() => setIsStatsDrawerOpen(true)}
                >
                  View All
                </button>
              </div>
              <div className={styles.statsGrid}>
                <div
                  className={`${styles.statBox} ${styles.statBoxBlue} ${styles.statBoxClickable}`}
                  onClick={() => setActiveStatPopup("MEMBERS")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveStatPopup("MEMBERS");
                    }
                  }}
                  title="Click to view Members details"
                >
                  <div className={styles.statIconCircle} style={{ background: "#EFF6FF", color: "#2563EB" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div>
                    <span className={styles.statNumber}>{data ? data.stats.members : "2.4K"}</span>
                    <span className={styles.statLabel}>Members</span>
                  </div>
                </div>

                <div
                  className={`${styles.statBox} ${styles.statBoxCyan} ${styles.statBoxClickable}`}
                  onClick={() => setActiveStatPopup("DISCUSSIONS")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveStatPopup("DISCUSSIONS");
                    }
                  }}
                  title="Click to view Discussions details"
                >
                  <div className={styles.statIconCircle} style={{ background: "#E0F2FE", color: "#0284C7" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className={styles.statNumber}>{data ? data.stats.discussions : "1.2K"}</span>
                    <span className={styles.statLabel}>Discussions</span>
                  </div>
                </div>

                <div
                  className={`${styles.statBox} ${styles.statBoxPurple} ${styles.statBoxClickable}`}
                  onClick={() => setActiveStatPopup("SOLUTIONS")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveStatPopup("SOLUTIONS");
                    }
                  }}
                  title="Click to view Solutions details"
                >
                  <div className={styles.statIconCircle} style={{ background: "#F5F3FF", color: "#7C3AED" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <span className={styles.statNumber}>{data ? data.stats.solutions : "3.1K"}</span>
                    <span className={styles.statLabel}>Solutions</span>
                  </div>
                </div>

                <div
                  className={`${styles.statBox} ${styles.statBoxAmber} ${styles.statBoxClickable}`}
                  onClick={() => setActiveStatPopup("HELPFUL_RATE")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveStatPopup("HELPFUL_RATE");
                    }
                  }}
                  title="Click to view Helpful Rate details"
                >
                  <div className={styles.statIconCircle} style={{ background: "#FFFBEB", color: "#D97706" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
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
                  onClick={() => setIsContributorsDrawerOpen(true)}
                  aria-label="View all top contributors"
                >
                  View All &rarr;
                </button>
              </div>

              <div className={styles.contributorsList}>
                {topContributorsList.length === 0 ? (
                  <div style={{ padding: "24px 14px", textAlign: "center", color: "#64748B", fontSize: "13px" }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px auto" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                    <p style={{ margin: "0 0 4px 0", fontWeight: 600, color: "#1E293B" }}>No Contributors Yet</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748B", lineHeight: 1.4 }}>
                      Start a discussion or share a solution to lead the leaderboard!
                    </p>
                  </div>
                ) : (
                  topContributorsList.map((contributor) => {
                    const avatarSrc = getAuthorAvatar(contributor.authorName) || contributor.authorAvatar || "/profile_icon.png";
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
                            <img
                              src={avatarSrc}
                              alt={contributor.authorName}
                              className={styles.userAvatarImg}
                              onError={(e) => {
                                e.currentTarget.src = "/profile_icon.png";
                              }}
                            />
                          </div>

                          <div className={styles.contributorInfoStack}>
                            <span className={styles.contributorName}>{contributor.authorName}</span>
                            <span className={styles.contributorPostSub}>{contributor.postCount} posts</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
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
          onClick={closeCreateModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-post-modal-title"
        >
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="create-post-modal-title" className={styles.modalTitle}>
                  Start a New Discussion
                </h2>
                <p className={styles.modalSubtitle}>
                  Share your thoughts, ask a doubt, or start a meaningful discussion with the community.
                </p>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={closeCreateModal}
                aria-label="Close modal"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreatePostSubmit} className={styles.modalForm}>
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
                    <span className={styles.formLabelHint}>(max 50 characters)</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      id="post-title-input"
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g., How to approach DILR sets effectively?"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      maxLength={50}
                      required
                    />
                    <div className={styles.inputCounter}>
                      {newTitle.length}/50
                    </div>
                  </div>
                </div>

                <div className={styles.formField} ref={modalCategoryRef}>
                  <label className={styles.formLabel} id="modal-category-label">
                    Category
                  </label>
                  <button
                    id="modal-category-trigger"
                    type="button"
                    className={`${styles.modalCategoryTrigger} ${
                      isModalCategoryOpen ? styles.modalCategoryTriggerActive : ""
                    }`}
                    onClick={() => setIsModalCategoryOpen((prev) => !prev)}
                    aria-expanded={isModalCategoryOpen}
                    aria-haspopup="listbox"
                    aria-labelledby="modal-category-label modal-category-trigger"
                  >
                    <div className={styles.modalCategoryTriggerLeft}>
                      <span
                        className={styles.modalCategoryTriggerIcon}
                        style={{
                          color:
                            MODAL_CATEGORIES_CONFIG.find((c) => c.name === newCategory)
                              ?.iconColor || "#2563EB",
                        }}
                        aria-hidden="true"
                      >
                        {getCategoryOutlineIcon(newCategory, styles.modalCategoryTriggerSvg)}
                      </span>
                      <span className={styles.modalCategoryTriggerText}>{newCategory}</span>
                    </div>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={styles.modalCategoryTriggerChevron}
                      style={{
                        transform: isModalCategoryOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.18s ease",
                      }}
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Expanded Category Selection Panel */}
                  {isModalCategoryOpen && (
                    <div
                      className={styles.modalCategoryPanel}
                      role="listbox"
                      aria-label="Category Options"
                    >
                      <div className={styles.modalCategoryList}>
                        {MODAL_CATEGORIES_CONFIG.map((cat) => {
                          const isSelected = newCategory === cat.name;
                          return (
                            <div
                              key={cat.name}
                              ref={isSelected ? selectedCategoryRowRef : undefined}
                              className={`${styles.modalCategoryRow} ${
                                isSelected ? styles.modalCategoryRowSelected : ""
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
                              <div className={styles.modalCategoryRowLeft}>
                                <div
                                  className={styles.modalCategoryIconBox}
                                  style={{
                                    color: cat.iconColor,
                                  }}
                                  aria-hidden="true"
                                >
                                  {getCategoryOutlineIcon(cat.name, styles.modalCategoryRowSvg)}
                                </div>
                                <div className={styles.modalCategoryRowMeta}>
                                  <span className={styles.modalCategoryRowName}>{cat.name}</span>
                                  <span className={styles.modalCategoryRowDesc}>{cat.desc}</span>
                                </div>
                              </div>

                              <div className={styles.modalCategoryRadioWrap} aria-hidden="true">
                                {isSelected ? (
                                  <div className={styles.modalCategoryRadioActive}>
                                    <div className={styles.modalCategoryRadioDot} />
                                  </div>
                                ) : (
                                  <div className={styles.modalCategoryRadioInactive} />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="post-content-textarea">
                    Content
                    <span className={styles.formLabelHint}>(min 15 characters)</span>
                  </label>
                  <div className={styles.textareaWrapper}>
                    <textarea
                      ref={contentTextareaRef}
                      id="post-content-textarea"
                      className={styles.formTextarea}
                      placeholder="Share your thoughts, ask a doubt, or start a discussion..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      maxLength={2000}
                      required
                    />
                    <div className={styles.textareaCounter}>
                      {newContent.length}/2000
                    </div>
                  </div>
                </div>

                {/* Image Attachment Section */}
                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    Image Attachment (Optional)
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageFileChange}
                    style={{ display: "none" }}
                  />

                  {/* Horizontal Dropzone */}
                  <div
                    className={`${styles.modalImageDropzone} ${
                      isDraggingImage ? styles.modalImageDropzoneActive : ""
                    }`}
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
                    <div className={styles.modalDropzoneLeft}>
                      <div className={styles.modalUploadIconWrap} aria-hidden="true">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                          <path d="M12 12v9" />
                          <path d="m16 16-4-4-4 4" />
                        </svg>
                      </div>
                      <div className={styles.modalDropzoneTextCol}>
                        <div className={styles.modalUploadPrimaryText}>Drag & drop an image here</div>
                        <div className={styles.modalUploadSecondaryText}>
                          or <span className={styles.modalUploadLinkText}>click to browse</span> from your device
                        </div>
                        <div className={styles.modalUploadHelperText}>Supports: JPG, PNG, WEBP (Max 5MB)</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.modalBrowseFilesBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                      </svg>
                      <span>Browse Files</span>
                    </button>
                  </div>

                  {/* Attached Image Preview Card (if uploaded) */}
                  {newImageUrl && (
                    <div className={styles.modalPreviewRow}>
                      <div className={styles.modalPreviewLeft}>
                        <div className={styles.modalPreviewThumbWrap}>
                          <img
                            src={newImageUrl}
                            alt={newImageMeta?.name || "Attached file"}
                            className={styles.modalPreviewThumbImg}
                          />
                        </div>
                        <div className={styles.modalPreviewMeta}>
                          <span
                            className={styles.modalPreviewFileName}
                            title={newImageMeta?.name || "cat_notes_diagram.png"}
                          >
                            {newImageMeta?.name || "cat_notes_diagram.png"}
                          </span>
                          <span className={styles.modalPreviewFileSize}>
                            {newImageMeta?.sizeFormatted || "2.3 MB"}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={styles.modalPreviewRemoveBtn}
                        onClick={handleRemoveImage}
                        title="Remove image"
                        aria-label="Remove image"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {imageValidationError && (
                    <div className={styles.imageValidationMsg} role="alert">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{imageValidationError}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={closeCreateModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={isSubmittingPost}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span>{isSubmittingPost ? "Posting..." : "Post"}</span>
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
                  <img
                    src={getAuthorAvatar(activePost.authorName) || activePost.authorAvatar || "/profile_icon.png"}
                    alt={activePost.authorName}
                    className={styles.userAvatarImg}
                    onError={(e) => {
                      e.currentTarget.src = "/profile_icon.png";
                    }}
                  />
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
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

                {activePost.isOwnPost ? (
                  <button
                    type="button"
                    className={`${styles.actionMetricBtn} ${styles.dropdownItemDanger}`}
                    onClick={() => handleDeletePost(activePost.id)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Delete Post</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.actionMetricBtn}
                    onClick={(e) => handleReportPost(activePost.id, e)}
                    title="Report discussion"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" y1="22" x2="4" y2="15" />
                    </svg>
                    <span>Report</span>
                  </button>
                )}
              </div>

              {/* Reply / Comment Box */}
              <form className={styles.commentComposerBox} onSubmit={handleAddComment}>
                <textarea
                  ref={commentTextareaRef}
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
                    const commentAvatar = getAuthorAvatar(comment.authorName) || comment.authorAvatar || "/profile_icon.png";
                    return (
                      <div key={comment.id} className={styles.commentCard}>
                        <div className={styles.postAuthorMeta}>
                          <div
                            className={styles.userAvatarCircle}
                            style={{ width: "32px", height: "32px", fontSize: "12px" }}
                          >
                            <img
                              src={commentAvatar}
                              alt={comment.authorName}
                              className={styles.userAvatarImg}
                              onError={(e) => {
                                e.currentTarget.src = "/profile_icon.png";
                              }}
                            />
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
                              const repAvatar = getAuthorAvatar(rep.authorName) || rep.authorAvatar || "/profile_icon.png";
                              return (
                                <div key={rep.id} className={styles.nestedReplyCard}>
                                  <div className={styles.postAuthorMeta} style={{ marginBottom: "4px" }}>
                                    <div
                                      className={styles.userAvatarCircle}
                                      style={{ width: "26px", height: "26px", fontSize: "10px" }}
                                    >
                                      <img
                                        src={repAvatar}
                                        alt={rep.authorName}
                                        className={styles.userAvatarImg}
                                        onError={(e) => {
                                          e.currentTarget.src = "/profile_icon.png";
                                        }}
                                      />
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

      {/* Top Contributors Right-Side Drawer */}
      {isContributorsDrawerOpen && (
        <div
          className={styles.contributorDrawerOverlay}
          onClick={() => setIsContributorsDrawerOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="top-contributors-drawer-title"
        >
          <div
            className={styles.contributorDrawerPanel}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className={styles.contributorDrawerHeader}>
              <div className={styles.contributorDrawerHeaderCol}>
                <div className={styles.contributorDrawerHeaderTitleRow}>
                  <span className={styles.contributorDrawerHeaderEmoji} aria-hidden="true" style={{ display: "inline-flex", alignItems: "center" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                      <path d="M4 22h16" />
                      <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34c3.24-.76 5-3.33 5-6.66V3H4v8c0 3.33 1.76 5.9 5 6.66z" />
                    </svg>
                  </span>
                  <h2 id="top-contributors-drawer-title" className={styles.contributorDrawerHeaderTitle}>
                    Top Contributors
                  </h2>
                </div>
                <p className={styles.contributorDrawerHeaderSubtitle}>
                  {contributorTab === "This Month"
                    ? "Community leaders this month"
                    : contributorTab === "This Week"
                    ? "Community leaders this week"
                    : "Community leaders of all time"}
                </p>
              </div>

              <button
                type="button"
                className={styles.contributorDrawerCloseBtn}
                onClick={() => setIsContributorsDrawerOpen(false)}
                aria-label="Close top contributors drawer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className={styles.contributorDrawerFilterWrap}>
              <div className={styles.contributorTabsWrap}>
                {(["This Month", "This Week", "All Time"] as const).map((tab) => {
                  const isSelected = contributorTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      className={`${styles.contributorPillTab} ${
                        isSelected ? styles.contributorPillTabActive : ""
                      }`}
                      onClick={() => setContributorTab(tab)}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Body - Scrollable */}
            <div className={styles.contributorDrawerBody}>
              {/* Contributor Cards List */}
              <div className={styles.contributorCardsList}>
                {topContributorsList.length === 0 ? (
                  <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748B" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px auto" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                    <p style={{ margin: "0 0 6px 0", fontWeight: 700, color: "#1E293B", fontSize: "16px" }}>Leaderboard Reset</p>
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748B", maxWidth: "280px", marginInline: "auto" }}>
                      Active contributions will appear here dynamically as students ask and answer CAT questions.
                    </p>
                  </div>
                ) : (
                  topContributorsList.map((contributor) => {
                    const avatarSrc =
                      getAuthorAvatar(contributor.authorName) || contributor.authorAvatar || "/profile_icon.png";
                    const rankClass =
                      contributor.rank === 1
                        ? styles.contributorCardGold
                        : contributor.rank === 2
                        ? styles.contributorCardSilver
                        : contributor.rank === 3
                        ? styles.contributorCardBronze
                        : styles.contributorCardDefault;

                    return (
                      <div
                        key={contributor.authorId}
                        className={`${styles.contributorDrawerCard} ${rankClass}`}
                      >
                        {/* Rank indicator */}
                        <div className={styles.contributorDrawerRankWrap}>
                          {contributor.rank === 1 ? (
                            <img
                              src="/community/medal-gold.png"
                              alt="1st Place"
                              className={styles.contributorDrawerMedal}
                            />
                          ) : contributor.rank === 2 ? (
                            <img
                              src="/community/medal-silver.png"
                              alt="2nd Place"
                              className={styles.contributorDrawerMedal}
                            />
                          ) : contributor.rank === 3 ? (
                            <img
                              src="/community/medal-bronze.png"
                              alt="3rd Place"
                              className={styles.contributorDrawerMedal}
                            />
                          ) : (
                            <span className={styles.contributorDrawerRankCircle}>
                              {contributor.rank}
                            </span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div className={styles.contributorDrawerAvatarWrap}>
                          <img
                            src={avatarSrc}
                            alt={contributor.authorName}
                            className={styles.contributorDrawerAvatarImg}
                            onError={(e) => {
                              e.currentTarget.src = "/profile_icon.png";
                            }}
                          />
                        </div>

                        {/* Info Stack */}
                        <div className={styles.contributorDrawerContent}>
                          <div className={styles.contributorDrawerTopRow}>
                            <span className={styles.contributorDrawerUsername}>
                              {contributor.authorName}
                            </span>
                            {contributor.rank === 1 && (
                              <span
                                className={styles.contributorDrawerTrophyIcon}
                                aria-label="Top Contributor Trophy"
                                title="Community Leader 1st Place"
                                style={{ display: "inline-flex", alignItems: "center" }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                  <path d="M4 22h16" />
                                  <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34c3.24-.76 5-3.33 5-6.66V3H4v8c0 3.33 1.76 5.9 5 6.66z" />
                                </svg>
                              </span>
                            )}
                          </div>

                          <div className={styles.contributorDrawerStatsRow}>
                            <span>{contributor.postCount} posts</span>
                          </div>

                          <div className={styles.contributorDrawerBadgesRow}>
                            <span className={styles.contributorDrawerActiveBadge}>
                              <span className={styles.contributorActiveDot} /> Active
                            </span>
                            {contributor.rank <= 3 && (
                              <span
                                className={`${styles.contributorDrawerTopBadge} ${
                                  contributor.rank === 1
                                    ? styles.topBadgeGold
                                    : contributor.rank === 2
                                    ? styles.topBadgeSilver
                                    : styles.topBadgeBronze
                                }`}
                              >
                                Top Contributor
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Community Contribution Card */}
              <div className={styles.communityContributionCard}>
                <div className={styles.communityContributionHeader}>
                  <h4 className={styles.communityContributionTitle}>
                    Community Contribution
                  </h4>
                  <p className={styles.communityContributionSubtitle}>
                    {contributorTab === "This Month"
                      ? "Total impact this month"
                      : contributorTab === "This Week"
                      ? "Total impact this week"
                      : "Total impact of all time"}
                  </p>
                </div>
                <div className={styles.contributionMetricsGrid}>
                  <div className={styles.contributionMetricBox}>
                    <span className={styles.contributionMetricValue}>
                      {data ? data.stats.discussions : "1.2K"}
                    </span>
                    <span className={styles.contributionMetricLabel}>
                      Discussions Started
                    </span>
                  </div>
                  <div className={styles.contributionMetricBox}>
                    <span className={styles.contributionMetricValue}>
                      {data ? data.stats.helpfulRate : "92%"}
                    </span>
                    <span className={styles.contributionMetricLabel}>
                      Helpful Answers
                    </span>
                  </div>
                  <div className={styles.contributionMetricBox}>
                    <span className={styles.contributionMetricValue}>
                      {data ? data.stats.solutions : "3.1K"}
                    </span>
                    <span className={styles.contributionMetricLabel}>
                      Solutions Shared
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Community Stats Right-Side Drawer */}
      {isStatsDrawerOpen && (
        <div
          className={styles.statsDrawerOverlay}
          onClick={() => setIsStatsDrawerOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="community-stats-drawer-title"
        >
          <div
            className={styles.statsDrawerPanel}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className={styles.drawerHeader}>
              <div className={styles.drawerTitleCol}>
                <h2 id="community-stats-drawer-title" className={styles.drawerTitle}>
                  COMMUNITY <span className={styles.drawerTitleHighlight}>STATS</span>
                </h2>
                <p className={styles.drawerSubtitle}>
                  A quick overview of our community activity and impact.
                </p>
              </div>

              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={() => setIsStatsDrawerOpen(false)}
                aria-label="Close community stats drawer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Drawer Body */}
            <div className={styles.drawerBody}>
              {/* 3. Stat Summary Cards 2x2 */}
              <div className={styles.drawerStatsGrid}>
                {/* Card 1: Members */}
                <div className={`${styles.drawerStatCard} ${styles.drawerStatCardLavender}`}>
                  <div className={styles.drawerStatIconWrap}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <span className={styles.drawerStatNumber}>{data ? data.stats.members : "2.4K"}</span>
                  <span className={styles.drawerStatLabel}>Members</span>
                  <span className={styles.drawerStatDesc}>Active CAT aspirants in our community</span>
                </div>

                {/* Card 2: Discussions */}
                <div className={`${styles.drawerStatCard} ${styles.drawerStatCardPink}`}>
                  <div className={styles.drawerStatIconWrap}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DB2777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <span className={styles.drawerStatNumber}>{data ? data.stats.discussions : "1.2K"}</span>
                  <span className={styles.drawerStatLabel}>Discussions</span>
                  <span className={styles.drawerStatDesc}>Questions &amp; discussions started</span>
                </div>

                {/* Card 3: Solutions */}
                <div className={`${styles.drawerStatCard} ${styles.drawerStatCardMint}`}>
                  <div className={styles.drawerStatIconWrap}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className={styles.drawerStatNumber}>{data ? data.stats.solutions : "3.1K"}</span>
                  <span className={styles.drawerStatLabel}>Solutions</span>
                  <span className={styles.drawerStatDesc}>Doubts solved by the community</span>
                </div>

                {/* Card 4: Helpful Rate */}
                <div className={`${styles.drawerStatCard} ${styles.drawerStatCardYellow}`}>
                  <div className={styles.drawerStatIconWrap}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </div>
                  <span className={styles.drawerStatNumber}>{data ? data.stats.helpfulRate : "92%"}</span>
                  <span className={styles.drawerStatLabel}>Helpful Rate</span>
                  <span className={styles.drawerStatDesc}>Questions getting helpful responses</span>
                </div>
              </div>

              {/* 4. Community Activity Chart Card */}
              <div className={styles.drawerSectionCard}>
                <div className={styles.drawerSectionHeaderRow}>
                  <div>
                    <h3 className={styles.drawerSectionTitle}>Community Activity</h3>
                    <p className={styles.drawerSectionSubtitle}>Community engagement over time.</p>
                  </div>

                  <select
                    className={styles.periodSelect}
                    value={activityPeriod}
                    onChange={(e) => setActivityPeriod(e.target.value as "7D" | "30D" | "90D")}
                    aria-label="Select activity timeframe"
                  >
                    <option value="7D">Last 7 Days</option>
                    <option value="30D">Last 30 Days</option>
                    <option value="90D">Last 90 Days</option>
                  </select>
                </div>

                <div className={styles.chartContainer}>
                  {hoveredPoint && (
                    <div className={styles.chartTooltipFloating}>
                      <span>{hoveredPoint.date}:</span>
                      <strong>{hoveredPoint.value} activities</strong>
                    </div>
                  )}

                  <svg viewBox="0 0 500 150" className={styles.chartSvg}>
                    <defs>
                      <linearGradient id="communityActivityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>

                    {/* Dotted horizontal grid lines */}
                    <line x1="20" y1="28" x2="480" y2="28" stroke="#F1F5F9" strokeWidth="1.2" strokeDasharray="3 3" />
                    <line x1="20" y1="70" x2="480" y2="70" stroke="#F1F5F9" strokeWidth="1.2" strokeDasharray="3 3" />
                    <line x1="20" y1="112" x2="480" y2="112" stroke="#F1F5F9" strokeWidth="1.2" strokeDasharray="3 3" />

                    {/* Filled Area */}
                    <path d={chartPaths.areaD} fill="url(#communityActivityGrad)" />

                    {/* Trend Line */}
                    <path
                      d={chartPaths.lineD}
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data Points */}
                    {chartPaths.points.map((pt, idx) => (
                      <g
                        key={idx}
                        onMouseEnter={() =>
                          setHoveredPoint({
                            date: pt.item.fullDate,
                            value: pt.item.value,
                            x: pt.x,
                            y: pt.y,
                          })
                        }
                        onMouseLeave={() => setHoveredPoint(null)}
                        style={{ cursor: "pointer" }}
                      >
                        <circle cx={pt.x} cy={pt.y} r="8" fill="transparent" />
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={hoveredPoint?.date === pt.item.fullDate ? "5.5" : "3.5"}
                          fill="#FFFFFF"
                          stroke="#2563EB"
                          strokeWidth="2.5"
                        />
                      </g>
                    ))}
                  </svg>

                  <div className={styles.chartXAxisLabels}>
                    {activityData.map((item, idx) => (
                      <span key={idx}>{item.label}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. Most Active Categories Card */}
              <div className={styles.drawerSectionCard}>
                <div className={styles.drawerSectionHeaderRow}>
                  <div>
                    <h3 className={styles.drawerSectionTitle}>Most Active Categories</h3>
                    <p className={styles.drawerSectionSubtitle}>
                      Breakdown of discussions by preparation topic.
                    </p>
                  </div>

                  <button
                    type="button"
                    className={styles.viewAllCategoriesBtn}
                    onClick={() => setShowAllCategoriesInDrawer((prev) => !prev)}
                  >
                    {showAllCategoriesInDrawer ? "Show Less ↑" : "View All"}
                  </button>
                </div>

                <div className={styles.categoryProgressList}>
                  {(showAllCategoriesInDrawer
                    ? categoryActivityCounts
                    : categoryActivityCounts.slice(0, 5)
                  ).map((cat) => {
                    const maxCount = categoryActivityCounts[0]?.count || 300;
                    const percent = Math.min(100, Math.max(12, Math.round((cat.count / maxCount) * 100)));
                    return (
                      <div key={cat.name} className={styles.categoryProgressRow}>
                        <span className={styles.categoryRowName} title={cat.name}>
                          <span style={{ display: "inline-flex", alignItems: "center" }}>
                            {getCategoryOutlineIcon(cat.name as CommunityCategory)}
                          </span>
                          <span>{cat.name}</span>
                        </span>

                        <div className={styles.categoryProgressBarBg}>
                          <div
                            className={styles.categoryProgressBarFill}
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <span className={styles.categoryRowCount}>{cat.count} posts</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Interactive Community Stats Detail Popovers */}
      {activeStatPopup === "MEMBERS" && (
        <div
          className={styles.statPopoverOverlay}
          onClick={() => setActiveStatPopup(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="stat-members-title"
        >
          <div
            className={styles.statPopoverCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.statPopoverHeader}>
              <div className={styles.statPopoverHeaderLeft}>
                <div className={styles.statPopoverIcon} style={{ background: "#EFF6FF", color: "#2563EB" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <h3 id="stat-members-title" className={styles.statPopoverTitle}>Community Members</h3>
                  <p className={styles.statPopoverSub}>TechnoCAT Aspirant Network</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.statPopoverCloseBtn}
                onClick={() => setActiveStatPopup(null)}
                aria-label="Close members detail"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className={styles.statPopoverBody}>
              <div className={styles.statHighlightBox}>
                <div className={styles.statHighlightNumberRow}>
                  <span className={styles.statHighlightNumber}>{data ? data.stats.members : (isDemo ? "2.4K" : "0")}</span>
                  <span className={`${styles.statGrowthBadge} ${styles.statGrowthBadgeGreen}`}>
                    {isDemo ? "▲ +14.2% this month" : "Live Registered"}
                  </span>
                </div>
                <p className={styles.statHighlightDesc}>
                  {isDemo
                    ? "Community members across TechnoCAT actively preparing for CAT & OMETs."
                    : "Verified student accounts currently registered in the TechnoCAT community."}
                </p>
              </div>

              {isDemo ? (
                <div className={styles.statSectionBlock}>
                  <h4 className={styles.statSectionHeading}>30-Day Growth Trend</h4>
                  <div className={styles.miniTrendChartWrap}>
                    <svg viewBox="0 0 320 80" className={styles.miniTrendChartSvg} aria-label="30-day membership growth chart">
                      <defs>
                        <linearGradient id="membersTrendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <line x1="10" y1="20" x2="310" y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="10" y1="50" x2="310" y2="50" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                      <path
                        d="M 15 65 L 55 58 L 105 52 L 155 45 L 205 38 L 255 24 L 305 14 L 305 75 L 15 75 Z"
                        fill="url(#membersTrendGrad)"
                      />
                      <path
                        d="M 15 65 L 55 58 L 105 52 L 155 45 L 205 38 L 255 24 L 305 14"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="15" cy="65" r="3" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
                      <circle cx="155" cy="45" r="3" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
                      <circle cx="305" cy="14" r="4" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
                    </svg>
                    <div className={styles.miniTrendLabels}>
                      <span>Sep 01 (1,840)</span>
                      <span>Mid-Sep (2.1K)</span>
                      <span style={{ color: "#2563EB", fontWeight: 700 }}>Today ({data ? data.stats.members : "2.4K"})</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.statSectionBlock}>
                  <h4 className={styles.statSectionHeading}>Membership Status</h4>
                  <div style={{ padding: "14px 16px", background: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>Active Accounts</span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#2563EB" }}>{data ? data.stats.members : "0"} Aspirants</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748B", lineHeight: 1.4 }}>
                      Verified in real-time from the database profile directory.
                    </p>
                  </div>
                </div>
              )}

              <div className={styles.statSectionBlock}>
                <h4 className={styles.statSectionHeading}>Engagement Highlights</h4>
                <div className={styles.statChipsRow}>
                  <div className={styles.statChip}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z" />
                    </svg>
                    <span><strong>{isDemo ? "480+" : (data ? data.stats.members : "1")}</strong> {isDemo ? "active this week" : "enrolled"}</span>
                  </div>
                  <div className={styles.statChip}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                    <span><strong>{isDemo ? "85%" : "100%"}</strong> CAT 2026 Target</span>
                  </div>
                  <div className={styles.statChip}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                    <span><strong>99+</strong> %ile mentors</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.statPopoverFooter}>
              <span style={{ fontSize: "12px", color: "#64748B" }}>{isDemo ? "Updated live every 15 minutes" : "Synchronized live with database"}</span>
              <button
                type="button"
                className={styles.statPopoverFooterBtn}
                onClick={() => {
                  setActiveStatPopup(null);
                  setIsStatsDrawerOpen(true);
                }}
              >
                Full Community Overview &rarr;
              </button>
            </div>
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
          <div
            className={styles.statPopoverCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.statPopoverHeader}>
              <div className={styles.statPopoverHeaderLeft}>
                <div className={styles.statPopoverIcon} style={{ background: "#E0F2FE", color: "#0284C7" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 id="stat-discussions-title" className={styles.statPopoverTitle}>Total Discussions</h3>
                  <p className={styles.statPopoverSub}>Threads, Doubts &amp; Debates</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.statPopoverCloseBtn}
                onClick={() => setActiveStatPopup(null)}
                aria-label="Close discussions detail"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className={styles.statPopoverBody}>
              <div className={styles.statHighlightBox}>
                <div className={styles.statHighlightNumberRow}>
                  <span className={styles.statHighlightNumber}>{data ? data.stats.discussions : (isDemo ? "1.2K" : "0")}</span>
                  <span className={`${styles.statGrowthBadge} ${styles.statGrowthBadgeBlue}`}>
                    {isDemo ? "▲ +18 this week" : "Live Discussions"}
                  </span>
                </div>
                <p className={styles.statHighlightDesc}>
                  Peer discussions, strategy blueprints, and mock test analysis across categories.
                </p>
              </div>

              <div className={styles.statSectionBlock}>
                <h4 className={styles.statSectionHeading}>Top Discussion Topics</h4>
                <div className={styles.topicDistList}>
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
                    <div key={topic.name} className={styles.topicDistRow}>
                      <span className={styles.topicDistName} title={topic.name} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        {topic.name === "CAT Strategy" ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="6" />
                            <circle cx="12" cy="12" r="2" />
                          </svg>
                        ) : topic.name === "Doubt Solving" ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        ) : topic.name === "Study Resources" ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                          </svg>
                        ) : topic.name === "Mocks & Analysis" ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="18" y1="20" x2="18" y2="10" />
                            <line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        )}
                        <span>{topic.name}</span>
                      </span>
                      <div className={styles.topicDistBarBg}>
                        <div
                          className={styles.topicDistBarFill}
                          style={{ width: `${Math.max(4, topic.percent * 2.8)}%` }}
                        />
                      </div>
                      <span className={styles.topicDistCount}>{topic.count} posts</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.statSectionBlock}>
                <h4 className={styles.statSectionHeading}>Response Velocity</h4>
                <div className={styles.statChipsRow}>
                  <div className={styles.statChip}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span><strong>{isDemo ? "95%" : "Active"}</strong> {isDemo ? "answered in < 4 hours" : "Question Response Rate"}</span>
                  </div>
                  <div className={styles.statChip}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span><strong>{isDemo ? "4.2" : (data?.stats.solutions || "0")}</strong> {isDemo ? "replies per thread" : "Total Community Replies"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.statPopoverFooter}>
              <span style={{ fontSize: "12px", color: "#64748B" }}>{isDemo ? "Sorted by overall community volume" : "Aggregated from real discussions"}</span>
              <button
                type="button"
                className={styles.statPopoverFooterBtn}
                onClick={() => {
                  setActiveStatPopup(null);
                  setIsStatsDrawerOpen(true);
                }}
              >
                Full Breakdown &rarr;
              </button>
            </div>
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
          <div
            className={styles.statPopoverCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.statPopoverHeader}>
              <div className={styles.statPopoverHeaderLeft}>
                <div className={styles.statPopoverIcon} style={{ background: "#F5F3FF", color: "#7C3AED" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h3 id="stat-solutions-title" className={styles.statPopoverTitle}>Solutions Provided</h3>
                  <p className={styles.statPopoverSub}>Peer &amp; Mentor Problem Solving</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.statPopoverCloseBtn}
                onClick={() => setActiveStatPopup(null)}
                aria-label="Close solutions detail"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className={styles.statPopoverBody}>
              <div className={styles.statHighlightBox}>
                <div className={styles.statHighlightNumberRow}>
                  <span className={styles.statHighlightNumber}>{data ? data.stats.solutions : (isDemo ? "3.1K" : "0")}</span>
                  <span className={`${styles.statGrowthBadge} ${styles.statGrowthBadgeGreen}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{isDemo ? "2,820 Verified" : "Peer Verified"}</span>
                  </span>
                </div>
                <p className={styles.statHighlightDesc}>
                  Accepted and peer-validated step-by-step solutions for QA, DILR, and VARC questions.
                </p>
              </div>

              <div className={styles.statSectionBlock}>
                <h4 className={styles.statSectionHeading}>Resolution Speed</h4>
                <div className={styles.speedBarWrap}>
                  <div className={styles.speedBarTitleRow}>
                    <span>88% solved in under 2 hours</span>
                    <span style={{ color: "#10B981" }}>Fast Response</span>
                  </div>
                  <div className={styles.speedBarFillRow}>
                    <div className={styles.speedSegment1} title="< 30 mins (54%)" />
                    <div className={styles.speedSegment2} title="< 2 hrs (34%)" />
                    <div className={styles.speedSegment3} title="< 6 hrs (12%)" />
                  </div>
                  <div className={styles.speedLegendRow}>
                    <span>• &lt; 30m: <strong>54%</strong></span>
                    <span>• &lt; 2h: <strong>34%</strong></span>
                    <span>• &lt; 6h: <strong>12%</strong></span>
                  </div>
                </div>
              </div>

              <div className={styles.statSectionBlock}>
                <h4 className={styles.statSectionHeading}>Recent Solved Doubts</h4>
                <div className={styles.recentSolvedList}>
                  <div className={styles.recentSolvedItem}>
                    <span className={styles.recentSolvedTitle} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                      <span>P&amp;C circular seating with restricted pairs</span>
                    </span>
                    <span className={styles.recentSolvedTime}>Solved in 18m</span>
                  </div>
                  <div className={styles.recentSolvedItem}>
                    <span className={styles.recentSolvedTitle} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                      <span>RC inference tone vs author attitude nuance</span>
                    </span>
                    <span className={styles.recentSolvedTime}>Solved in 35m</span>
                  </div>
                  <div className={styles.recentSolvedItem}>
                    <span className={styles.recentSolvedTitle} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                      <span>DILR matrix missing distribution clue</span>
                    </span>
                    <span className={styles.recentSolvedTime}>Solved in 52m</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.statPopoverFooter}>
              <span style={{ fontSize: "12px", color: "#64748B" }}>{isDemo ? "Verified by top scorers & mentors" : "Peer validated step-by-step solutions"}</span>
              <button
                type="button"
                className={styles.statPopoverFooterBtn}
                onClick={() => {
                  setActiveStatPopup(null);
                  setIsStatsDrawerOpen(true);
                }}
              >
                View Activity History &rarr;
              </button>
            </div>
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
          <div
            className={styles.statPopoverCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.statPopoverHeader}>
              <div className={styles.statPopoverHeaderLeft}>
                <div className={styles.statPopoverIcon} style={{ background: "#FFFBEB", color: "#D97706" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </div>
                <div>
                  <h3 id="stat-helpful-title" className={styles.statPopoverTitle}>Helpful Rate</h3>
                  <p className={styles.statPopoverSub}>Quality &amp; Satisfaction Benchmark</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.statPopoverCloseBtn}
                onClick={() => setActiveStatPopup(null)}
                aria-label="Close helpful rate detail"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className={styles.statPopoverBody}>
              <div className={styles.helpfulRateDonutCard}>
                <div className={styles.donutSvgWrap}>
                  <svg viewBox="0 0 100 100" className={styles.donutSvg} aria-label="Helpful rate donut ring 92%">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#F1F5F9"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="url(#donutGrad)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="251.3"
                      strokeDashoffset="20.1"
                    />
                    <defs>
                      <linearGradient id="donutGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className={styles.donutCenterText}>
                    <span className={styles.donutPercent}>{data ? data.stats.helpfulRate : (isDemo ? "92%" : "100%")}</span>
                    <span className={styles.donutLabel}>Helpful</span>
                  </div>
                </div>

                <div className={styles.helpfulRateInfoSide}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className={styles.helpfulRateScore}>Rating Score</span>
                    <span className={`${styles.statGrowthBadge} ${styles.statGrowthBadgeGreen}`} style={{ padding: "2px 8px", fontSize: "11px" }}>
                      {isDemo ? "▲ +3.4%" : "Live Verified"}
                    </span>
                  </div>
                  <p className={styles.helpfulRateDesc}>
                    {isDemo
                      ? "Positive feedback indicator compared to last month's baseline."
                      : "Ratio of helpful responses and upvoted doubt solutions across questions."}
                  </p>
                </div>
              </div>

              <div className={styles.statSectionBlock}>
                <h4 className={styles.statSectionHeading}>What This Metric Means</h4>
                <div className={styles.statHighlightBox} style={{ background: "#F0FDF4", borderColor: "#DCFCE7" }}>
                  <p className={styles.statHighlightDesc} style={{ color: "#166534" }}>
                    The <strong>Helpful Rate</strong> measures the percentage of CAT questions that receive verified answers, peer upvotes, or explicit thank-you confirmations from the student who asked.
                  </p>
                </div>
              </div>

              <div className={styles.statSectionBlock}>
                <h4 className={styles.statSectionHeading}>Satisfaction Metrics</h4>
                <div className={styles.statChipsRow}>
                  <div className={styles.statChip}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span><strong>{isDemo ? "4.8 / 5.0" : "5.0 / 5.0"}</strong> community rating</span>
                  </div>
                  <div className={styles.statChip}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                    </svg>
                    <span><strong>{data ? data.stats.helpfulRate : "100%"}</strong> positive response</span>
                  </div>
                  <div className={styles.statChip}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                    <span><strong>0</strong> flagged answers</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.statPopoverFooter}>
              <span style={{ fontSize: "12px", color: "#64748B" }}>{isDemo ? "Based on 3,400+ peer ratings" : "Calculated from peer votes & responses"}</span>
              <button
                type="button"
                className={styles.statPopoverFooterBtn}
                onClick={() => {
                  setActiveStatPopup(null);
                  setIsStatsDrawerOpen(true);
                }}
              >
                View Full Report &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && <div className={styles.toastBanner}>{toastMessage}</div>}
    </div>
  );
}
