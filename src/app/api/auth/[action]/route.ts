import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getProfileByEmail, getProfileById, createProfile, updateProfilePassword } from "@/lib/db";

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
          fullName: user.full_name,
          role: user.role,
          avatarUrl: user.avatar_url,
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

      if (!fullName || !email || !password) {
        return NextResponse.json({ error: "All fields are required." }, { status: 400 });
      }

      const trimmedName = fullName.trim();
      const cleanEmail = email.trim().toLowerCase();

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

      const newUser = await createProfile(cleanEmail, hashedPassword, trimmedName);

      const response = NextResponse.json({
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.full_name,
          role: newUser.role,
          avatarUrl: newUser.avatar_url,
        },
      });

      response.cookies.set("technocat_user_id", newUser.id, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

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
      // Return default Sabrina Gomez demo profile for guest / initial experience
      const defaultUser = await getProfileByEmail("student@technocat.edu");
      return NextResponse.json({
        user: defaultUser ? {
          id: defaultUser.id,
          email: defaultUser.email,
          fullName: defaultUser.full_name,
          role: defaultUser.role,
          avatarUrl: defaultUser.avatar_url,
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
        fullName: user.full_name,
        role: user.role,
        avatarUrl: user.avatar_url,
        isGuest: false,
      },
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 404 });
}
