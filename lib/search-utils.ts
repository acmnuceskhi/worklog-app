/**
 * Search utility functions for client-side filtering.
 * Used by useTeamSearch and useWorklogSearch hooks.
 */

/**
 * Strip HTML tags from a string for searchable plain text.
 * Handles TipTap rich-text content in worklog descriptions.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Case-insensitive substring match.
 * Returns true if the query is found anywhere in the text.
 */
export function textMatches(text: string, query: string): boolean {
  if (!query) return true;
  return text.toLowerCase().includes(query.toLowerCase());
}

/**
 * Build a searchable string by joining multiple nullable field values.
 * Strips HTML from any value that may contain rich text.
 */
export function buildSearchableText(
  ...fields: (string | null | undefined)[]
): string {
  return fields
    .filter(Boolean)
    .map((f) => (f!.includes("<") ? stripHtml(f!) : f!))
    .join(" ")
    .toLowerCase();
}

/**
 * Score a text match for relevance ranking.
 *   100 — exact match
 *    80 — starts-with match
 *    60 — substring match
 *     0 — no match
 */
export function matchScore(text: string, query: string): number {
  const h = text.toLowerCase();
  const n = query.toLowerCase();

  if (!n) return 100; // empty query matches everything equally
  if (h === n) return 100;
  if (h.startsWith(n)) return 80;
  if (h.includes(n)) return 60;
  return 0;
}

/**
 * Escape regex special characters in a string.
 * Used when building highlight RegExp from user input.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
