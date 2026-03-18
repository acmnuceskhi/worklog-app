import { z } from "zod";

const githubTokenRegex = /^https:\/\/(www\.)?github\.com\/.+/;

function parseGithubLinks(value: string) {
  return value
    .split(/[\n,\s]+/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function hasValidGithubLinks(value?: string) {
  if (!value) return true;
  const links = parseGithubLinks(value);
  return links.length > 0 && links.every((link) => githubTokenRegex.test(link));
}

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
  // null = explicitly remove org link; undefined = no change; string = set/change org
  organizationId: z
    .string()
    .cuid("Invalid organization ID format")
    .nullable()
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

export const organizationInviteMultipleSchema = z.object({
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
  description: z.string().optional(),
  githubLink: z
    .string()
    .optional()
    .refine(
      (value) => hasValidGithubLinks(value),
      "Must contain valid GitHub URL(s), separated by commas/new lines",
    ),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Deadline must be in YYYY-MM-DD format")
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
  description: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().optional(),
  ),
  githubLink: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .string()
      .refine(
        (value) => hasValidGithubLinks(value),
        "Must contain valid GitHub URL(s), separated by commas/new lines",
      )
      .optional()
      .nullable(),
  ),
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
  deadline: z
    .string()
    .refine(
      (value) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
        return !Number.isNaN(new Date(value).getTime());
      },
      { message: "Invalid deadline format" },
    )
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
