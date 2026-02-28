import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isTeamOwner } from "@/lib/auth-utils";
import { handleApiError, unauthorized, forbidden } from "@/lib/api-utils";
import {
  parsePaginationParams,
  createPaginatedResponse,
} from "@/lib/api-pagination";
import { isDevelopment, mockWorklogs, mockUsers } from "@/lib/mock-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { teamId } = await params;
    const { searchParams } = new URL(request.url);
    const { skip, take, page, limit } = parsePaginationParams(searchParams);

    // In development mode, return mock worklogs for the team
    if (isDevelopment) {
      const allWorklogs = mockWorklogs
        .filter((w) => w.teamId === teamId)
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
      const total = allWorklogs.length;
      const items = allWorklogs.slice(skip, skip + take);
      return NextResponse.json(
        createPaginatedResponse(items, total, page, limit),
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    // Check if user is team owner
    const canAccess = await isTeamOwner(session.user.id, teamId);
    if (!canAccess) {
      return forbidden(
        "You do not have permission to view worklogs for this team",
      );
    }

    const where = { teamId };

    // Fetch total count and paginated worklogs in parallel
    const [total, worklogs] = await Promise.all([
      prisma.worklog.count({ where }),
      prisma.worklog.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          ratings: {
            select: {
              value: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    return NextResponse.json(
      createPaginatedResponse(worklogs, total, page, limit),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
