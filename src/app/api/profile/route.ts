import { NextRequest, NextResponse } from "next/server";
import { getProfileById, getProfileByEmail, updateProfile } from "@/lib/db";

async function resolveUserId(request: NextRequest): Promise<{ userId: string | null; isDemo: boolean }> {
  const userId = request.cookies.get("technocat_user_id")?.value;
  if (userId) {
    return { userId, isDemo: false };
  }
  const defaultUser = await getProfileByEmail("student@technocat.edu");
  return { userId: defaultUser?.id || null, isDemo: true };
}

export async function GET(request: NextRequest) {
  try {
    const { userId, isDemo } = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getProfileById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        avatarUrl: user.avatar_url,
        isGuest: isDemo,
      },
    });
  } catch (error: any) {
    console.error("[Profile GET API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch profile." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, avatarUrl } = body;

    const updates: { fullName?: string; avatarUrl?: string | null } = {};

    if (typeof fullName === "string" && fullName.trim().length > 0) {
      updates.fullName = fullName.trim();
    }

    if (avatarUrl !== undefined) {
      // Allow valid image URL / data URL or null to remove
      updates.avatarUrl = avatarUrl ? String(avatarUrl) : null;
    }

    const updatedUser = await updateProfile(userId, updates);

    return NextResponse.json({
      success: true,
      user: updatedUser
        ? {
            id: updatedUser.id,
            email: updatedUser.email,
            fullName: updatedUser.full_name,
            role: updatedUser.role,
            avatarUrl: updatedUser.avatar_url,
          }
        : null,
    });
  } catch (error: any) {
    console.error("[Profile POST API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to update profile." }, { status: 500 });
  }
}
