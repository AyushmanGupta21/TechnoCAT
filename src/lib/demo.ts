// Single source of truth for the showcase/demo account.
//
// The demo account intentionally displays prefilled showcase data so the product can be
// demonstrated without days of real usage. Every other account must only ever see data
// derived from its own activity. Safe to import from both client and server code.

export const DEMO_EMAIL = "student@technocat.edu";

export function isDemoEmail(email: string | null | undefined): boolean {
  return typeof email === "string" && email.trim().toLowerCase() === DEMO_EMAIL;
}
