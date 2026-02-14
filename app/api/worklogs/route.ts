import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, badRequest } from "@/lib/auth-utils";
import { validateRequest, worklogCreateSchema } from "@/lib/validations";

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

    return NextResponse.json({ data: worklogsWithDetails });
  } catch (error) {
    console.error("Get worklogs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
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
    } = validation.data;

    const allowedStatuses = new Set(["STARTED", "HALF_DONE", "COMPLETED"]);
    if (progressStatus && !allowedStatuses.has(progressStatus)) {
      return badRequest("Invalid progress status for worklog creation");
    }

    // Verify user is a member or owner of the team
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

    const worklog = await prisma.worklog.create({
      data: {
        title,
        description,
        githubLink: githubLink || undefined,
        deadline: deadline ? new Date(deadline) : undefined,
        progressStatus: progressStatus || undefined,
        userId: user.id,
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

    return NextResponse.json({ data: worklog }, { status: 201 });
  } catch (error) {
    console.error("Create worklog error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
