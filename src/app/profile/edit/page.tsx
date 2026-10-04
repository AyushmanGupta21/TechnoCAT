"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./edit-profile.module.css";

const navLinks = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Browse", href: "/browse" },
  { name: "My Topics", href: "/topics" },
  { name: "Intelligence Hub", href: "/intelligence" },
  { name: "Mock Viva Prep", href: "#" },
];

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDemo = Boolean(user && user.email === "student@technocat.edu");

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [targetYear, setTargetYear] = useState("CAT 2026");
  const [dreamSchool, setDreamSchool] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (user) {
      const parts = (user.fullName || "").trim().split(/\s+/);
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");

      const isHardcodedDemoAvatar = user.avatarUrl?.includes("photo-1494790108377");
      setAvatarPreview(isHardcodedDemoAvatar ? "" : (user.avatarUrl || ""));

      if (user.phone) {
        setPhone(user.phone);
      } else {
        try {
          const savedPhone = localStorage.getItem(`technocat_phone_${user.id}`);
          if (savedPhone) setPhone(savedPhone);
        } catch {}
      }

      if (user.targetYear) {
        setTargetYear(user.targetYear);
      } else {
        try {
          const savedTarget = localStorage.getItem(`technocat_target_year_${user.id}`);
          if (savedTarget) setTargetYear(savedTarget);
        } catch {}
      }

      if (user.dreamSchool) {
        setDreamSchool(user.dreamSchool);
      } else {
        try {
          const savedDream = localStorage.getItem(`technocat_dream_school_${user.id}`);
          if (savedDream) setDreamSchool(savedDream);
        } catch {}
      }
    } else if (isDemo) {
      setFirstName("Student");
      setLastName("");
      setPhone("");
      setTargetYear("CAT 2026");
      setDreamSchool("");
      setAvatarPreview("");
    }
  }, [user, isDemo]);

  // Derived user initials for avatar fallback
  const userInitials = useMemo(() => {
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (fn && ln) return (fn[0] + ln[0]).toUpperCase();
    if (fn) return fn.slice(0, 2).toUpperCase();
    return "TC";
  }, [firstName, lastName]);

  const fullNameDisplay = useMemo(() => {
    const combined = `${firstName.trim()} ${lastName.trim()}`.trim();
    return combined || "Student";
  }, [firstName, lastName]);

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFeedback({ type: "error", message: "Please select an image file (PNG, JPG, or WebP)." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: "error", message: "Image size must be less than 5MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const cropSize = Math.min(img.width, img.height);
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const sx = (img.width - cropSize) / 2;
          const sy = (img.height - cropSize) / 2;
          ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, 256, 256);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setAvatarPreview(compressedDataUrl);
          setFeedback(null);
        }
      };
      img.src = uploadEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFeedback({ type: "success", message: "Profile picture set to initials avatar. Click Save Changes to confirm." });
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const fullTrimmedName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullTrimmedName) {
      setFeedback({ type: "error", message: "First name is required." });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullTrimmedName,
          avatarUrl: avatarPreview || null,
          phone,
          targetYear,
          dreamSchool,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update profile.");
      }

      // Update supplementary profile fields in local storage as fast client fallback
      const uid = user?.id || (isDemo ? "demo-student" : "current");
      try {
        localStorage.setItem(`technocat_phone_${uid}`, phone);
        localStorage.setItem(`technocat_target_year_${uid}`, targetYear);
        localStorage.setItem(`technocat_dream_school_${uid}`, dreamSchool);
      } catch {}

      // Update AuthContext so navbar, user badge, and all pages re-render immediately
      updateUser?.({
        fullName: fullTrimmedName,
        avatarUrl: avatarPreview || undefined,
        phone,
        targetYear,
        dreamSchool,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("technocat_profile_updated", {
            detail: { fullName: fullTrimmedName, avatarUrl: avatarPreview },
          })
        );
      }

      setFeedback({ type: "success", message: "Profile details saved successfully!" });
    } catch (err: any) {
      console.error("Profile save error:", err);
      setFeedback({ type: "error", message: err.message || "Something went wrong while saving." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* ===== STICKY TOP NAVIGATION ===== */}
      <header className={styles.stickyNavHeader}>
        <div className={styles.headerInner}>
          <nav className={styles.topNav} aria-label="Main Navigation">
            <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
              <img src="/logo.jpg" alt="TechnoCAT Logo" className={styles.logoImage} />
            </Link>

            <div className={styles.navLinks}>
              {navLinks.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    if (item.href === "#") e.preventDefault();
                  }}
                  className={styles.navLink}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <PostLoginNavActions />
          </nav>
        </div>
      </header>

      {/* ===== HERO HEADER SECTION ===== */}
      <div className={styles.darkHeader}>
        <div className={styles.headerInner}>
          {/* Breadcrumb & Hero Heading */}
          <div className={styles.heroRow}>
            <div className={styles.badgeRow}>
              <span className={styles.badgeLabel}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                Profile &amp; Aspirant Settings
              </span>
              {isDemo && (
                <span className={styles.demoPill}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  Demo Showcase Account
                </span>
              )}
            </div>

            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/dashboard" className={styles.breadcrumbLink}>
                Dashboard
              </Link>
              <span className={styles.breadcrumbSep}>›</span>
              <span className={styles.breadcrumbCurrent}>Edit Profile</span>
            </nav>

            <div>
              <h1 className={styles.heroHeading}>
                Edit Aspirant <span className={styles.heroHighlight}>Profile</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Keep your aspirant credentials, target exam year, and contact details up to date to personalize your CAT preparation journey.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT GRID ===== */}
      <main className={styles.mainContent}>
        <div className={styles.profileLayoutGrid}>
          {/* Left Column: Profile Card */}
          <aside className={styles.sidebarCard}>
            <div className={styles.sidebarAvatarWrap}>
              {avatarPreview ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatarPreview} alt={fullNameDisplay} className={styles.sidebarAvatar} />
              ) : (
                <div className={styles.sidebarAvatarFallback}>{userInitials}</div>
              )}
              <span className={styles.sidebarStatusBadge} title="Active Status" />
            </div>

            <h2 className={styles.sidebarName}>{fullNameDisplay}</h2>
            <p className={styles.sidebarEmail}>{user?.email || (isDemo ? "student@technocat.edu" : "aspirant@technocat.edu")}</p>

            <div className={styles.sidebarBadgeList}>
              <span className={styles.sidebarPill}>{targetYear}</span>
              <span className={styles.sidebarPill} style={{ background: "#FDF2F8", color: "#BE185D", borderColor: "#FBCFE8" }}>
                CAT Aspirant
              </span>
            </div>

            <div className={styles.sidebarDivider} />

            <div className={styles.sidebarMetaList}>
              <div className={styles.sidebarMetaItem}>
                <span className={styles.sidebarMetaLabel}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Target Exam
                </span>
                <span className={styles.sidebarMetaValue}>{targetYear}</span>
              </div>

              <div className={styles.sidebarMetaItem}>
                <span className={styles.sidebarMetaLabel}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Account Tier
                </span>
                <span className={styles.sidebarMetaValue} style={{ color: "#2563EB" }}>
                  {isDemo ? "Demo Scholar" : "CAT Pro Scholar"}
                </span>
              </div>

              <div className={styles.sidebarMetaItem}>
                <span className={styles.sidebarMetaLabel}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Verification
                </span>
                <span className={styles.sidebarMetaValue} style={{ color: "#059669" }}>
                  Verified Student
                </span>
              </div>

              {dreamSchool && (
                <div className={styles.sidebarMetaItem}>
                  <span className={styles.sidebarMetaLabel}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21h18" />
                      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                      <line x1="9" y1="9" x2="9" y2="9.01" />
                      <line x1="9" y1="13" x2="9" y2="13.01" />
                      <line x1="9" y1="17" x2="9" y2="17.01" />
                      <line x1="15" y1="9" x2="15" y2="9.01" />
                      <line x1="15" y1="13" x2="15" y2="13.01" />
                      <line x1="15" y1="17" x2="15" y2="17.01" />
                    </svg>
                    Dream School
                  </span>
                  <span className={styles.sidebarMetaValue} style={{ textAlign: "right", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {dreamSchool}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.sidebarDivider} />

            <div className={styles.sidebarLinks}>
              <Link href="/settings" className={styles.sidebarLinkBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Account &amp; Security Settings
              </Link>
              <Link href="/dashboard" className={styles.sidebarLinkBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Return to Dashboard
              </Link>
            </div>
          </aside>

          {/* Right Column: Form Card */}
          <div className={styles.formCard}>
            {feedback && (
              <div
                className={`${styles.alertBanner} ${
                  feedback.type === "success" ? styles.alertSuccess : styles.alertError
                }`}
              >
                {feedback.type === "success" ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveChanges}>
              {/* Photo Section */}
              <div className={styles.sectionGroup}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    Profile Photo
                  </h3>
                  <p className={styles.sectionSubtitle}>
                    Upload a high-resolution photo (PNG, JPG, or WebP up to 5MB). Photo will be centered and cropped into a circle.
                  </p>
                </div>

                <div className={styles.avatarUploadRow}>
                  <div className={styles.avatarPreviewContainer}>
                    {avatarPreview ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={avatarPreview} alt="Avatar Preview" className={styles.avatarImage} />
                    ) : (
                      <div className={styles.avatarFallback}>{userInitials}</div>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    style={{ display: "none" }}
                    onChange={handleImageFileSelect}
                  />

                  <div className={styles.avatarActions}>
                    <div className={styles.avatarBtnGroup}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={styles.uploadBtn}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        {avatarPreview ? "Upload New Photo" : "Upload Photo"}
                      </button>

                      {avatarPreview && (
                        <button type="button" onClick={handleRemovePhoto} className={styles.removeBtn}>
                          Remove Photo
                        </button>
                      )}
                    </div>
                    <p className={styles.avatarHelpText}>
                      We recommend a square image with your face clearly visible for mentor evaluations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className={styles.sectionGroup}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Personal Information
                  </h3>
                  <p className={styles.sectionSubtitle}>
                    This name will appear on your mock test report cards, performance leaderboards, and completion badges.
                  </p>
                </div>

                <div className={styles.formRowGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      First Name <span className={styles.inputRequired}>*</span>
                    </label>
                    <div className={styles.inputWrapper}>
                      <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Ayushman"
                        required
                        className={styles.textInput}
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Last Name</label>
                    <div className={styles.inputWrapper}>
                      <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Gomez"
                        className={styles.textInput}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className={styles.sectionGroup}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    Contact &amp; Verification
                  </h3>
                  <p className={styles.sectionSubtitle}>
                    Your primary registered communication channels for notifications and exam updates.
                  </p>
                </div>

                <div className={styles.formRowGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      <span>Email Address</span>
                      <span className={styles.verifiedBadge}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Verified
                      </span>
                    </label>
                    <div className={styles.inputWrapper}>
                      <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <input
                        type="email"
                        value={user?.email || (isDemo ? "student@technocat.edu" : "")}
                        disabled
                        className={`${styles.textInput} ${styles.textInputDisabled}`}
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Phone Number</label>
                    <div className={styles.inputWrapper}>
                      <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={styles.textInput}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CAT Aspirant Goals */}
              <div className={styles.sectionGroup}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                    Aspirant Target &amp; B-School Goals
                  </h3>
                  <p className={styles.sectionSubtitle}>
                    Helps the AI Intelligence Hub calibrate question difficulty and percentile projections.
                  </p>
                </div>

                <div className={styles.formRowGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Target Examination Year</label>
                    <div className={styles.inputWrapper}>
                      <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <select
                        value={targetYear}
                        onChange={(e) => setTargetYear(e.target.value)}
                        className={styles.selectInput}
                      >
                        <option value="CAT 2025">CAT 2025 (Nov 2025)</option>
                        <option value="CAT 2026">CAT 2026 (Recommended Cohort)</option>
                        <option value="CAT 2027">CAT 2027 (Foundation)</option>
                        <option value="XAT / OMETs 2026">XAT / OMETs 2026</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Dream B-School Goal</label>
                    <div className={styles.inputWrapper}>
                      <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 21h18" />
                        <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                        <line x1="9" y1="9" x2="9" y2="9.01" />
                        <line x1="9" y1="13" x2="9" y2="13.01" />
                        <line x1="15" y1="9" x2="15" y2="9.01" />
                        <line x1="15" y1="13" x2="15" y2="13.01" />
                      </svg>
                      <input
                        type="text"
                        value={dreamSchool}
                        onChange={(e) => setDreamSchool(e.target.value)}
                        placeholder="e.g. IIM Ahmedabad, IIM Bangalore, FMS Delhi"
                        className={styles.textInput}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className={styles.actionBar}>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>

                <button type="submit" disabled={isSubmitting} className={styles.saveBtn}>
                  {isSubmitting ? (
                    <>
                      <div className={styles.spinner} />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
