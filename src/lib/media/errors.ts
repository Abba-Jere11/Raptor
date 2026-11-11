/** Map storage/DB noise into a short staff-facing message. */
export function friendlyMediaError(raw: string | null | undefined, fallback = "That file could not be processed."): string {
  const message = (raw ?? "").trim();
  if (!message) return fallback;
  if (/timeout|timed out|statement timeout|canceling statement/i.test(message)) {
    return "The database timed out. Wait a moment, then try fewer photos at once.";
  }
  if (/fetch failed|ECONNREFUSED|network|Failed to fetch|ENOTFOUND|socket hang up/i.test(message)) {
    return "Could not reach storage or the database. Check that local Supabase is running, then try again.";
  }
  if (/Payload too large|Entity Too Large|413/i.test(message)) {
    return "That file is too large. Use a smaller original and try again.";
  }
  return message.length > 180 ? `${message.slice(0, 177)}…` : message;
}
