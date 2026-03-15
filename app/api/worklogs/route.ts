import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import {
  apiResponse,
  unauthorized,
  badRequest,
  handleApiError,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/api-utils";
import { validateRequest, worklogCreateSchema } from "@/lib/validations";
import { apiLimiter } from "@/lib/rate-limit";
import { getIdempotencyKey, withIdempotency } from "@/app/api/_idempotency";

/**
 * GET /api/worklogs
 * Get all worklogs created by the current user
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    /**
     * Pagination limit: 100 worklogs per user
     * Rationale:
     * - Typical user has 10-30 active/recent worklogs
     * - Prevents memory exhaustion for users with 100+ archived worklogs
     * - Clients should implement pagination for deeper history
     * - Can be configured via WORKLOG_LIST_LIMIT env var
     */
    const WORKLOG_LIST_LIMIT = parseInt(
      process.env.WORKLOG_LIST_LIMIT ?? "100",
      10,
    );

    // Get worklogs with pagination to prevent memory issues
    // OPTIMIZATION: Only fetch essential fields to reduce query payload
    const worklogs = await prisma.worklog.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        progressStatus: true,
        deadline: true,
        createdAt: true,
        teamId: true,
      },
      orderBy: { createdAt: "desc" },
      take: WORKLOG_LIST_LIMIT,
    });

    // Early return if no worklogs
    if (worklogs.length === 0) {
      return apiResponse([]);
    }

    // Get unique team IDs for efficient batch query
    const teamIds = [...new Set(worklogs.map((w) => w.teamId))];

    // Batch fetch team data (ratings are NOT returned to members per visibility rules)
    const teamsData = await prisma.team.findMany({
      where: { id: { in: teamIds } },
      select: {
        id: true,
        name: true,
        owner: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create lookup map for O(1) access
    const teamsMap = new Map(teamsData.map((team) => [team.id, team]));

    // Combine data efficiently
    const worklogsWithDetails = worklogs.map((worklog) => ({
      ...worklog,
      team: teamsMap.get(worklog.teamId),
    }));

    return apiResponse(worklogsWithDetails);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/worklogs
 * Create a new worklog
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = await getRateLimitIdentifier();
    const rateLimitResponse = checkRateLimit(apiLimiter, 30, identifier);
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const validation = await validateRequest(request, worklogCreateSchema);
    if (!validation.success) {
      return badRequest(validation.error);
    }
    const {
      title,
      description,
      teamId,
      githubLink,
      deadline,
      progressStatus,
      attachments,
      userId: assignedUserId,
    } = validation.data;

    const allowedStatuses = new Set(["STARTED", "HALF_DONE", "COMPLETED"]);
    if (progressStatus && !allowedStatuses.has(progressStatus)) {
      return badRequest("Invalid progress status for worklog creation");
    }

    let targetUserId = user.id;

    // All pre-checks before the idempotency transaction
    if (assignedUserId && assignedUserId !== user.id) {
      const isOwner = await prisma.team.findFirst({
        where: {
          id: teamId,
          ownerId: user.id,
        },
      });

      if (!isOwner) {
        return NextResponse.json(
          { error: "Only team owners can assign worklogs to others" },
          { status: 403 },
        );
      }

      const targetMember = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: assignedUserId,
          status: "ACCEPTED",
        },
      });

      if (!targetMember) {
        return badRequest("Target user is not a member of this team");
      }

      targetUserId = assignedUserId;
    } else {
      const [teamMember, isTeamOwner] = await Promise.all([
        prisma.teamMember.findFirst({
          where: {
            teamId,
            userId: user.id,
            status: "ACCEPTED",
          },
        }),
        prisma.team.findFirst({
          where: {
            id: teamId,
            ownerId: user.id,
          },
        }),
      ]);

      if (!teamMember && !isTeamOwner) {
        return NextResponse.json(
          { error: "You are not a member of this team" },
          { status: 403 },
        );
      }
    }

    // Block worklog creation for org-deleted (read-only) teams
    const teamForOrgCheck = await prisma.team.findUnique({
      where: { id: teamId },
      select: { organizationWasDeleted: true },
    });
    if (teamForOrgCheck?.organizationWasDeleted) {
      return NextResponse.json(
        {
          error:
            "This team is read-only because its organization was deleted. Link it to a new organization first.",
        },
        { status: 403 },
      );
    }

    const worklogData = {
      title,
      description,
      githubLink: githubLink || undefined,
      deadline: deadline ? new Date(deadline) : undefined,
      progressStatus: progressStatus || undefined,
      userId: targetUserId,
      teamId,
      attachments: attachments?.length
        ? {
            create: attachments.map((attachment) => ({
              url: attachment.url,
              fileName: attachment.name,
              mimeType: attachment.type,
              size: attachment.size,
              kind: attachment.type.startsWith("image/") ? "image" : "file",
            })),
          }
        : undefined,
    };

    const worklogInclude = {
      team: {
        select: {
          name: true,
        },
      },
    };

    // Atomic idempotency: check + create + record in one transaction
    const idempotencyToken = getIdempotencyKey(request);
    if (idempotencyToken) {
      const result = await withIdempotency(
        idempotencyToken,
        user.id,
        "CREATE_WORKLOG",
        201,
        (tx) =>
          tx.worklog.create({ data: worklogData, include: worklogInclude }),
      );
      if (result.cached) return result.response;
      return apiResponse(result.data, 201);
    }

    // No idempotency token — create directly
    const worklog = await prisma.worklog.create({
      data: worklogData,
      include: worklogInclude,
    });

    return apiResponse(worklog, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
