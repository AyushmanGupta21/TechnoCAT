// Calendar dates are evaluated in the students' timezone (India), not the server's (UTC),
// so "today", streaks and daily study time line up with the student's day.

export const APP_TIMEZONE = "Asia/Kolkata";

/** Today's date in the app timezone as YYYY-MM-DD. */
export function todayInAppTz(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });
}

/** Add (or subtract) whole days to a YYYY-MM-DD date string. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}
