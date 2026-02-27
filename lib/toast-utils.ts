import { toast } from "sonner";

/**
 * Centralized toast utility functions for consistent notification patterns
 * across the application. All functions follow duration guidelines:
 *
 * - Validation errors: 2500ms (quick feedback)
 * - Success messages: 3000ms (positive reinforcement)
 * - General errors: 3500ms (allow time to read and act)
 * - Info/warning: 3000ms (standard)
 */

export const showToasts = {
  /**
   * Validation error - for form field validation failures
   * @param field - Field name that failed validation
   * @param reason - Reason for validation failure
   */
  validationError: (field: string, reason: string) =>
    toast.error("Validation Error", {
      description: `${field}: ${reason}`,
      duration: 2500,
    }),

  /**
   * Success notification - for completed actions
   * @param action - What action was completed
   * @param details - Optional additional details
   */
  success: (action: string, details?: string) =>
    toast.success(action, {
      description: details,
      duration: 3000,
    }),

  /**
   * Error notification - for failed operations
   * @param title - Error title
   * @param details - Optional error details/reason
   */
  error: (title: string, details?: string) =>
    toast.error(title, {
      description: details,
      duration: 3500,
    }),

  /**
   * Info notification - for informational messages
   * @param title - Info title
   * @param details - Optional additional information
   */
  info: (title: string, details?: string) =>
    toast.info(title, {
      description: details,
      duration: 3000,
    }),

  /**
   * Warning notification - for potentially risky actions
   * @param title - Warning title
   * @param details - Optional warning details
   */
  warning: (title: string, details?: string) =>
    toast.warning(title, {
      description: details,
      duration: 3000,
    }),

  /**
   * Async operation notification with loading state
   * @param promise - Promise to track
   * @param messages - Object with loading, success, error messages
   */
  async: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
  ) =>
    toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    }),
};
