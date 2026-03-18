import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  isTeamMember,
  isTeamOwner,
  isOrganizationOwner,
} from "@/lib/auth-utils";
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

    const teamMeta = await prisma.team.findUnique({
      where: { id: teamId },
      select: { organizationId: true },
    });

    const [isOwnr, isMember, isOrgOwnr] = await Promise.all([
      isTeamOwner(session.user.id, teamId),
      isTeamMember(session.user.id, teamId),
      teamMeta?.organizationId
        ? isOrganizationOwner(session.user.id, teamMeta.organizationId)
        : Promise.resolve(false),
    ]);

    const canAccess = isOwnr || isMember || isOrgOwnr;
    if (!canAccess) {
      return forbidden(
        "You do not have permission to view worklogs for this team",
      );
    }

    const where =
      isOwnr || isOrgOwnr ? { teamId } : { teamId, userId: session.user.id };

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

    const adjustedWorklogs =
      isOwnr || isOrgOwnr
        ? worklogs
        : worklogs.map((w) =>
            w.progressStatus === "REVIEWED" || w.progressStatus === "GRADED"
              ? { ...w, progressStatus: "COMPLETED" as const }
              : w,
          );

    return NextResponse.json(
      createPaginatedResponse(adjustedWorklogs, total, page, limit),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
