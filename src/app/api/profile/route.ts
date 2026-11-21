import { NextRequest, NextResponse } from "next/server";
import { getProfileById, updateProfile } from "@/lib/db";
import { resolveStudentName, sanitizeAvatarUrl } from "@/lib/nameUtils";
import { getSession } from "@/lib/auth/session";

async function resolveUserId(request: NextRequest): Promise<{ userId: string | null; isDemo: boolean }> {
  const session = getSession(request);
  return { userId: session?.userId ?? null, isDemo: session?.isDemo ?? false };
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
        fullName: resolveStudentName(user.full_name, user.email),
        role: user.role,
        avatarUrl: sanitizeAvatarUrl(user.avatar_url),
        phone: user.phone || "",
        targetYear: user.target_year || "CAT 2026",
        dreamSchool: user.dream_school || "",
        preferences: user.preferences || {},
        leaderboardOptOut: Boolean(user.leaderboard_opt_out),
        isGuest: false,
        isDemo,
      },
    });
  } catch (error: any) {
    console.error("[Profile GET API Error]", error);
    return NextResponse.json({ error: "Failed to fetch profile." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { fullName, avatarUrl, phone, targetYear, dreamSchool, preferences, leaderboardOptOut } = body;

    const updates: {
      fullName?: string;
      avatarUrl?: string | null;
      phone?: string;
      targetYear?: string;
      dreamSchool?: string;
      preferences?: any;
      leaderboardOptOut?: boolean;
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
      if (!preferences || typeof preferences !== "object" || Array.isArray(preferences)) {
        return NextResponse.json({ error: "preferences must be an object" }, { status: 400 });
      }
      // Merge (not replace): different screens own different keys (settings switches,
      // predictor profile, …) and must not wipe each other's data.
      const current = await getProfileById(userId);
      updates.preferences = { ...(current?.preferences || {}), ...preferences };
    }

    if (typeof leaderboardOptOut === "boolean") {
      updates.leaderboardOptOut = leaderboardOptOut;
    }

    const updatedUser = await updateProfile(userId, updates);

    return NextResponse.json({
      success: true,
      user: updatedUser
        ? {
            id: updatedUser.id,
            email: updatedUser.email,
            fullName: resolveStudentName(updatedUser.full_name, updatedUser.email),
            role: updatedUser.role,
            avatarUrl: sanitizeAvatarUrl(updatedUser.avatar_url),
            phone: updatedUser.phone || "",
            targetYear: updatedUser.target_year || "CAT 2026",
            dreamSchool: updatedUser.dream_school || "",
            preferences: updatedUser.preferences || {},
            leaderboardOptOut: Boolean(updatedUser.leaderboard_opt_out),
          }
        : null,
    });
  } catch (error: any) {
    console.error("[Profile POST API Error]", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
