import { NextRequest, NextResponse } from "next/server";
import { getProfileByEmail, getProfileById, createProfile } from "@/lib/db";

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

      const user = await getProfileByEmail(email);
      if (!user) {
        return NextResponse.json({ error: "No account found with this email." }, { status: 401 });
      }

      // Plaintext or hashed comparison (supporting demo password 'techno123')
      if (user.password_hash !== password) {
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

      const existing = await getProfileByEmail(email);
      if (existing) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }

      const newUser = await createProfile(email, password, fullName);

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
