import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Authorization utilities for role-based access control
 */

/**
 * Session cache configuration
 */
export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
}

interface CacheEntry {
  data: AuthUser | null;
  timestamp: number;
}

/**
 * Cache TTL in milliseconds: 3 seconds
 * Rationale:
 * - Short enough (3s) to prevent serving significantly stale user data
 * - Long enough to batch multiple requests from middleware + page loads
 * - Typical page load completes within 1-3 seconds
 * - Allows session invalidation within reasonable time window
 */
const CACHE_TTL = 3000;

/**
 * Maximum cache entries before cleanup: 100
 * Rationale:
 * - Each user session adds one cache entry
 * - 100 concurrent users = ~400 bytes of memory
 * - Prevents unbounded growth in long-running servers
 * - Cleanup runs on each getUserById call once exceeded
 */
const MAX_CACHE_SIZE = 100;

import { cache } from "react";

const sessionCache = new Map<string, CacheEntry>();

/**
 * Get the current session with per-request memoization.
 * Uses React.cache to ensure that multiple calls within the same request
 * lifecycle (e.g., in middleware or multiple server components/functions)
 * only trigger one execution of the auth() logic.
 */
export const getCachedSession = cache(async () => {
  return await auth();
});

/**
 * Get the current authenticated user with JWT-based caching and request-memoization.
 * Optimized to balance performance (preventing redundant JWT/DB calls) and
 * freshness (validating the session at least once per request or cache TTL).
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getCachedSession();

  if (!session?.user?.id) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Auth Debug] No user ID found in session");
    }
    return null;
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[Auth Debug] User authenticated:", session.user.id);
  }

  // Use user ID as cache key for user-specific caching
  const cacheKey = session.user.id;
  const now = Date.now();
  const cached = sessionCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const user = {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name,
  };

  sessionCache.set(cacheKey, { data: user, timestamp: now });

  // Cleanup expired entries to prevent unbounded cache growth
  if (sessionCache.size > MAX_CACHE_SIZE) {
    const cutoff = now - CACHE_TTL;
    let deletedCount = 0;

    for (const [key, entry] of sessionCache.entries()) {
      if (entry.timestamp < cutoff) {
        sessionCache.delete(key);
        deletedCount++;
      }
    }

    // Log cleanup if significant entries removed (development only)
    if (process.env.NODE_ENV === "development" && deletedCount > 10) {
      console.debug(`[auth-cache] Cleaned ${deletedCount} expired entries`);
    }
  }

  return user;
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
 * OPTIMIZATION: Only fetch team metadata, not all members/worklogs
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
    select: {
      id: true,
      name: true,
      description: true,
      project: true,
      credits: true,
      ownerId: true,
      organizationId: true,
      createdAt: true,
      updatedAt: true,
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

import {
  apiResponse,
  unauthorized as apiUnauthorized,
  forbidden as apiForbidden,
  badRequest as apiBadRequest,
  notFound as apiNotFound,
} from "@/lib/api-utils";

/**
 * Authorization response helpers
 * Re-exported from api-utils for backward compatibility
 */
export const unauthorized = apiUnauthorized;
export const forbidden = apiForbidden;
export const badRequest = apiBadRequest;
export const notFound = apiNotFound;

export const success = (data: unknown, status: number = 200) => {
  return apiResponse(data, status);
};
