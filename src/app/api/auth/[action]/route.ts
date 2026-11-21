import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getProfileByEmail, getProfileById, createProfile, updateProfilePassword, deleteProfile } from "@/lib/db";
import { resolveStudentName, sanitizeAvatarUrl } from "@/lib/nameUtils";
import { getSession, setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { consumeRateLimit, resetRateLimit, getClientIp } from "@/lib/auth/rateLimit";
import { isDemoEmail } from "@/lib/demo";

const BCRYPT_COST = 12;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128; // bcrypt only uses the first 72 bytes; cap input size
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIFTEEN_MIN = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
// Used to equalise response time when the email does not exist (prevents account enumeration).
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5Q1u7Uq2vNQ4l7m1oQy3pZ0W3iY7n2a";

function isBcryptHash(value: string): boolean {
  return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
}

function toClientUser(user: any) {
  return {
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
    isDemo: isDemoEmail(user.email),
  };
}

function tooMany(retryAfterSeconds: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return NextResponse.json(
    { error: `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

async function readJson(request: NextRequest): Promise<Record<string, any>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

/**
 * Verifies a password against the stored bcrypt hash. Plaintext values are never
 * accepted (legacy plaintext rows were hashed by db/migrations/0006).
 */
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!isBcryptHash(storedHash)) return false;
  return bcrypt.compare(password, storedHash);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  const ip = getClientIp(request);

  try {
    if (action === "login") {
      const { email, password } = await readJson(request);
      if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
        return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
      }
      if (password.length > MAX_PASSWORD_LENGTH) {
        return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
      }

      const cleanEmail = email.trim().toLowerCase();
      const ipLimit = await consumeRateLimit(`login-ip:${ip}`, 50, FIFTEEN_MIN);
      if (!ipLimit.allowed) return tooMany(ipLimit.retryAfterSeconds);
      const accountKey = `login:${ip}:${cleanEmail}`;
      const accountLimit = await consumeRateLimit(accountKey, 10, FIFTEEN_MIN);
      if (!accountLimit.allowed) return tooMany(accountLimit.retryAfterSeconds);

      const user = await getProfileByEmail(cleanEmail);
      if (!user) {
        await bcrypt.compare(password, DUMMY_HASH);
        return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
      }

      const isMatch = await verifyPassword(password, user.password_hash || "");
      if (!isMatch) {
        return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
      }

      await resetRateLimit(accountKey);
      const response = NextResponse.json({ user: toClientUser(user) });
      setSessionCookie(response, user.id, user.email);
      return response;
    }

    if (action === "signup") {
      const { fullName, email, password } = await readJson(request);
      if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
        return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
      }

      const limit = await consumeRateLimit(`signup:${ip}`, 10, ONE_HOUR);
      if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

      const cleanEmail = email.trim().toLowerCase();
      if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 254) {
        return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
      }
      if (isDemoEmail(cleanEmail)) {
        return NextResponse.json({ error: "This email address is reserved." }, { status: 409 });
      }
      if (password.length < MIN_PASSWORD_LENGTH) {
        return NextResponse.json(
          { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` },
          { status: 400 }
        );
      }
      if (password.length > MAX_PASSWORD_LENGTH) {
        return NextResponse.json(
          { error: `Password must be at most ${MAX_PASSWORD_LENGTH} characters long.` },
          { status: 400 }
        );
      }

      const existing = await getProfileByEmail(cleanEmail);
      if (existing) {
        return NextResponse.json({ error: "An account with this email already exists. Please sign in." }, { status: 409 });
      }

      const safeName = typeof fullName === "string" ? fullName.trim().slice(0, 80) : "";
      const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);
      const newUser = await createProfile(cleanEmail, hashedPassword, resolveStudentName(safeName, cleanEmail));

      const response = NextResponse.json({ user: toClientUser(newUser) });
      setSessionCookie(response, newUser.id, newUser.email);
      return response;
    }

    if (action === "change-password") {
      const session = getSession(request);
      if (!session) {
        return NextResponse.json({ error: "Please sign in to change your password." }, { status: 401 });
      }
      if (session.isDemo) {
        return NextResponse.json(
          { error: "Demo showcase account is protected and cannot change passwords." },
          { status: 403 }
        );
      }

      const limit = await consumeRateLimit(`change-password:${session.userId}`, 10, FIFTEEN_MIN);
      if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

      const { currentPassword, newPassword } = await readJson(request);
      if (typeof currentPassword !== "string" || typeof newPassword !== "string" || !currentPassword || !newPassword) {
        return NextResponse.json({ error: "Current password and new password are required." }, { status: 400 });
      }
      if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
        return NextResponse.json(
          { error: `New password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.` },
          { status: 400 }
        );
      }

      const user = await getProfileById(session.userId);
      if (!user) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }

      const isMatch = await verifyPassword(currentPassword, user.password_hash || "");
      if (!isMatch) {
        return NextResponse.json({ error: "Current password does not match our records." }, { status: 400 });
      }

      await updateProfilePassword(user.id, await bcrypt.hash(newPassword, BCRYPT_COST));

      // Re-issue the session so the current device stays signed in.
      const response = NextResponse.json({ success: true, message: "Password updated successfully!" });
      setSessionCookie(response, user.id, user.email);
      return response;
    }

    if (action === "delete-account") {
      const session = getSession(request);
      if (!session) {
        return NextResponse.json({ error: "Please sign in to delete your account." }, { status: 401 });
      }
      if (session.isDemo) {
        return NextResponse.json(
          { error: "Demo showcase accounts cannot be deleted as they are shared sandbox environments." },
          { status: 403 }
        );
      }

      const user = await getProfileById(session.userId);
      if (!user) {
        const gone = NextResponse.json({ error: "User not found." }, { status: 404 });
        clearSessionCookie(gone);
        return gone;
      }

      await deleteProfile(user.id);

      const response = NextResponse.json({ success: true, message: "Account deleted successfully." });
      clearSessionCookie(response);
      return response;
    }

    if (action === "logout") {
      const response = NextResponse.json({ success: true });
      clearSessionCookie(response);
      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 404 });
  } catch (error) {
    console.error(`[Auth API Error] action=${action}`, error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;

  if (action !== "me") {
    return NextResponse.json({ error: "Invalid action" }, { status: 404 });
  }

  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  try {
    const user = await getProfileById(session.userId);
    if (!user) {
      // Account no longer exists: drop the stale session.
      const response = NextResponse.json({ user: null });
      clearSessionCookie(response);
      return response;
    }
    return NextResponse.json({ user: toClientUser(user) });
  } catch (error) {
    console.error("[Auth API Error] action=me", error);
    return NextResponse.json({ error: "Unable to load session." }, { status: 500 });
  }
}
