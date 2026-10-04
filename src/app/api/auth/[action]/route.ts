import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getProfileByEmail, getProfileById, createProfile, updateProfilePassword, deleteProfile } from "@/lib/db";
import { resolveStudentName, sanitizeAvatarUrl } from "@/lib/nameUtils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;

  try {
    if (action === "login") {
      const { email, password } = await request.json();

      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();
      const user = await getProfileByEmail(cleanEmail);
      if (!user) {
        return NextResponse.json({ error: "No account found with this email." }, { status: 401 });
      }

      const storedHash = user.password_hash || "";
      let isMatch = false;

      // Check if stored hash is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
      if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
        isMatch = await bcrypt.compare(password, storedHash);
      } else {
        // Plaintext legacy password support (e.g. existing accounts)
        if (storedHash === password) {
          isMatch = true;
          // Seamlessly auto-upgrade legacy plaintext to bcrypt hash in database
          try {
            const upgradedHash = await bcrypt.hash(password, 10);
            await updateProfilePassword(user.id, upgradedHash);
          } catch (upgradeErr) {
            console.warn("[Password Upgrade Error]", upgradeErr);
          }
        }
      }

      if (!isMatch) {
        return NextResponse.json({ error: "Incorrect password. Please try again." }, { status: 401 });
      }

      const response = NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: resolveStudentName(user.full_name, user.email),
          role: user.role,
          avatarUrl: sanitizeAvatarUrl(user.avatar_url),
          phone: user.phone || "",
          targetYear: user.target_year || "CAT 2026",
          dreamSchool: user.dream_school || "",
          preferences: user.preferences || {},
        },
      });

      // Set session cookie
      response.cookies.set("technocat_user_id", user.id, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    if (action === "signup") {
      const { fullName, email, password } = await request.json();

      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();
      const resolvedName = resolveStudentName(fullName, cleanEmail);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
      }

      const existing = await getProfileByEmail(cleanEmail);
      if (existing) {
        return NextResponse.json({ error: "An account with this email already exists. Please sign in." }, { status: 409 });
      }

      // Hash password with bcryptjs
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await createProfile(cleanEmail, hashedPassword, resolvedName);

      const response = NextResponse.json({
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: resolveStudentName(newUser.full_name, newUser.email),
          role: newUser.role,
          avatarUrl: sanitizeAvatarUrl(newUser.avatar_url),
          phone: "",
          targetYear: "CAT 2026",
          dreamSchool: "",
          preferences: {},
        },
      });

      response.cookies.set("technocat_user_id", newUser.id, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    if (action === "change-password") {
      const userId = request.cookies.get("technocat_user_id")?.value;
      if (!userId) {
        return NextResponse.json({ error: "Please sign in to change your password." }, { status: 401 });
      }

      const user = await getProfileById(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }

      if (user.email.toLowerCase() === "student@technocat.edu") {
        return NextResponse.json(
          { error: "Demo showcase account is protected and cannot change passwords." },
          { status: 403 }
        );
      }

      const { currentPassword, newPassword } = await request.json();
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: "Current password and new password are required." }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters long." }, { status: 400 });
      }

      const storedHash = user.password_hash || "";
      let isMatch = false;

      if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
        isMatch = await bcrypt.compare(currentPassword, storedHash);
      } else {
        isMatch = storedHash === currentPassword;
      }

      if (!isMatch) {
        return NextResponse.json({ error: "Current password does not match our records." }, { status: 400 });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await updateProfilePassword(userId, newHash);

      return NextResponse.json({ success: true, message: "Password updated successfully!" });
    }

    if (action === "delete-account") {
      const userId = request.cookies.get("technocat_user_id")?.value;
      if (!userId) {
        return NextResponse.json({ error: "Please sign in to delete your account." }, { status: 401 });
      }

      const user = await getProfileById(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }

      if (user.email.toLowerCase() === "student@technocat.edu") {
        return NextResponse.json(
          { error: "Demo showcase accounts cannot be deleted as they are shared sandbox environments." },
          { status: 403 }
        );
      }

      await deleteProfile(userId);

      const response = NextResponse.json({ success: true, message: "Account deleted successfully." });
      response.cookies.delete("technocat_user_id");
      return response;
    }

    if (action === "logout") {
      const response = NextResponse.json({ success: true });
      response.cookies.delete("technocat_user_id");
      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 404 });
  } catch (error: any) {
    console.error("[Auth API Error]", error);
    return NextResponse.json({ error: error.message || "Authentication error." }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;

  if (action === "me") {
    const userId = request.cookies.get("technocat_user_id")?.value;

    if (!userId) {
      // Default demo profile for guest / initial experience
      const defaultUser = await getProfileByEmail("student@technocat.edu");
      return NextResponse.json({
        user: defaultUser ? {
          id: defaultUser.id,
          email: defaultUser.email,
          fullName: resolveStudentName(defaultUser.full_name, defaultUser.email),
          role: defaultUser.role,
          avatarUrl: sanitizeAvatarUrl(defaultUser.avatar_url),
          phone: defaultUser.phone || "",
          targetYear: defaultUser.target_year || "CAT 2026",
          dreamSchool: defaultUser.dream_school || "",
          preferences: defaultUser.preferences || {},
          isGuest: true,
        } : null,
      });
    }

    const user = await getProfileById(userId);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: resolveStudentName(user.full_name, user.email),
        role: user.role,
        avatarUrl: sanitizeAvatarUrl(user.avatar_url),
        phone: user.phone || "",
        targetYear: user.target_year || "CAT 2026",
        dreamSchool: user.dream_school || "",
        preferences: user.preferences || {},
        isGuest: false,
      },
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 404 });
}
