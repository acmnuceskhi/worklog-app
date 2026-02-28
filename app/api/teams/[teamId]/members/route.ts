import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { handleApiError, unauthorized, forbidden } from "@/lib/api-utils";
import { isTeamMember, isTeamOwner } from "@/lib/auth-utils";
import {
  parsePaginationParams,
  createPaginatedResponse,
} from "@/lib/api-pagination";
import { isDevelopment, mockTeamMembers, mockUsers } from "@/lib/mock-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { teamId } = await params;
    const { searchParams } = new URL(request.url);
    const { skip, take, page, limit } = parsePaginationParams(searchParams, {
      defaultLimit: 50,
      maxLimit: 200,
    });

    // In development mode, return mock members for the team
    if (isDevelopment) {
      const allMembers = mockTeamMembers
        .filter((tm) => tm.teamId === teamId)
        .map((tm) => {
          const user = tm.userId
            ? mockUsers.find((u) => u.id === tm.userId)
            : undefined;
          return {
            id: tm.id,
            teamId: tm.teamId,
            userId: tm.userId || null,
            email: tm.email,
            status: tm.status,
            invitedAt: tm.invitedAt.toISOString(),
            joinedAt: tm.joinedAt ? tm.joinedAt.toISOString() : null,
            user: user
              ? { id: user.id, name: user.name, email: user.email }
              : null,
          };
        });
      const total = allMembers.length;
      const items = allMembers.slice(skip, skip + take);
      return NextResponse.json(
        createPaginatedResponse(items, total, page, limit),
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const userId = session.user.id;

    // Check access: must be owner or member of the team
    const isOwner = await isTeamOwner(userId, teamId);
    const isMember = await isTeamMember(userId, teamId);

    if (!isOwner && !isMember) {
      return forbidden(
        "You do not have permission to view members of this team",
      );
    }

    const where = { teamId };

    const [total, members] = await Promise.all([
      prisma.teamMember.count({ where }),
      prisma.teamMember.findMany({
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
          status: "asc",
        },
      }),
    ]);

    return NextResponse.json(
      createPaginatedResponse(members, total, page, limit),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
