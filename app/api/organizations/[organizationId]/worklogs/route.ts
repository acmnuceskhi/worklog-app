import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  badRequest,
  forbidden,
  getCurrentUser,
  isOrganizationOwner,
  unauthorized,
} from "@/lib/auth-utils";

const MAX_PAGE_SIZE = 50;
const ALLOWED_STATUSES = new Set([
  "STARTED",
  "HALF_DONE",
  "COMPLETED",
  "REVIEWED",
  "GRADED",
]);

const ALLOWED_SORT_BY = new Set(["date", "status", "priority"]);
const ALLOWED_SORT_DIR = new Set(["asc", "desc"]);

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
 * Filtered worklogs for an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { organizationId } = await params;

    const isOwner = await isOrganizationOwner(user.id, organizationId);
    if (!isOwner) {
      return forbidden("Only organization owners can view worklogs");
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

    if (!ALLOWED_SORT_BY.has(sortBy)) {
      return badRequest("Invalid sortBy value");
    }
    if (!ALLOWED_SORT_DIR.has(sortDir)) {
      return badRequest("Invalid sortDir value");
    }

    // Type assertion for sort direction
    const sortDirection = sortDir as "asc" | "desc";
    const descSort = "desc" as const;

    const statuses = statusParam
      ? statusParam
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];

    if (statuses.some((status) => !ALLOWED_STATUSES.has(status))) {
      return badRequest("Invalid status filter");
    }

    const where: Record<string, unknown> = {
      team: { organizationId },
    };

    if (teamId) {
      where.teamId = teamId;
    }

    if (statuses.length > 0) {
      where.progressStatus = { in: statuses };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: dateFrom } : {}),
        ...(dateTo ? { lte: dateTo } : {}),
      };
    }

    if (search) {
      const normalizedStatus = search.toUpperCase().replace(/\s+/g, "_");
      const orFilters: Record<string, unknown>[] = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];

      if (ALLOWED_STATUSES.has(normalizedStatus)) {
        orFilters.push({ progressStatus: normalizedStatus });
      }

      where.OR = orFilters;
    }

    const orderBy = (() => {
      if (sortBy === "status") {
        return [{ progressStatus: sortDirection }];
      }
      if (sortBy === "priority") {
        return [{ deadline: sortDirection }, { createdAt: descSort }];
      }
      return [{ createdAt: sortDirection }];
    })();

    const [total, worklogs] = await Promise.all([
      prisma.worklog.count({ where }),
      prisma.worklog.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
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
              rater: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      data: worklogs,
      meta: {
        total,
        page,
        pageSize,
      },
    });
  } catch (error) {
    console.error("Organization worklogs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
