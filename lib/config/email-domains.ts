/**
 * Allowed email domains for team and organization invitations.
 *
 * Only users with emails from these domains may be invited.
 * This mirrors the OAuth provider restriction (Google hd parameter).
 */
export const ALLOWED_EMAIL_DOMAINS = ["@nu.edu.pk", "@isb.nu.edu.pk"] as const;

/**
 * Returns true if the given email belongs to an allowed university domain.
 */
export function isAllowedEmailDomain(email: string): boolean {
  const lower = email.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some((domain) => lower.endsWith(domain));
}
