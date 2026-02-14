/**
 * Database Operations Tracking Utility
 * Tracks Prisma operations for monitoring usage against free tier limits
 */

let monthlyOperations = 0;
let sessionOperations = 0;

/**
 * Track a database operation
 * @param operation - Description of the operation (e.g., 'user.findUnique', 'worklog.create')
 */
export function trackOperation(operation: string) {
  monthlyOperations++;
  sessionOperations++;
  console.log(
    `📊 Operation: ${operation} | Session: ${sessionOperations} | Total: ${monthlyOperations}`,
  );
}

/**
 * Reset session operation counter
 * Call at the start of each test session or user interaction
 */
export function resetSessionCounter() {
  sessionOperations = 0;
}

/**
 * Get current operation counts
 */
export function getOperationCounts() {
  return {
    monthly: monthlyOperations,
    session: sessionOperations,
  };
}

/**
 * Check if we're approaching operation limits
 */
export function checkOperationLimits() {
  const FREE_TIER_LIMIT = 100000;
  const WARNING_THRESHOLD = 80000; // 80% of limit

  if (monthlyOperations >= WARNING_THRESHOLD) {
    console.warn(
      `⚠️  Approaching operation limit: ${monthlyOperations}/${FREE_TIER_LIMIT} (${((monthlyOperations / FREE_TIER_LIMIT) * 100).toFixed(1)}%)`,
    );
  }

  if (monthlyOperations >= FREE_TIER_LIMIT) {
    console.error(
      `🚨 Operation limit exceeded: ${monthlyOperations}/${FREE_TIER_LIMIT}`,
    );
  }

  return {
    current: monthlyOperations,
    limit: FREE_TIER_LIMIT,
    percentage: ((monthlyOperations / FREE_TIER_LIMIT) * 100).toFixed(1),
    isNearLimit: monthlyOperations >= WARNING_THRESHOLD,
    isOverLimit: monthlyOperations >= FREE_TIER_LIMIT,
  };
}

/**
 * Log operation summary for debugging
 */
export function logOperationSummary() {
  const limits = checkOperationLimits();
  console.log(`📈 Operation Summary:`);
  console.log(
    `   Monthly: ${limits.current}/${limits.limit} (${limits.percentage}%)`,
  );
  console.log(`   Session: ${sessionOperations} operations`);
  console.log(
    `   Status: ${limits.isOverLimit ? "🚨 OVER LIMIT" : limits.isNearLimit ? "⚠️  NEAR LIMIT" : "✅ SAFE"}`,
  );
}
