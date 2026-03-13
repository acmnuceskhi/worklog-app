import { useCallback } from "react";
import {
  validateTeamMemberEmail,
  validateOrganizationOwnerEmail,
  getAllowedDomains,
} from "@/lib/validations/email-domain-validation";

/**
 * Returns memoized domain validator functions for use in React components.
 *
 * The returned validators are stable across renders and safe to pass as
 * props to memoized children (e.g. BulkEmailInput.validateEmail).
 */
export function useEmailDomainValidator() {
  const validateTeamEmail = useCallback(
    (email: string): boolean => validateTeamMemberEmail(email),
    [],
  );

  const validateOrgEmail = useCallback(
    (email: string): boolean => validateOrganizationOwnerEmail(email),
    [],
  );

  const allowedDomains = getAllowedDomains();

  return { validateTeamEmail, validateOrgEmail, allowedDomains };
}
