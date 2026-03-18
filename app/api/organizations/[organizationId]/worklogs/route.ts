import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma, ProgressStatus } from "@/app/generated/prisma/client";
import {
  getCurrentUser,
  isOrganizationOwnerOrCoOwner,
  unauthorized,
  forbidden,
} from "@/lib/auth-utils";
import { buildPaginationMeta } from "@/lib/api-pagination";

const MAX_PAGE_SIZE = 50;
const ALLOWED_STATUSES = new Set([
  "STARTED",
  "HALF_DONE",
  "COMPLETED",
  "REVIEWED",
  "GRADED",
]);

function parseNumber(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function normalizeDate(value: string | null) {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * GET /api/organizations/[organizationId]/worklogs
 * Filtered worklogs for an organization (owner/co-owner only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const { organizationId } = await params;

    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const canAccess = await isOrganizationOwnerOrCoOwner(
      user.id,
      organizationId,
    );
    if (!canAccess) {
      return forbidden(
        "Only organization owners can view organization worklogs",
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const statusParam = searchParams.get("status");
    const teamId = searchParams.get("teamId")?.trim();
    const dateFrom = normalizeDate(searchParams.get("dateFrom"));
    const dateTo = normalizeDate(searchParams.get("dateTo"));
    if (dateFrom) {
      dateFrom.setHours(0, 0, 0, 0);
    }
    if (dateTo) {
      dateTo.setHours(23, 59, 59, 999);
    }
    const sortBy = searchParams.get("sortBy") || "date";
    const sortDir = searchParams.get("sortDir") || "desc";
    const page = Math.max(1, parseNumber(searchParams.get("page"), 1));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseNumber(searchParams.get("pageSize"), 20)),
    );

    // Build Prisma where clause based on filters
    const where: Prisma.WorklogWhereInput = {
      team: {
        organizationId,
      },
      ...(statusParam && ALLOWED_STATUSES.has(statusParam)
        ? { progressStatus: statusParam as ProgressStatus }
        : {}),
      ...(teamId ? { teamId } : {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, worklogs] = await Promise.all([
      prisma.worklog.count({ where }),
      prisma.worklog.findMany({
        where,
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          ratings: {
            select: {
              id: true,
              value: true,
              comment: true,
              createdAt: true,
              updatedAt: true,
              rater: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
        orderBy:
          sortBy === "status"
            ? { progressStatus: sortDir === "desc" ? "desc" : "asc" }
            : { createdAt: sortDir === "desc" ? "desc" : "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      items: worklogs,
      meta: buildPaginationMeta(total, page, pageSize),
    });
  } catch (error) {
    console.error("Organization worklogs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
