import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isTeamOwner } from "@/lib/auth-utils";
import {
  apiResponse,
  handleApiError,
  unauthorized,
  forbidden,
} from "@/lib/api-utils";
import { isDevelopment, mockWorklogs, mockUsers } from "@/lib/mock-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { teamId } = await params;

    // In development mode, return mock worklogs for the team
    if (isDevelopment) {
      const teamWorklogs = mockWorklogs
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
      return apiResponse(teamWorklogs);
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

    // Fetch worklogs for the team
    const worklogs = await prisma.worklog.findMany({
      where: {
        teamId: teamId,
      },
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
    });

    return apiResponse(worklogs);
  } catch (error) {
    return handleApiError(error);
  }
}
