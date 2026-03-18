import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  getCurrentUser,
  isOrganizationOwner,
  isTeamOwner,
  isWorklogOwner,
} from "@/lib/auth-utils";
import {
  apiResponse,
  badRequest,
  forbidden,
  handleApiError,
  notFound,
  unauthorized,
} from "@/lib/api-utils";
import { validateRequest, worklogUpdateSchema } from "@/lib/validations";

/**
 * PATCH /api/worklogs/[worklogId]
 * Update worklog fields (content and/or deadline)
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

    const { deadline, title, description, githubLink, attachments } =
      validation.data;
    const hasDeadlineUpdate = "deadline" in validation.data;
    const hasContentUpdate =
      title !== undefined ||
      description !== undefined ||
      githubLink !== undefined ||
      (attachments?.length ?? 0) > 0;

    if (!hasDeadlineUpdate && !hasContentUpdate) {
      return badRequest("No valid updates provided");
    }

    const worklog = await prisma.worklog.findUnique({
      where: { id: worklogId },
      include: { team: { include: { organization: true } } },
    });

    if (!worklog) {
      return notFound("Worklog not found");
    }

    const [isTeamOwnr, isOrgOwner, isOwnerOfWorklog] = await Promise.all([
      isTeamOwner(user.id, worklog.teamId),
      worklog.team.organizationId
        ? isOrganizationOwner(user.id, worklog.team.organizationId)
        : Promise.resolve(false),
      isWorklogOwner(user.id, worklog.id),
    ]);

    if (hasDeadlineUpdate && !isTeamOwnr && !isOrgOwner) {
      return forbidden("Only team or organization owners can edit deadlines");
    }

    if (hasContentUpdate && !isOwnerOfWorklog) {
      return forbidden("Only the worklog creator can edit this worklog");
    }

    if (
      hasContentUpdate &&
      (worklog.progressStatus === "REVIEWED" ||
        worklog.progressStatus === "GRADED")
    ) {
      return forbidden("Reviewed or graded worklogs are locked for editing");
    }

    const updateData: {
      deadline?: Date | null;
      title?: string;
      description?: string;
      githubLink?: string | null;
      attachments?: {
        create: Array<{
          url: string;
          fileName: string;
          mimeType: string;
          size: number;
          kind: string;
        }>;
      };
    } = {};

    if (hasDeadlineUpdate) {
      updateData.deadline = deadline ? new Date(deadline) : null;
    }

    if (title !== undefined) {
      updateData.title = title;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (githubLink !== undefined) {
      updateData.githubLink = githubLink || null;
    }

    if (attachments && attachments.length > 0) {
      updateData.attachments = {
        create: attachments.map((attachment) => ({
          url: attachment.url,
          fileName: attachment.name,
          mimeType: attachment.type,
          size: attachment.size,
          kind: attachment.type.startsWith("image/") ? "image" : "file",
        })),
      };
    }

    const updated = await prisma.worklog.update({
      where: { id: worklogId },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        githubLink: true,
        deadline: true,
        progressStatus: true,
        updatedAt: true,
      },
    });

    return apiResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/worklogs/[worklogId]
 * Delete a worklog
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ worklogId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { worklogId } = await params;

    // Find the worklog with team and organization info
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
      return notFound("Worklog not found");
    }

    // Check permissions:
    // 1. Worklog owner can delete their own worklogs
    // 2. Team owner can delete worklogs in their teams
    // 3. Organization owner can delete worklogs in their organizations
    const isWorklogOwner = worklog.userId === user.id;
    if (!isWorklogOwner) {
      return forbidden("Only the worklog creator can delete this worklog");
    }

    if (
      worklog.progressStatus === "REVIEWED" ||
      worklog.progressStatus === "GRADED"
    ) {
      return forbidden(
        "Reviewed or graded worklogs are locked and cannot be deleted",
      );
    }

    // Delete the worklog (cascade will handle attachments and ratings)
    await prisma.worklog.delete({
      where: { id: worklogId },
    });

    return apiResponse({ message: "Worklog deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
