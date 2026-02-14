import { z } from "zod";

/**
 * Credits Management Schemas
 */
export const creditsUpdateSchema = z.object({
  action: z.enum(["add", "subtract", "set"]),
  amount: z.number().nonnegative("Amount must be non-negative"),
});

/**
 * Worklog Status Update Schema
 */
export const worklogStatusUpdateSchema = z.object({
  status: z.enum(["STARTED", "HALF_DONE", "COMPLETED", "REVIEWED", "GRADED"]),
});

/**
 * Rating Schemas
 */
export const ratingCreateSchema = z.object({
  value: z
    .number()
    .int("Rating value must be an integer")
    .min(1, "Rating value must be at least 1")
    .max(10, "Rating value must be at most 10"),
  comment: z
    .string()
    .max(1000, "Comment must be at most 1000 characters")
    .optional(),
});

export const ratingUpdateSchema = z.object({
  value: z
    .number()
    .int("Rating value must be an integer")
    .min(1, "Rating value must be at least 1")
    .max(10, "Rating value must be at most 10")
    .optional(),
  comment: z
    .string()
    .max(1000, "Comment must be at most 1000 characters")
    .optional(),
});

/**
 * Organization Schemas
 */
export const organizationCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Organization name must not be empty")
    .max(100, "Organization name must be at most 100 characters"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),
});

export const organizationUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Organization name must not be empty")
    .max(100, "Organization name must be at most 100 characters"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),
});

/**
 * Team Schemas
 */
export const teamCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Team name must not be empty")
    .max(100, "Team name must be at most 100 characters"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),
  project: z
    .string()
    .max(100, "Project name must be at most 100 characters")
    .optional(),
  organizationId: z.string().cuid("Invalid organization ID format").optional(),
});

export const teamUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Team name must not be empty")
    .max(100, "Team name must be at most 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),
  project: z
    .string()
    .max(100, "Project name must be at most 100 characters")
    .optional(),
});

export const teamInviteSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const teamInviteMultipleSchema = z.object({
  emails: z
    .array(z.string().email("Invalid email format"))
    .min(1, "At least one email is required"),
});

/**
 * Worklog Schemas
 */
export const worklogCreateSchema = z.object({
  title: z
    .string()
    .min(1, "Title must not be empty")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .min(1, "Description must not be empty")
    .refine(
      (value) => value.replace(/<[^>]*>/g, "").trim().length > 0,
      "Description must not be empty",
    ),
  githubLink: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^https:\/\/(www\.)?github\.com\/.+/.test(value),
      "Must be a valid GitHub URL",
    ),
  deadline: z
    .string()
    .datetime("Invalid deadline format")
    .or(z.date())
    .optional(),
  progressStatus: z.enum(["STARTED", "HALF_DONE", "COMPLETED"]).optional(),
  attachments: z
    .array(
      z.object({
        url: z.string().min(1, "Attachment URL is required"),
        name: z.string().min(1, "Attachment name is required"),
        size: z.number().int().nonnegative(),
        type: z.string().min(1, "Attachment type is required"),
      }),
    )
    .optional(),
  teamId: z.string().cuid("Invalid team ID format"),
  userId: z.string().cuid("Invalid user ID format").optional(), // For team owners assigning tasks
});

export const worklogUpdateSchema = z.object({
  title: z
    .string()
    .min(1, "Title must not be empty")
    .max(200, "Title must be at most 200 characters")
    .optional(),
  description: z.string().min(1, "Description must not be empty").optional(),
  githubLink: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .string()
      .url("Invalid GitHub link URL")
      .regex(/^https:\/\/(www\.)?github\.com\/.+/, "Must be a valid GitHub URL")
      .optional()
      .nullable(),
  ),
  deadline: z
    .string()
    .datetime("Invalid deadline format")
    .or(z.date())
    .optional()
    .nullable(),
});

/**
 * Utility function to validate request body with Zod schema
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>,
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      return { success: false, error: errorMessage };
    }
    return { success: false, error: "Invalid request body" };
  }
}
