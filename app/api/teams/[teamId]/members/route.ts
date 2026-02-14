import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  apiResponse,
  handleApiError,
  unauthorized,
  forbidden,
} from "@/lib/api-utils";
import { isTeamMember, isTeamOwner } from "@/lib/auth-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const { teamId } = await params;
    const userId = session.user.id;

    // Check access: must be owner or member of the team
    const isOwner = await isTeamOwner(userId, teamId);
    const isMember = await isTeamMember(userId, teamId);

    if (!isOwner && !isMember) {
      return forbidden(
        "You do not have permission to view members of this team",
      );
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId },
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
        status: "asc", // PENDING first, then ACCEPTED? Or check enum order.
      },
    });

    return apiResponse(members);
  } catch (error) {
    return handleApiError(error);
  }
}
