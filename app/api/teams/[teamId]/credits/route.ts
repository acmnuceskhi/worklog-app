import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getCurrentUser,
  isTeamOwner,
  unauthorized,
  forbidden,
  notFound,
  success,
  badRequest,
} from "@/lib/auth-utils";
import { validateRequest, creditsUpdateSchema } from "@/lib/validations";

/**
 * GET /api/teams/[teamId]/credits
 * Get team credits (team owner only)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { teamId } = await params;

    // Parallel: check ownership + fetch team data
    const [isOwner, team] = await Promise.all([
      isTeamOwner(user.id, teamId),
      prisma.team.findUnique({
        where: { id: teamId },
        select: {
          id: true,
          name: true,
          credits: true,
        },
      }),
    ]);

    if (!isOwner) {
      return forbidden("Only team owners can view team credits");
    }

    if (!team) {
      return notFound("Team not found");
    }

    return success(team);
  } catch (error) {
    console.error("Get team credits error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/teams/[teamId]/credits
 * Update team credits (team owner only)
 * Supports: add, subtract, set
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { teamId } = await params;
    const validation = await validateRequest(request, creditsUpdateSchema);
    if (!validation.success) {
      return badRequest(validation.error);
    }
    const { action, amount } = validation.data;

    // Parallel: check ownership + fetch team data
    const [isOwner, team] = await Promise.all([
      isTeamOwner(user.id, teamId),
      prisma.team.findUnique({
        where: { id: teamId },
        select: {
          id: true,
          name: true,
          credits: true,
          organizationWasDeleted: true,
        },
      }),
    ]);

    if (!isOwner) {
      return forbidden("Only team owners can update team credits");
    }

    if (!team) {
      return notFound("Team not found");
    }

    if (team.organizationWasDeleted) {
      return forbidden(
        "This team is read-only because its organization was deleted. Link it to a new organization first.",
      );
    }

    let newCredits: number;

    switch (action) {
      case "add":
        newCredits = team.credits + amount;
        break;
      case "subtract":
        newCredits = Math.max(0, team.credits - amount); // Prevent negative
        break;
      case "set":
        newCredits = amount;
        break;
      default:
        return badRequest("Invalid action");
    }

    // Update credits
    const updated = await prisma.team.update({
      where: { id: teamId },
      data: { credits: newCredits },
      select: {
        id: true,
        name: true,
        credits: true,
      },
    });

    return success({
      ...updated,
      previousCredits: team.credits,
      action,
      amount,
    });
  } catch (error) {
    console.error("Update team credits error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
