import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  getCurrentUser,
  isTeamOwner,
  isTeamMember,
  isWorklogOwner,
  isOrganizationOwner,
} from "@/lib/auth-utils";
import {
  apiResponse,
  badRequest,
  forbidden,
  handleApiError,
  notFound,
  unauthorized,
} from "@/lib/api-utils";
import { validateRequest, worklogStatusUpdateSchema } from "@/lib/validations";

type ProgressStatus =
  | "STARTED"
  | "HALF_DONE"
  | "COMPLETED"
  | "REVIEWED"
  | "GRADED";

/**
 * Valid status transitions
 */
const VALID_TRANSITIONS: Record<ProgressStatus, ProgressStatus[]> = {
  STARTED: ["HALF_DONE"],
  HALF_DONE: ["COMPLETED"],
  COMPLETED: ["REVIEWED"],
  REVIEWED: ["GRADED"],
  GRADED: [], // Terminal state
};

/**
 * Check if a status transition is valid
 */
function isValidTransition(
  currentStatus: ProgressStatus,
  newStatus: ProgressStatus,
): boolean {
  if (currentStatus === newStatus) return true; // No change
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

/**
 * Worklog shape expected by canUpdateToStatus (pre-fetched with includes)
 */
type WorklogWithTeamOrg = {
  id: string;
  userId: string;
  teamId: string;
  progressStatus: string;
  team: {
    organizationId: string | null;
  };
};

/**
 * Check if user can update to a specific status.
 * Accepts pre-fetched worklog to avoid redundant DB lookups.
 */
async function canUpdateToStatus(
  userId: string,
  worklog: WorklogWithTeamOrg,
  newStatus: ProgressStatus,
): Promise<{ allowed: boolean; reason?: string }> {
  // Members can update: STARTED → HALF_DONE → COMPLETED
  if (["STARTED", "HALF_DONE", "COMPLETED"].includes(newStatus)) {
    const [isOwner, isMember] = await Promise.all([
      isWorklogOwner(userId, worklog.id),
      isTeamMember(userId, worklog.teamId),
    ]);

    if (isOwner || isMember) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "Only worklog owner or team members can update to this status",
    };
  }

  // Team owners can update: COMPLETED → REVIEWED
  if (newStatus === "REVIEWED") {
    const isOwner = await isTeamOwner(userId, worklog.teamId);
    if (isOwner) {
      return { allowed: true };
    }
    return { allowed: false, reason: "Only team owners can mark as REVIEWED" };
  }

  // Organization owners can update: REVIEWED → GRADED
  if (newStatus === "GRADED") {
    if (!worklog.team.organizationId) {
      return { allowed: false, reason: "Team must belong to an organization" };
    }
    const isOrgOwner = await isOrganizationOwner(
      userId,
      worklog.team.organizationId,
    );
    if (isOrgOwner) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "Only organization owners can mark as GRADED",
    };
  }

  return { allowed: false, reason: "Invalid status" };
}

/**
 * PATCH /api/worklogs/[worklogId]/status
 * Update worklog progress status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ worklogId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { worklogId } = await params;
    const validation = await validateRequest(
      request,
      worklogStatusUpdateSchema,
    );
    if (!validation.success) {
      return badRequest(validation.error);
    }
    const { status: newStatus } = validation.data;

    // Get current worklog with team/org info (single fetch, reused for permission check)
    const worklog = await prisma.worklog.findUnique({
      where: { id: worklogId },
      include: {
        team: {
          select: { organizationId: true },
        },
      },
    });

    if (!worklog) {
      return notFound("Worklog not found");
    }

    // Check if transition is valid
    if (
      !isValidTransition(
        worklog.progressStatus as ProgressStatus,
        newStatus as ProgressStatus,
      )
    ) {
      return badRequest(
        `Invalid status transition from ${worklog.progressStatus} to ${newStatus}. ` +
          `Valid next statuses: ${VALID_TRANSITIONS[worklog.progressStatus as ProgressStatus]?.join(", ") || "none"}`,
      );
    }

    // Check if user has permission to update to this status (uses pre-fetched worklog)
    const permission = await canUpdateToStatus(
      user.id,
      worklog,
      newStatus as ProgressStatus,
    );
    if (!permission.allowed) {
      return forbidden(
        permission.reason ||
          "You don't have permission to update to this status",
      );
    }

    // Update the status
    const updated = await prisma.worklog.update({
      where: { id: worklogId },
      data: { progressStatus: newStatus },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return apiResponse({
      id: updated.id,
      title: updated.title,
      progressStatus: updated.progressStatus,
      updatedAt: updated.updatedAt,
      user: updated.user,
      team: updated.team,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/worklogs/[worklogId]/status
 * Get worklog status and valid next transitions
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ worklogId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { worklogId } = await params;

    const worklog = await prisma.worklog.findUnique({
      where: { id: worklogId },
      select: {
        id: true,
        title: true,
        progressStatus: true,
        updatedAt: true,
      },
    });

    if (!worklog) {
      return notFound("Worklog not found");
    }

    const validNextStatuses =
      VALID_TRANSITIONS[worklog.progressStatus as ProgressStatus] || [];

    return apiResponse({
      ...worklog,
      validNextStatuses,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
