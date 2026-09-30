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
        phone: user.phone || "",
        targetYear: user.target_year || "CAT 2026",
        dreamSchool: user.dream_school || "",
        preferences: user.preferences || {},
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
    const { fullName, avatarUrl, phone, targetYear, dreamSchool, preferences } = body;

    const updates: {
      fullName?: string;
      avatarUrl?: string | null;
      phone?: string;
      targetYear?: string;
      dreamSchool?: string;
      preferences?: any;
    } = {};

    if (typeof fullName === "string" && fullName.trim().length > 0) {
      updates.fullName = fullName.trim();
    }

    if (avatarUrl !== undefined) {
      // Allow valid image URL / data URL or null to remove
      updates.avatarUrl = avatarUrl ? String(avatarUrl) : null;
    }

    if (phone !== undefined) {
      updates.phone = String(phone).trim();
    }

    if (targetYear !== undefined) {
      updates.targetYear = String(targetYear).trim();
    }

    if (dreamSchool !== undefined) {
      updates.dreamSchool = String(dreamSchool).trim();
    }

    if (preferences !== undefined) {
      updates.preferences = preferences;
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
            phone: updatedUser.phone || "",
            targetYear: updatedUser.target_year || "CAT 2026",
            dreamSchool: updatedUser.dream_school || "",
            preferences: updatedUser.preferences || {},
          }
        : null,
    });
  } catch (error: any) {
    console.error("[Profile POST API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to update profile." }, { status: 500 });
  }
}
