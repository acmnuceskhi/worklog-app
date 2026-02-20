import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import {
  apiResponse,
  unauthorized,
  badRequest,
  handleApiError,
} from "@/lib/api-utils";
import { validateRequest, worklogCreateSchema } from "@/lib/validations";
import { isDevelopment, mockWorklogs, mockUsers } from "@/lib/mock-data";

/**
 * GET /api/worklogs
 * Get all worklogs created by the current user
 */
export async function GET() {
  try {
    // In development mode, return mock worklogs for the default user
    if (isDevelopment) {
      const defaultUserId = "mock-org-owner-1";
      const userWorklogs = mockWorklogs
        .filter((w) => w.userId === defaultUserId)
        .map((w) => {
          const user = mockUsers.find((u) => u.id === w.userId);
          return {
            id: w.id,
            title: w.title,
            description: w.description,
            githubLink: w.githubLink || null,
            progressStatus: w.progressStatus,
            deadline: w.deadline ? w.deadline.toISOString() : null,
            userId: w.userId,
            teamId: w.teamId,
            createdAt: w.createdAt.toISOString(),
            updatedAt: w.updatedAt.toISOString(),
            user: user
              ? { id: user.id, name: user.name, email: user.email }
              : null,
            ratings: [],
          };
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      return apiResponse(userWorklogs);
    }

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
      return NextResponse.json({ data: [] });
    }

    // Get unique team IDs and worklog IDs for efficient batch queries
    const teamIds = [...new Set(worklogs.map((w) => w.teamId))];
    const worklogIds = worklogs.map((w) => w.id);

    // Batch fetch related data
    const [teamsData, ratingsData] = await Promise.all([
      prisma.team.findMany({
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
      }),
      prisma.rating.findMany({
        where: {
          worklogId: { in: worklogIds },
        },
        select: {
          id: true,
          value: true,
          comment: true,
          worklogId: true,
          rater: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    // Create lookup maps for O(1) access
    const teamsMap = new Map(teamsData.map((team) => [team.id, team]));
    const ratingsByWorklog = new Map<string, typeof ratingsData>();

    ratingsData.forEach((rating) => {
      if (!ratingsByWorklog.has(rating.worklogId)) {
        ratingsByWorklog.set(rating.worklogId, []);
      }
      ratingsByWorklog.get(rating.worklogId)!.push(rating);
    });

    // Combine data efficiently
    const worklogsWithDetails = worklogs.map((worklog) => ({
      ...worklog,
      team: teamsMap.get(worklog.teamId),
      ratings: ratingsByWorklog.get(worklog.id) || [],
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

    // Logic for assigning tasks to others (Team Owner only)
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

      // Verify target user is a member of the team
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
      // Logic for creating own worklog (Member or Owner)
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: user.id,
          status: "ACCEPTED",
        },
      });

      const isTeamOwner = await prisma.team.findFirst({
        where: {
          id: teamId,
          ownerId: user.id,
        },
      });

      if (!teamMember && !isTeamOwner) {
        return NextResponse.json(
          { error: "You are not a member of this team" },
          { status: 403 },
        );
      }
    }

    const worklog = await prisma.worklog.create({
      data: {
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
      },
      include: {
        team: {
          select: {
            name: true,
          },
        },
      },
    });

    return apiResponse(worklog, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
