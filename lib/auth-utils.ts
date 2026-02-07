import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Authorization utilities for role-based access control
 */

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name,
  };
}

/**
 * Check if user is an organization owner
 */
export async function isOrganizationOwner(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const org = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      ownerId: userId,
    },
  });
  return !!org;
}

/**
 * Check if user is a team owner
 */
export async function isTeamOwner(
  userId: string,
  teamId: string,
): Promise<boolean> {
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      ownerId: userId,
    },
  });
  return !!team;
}

/**
 * Check if user is a team member (accepted status)
 */
export async function isTeamMember(
  userId: string,
  teamId: string,
): Promise<boolean> {
  const member = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId,
      status: "ACCEPTED",
    },
  });
  return !!member;
}

/**
 * Check if team belongs to an organization
 */
export async function getTeamOrganization(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { organization: true },
  });
  return team?.organization || null;
}

/**
 * Check if team owner has access to team (team must be in their organization)
 */
export async function canTeamOwnerAccessTeam(
  userId: string,
  teamId: string,
): Promise<boolean> {
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      ownerId: userId,
      organizationId: { not: null }, // Team must belong to an organization
    },
    include: {
      organization: true,
    },
  });

  if (!team || !team.organization) {
    return false;
  }

  // Verify user is owner of this team
  return team.ownerId === userId;
}

/**
 * Get user's owned organizations
 */
export async function getUserOrganizations(userId: string) {
  return await prisma.organization.findMany({
    where: { ownerId: userId },
    include: {
      teams: {
        include: {
          members: true,
        },
      },
    },
  });
}

/**
 * Get teams owned by user within a specific organization
 */
export async function getUserTeamsInOrganization(
  userId: string,
  organizationId: string,
) {
  return await prisma.team.findMany({
    where: {
      ownerId: userId,
      organizationId,
    },
    include: {
      members: true,
      worklogs: true,
    },
  });
}

/**
 * Check if user owns the worklog
 */
export async function isWorklogOwner(
  userId: string,
  worklogId: string,
): Promise<boolean> {
  const worklog = await prisma.worklog.findFirst({
    where: {
      id: worklogId,
      userId,
    },
  });
  return !!worklog;
}

/**
 * Authorization response helpers
 */
export const unauthorized = (message: string = "Unauthorized") => {
  return NextResponse.json({ error: message }, { status: 401 });
};

export const forbidden = (message: string = "Forbidden") => {
  return NextResponse.json({ error: message }, { status: 403 });
};

export const badRequest = (message: string = "Bad request") => {
  return NextResponse.json({ error: message }, { status: 400 });
};

export const notFound = (message: string = "Not found") => {
  return NextResponse.json({ error: message }, { status: 404 });
};

export const success = (data: unknown, status: number = 200) => {
  return NextResponse.json(data, { status });
};
