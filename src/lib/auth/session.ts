// Signed, expiring session cookies (server-only).
//
// Token format: base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload, JWT_SECRET)).
// The payload carries the user id and email so route handlers can authorize requests
// (including the demo-account check) without trusting anything the client sends.

import crypto from "crypto";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { isDemoEmail } from "@/lib/demo";

export const SESSION_COOKIE = "technocat_session";
// Old unsigned cookie (raw user id). Never trusted; only cleared on login/logout.
const LEGACY_COOKIE = "technocat_user_id";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface Session {
  userId: string;
  email: string;
  isDemo: boolean;
}

interface SessionPayload {
  v: 1;
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

function getSecret(): Buffer {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET is missing or shorter than 32 characters. Set a long random value in .env.local / deployment env."
    );
  }
  return Buffer.from(secret, "utf8");
}

function sign(data: string): string {
  return crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function createSessionToken(userId: string, email: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    v: 1,
    sub: userId,
    email: email.trim().toLowerCase(),
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token: string | undefined | null): Session | null {
  if (!token || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot !== token.lastIndexOf(".")) return null;

  const encoded = token.slice(0, dot);
  const providedSig = Buffer.from(token.slice(dot + 1), "base64url");
  const expectedSig = Buffer.from(sign(encoded), "base64url");
  if (providedSig.length !== expectedSig.length || !crypto.timingSafeEqual(providedSig, expectedSig)) {
    return null;
  }

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (payload?.v !== 1 || typeof payload.sub !== "string" || !UUID_RE.test(payload.sub)) return null;
  if (typeof payload.exp !== "number" || payload.exp <= Math.floor(Date.now() / 1000)) return null;
  if (typeof payload.email !== "string") return null;

  return { userId: payload.sub, email: payload.email, isDemo: isDemoEmail(payload.email) };
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

/** Attach a fresh session cookie to a route-handler response. */
export function setSessionCookie(response: NextResponse, userId: string, email: string): void {
  response.cookies.set(SESSION_COOKIE, createSessionToken(userId, email), cookieOptions());
  response.cookies.delete(LEGACY_COOKIE);
}

/** Remove the session (and any legacy cookie) from a route-handler response. */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(LEGACY_COOKIE);
}

/** Resolve the signed-in user for a Route Handler. Returns null when not signed in. */
export function getSession(request: NextRequest): Session | null {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

/** Resolve the signed-in user inside Server Functions / Server Components. */
export async function getServerSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}
