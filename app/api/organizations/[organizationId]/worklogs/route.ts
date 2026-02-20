import { NextRequest, NextResponse } from "next/server";
import {
  getMockOrganization,
  mockTeams,
  mockWorklogs,
  mockUsers,
  mockRatings,
} from "@/lib/mock-data";

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
 * Filtered worklogs for an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const { organizationId } = await params;

    // Always return mock data for development
    const mockOrg = getMockOrganization(organizationId);
    if (!mockOrg) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
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

    // Get teams for this organization
    const orgTeams = mockTeams.filter(
      (t) => t.organizationId === organizationId,
    );
    const teamIds = orgTeams.map((t) => t.id);

    // Filter worklogs
    let filteredWorklogs = mockWorklogs.filter((w) =>
      teamIds.includes(w.teamId),
    );

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredWorklogs = filteredWorklogs.filter(
        (w) =>
          w.title.toLowerCase().includes(searchLower) ||
          w.description.toLowerCase().includes(searchLower),
      );
    }

    // Apply status filter
    if (statusParam && ALLOWED_STATUSES.has(statusParam)) {
      filteredWorklogs = filteredWorklogs.filter(
        (w) => w.progressStatus === statusParam,
      );
    }

    // Apply team filter
    if (teamId && teamIds.includes(teamId)) {
      filteredWorklogs = filteredWorklogs.filter((w) => w.teamId === teamId);
    }

    // Apply date filters
    if (dateFrom) {
      filteredWorklogs = filteredWorklogs.filter(
        (w) => new Date(w.createdAt) >= dateFrom,
      );
    }
    if (dateTo) {
      filteredWorklogs = filteredWorklogs.filter(
        (w) => new Date(w.createdAt) <= dateTo,
      );
    }

    // Apply sorting
    filteredWorklogs.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "date":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "status":
          comparison = a.progressStatus.localeCompare(b.progressStatus);
          break;
        default:
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDir === "desc" ? -comparison : comparison;
    });

    // Apply pagination
    const total = filteredWorklogs.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedWorklogs = filteredWorklogs.slice(
      startIndex,
      startIndex + pageSize,
    );

    // Build response with enriched data
    const worklogs = paginatedWorklogs
      .map((w) => {
        const team = orgTeams.find((t) => t.id === w.teamId);
        const user = mockUsers.find((u) => u.id === w.userId);

        // Skip worklogs with missing team or user data
        if (!team || !user) {
          return null;
        }

        return {
          id: w.id,
          title: w.title,
          description: w.description,
          progressStatus: w.progressStatus,
          createdAt: w.createdAt.toISOString(),
          deadline: w.deadline ? w.deadline.toISOString() : null,
          team: {
            id: team.id,
            name: team.name,
          },
          user: {
            id: user.id,
            name: user.name,
            image: user.image,
          },
          ratings: mockRatings
            .filter((r) => r.worklogId === w.id)
            .map((r) => ({
              id: r.id,
              value: r.value,
              comment: r.comment || null,
              rater: mockUsers.find((u) => u.id === r.raterId)
                ? {
                    id: r.raterId,
                    name: mockUsers.find((u) => u.id === r.raterId)?.name,
                  }
                : null,
            })),
        };
      })
      .filter(Boolean); // Remove null entries

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
