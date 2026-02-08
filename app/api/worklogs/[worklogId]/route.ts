import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  badRequest,
  forbidden,
  getCurrentUser,
  notFound,
  success,
  unauthorized,
  isOrganizationOwner,
  isTeamOwner,
} from "@/lib/auth-utils";
import { validateRequest, worklogUpdateSchema } from "@/lib/validations";

/**
 * PATCH /api/worklogs/[worklogId]
 * Update worklog fields (deadline only)
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
    const validation = await validateRequest(request, worklogUpdateSchema);
    if (!validation.success) {
      return badRequest(validation.error);
    }

    const { deadline, ...rest } = validation.data;
    if (Object.keys(rest).length > 0) {
      return badRequest("Only deadline updates are supported here");
    }

    const worklog = await prisma.worklog.findUnique({
      where: { id: worklogId },
      include: { team: { include: { organization: true } } },
    });

    if (!worklog) {
      return notFound("Worklog not found");
    }

    const isOwner = await isTeamOwner(user.id, worklog.teamId);
    const isOrgOwner = worklog.team.organizationId
      ? await isOrganizationOwner(user.id, worklog.team.organizationId)
      : false;

    if (!isOwner && !isOrgOwner) {
      return forbidden("Only team or organization owners can edit deadlines");
    }

    const updated = await prisma.worklog.update({
      where: { id: worklogId },
      data: {
        deadline: deadline ? new Date(deadline) : null,
      },
      select: {
        id: true,
        title: true,
        deadline: true,
        progressStatus: true,
        updatedAt: true,
      },
    });

    return success({ data: updated });
  } catch (error) {
    console.error("Update worklog deadline error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
