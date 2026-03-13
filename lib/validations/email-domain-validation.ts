import {
  isAllowedEmailDomain,
  ALLOWED_EMAIL_DOMAINS,
} from "@/lib/config/email-domains";

/**
 * Validates that a single email belongs to an allowed university domain.
 * Used for team member invitation inputs.
 */
export function validateTeamMemberEmail(email: string): boolean {
  return isAllowedEmailDomain(email);
}

/**
 * Validates that a single email belongs to an allowed university domain.
 * Used for organization owner invitation inputs.
 */
export function validateOrganizationOwnerEmail(email: string): boolean {
  return isAllowedEmailDomain(email);
}

/**
 * Returns the list of allowed domain strings for display in UI help text.
 * e.g. ["@nu.edu.pk", "@isb.nu.edu.pk"]
 */
export function getAllowedDomains(): string[] {
  return [...ALLOWED_EMAIL_DOMAINS];
}
