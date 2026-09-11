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

  const [email, setEmail] = useState("student@technocat.edu");
  const [password, setPassword] = useState("techno123");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        window.location.href = "/dashboard";
      }
    } else {
      if (!fullName.trim()) {
        setError("Please enter your full name.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }

      const res = await signup(fullName, email, password);
      setLoading(false);
      if (!res.success) {
        setError(res.error || "Sign up failed");
      } else {
        window.location.href = "/dashboard";
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
            <span className={styles.logoTechno}>Techno</span><span className={styles.logoCAT}>CAT</span>
          </div>
          <p className={styles.modalSubtitle}>
            {authModalTab === "signin"
              ? "Sign in to access your dashboard, study stats, and RAG tutor"
              : "Create an account to start your structured CAT preparation"}
          </p>
        </div>

        {/* Tabs */}
        <div className={styles.tabsRow}>
          <button
            type="button"
            className={`${styles.tabBtn} ${
              authModalTab === "signin" ? styles.tabBtnActive : ""
            }`}
            onClick={() => {
              setAuthModalTab("signin");
              setError("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${
              authModalTab === "signup" ? styles.tabBtnActive : ""
            }`}
            onClick={() => {
              setAuthModalTab("signup");
              setError("");
            }}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={styles.formBody}>
          {error && <div className={styles.errorBanner}>{error}</div>}

          {authModalTab === "signin" && (
            <div className={styles.demoHintBox}>
              💡 <strong>Demo Account:</strong> student@technocat.edu / techno123
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
                placeholder="••••••••"
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
          </div>

          {authModalTab === "signup" && (
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Confirm Password</label>
              <input
                type="password"
                className={styles.textInput}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
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
