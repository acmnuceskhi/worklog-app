import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isTeamOwner } from "@/lib/auth-utils";
import { handleApiError, unauthorized, forbidden } from "@/lib/api-utils";
import {
  parsePaginationParams,
  createPaginatedResponse,
} from "@/lib/api-pagination";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { teamId } = await params;
    const { searchParams } = new URL(request.url);
    const { skip, take, page, limit } = parsePaginationParams(searchParams);

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
