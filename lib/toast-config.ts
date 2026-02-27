/**
 * Toast Configuration & Best Practices Guide
 *
 * This file documents Sonner toast configuration, duration guidelines,
 * and usage patterns to ensure consistency across the application.
 *
 * @see {@link components/ui/sonner.tsx} - Sonner component configuration
 * @see {@link lib/toast-utils.ts} - Reusable toast functions
 */

/**
 * Toast Duration Guidelines (in milliseconds)
 *
 * Use these durations to balance user experience:
 * - Allow sufficient time to read the message
 * - Dismiss automatically to prevent clutter
 * - Consider cognitive load of the operation
 */
export const TOAST_DURATION = {
  /** Micro-validations (single form field, quick feedback) - 2 seconds */
  VALIDATION: 2000,

  /** User confirmations (validate before action) - 2.5 seconds */
  CONFIRMATION: 2500,

  /** Success notifications (operation completed) - 3 seconds */
  SUCCESS: 3000,

  /** Error notifications (user must read and understand) - 3.5 seconds */
  ERROR: 3500,

  /** Info/Warning messages (standard informational) - 3 seconds */
  INFO: 3000,

  /** Loading state (auto-dismiss on success/error) - infinite until resolved */
  LOADING: Infinity,
} as const;

/**
 * Toast Position Strategy
 *
 * `bottom-right` is optimal because:
 * - Avoids overlap with header/navigation (top)
 * - Doesn't block main content (center)
 * - Works well on mobile (bottom)
 * - Conventional for users (matches browser notifications)
 *
 * Sonner Configuration:
 * - position: "bottom-right"
 * - limit: 3 (max visible toasts)
 * - gap: 12px (spacing between toasts)
 */
export const TOAST_POSITION = "bottom-right" as const;

/**
 * Toast Concurrency Rules
 *
 * Configure maximum visible toasts:
 * - limit={3}: Maximum 3 toasts visible simultaneously
 * - Older toasts auto-dismiss to make room for new ones
 * - Users can close individual toasts to reveal dismissed ones
 * - Prevents notification spam and UI clutter
 */
export const TOAST_LIMITS = {
  /** Maximum number of toasts shown simultaneously */
  MAX_VISIBLE: 3,
  /** Spacing between toasts in pixels */
  GAP_PX: 12,
} as const;

/**
 * Toast Type Guidelines
 *
 * Choose appropriate toast type based on notification category:
 */
export const TOAST_TYPES = {
  /**
   * error() - User action failed or validation issue
   *
   * Examples:
   * - Form validation failures
   * - API request errors
   * - File upload failures
   * - Permission denied actions
   *
   * Pattern: error("Error Title", { description: "Details..." })
   * Duration: TOAST_DURATION.ERROR (3500ms)
   */
  ERROR: "error" as const,

  /**
   * success() - Action completed successfully
   *
   * Examples:
   * - Team created
   * - Worklog submitted
   * - Team member invited
   * - Settings saved
   *
   * Pattern: success("Success Title", { description: "Details..." })
   * Duration: TOAST_DURATION.SUCCESS (3000ms)
   */
  SUCCESS: "success" as const,

  /**
   * warning() - Potentially risky action (non-blocking)
   *
   * Examples:
   * - Delete operation confirmation
   * - Overwrite existing data
   * - Deprecated feature usage
   * - Resource limit approaching
   *
   * Pattern: warning("Warning Title", { description: "Details..." })
   * Duration: TOAST_DURATION.INFO (3000ms)
   */
  WARNING: "warning" as const,

  /**
   * info() - Informational, not an error
   *
   * Examples:
   * - Feature coming soon
   * - Update available
   * - Helpful tips
   * - Status changes
   *
   * Pattern: info("Info Title", { description: "Details..." })
   * Duration: TOAST_DURATION.INFO (3000ms)
   */
  INFO: "info" as const,

  /**
   * promise() - Async operation with loading state
   *
   * Examples:
   * - Creating worklog
   * - Updating team
   * - Uploading files
   * - Sending invitations
   *
   * Pattern: toast.promise(promise, { loading, success, error })
   * Duration: Auto (shows until promise resolves)
   */
  PROMISE: "promise" as const,
} as const;

/**
 * Message Format Guidelines
 *
 * All toasts should follow Title + Description pattern:
 *
 * ✅ Good Examples:
 * - error("Validation Error", "Email must be valid format")
 * - success("Team Created", "Your team 'Frontend Dev' is ready")
 * - info("Feature Coming Soon", "This will be available in Q2 2026")
 *
 * ❌ Bad Examples:
 * - error("Error") - No context
 * - success("OK") - Non-descriptive
 * - info("Something happened") - Vague
 *
 * Rules:
 * - Title (main toast text): Concise, 3-5 words
 * - Description: Provides context/action (optional but recommended)
 * - Avoid technical jargon in user-facing messages
 * - Use active voice when possible
 */

/**
 * Common Toast Patterns
 *
 * 1. Form Validation:
 *    showToasts.validationError("Email", "Invalid email format")
 *
 * 2. API Success:
 *    showToasts.success("Team Created", "Your team is ready to use")
 *
 * 3. API Error:
 *    showToasts.error("Update Failed", "Please check your connection and try again")
 *
 * 4. Async Operation:
 *    showToasts.async(createTeamMutation(), {
 *      loading: "Creating team...",
 *      success: "Team created successfully",
 *      error: "Failed to create team",
 *    })
 *
 * 5. Warning Action:
 *    showToasts.warning("Delete Team", "This action cannot be undone")
 */

/**
 * Migration Checklist for Replacing alert()
 *
 * When replacing browser alert() calls:
 * - [ ] Use toast.error() for validation/errors
 * - [ ] Use toast.info() for informational messages
 * - [ ] Use toast.warning() for potentially risky actions
 * - [ ] Add title + description for clarity
 * - [ ] Set appropriate duration (2500-3500ms)
 * - [ ] Import { toast } from "sonner" at top of file
 * - [ ] Test in development mode
 * - [ ] Verify toast appears in bottom-right corner
 */
