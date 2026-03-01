/**
 * Structured audit logging for security-sensitive operations.
 *
 * Emits JSON log lines that can be ingested by Vercel Logs,
 * Datadog, or any structured-log aggregator.
 */

interface AuditEntry {
  timestamp: string;
  action: string;
  userId: string;
  [key: string]: unknown;
}

/**
 * Log a security-relevant action with structured JSON output.
 *
 * @param action   Machine-readable action identifier (e.g. "TEAM_MEMBER_REMOVED")
 * @param userId   ID of the user who performed the action
 * @param details  Optional key/value context (teamId, worklogId, etc.)
 *
 * @example
 * auditLog("WORKLOG_RATED", session.user.id, { worklogId, rating: 8 });
 */
export function auditLog(
  action: string,
  userId: string,
  details?: Record<string, unknown>,
): void {
  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    action,
    userId,
    ...details,
  };

  console.log(JSON.stringify(entry));
}
