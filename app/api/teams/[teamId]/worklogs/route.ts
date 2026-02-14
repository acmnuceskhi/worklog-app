import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isTeamOwner } from "@/lib/auth-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Check if user is team owner
    const canAccess = await isTeamOwner(session.user.id, teamId);
    if (!canAccess) {
      return NextResponse.json(
        { error: "You do not have permission to view worklogs for this team" },
        { status: 403 },
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ worklogs });
  } catch (error) {
    console.error("Error fetching team worklogs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
