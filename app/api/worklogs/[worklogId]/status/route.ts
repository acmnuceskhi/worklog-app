import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getCurrentUser,
  isTeamOwner,
  isTeamMember,
  isWorklogOwner,
  isOrganizationOwner,
  unauthorized,
  forbidden,
  notFound,
  success,
  badRequest,
} from "@/lib/auth-utils";
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
 * Check if user can update to a specific status
 */
async function canUpdateToStatus(
  userId: string,
  worklogId: string,
  newStatus: ProgressStatus,
): Promise<{ allowed: boolean; reason?: string }> {
  const worklog = await prisma.worklog.findUnique({
    where: { id: worklogId },
    include: {
      team: {
        include: {
          organization: true,
        },
      },
    },
  });

  if (!worklog) {
    return { allowed: false, reason: "Worklog not found" };
  }

  // Members can update: STARTED → HALF_DONE → COMPLETED
  if (["STARTED", "HALF_DONE", "COMPLETED"].includes(newStatus)) {
    const isOwner = await isWorklogOwner(userId, worklogId);
    const isMember = await isTeamMember(userId, worklog.teamId);

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

    // Get current worklog
    const worklog = await prisma.worklog.findUnique({
      where: { id: worklogId },
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

    // Check if user has permission to update to this status
    const permission = await canUpdateToStatus(
      user.id,
      worklogId,
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

    return success({
      id: updated.id,
      title: updated.title,
      progressStatus: updated.progressStatus,
      updatedAt: updated.updatedAt,
      user: updated.user,
      team: updated.team,
    });
  } catch (error) {
    console.error("Update worklog status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
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

    return success({
      ...worklog,
      validNextStatuses,
    });
  } catch (error) {
    console.error("Get worklog status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
