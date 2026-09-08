"use client";

import React from "react";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import Link from "next/link";

export default function EditProfilePage() {
  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <header style={{ background: "#0F172A", padding: "0 24px", height: "70px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ textDecoration: "none", color: "white", fontSize: "20px", fontWeight: "bold" }}>
          Techno<span style={{ color: "#ED1C24" }}>CAT</span>
        </Link>
        <PostLoginNavActions />
      </header>
      <main style={{ padding: "40px 24px", maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "24px" }}>Edit Profile</h1>
        <div style={{ background: "white", padding: "32px", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
          <p style={{ color: "#6B7280" }}>Profile editing form will go here. You can update your name, avatar, and contact details.</p>
        </div>
      </main>
    </div>
  );
}
