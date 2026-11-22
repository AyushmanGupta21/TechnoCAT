"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  LayoutDashboard,
  Mail,
  Phone,
  Save,
  Settings,
  Sparkles,
  Upload,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DEFAULT_PROFILE_ICON } from "@/lib/nameUtils";
import AppNav from "@/components/app/AppNav";
import { GradientText, Reveal } from "@/components/landing/motion";
import styles from "./edit-profile.module.css";

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

  const isCustomAvatar = useMemo(() => {
    if (!avatarPreview) return false;
    if (avatarPreview === DEFAULT_PROFILE_ICON) return false;
    if (avatarPreview.includes("photo-1494790108377")) return false;
    return true;
  }, [avatarPreview]);

  const displayedAvatar = isCustomAvatar ? avatarPreview : DEFAULT_PROFILE_ICON;

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
    setFeedback({ type: "success", message: "Profile picture reset to default profile icon. Click Save Changes to confirm." });
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
          avatarUrl: isCustomAvatar ? avatarPreview : null,
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
        avatarUrl: isCustomAvatar ? avatarPreview : undefined,
        phone,
        targetYear,
        dreamSchool,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("technocat_profile_updated", {
            detail: { fullName: fullTrimmedName, avatarUrl: isCustomAvatar ? avatarPreview : null },
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


  const initials =
    fullNameDisplay
      .split(/\s+/)
      .filter(Boolean)
      .map((p, i, arr) => (i === 0 || i === arr.length - 1 ? p[0] : ""))
      .join("")
      .toUpperCase()
      .slice(0, 2) || "S";

  const renderAvatar = (cls: string, initialsCls: string) =>
    isCustomAvatar ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={displayedAvatar}
        alt={fullNameDisplay}
        className={cls}
        onError={(e) => {
          e.currentTarget.src = DEFAULT_PROFILE_ICON;
        }}
      />
    ) : (
      <span className={`${cls} ${initialsCls}`} aria-label={fullNameDisplay}>
        {initials}
      </span>
    );

  return (
    <div className={styles.pageWrapper}>
      <AppNav />

      {/* ===== PAGE HEADER ===== */}
      <header className={styles.pageHeader}>
        <div className={styles.headerInner}>
          <Reveal className={styles.heroRow}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/dashboard" className={styles.breadcrumbLink}>
                Dashboard
              </Link>
              <ChevronRight size={14} className={styles.breadcrumbSep} aria-hidden="true" />
              <span className={styles.breadcrumbCurrent}>Edit profile</span>
            </nav>
            <div className={styles.heroTitleRow}>
              <div>
                <h1 className={styles.heroHeading}>
                  Your <GradientText>profile</GradientText>
                </h1>
                <p className={styles.heroSubtitle}>
                  Keep your name, contact details and CAT target up to date so your reports and plans stay personal.
                </p>
              </div>
              {isDemo && (
                <span className={styles.demoPill}>
                  <span className={styles.demoDot} aria-hidden="true" />
                  Demo showcase account
                </span>
              )}
            </div>
          </Reveal>
        </div>
      </header>

      {/* ===== MAIN CONTENT GRID ===== */}
      <main className={styles.mainContent}>
        <div className={styles.profileLayoutGrid}>
          {/* Left column: profile summary */}
          <Reveal delay={0.05} className={styles.sidebarWrap}>
            <aside className={`glass-card ${styles.sidebarCard}`} data-tint="blue">
              <div className={styles.sidebarBand} aria-hidden="true" />
              <div className={styles.sidebarAvatarWrap}>
                {renderAvatar(styles.sidebarAvatar, styles.sidebarInitials)}
                <span className={styles.sidebarStatusBadge} title="Active" />
              </div>

              <h2 className={styles.sidebarName}>{fullNameDisplay}</h2>
              <p className={styles.sidebarEmail}>
                {user?.email || (isDemo ? "student@technocat.edu" : "aspirant@technocat.edu")}
              </p>

              <div className={styles.sidebarBadgeList}>
                <span className={styles.sidebarPill}>{targetYear}</span>
                <span className={`${styles.sidebarPill} ${styles.sidebarPillViolet}`}>CAT aspirant</span>
              </div>

              <dl className={styles.sidebarMetaList}>
                <div className={styles.sidebarMetaItem}>
                  <dt className={styles.sidebarMetaLabel}>
                    <CalendarDays size={15} strokeWidth={1.9} style={{ color: "var(--data-blue)" }} />
                    Target exam
                  </dt>
                  <dd className={styles.sidebarMetaValue}>{targetYear}</dd>
                </div>
                <div className={styles.sidebarMetaItem}>
                  <dt className={styles.sidebarMetaLabel}>
                    <Sparkles size={15} strokeWidth={1.9} style={{ color: "var(--data-violet)" }} />
                    Account tier
                  </dt>
                  <dd className={`${styles.sidebarMetaValue} ${styles.metaBlue}`}>
                    {isDemo ? "Demo Scholar" : "CAT Pro Scholar"}
                  </dd>
                </div>
                <div className={styles.sidebarMetaItem}>
                  <dt className={styles.sidebarMetaLabel}>
                    <BadgeCheck size={15} strokeWidth={1.9} style={{ color: "var(--data-emerald)" }} />
                    Verification
                  </dt>
                  <dd className={`${styles.sidebarMetaValue} ${styles.metaGreen}`}>Verified student</dd>
                </div>
                {dreamSchool && (
                  <div className={styles.sidebarMetaItem}>
                    <dt className={styles.sidebarMetaLabel}>
                      <Building2 size={15} strokeWidth={1.9} style={{ color: "var(--data-amber)" }} />
                      Dream school
                    </dt>
                    <dd className={`${styles.sidebarMetaValue} ${styles.metaTruncate}`} title={dreamSchool}>
                      {dreamSchool}
                    </dd>
                  </div>
                )}
              </dl>

              <div className={styles.sidebarLinks}>
                <Link href="/settings" className={styles.sidebarLinkBtn}>
                  <Settings size={16} strokeWidth={1.9} />
                  <span>Account &amp; security settings</span>
                  <ChevronRight size={15} className={styles.sidebarLinkArrow} />
                </Link>
                <Link href="/dashboard" className={styles.sidebarLinkBtn}>
                  <LayoutDashboard size={16} strokeWidth={1.9} />
                  <span>Back to dashboard</span>
                  <ChevronRight size={15} className={styles.sidebarLinkArrow} />
                </Link>
              </div>
            </aside>
          </Reveal>

          {/* Right column: form */}
          <Reveal delay={0.1}>
            <div className={`glass-card ${styles.formCard}`} data-tint="teal">
              {feedback && (
                <div
                  className={`${styles.alertBanner} ${feedback.type === "success" ? styles.alertSuccess : styles.alertError}`}
                  role={feedback.type === "error" ? "alert" : "status"}
                >
                  {feedback.type === "success" ? (
                    <Check size={18} strokeWidth={2.4} />
                  ) : (
                    <AlertCircle size={18} strokeWidth={2.2} />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <form onSubmit={handleSaveChanges}>
                {/* Photo */}
                <section className={styles.sectionGroup}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      <span className={styles.sectionMarker} style={{ background: "var(--data-blue)" }} aria-hidden="true" />
                      Profile photo
                    </h3>
                    <p className={styles.sectionSubtitle}>PNG, JPG or WebP up to 5MB. We centre and crop it into a circle.</p>
                  </div>

                  <div className={styles.avatarUploadRow}>
                    <button
                      type="button"
                      className={styles.avatarPreviewContainer}
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Choose a new profile photo"
                    >
                      {renderAvatar(styles.avatarImage, styles.avatarInitials)}
                      <span className={styles.avatarOverlay} aria-hidden="true">
                        <Camera size={20} strokeWidth={2} />
                      </span>
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      style={{ display: "none" }}
                      onChange={handleImageFileSelect}
                    />

                    <div className={styles.avatarActions}>
                      <div className={styles.avatarBtnGroup}>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className={styles.uploadBtn}>
                          <Upload size={16} strokeWidth={2.2} />
                          {isCustomAvatar ? "Upload new photo" : "Upload photo"}
                        </button>
                        {isCustomAvatar && (
                          <button type="button" onClick={handleRemovePhoto} className={styles.removeBtn}>
                            Remove photo
                          </button>
                        )}
                      </div>
                      <p className={styles.avatarHelpText}>A square photo with your face clearly visible works best.</p>
                    </div>
                  </div>
                </section>

                {/* Personal information */}
                <section className={styles.sectionGroup}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      <span className={styles.sectionMarker} style={{ background: "var(--data-teal)" }} aria-hidden="true" />
                      Personal information
                    </h3>
                    <p className={styles.sectionSubtitle}>
                      Your name appears on mock test reports, leaderboards and completion badges.
                    </p>
                  </div>

                  <div className={styles.formRowGrid}>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} htmlFor="pf-first">
                        First name <span className={styles.inputRequired}>*</span>
                      </label>
                      <div className={styles.inputWrapper}>
                        <User className={styles.inputIcon} size={16} strokeWidth={1.9} />
                        <input
                          id="pf-first"
                          type="text"
                          autoComplete="given-name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="e.g. Priya"
                          required
                          className={styles.textInput}
                        />
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} htmlFor="pf-last">
                        Last name
                      </label>
                      <div className={styles.inputWrapper}>
                        <User className={styles.inputIcon} size={16} strokeWidth={1.9} />
                        <input
                          id="pf-last"
                          type="text"
                          autoComplete="family-name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="e.g. Gomez"
                          className={styles.textInput}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Contact */}
                <section className={styles.sectionGroup}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      <span className={styles.sectionMarker} style={{ background: "var(--data-violet)" }} aria-hidden="true" />
                      Contact details
                    </h3>
                    <p className={styles.sectionSubtitle}>Where we send notifications and exam updates.</p>
                  </div>

                  <div className={styles.formRowGrid}>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} htmlFor="pf-email">
                        <span>Email address</span>
                        <span className={styles.verifiedBadge}>
                          <Check size={12} strokeWidth={3} />
                          Verified
                        </span>
                      </label>
                      <div className={styles.inputWrapper}>
                        <Mail className={styles.inputIcon} size={16} strokeWidth={1.9} />
                        <input
                          id="pf-email"
                          type="email"
                          value={user?.email || (isDemo ? "student@technocat.edu" : "")}
                          disabled
                          className={`${styles.textInput} ${styles.textInputDisabled}`}
                        />
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} htmlFor="pf-phone">
                        Phone number
                      </label>
                      <div className={styles.inputWrapper}>
                        <Phone className={styles.inputIcon} size={16} strokeWidth={1.9} />
                        <input
                          id="pf-phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="+91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={styles.textInput}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Goals */}
                <section className={styles.sectionGroup}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      <span className={styles.sectionMarker} style={{ background: "var(--data-amber)" }} aria-hidden="true" />
                      Target and B-school goal
                    </h3>
                    <p className={styles.sectionSubtitle}>
                      Used to set question difficulty and percentile projections in the Intelligence Hub.
                    </p>
                  </div>

                  <div className={styles.formRowGrid}>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} htmlFor="pf-year">
                        Target exam year
                      </label>
                      <div className={styles.inputWrapper}>
                        <CalendarDays className={styles.inputIcon} size={16} strokeWidth={1.9} />
                        <select
                          id="pf-year"
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
                      <label className={styles.inputLabel} htmlFor="pf-dream">
                        Dream B-school
                      </label>
                      <div className={styles.inputWrapper}>
                        <Building2 className={styles.inputIcon} size={16} strokeWidth={1.9} />
                        <input
                          id="pf-dream"
                          type="text"
                          value={dreamSchool}
                          onChange={(e) => setDreamSchool(e.target.value)}
                          placeholder="e.g. IIM Ahmedabad, IIM Bangalore, FMS Delhi"
                          className={styles.textInput}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Action bar */}
                <div className={styles.actionBar}>
                  <button type="button" onClick={() => router.push("/dashboard")} className={styles.cancelBtn}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className={styles.saveBtn}>
                    {isSubmitting ? (
                      <>
                        <span className={styles.spinner} />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save size={16} strokeWidth={2.2} />
                        Save changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Reveal>
        </div>
      </main>
    </div>
  );
}
