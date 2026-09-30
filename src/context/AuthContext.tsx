"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  phone?: string;
  targetYear?: string;
  dreamSchool?: string;
  preferences?: Record<string, any>;
  isGuest?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isLoggingOut: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: (tab?: "signin" | "signup") => void;
  closeAuthModal: () => void;
  authModalTab: "signin" | "signup";
  setAuthModalTab: (tab: "signin" | "signup") => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (fullName: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<UserProfile>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const text = await res.text();
          if (text && text.trim().length > 0) {
            const data = JSON.parse(text);
            if (data?.user) {
              setUser(data.user);
            }
          }
        }
      } catch (err) {
        console.warn("[Auth Check Error]", err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const isPublicRoute = pathname === "/";
  const isAuthenticated = Boolean(user && !user.isGuest);

  // Strict route guard: no one can enter internal/dashboard pages without logging in
  useEffect(() => {
    if (!loading && !isPublicRoute && !isAuthenticated && !isLoggingOut) {
      if (typeof window !== "undefined") {
        const fullTarget =
          window.location.pathname + window.location.search + window.location.hash;
        if (fullTarget && fullTarget !== "/") {
          sessionStorage.setItem("technocat_auth_redirect", fullTarget);
        }
      }
      setAuthModalTab("signin");
      setIsAuthModalOpen(true);
      router.replace("/");
    }
  }, [loading, isPublicRoute, isAuthenticated, isLoggingOut, router]);

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0) {
          const data = JSON.parse(text);
          if (data?.user) {
            setUser(data.user);
          }
        }
      }
    } catch (err) {
      console.warn("[Auth Refresh Error]", err);
    }
  };

  const updateUser = (updated: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  };

  const openAuthModal = (tab: "signin" | "signup" = "signin") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      setUser({ ...data.user, isGuest: false });
      closeAuthModal();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error during login" };
    }
  };

  const signup = async (fullName: string, email: string, pass: string) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password: pass }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Signup failed" };
      }

      setUser({ ...data.user, isGuest: false });
      closeAuthModal();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error during signup" };
    }
  };

  const logout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("technocat_auth_redirect");
        sessionStorage.removeItem("technocat_predictor_pending_redirect");
        window.location.href = "/";
      }
    } catch (err) {
      console.error("[Logout Error]", err);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  const shouldBlockProtectedView = !isPublicRoute && (loading || !isAuthenticated);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoggingOut,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalTab,
        setAuthModalTab,
        login,
        signup,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {shouldBlockProtectedView ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#FFFFFF",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid #E2E8F0",
              borderTopColor: "#2563EB",
              borderRadius: "50%",
              animation: "authLogoutSpin 0.7s linear infinite",
            }}
          />
          <style>{`@keyframes authLogoutSpin { to { transform: rotate(360deg); } }`}</style>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#64748B",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            {loading ? "Checking authentication..." : "Redirecting to login..."}
          </span>
        </div>
      ) : (
        children
      )}
      {isLoggingOut && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#FFFFFF",
            zIndex: 9999999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid #E2E8F0",
              borderTopColor: "#2563EB",
              borderRadius: "50%",
              animation: "authLogoutSpin 0.7s linear infinite",
            }}
          />
          <style>{`@keyframes authLogoutSpin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#64748B", fontFamily: "system-ui, -apple-system, sans-serif" }}>
            Logging out...
          </span>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
