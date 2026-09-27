"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import styles from "./AuthModal.module.css";

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    login,
    signup,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Clean form state when switching between tabs or when modal opens
  const handleTabChange = (tab: "signin" | "signup") => {
    setAuthModalTab(tab);
    setError("");
    if (tab === "signup") {
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFullName("");
    }
  };

  const handleAutoFillDemo = () => {
    setEmail("student@technocat.edu");
    setPassword("techno123");
    setError("");
  };

  React.useEffect(() => {
    if (isAuthModalOpen) {
      setError("");
      if (authModalTab === "signup") {
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setFullName("");
      }
    }
  }, [isAuthModalOpen, authModalTab]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (authModalTab === "signin") {
      const res = await login(email, password);
      setLoading(false);
      if (!res.success) {
        setError(res.error || "Login failed");
      } else {
        const hasPredictorRedirect = typeof window !== "undefined" && sessionStorage.getItem("technocat_predictor_pending_redirect");
        const authRedirect = typeof window !== "undefined" && sessionStorage.getItem("technocat_auth_redirect");
        if (hasPredictorRedirect) {
          sessionStorage.removeItem("technocat_predictor_pending_redirect");
          window.location.href = "/intelligence/b-school-predictor";
        } else if (authRedirect) {
          sessionStorage.removeItem("technocat_auth_redirect");
          window.location.href = authRedirect;
        } else {
          window.location.href = "/dashboard";
        }
      }
    } else {
      if (!fullName.trim()) {
        setError("Please enter your full name.");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }

      const res = await signup(fullName, email, password);
      setLoading(false);
      if (!res.success) {
        setError(res.error || "Sign up failed");
      } else {
        const hasPredictorRedirect = typeof window !== "undefined" && sessionStorage.getItem("technocat_predictor_pending_redirect");
        const authRedirect = typeof window !== "undefined" && sessionStorage.getItem("technocat_auth_redirect");
        if (hasPredictorRedirect) {
          sessionStorage.removeItem("technocat_predictor_pending_redirect");
          window.location.href = "/intelligence/b-school-predictor";
        } else if (authRedirect) {
          sessionStorage.removeItem("technocat_auth_redirect");
          window.location.href = authRedirect;
        } else {
          window.location.href = "/dashboard";
        }
      }
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div className={styles.modalContent} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <button
            className={styles.closeBtn}
            onClick={closeAuthModal}
            aria-label="Close"
          >
            ✕
          </button>
          <div className={styles.brandLogo}>
            <img src="/logo.jpg" alt="TechnoCAT Logo" className={styles.logoImage} />
          </div>
          <p className={styles.modalSubtitle}>
            Your CAT preparation journey starts here.
          </p>
        </div>

        {/* Tabs */}
        <div className={styles.tabsRow}>
          <button
            type="button"
            className={`${styles.tabBtn} ${
              authModalTab === "signin" ? styles.tabBtnActive : ""
            }`}
            onClick={() => handleTabChange("signin")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${
              authModalTab === "signup" ? styles.tabBtnActive : ""
            }`}
            onClick={() => handleTabChange("signup")}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={styles.formBody}>
          {error && <div className={styles.errorBanner}>{error}</div>}

          {authModalTab === "signin" && (
            <div className={styles.demoHintBox}>
              <div className={styles.demoHintHeader}>
                <div className={styles.demoHintTitle}>
                  💡 <strong>Demo Login:</strong> <code>student@technocat.edu</code>
                </div>
                <button
                  type="button"
                  className={styles.demoFillBtn}
                  onClick={handleAutoFillDemo}
                  title="Auto-fill demo credentials"
                >
                  ⚡ Auto-fill
                </button>
              </div>
              <div className={styles.demoHintSub}>
                Password: <code>techno123</code> &bull; Or enter your registered account
              </div>
            </div>
          )}

          {authModalTab === "signup" && (
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Full Name</label>
              <input
                type="text"
                className={styles.textInput}
                placeholder="e.g. Ayushman Gupta"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Email Address</label>
            <input
              type="email"
              className={styles.textInput}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Password</label>
            <div className={styles.inputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                className={styles.textInput}
                placeholder={authModalTab === "signup" ? "Create a secure password (min 6 chars)" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.eyeToggleBtn}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {authModalTab === "signup" && password.length > 0 && password.length < 6 && (
              <span className={styles.inputHintError}>Must be at least 6 characters</span>
            )}
          </div>

          {authModalTab === "signup" && (
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Confirm Password</label>
              <input
                type="password"
                className={styles.textInput}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword.length > 0 && (
                confirmPassword === password ? (
                  <span className={styles.inputHintSuccess}>✓ Passwords match</span>
                ) : (
                  <span className={styles.inputHintError}>✕ Passwords do not match</span>
                )
              )}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : authModalTab === "signin"
              ? "Sign In to TechnoCAT"
              : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
