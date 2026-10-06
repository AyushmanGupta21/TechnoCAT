/**
 * Resolves the student's display name.
 * 1. If registered with a valid name (and not legacy mock names like Sabrina), use it.
 * 2. If no name was registered, extract the student's name from their email address.
 *    e.g. "student@technocat.edu" -> "Student"
 *    e.g. "ayushman.gupta@domain.com" -> "Ayushman Gupta"
 *    e.g. "rahul_verma@gmail.com" -> "Rahul Verma"
 * 3. Never fallback to hardcoded mock names.
 */
export function resolveStudentName(fullName?: string | null, email?: string | null): string {
  if (fullName && typeof fullName === "string") {
    const trimmed = fullName.trim();
    const lower = trimmed.toLowerCase();
    if (trimmed.length > 0 && lower !== "sabrina gomez" && lower !== "sabrina") {
      return trimmed;
    }
  }

  if (email && typeof email === "string" && email.includes("@")) {
    const localPart = email.split("@")[0].trim();
    if (localPart.length > 0) {
      const formatted = localPart
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
      return formatted || localPart;
    }
  }

  return "Student";
}

export const DEFAULT_PROFILE_ICON = "/profile_icon.png";

/**
 * Filter out hardcoded demo avatars so fake photos never show up for students.
 */
export function sanitizeAvatarUrl(avatarUrl?: string | null): string | null {
  if (!avatarUrl || typeof avatarUrl !== "string") return null;
  if (avatarUrl.includes("photo-1494790108377")) return null;
  return avatarUrl;
}

/**
 * Resolves user avatar URL.
 * Returns custom avatar if set by the user, otherwise returns the default profile icon.
 */
export function resolveUserAvatarUrl(avatarUrl?: string | null): string {
  const clean = sanitizeAvatarUrl(avatarUrl);
  if (clean && clean.trim().length > 0 && clean !== DEFAULT_PROFILE_ICON) {
    return clean;
  }
  return DEFAULT_PROFILE_ICON;
}
