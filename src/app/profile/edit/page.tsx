"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "../../dashboard/dashboard.module.css";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDemo = !user || user.email === "student@technocat.edu";

  // Derive initial names
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [targetYear, setTargetYear] = useState("CAT 2026");
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (user) {
      const parts = (user.fullName || "").trim().split(/\s+/);
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
      
      const isHardcodedDemoAvatar = user.avatarUrl?.includes("photo-1494790108377");
      if (isDemo) {
        setAvatarPreview(user.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80");
      } else {
        setAvatarPreview(isHardcodedDemoAvatar ? "" : (user.avatarUrl || ""));
      }

      try {
        const savedPhone = localStorage.getItem(`technocat_phone_${user.id}`);
        if (savedPhone) setPhone(savedPhone);
        const savedTarget = localStorage.getItem(`technocat_target_year_${user.id}`);
        if (savedTarget) setTargetYear(savedTarget);
      } catch {}
    } else if (isDemo) {
      setFirstName("Sabrina");
      setLastName("Gomez");
      setPhone("+91 98765 43210");
      setAvatarPreview("https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80");
    }
  }, [user, isDemo]);

  // Derived user initials for avatar fallback
  const userInitials = useMemo(() => {
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (fn && ln) return (fn[0] + ln[0]).toUpperCase();
    if (fn) return fn.slice(0, 2).toUpperCase();
    return "U";
  }, [firstName, lastName]);

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFeedback({ type: "error", message: "Please select an image file (PNG, JPG, WebP)." });
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
        // Optimize & center-crop to 256x256 using an offscreen canvas
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
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update profile.");
      }

      const data = await res.json();
      
      // Update local storage for supplementary profile fields
      if (user?.id) {
        try {
          localStorage.setItem(`technocat_phone_${user.id}`, phone);
          localStorage.setItem(`technocat_target_year_${user.id}`, targetYear);
        } catch {}
      }

      // Update AuthContext so navbar and app re-render instantly with new name and avatar
      updateUser?.({
        fullName: fullTrimmedName,
        avatarUrl: avatarPreview || undefined,
      });

      // Dispatch event for other components
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("technocat_profile_updated", {
          detail: { fullName: fullTrimmedName, avatarUrl: avatarPreview }
        }));
      }

      setFeedback({ type: "success", message: "Your profile has been updated successfully!" });
    } catch (err: any) {
      console.error("Profile save error:", err);
      setFeedback({ type: "error", message: err.message || "Something went wrong while saving." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.dashboardWrapper}>
      {/* ===== DARK HEADER SECTION ===== */}
      <header className={styles.darkHeader}>
        <div className={styles.headerInner}>
          <nav className={styles.topNav} aria-label="Settings Navigation">
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <Link href="/dashboard" className={styles.brandLogo} title="Back to Dashboard">
                <img src="/logo.jpg" alt="TechnoCAT Logo" className={styles.logoImage} />
              </Link>
              
              <Link
                href="/dashboard"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#2563EB",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                  padding: "6px 12px",
                  background: "#F0F9FF",
                  border: "1px solid #E0F2FE",
                  borderRadius: "8px",
                  transition: "all 0.2s"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to Dashboard
              </Link>
            </div>

            <PostLoginNavActions />
          </nav>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className={styles.mainContent} style={{ maxWidth: "800px", margin: "0 auto", marginTop: "32px", width: "100%", padding: "0 20px 60px" }}>
        <div className={styles.cardBox} style={{ padding: "32px", background: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1E293B", margin: 0 }}>Edit Profile</h1>
              <p style={{ fontSize: "14px", color: "#64748B", margin: "4px 0 0 0" }}>
                Update your personal information, profile photo, and CAT prep details.
              </p>
            </div>
            {isDemo && (
              <span style={{ fontSize: "12px", fontWeight: "600", padding: "4px 10px", background: "#FEF3C7", color: "#B45309", borderRadius: "6px" }}>
                Demo Showcase Profile
              </span>
            )}
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                fontSize: "14px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: feedback.type === "success" ? "#F0FDF4" : "#FEF2F2",
                border: feedback.type === "success" ? "1px solid #BBF7D0" : "1px solid #FECACA",
                color: feedback.type === "success" ? "#166534" : "#991B1B",
              }}
            >
              {feedback.type === "success" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              )}
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleSaveChanges} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {/* Avatar Section */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px", paddingBottom: "24px", borderBottom: "1px solid #E2E8F0" }}>
              {avatarPreview ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  style={{
                    width: "88px",
                    height: "88px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid #E0F2FE",
                    boxShadow: "0 2px 8px rgba(37,99,235,0.12)"
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "88px",
                    height: "88px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #2563EB, #7C3AED)",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    fontWeight: "700",
                    border: "3px solid #E0F2FE",
                    boxShadow: "0 2px 8px rgba(37,99,235,0.15)"
                  }}
                >
                  {userInitials}
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                accept="image/png, image/jpeg, image/jpg, image/webp"
                style={{ display: "none" }}
                onChange={handleImageFileSelect}
              />

              <div>
                <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#334155", margin: "0 0 4px 0" }}>Profile Picture</h3>
                <p style={{ fontSize: "12px", color: "#64748B", margin: "0 0 12px 0" }}>
                  Upload a photo (PNG, JPG or WebP up to 5MB). Photo will be centered and cropped.
                </p>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: "8px 16px",
                      background: "#2563EB",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    {avatarPreview ? "Change Photo" : "Upload Photo"}
                  </button>

                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      style={{
                        padding: "8px 16px",
                        background: "#F1F5F9",
                        color: "#475569",
                        border: "1px solid #CBD5E1",
                        borderRadius: "8px",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontSize: "13px"
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1E293B", margin: 0 }}>
                Personal Information
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>First Name *</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      outline: "none",
                      fontSize: "14px",
                      color: "#1E293B",
                      transition: "border 0.2s"
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      outline: "none",
                      fontSize: "14px",
                      color: "#1E293B"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>
                    Email Address <span style={{ fontSize: "11px", color: "#94A3B8" }}>(Registered ID)</span>
                  </label>
                  <input
                    type="email"
                    value={user?.email || (isDemo ? "student@technocat.edu" : "")}
                    disabled
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #E2E8F0",
                      background: "#F8FAFC",
                      outline: "none",
                      fontSize: "14px",
                      color: "#64748B",
                      cursor: "not-allowed"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      outline: "none",
                      fontSize: "14px",
                      color: "#1E293B"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Target Examination Year</label>
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    outline: "none",
                    fontSize: "14px",
                    color: "#1E293B",
                    background: "#FFFFFF"
                  }}
                >
                  <option value="CAT 2025">CAT 2025</option>
                  <option value="CAT 2026">CAT 2026 (Recommended)</option>
                  <option value="CAT 2027">CAT 2027</option>
                  <option value="XAT / OMETs 2026">XAT / OMETs 2026</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px", paddingTop: "20px", borderTop: "1px solid #E2E8F0" }}>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                style={{
                  padding: "10px 20px",
                  background: "white",
                  color: "#475569",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: "10px 24px",
                  background: isSubmitting ? "#93C5FD" : "#2563EB",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                {isSubmitting ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.spinnerIcon}>
                      <line x1="12" y1="2" x2="12" y2="6" />
                      <line x1="12" y1="18" x2="12" y2="22" />
                      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                      <line x1="2" y1="12" x2="6" y2="12" />
                      <line x1="18" y1="12" x2="22" y2="12" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
