// lib/mock-data.ts - Comprehensive development-only mock data
// DO NOT USE IN PRODUCTION - Remove or disable before deployment
// Follows database schema relationships and includes all entities for testing

export const isDevelopment = process.env.NODE_ENV === "development";

// Base types matching database schema
export interface MockUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: "org-owner" | "team-owner" | "member";
}

export interface MockOrganization {
  id: string;
  name: string;
  description?: string;
  credits: number;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockTeam {
  id: string;
  name: string;
  description?: string;
  project?: string;
  credits: number;
  organizationId?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockTeamMember {
  id: string;
  teamId: string;
  userId?: string;
  email: string;
  token?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  invitedAt: Date;
  joinedAt?: Date;
}

export interface MockWorklog {
  id: string;
  title: string;
  description: string;
  githubLink?: string;
  progressStatus: "STARTED" | "HALF_DONE" | "COMPLETED" | "REVIEWED" | "GRADED";
  deadline?: Date;
  userId: string;
  teamId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockWorklogAttachment {
  id: string;
  worklogId: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  kind: "image" | "file";
  createdAt: Date;
}

export interface MockRating {
  id: string;
  value: number; // 1-10
  comment?: string;
  worklogId: string;
  raterId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock users with different roles
export const mockUsers: MockUser[] = isDevelopment
  ? [
      {
        id: "mock-org-owner-1",
        name: "Alice Johnson",
        email: "alice@techcorp.com",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
        role: "org-owner",
      },
      {
        id: "mock-team-owner-1",
        name: "Bob Smith",
        email: "bob@techcorp.com",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
        role: "team-owner",
      },
      {
        id: "mock-member-1",
        name: "Charlie Brown",
        email: "charlie@techcorp.com",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=charlie",
        role: "member",
      },
      {
        id: "mock-member-2",
        name: "Diana Prince",
        email: "diana@techcorp.com",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=diana",
        role: "member",
      },
    ]
  : [];

// Mock organizations
export const mockOrganizations: MockOrganization[] = isDevelopment
  ? [
      {
        id: "mock-org-1",
        name: "TechCorp Solutions",
        description: "Leading technology solutions provider",
        credits: 500,
        ownerId: "mock-org-owner-1",
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-02-10"),
      },
    ]
  : [];

// Mock teams
export const mockTeams: MockTeam[] = isDevelopment
  ? [
      {
        id: "mock-team-1",
        name: "Frontend Development",
        description: "Building modern web applications",
        project: "Worklog App",
        credits: 150,
        organizationId: "mock-org-1",
        ownerId: "mock-org-owner-1",
        createdAt: new Date("2026-01-20"),
        updatedAt: new Date("2026-02-15"),
      },
      {
        id: "mock-team-2",
        name: "Backend Development",
        description: "API development and database management",
        project: "Worklog App",
        credits: 200,
        organizationId: "mock-org-1",
        ownerId: "mock-org-owner-1",
        createdAt: new Date("2026-01-25"),
        updatedAt: new Date("2026-02-18"),
      },
      {
        id: "mock-team-3",
        name: "QA & Testing",
        description: "Quality assurance and testing team",
        project: "Worklog App",
        credits: 100,
        organizationId: "mock-org-1",
        ownerId: "mock-team-owner-1",
        createdAt: new Date("2026-02-01"),
        updatedAt: new Date("2026-02-19"),
      },
    ]
  : [];

// Mock team members
export const mockTeamMembers: MockTeamMember[] = isDevelopment
  ? [
      // Frontend team members
      {
        id: "mock-member-1-team-1",
        teamId: "mock-team-1",
        userId: "mock-member-1",
        email: "charlie@techcorp.com",
        status: "ACCEPTED",
        invitedAt: new Date("2026-01-21"),
        joinedAt: new Date("2026-01-22"),
      },
      {
        id: "mock-member-2-team-1",
        teamId: "mock-team-1",
        userId: "mock-member-2",
        email: "diana@techcorp.com",
        status: "ACCEPTED",
        invitedAt: new Date("2026-01-21"),
        joinedAt: new Date("2026-01-23"),
      },
      {
        id: "mock-org-owner-team-1",
        teamId: "mock-team-1",
        userId: "mock-org-owner-1",
        email: "alice@techcorp.com",
        status: "ACCEPTED",
        invitedAt: new Date("2026-01-20"),
        joinedAt: new Date("2026-01-20"),
      },
      // Backend team members
      {
        id: "mock-member-1-team-2",
        teamId: "mock-team-2",
        userId: "mock-member-1",
        email: "charlie@techcorp.com",
        status: "ACCEPTED",
        invitedAt: new Date("2026-01-26"),
        joinedAt: new Date("2026-01-27"),
      },
      {
        id: "mock-org-owner-team-2",
        teamId: "mock-team-2",
        userId: "mock-org-owner-1",
        email: "alice@techcorp.com",
        status: "ACCEPTED",
        invitedAt: new Date("2026-01-25"),
        joinedAt: new Date("2026-01-25"),
      },
      // QA team members
      {
        id: "mock-member-2-team-3",
        teamId: "mock-team-3",
        userId: "mock-member-2",
        email: "diana@techcorp.com",
        status: "ACCEPTED",
        invitedAt: new Date("2026-02-02"),
        joinedAt: new Date("2026-02-02"),
      },
      // Pending invitation for alice to join QA team (for InvitationsPanel dev testing)
      {
        id: "mock-pending-invite-alice-team-3",
        teamId: "mock-team-3",
        userId: undefined,
        email: "alice@techcorp.com",
        token: "mock-invite-token-alice-team-3",
        status: "PENDING",
        invitedAt: new Date("2026-02-25"),
      },
    ]
  : [];

// Mock worklogs with various states
export const mockWorklogs: MockWorklog[] = isDevelopment
  ? [
      // Organization owner worklogs
      {
        id: "mock-worklog-org-1",
        title: "Plan Q1 development roadmap",
        description:
          "Review team performance metrics and plan quarterly development priorities for all teams",
        progressStatus: "COMPLETED",
        deadline: new Date("2026-02-20"),
        userId: "mock-org-owner-1",
        teamId: "mock-team-1",
        createdAt: new Date("2026-02-15"),
        updatedAt: new Date("2026-02-20"),
      },
      {
        id: "mock-worklog-org-2",
        title: "Organize sprint planning meeting",
        description:
          "Conduct sprint planning with team leads to define sprint goals and deliverables",
        progressStatus: "COMPLETED",
        deadline: new Date("2026-02-18"),
        userId: "mock-org-owner-1",
        teamId: "mock-team-2",
        createdAt: new Date("2026-02-10"),
        updatedAt: new Date("2026-02-18"),
      },
      {
        id: "mock-worklog-org-3",
        title: "Review code quality metrics",
        description:
          "Analyze code coverage, test compatibility, and performance metrics across projects",
        progressStatus: "HALF_DONE",
        deadline: new Date("2026-02-25"),
        userId: "mock-org-owner-1",
        teamId: "mock-team-1",
        createdAt: new Date("2026-02-18"),
        updatedAt: new Date("2026-02-20"),
      },
      // Team 1 worklogs
      {
        id: "mock-worklog-1",
        title: "Implement user authentication",
        description:
          "Set up OAuth integration with Google and GitHub providers using NextAuth.js",
        githubLink: "https://github.com/acm-techops/worklog-app/pull/42",
        progressStatus: "COMPLETED",
        deadline: new Date("2026-02-25"),
        userId: "mock-member-1",
        teamId: "mock-team-1",
        createdAt: new Date("2026-02-01"),
        updatedAt: new Date("2026-02-20"),
      },
      {
        id: "mock-worklog-2",
        title: "Design dashboard UI",
        description:
          "Create responsive dashboard with worklog overview, progress tracking, and team statistics",
        progressStatus: "REVIEWED",
        deadline: new Date("2026-02-28"),
        userId: "mock-member-1",
        teamId: "mock-team-1",
        createdAt: new Date("2026-02-05"),
        updatedAt: new Date("2026-02-22"),
      },
      {
        id: "mock-worklog-3",
        title: "Set up database schema",
        description:
          "Define Prisma models for organizations, teams, worklogs, and ratings with proper relationships",
        githubLink: "https://github.com/acm-techops/worklog-app/commit/a3f5b2c",
        progressStatus: "GRADED",
        userId: "mock-member-1",
        teamId: "mock-team-1",
        createdAt: new Date("2026-01-25"),
        updatedAt: new Date("2026-02-10"),
      },
      {
        id: "mock-worklog-4",
        title: "Implement file upload system",
        description:
          "Add support for image and document attachments to worklogs",
        progressStatus: "HALF_DONE",
        deadline: new Date("2026-03-05"),
        userId: "mock-member-2",
        teamId: "mock-team-1",
        createdAt: new Date("2026-02-10"),
        updatedAt: new Date("2026-02-18"),
      },
      {
        id: "mock-worklog-5",
        title: "Create team invitation system",
        description:
          "Implement email invitations for team members with secure tokens",
        progressStatus: "STARTED",
        deadline: new Date("2026-03-10"),
        userId: "mock-member-2",
        teamId: "mock-team-1",
        createdAt: new Date("2026-02-15"),
        updatedAt: new Date("2026-02-15"),
      },
      // Team 2 worklogs
      {
        id: "mock-worklog-6",
        title: "Build REST API endpoints",
        description:
          "Create CRUD endpoints for worklogs, teams, and organizations",
        githubLink: "https://github.com/acm-techops/worklog-app/pull/58",
        progressStatus: "COMPLETED",
        userId: "mock-member-1",
        teamId: "mock-team-2",
        createdAt: new Date("2026-01-30"),
        updatedAt: new Date("2026-02-12"),
      },
      {
        id: "mock-worklog-7",
        title: "Implement rating system",
        description:
          "Add organization owner rating functionality for completed worklogs",
        progressStatus: "REVIEWED",
        userId: "mock-member-1",
        teamId: "mock-team-2",
        createdAt: new Date("2026-02-08"),
        updatedAt: new Date("2026-02-19"),
      },
    ]
  : [];

// Mock worklog attachments
export const mockWorklogAttachments: MockWorklogAttachment[] = isDevelopment
  ? [
      {
        id: "mock-attachment-1",
        worklogId: "mock-worklog-1",
        url: "https://example.com/uploads/auth-flow.png",
        fileName: "auth-flow.png",
        mimeType: "image/png",
        size: 245760,
        kind: "image",
        createdAt: new Date("2026-02-18"),
      },
      {
        id: "mock-attachment-2",
        worklogId: "mock-worklog-3",
        url: "https://example.com/uploads/schema.pdf",
        fileName: "database-schema.pdf",
        mimeType: "application/pdf",
        size: 512000,
        kind: "file",
        createdAt: new Date("2026-02-08"),
      },
    ]
  : [];

// Mock ratings (only organization owners can rate)
export const mockRatings: MockRating[] = isDevelopment
  ? [
      {
        id: "mock-rating-1",
        value: 9,
        comment:
          "Excellent implementation of authentication flow. Clean code, proper error handling, and good security practices.",
        worklogId: "mock-worklog-3",
        raterId: "mock-org-owner-1",
        createdAt: new Date("2026-02-12"),
        updatedAt: new Date("2026-02-12"),
      },
      {
        id: "mock-rating-2",
        value: 8,
        comment:
          "Solid API design with proper REST conventions. Good documentation and error responses.",
        worklogId: "mock-worklog-6",
        raterId: "mock-org-owner-1",
        createdAt: new Date("2026-02-14"),
        updatedAt: new Date("2026-02-14"),
      },
      {
        id: "mock-rating-3",
        value: 7,
        comment:
          "Good progress on the rating system implementation. Some edge cases need attention.",
        worklogId: "mock-worklog-7",
        raterId: "mock-org-owner-1",
        createdAt: new Date("2026-02-21"),
        updatedAt: new Date("2026-02-21"),
      },
    ]
  : [];

// Helper functions for querying mock data
export const getMockUser = (userId: string): MockUser | undefined => {
  return mockUsers.find((u) => u.id === userId);
};

export const getMockOrganization = (
  orgId: string,
): MockOrganization | undefined => {
  return mockOrganizations.find((o) => o.id === orgId);
};

export const getMockTeam = (teamId: string): MockTeam | undefined => {
  return mockTeams.find((t) => t.id === teamId);
};

export const getMockWorklogsForUser = (userId: string): MockWorklog[] => {
  return mockWorklogs.filter((w) => w.userId === userId);
};

export const getMockWorklogsForTeam = (teamId: string): MockWorklog[] => {
  return mockWorklogs.filter((w) => w.teamId === teamId);
};

export const getMockTeamsForUser = (userId: string): MockTeam[] => {
  return mockTeams.filter(
    (t) =>
      t.ownerId === userId ||
      mockTeamMembers.some(
        (m) =>
          m.teamId === t.id && m.userId === userId && m.status === "ACCEPTED",
      ),
  );
};

export const getMockOrganizationsForUser = (
  userId: string,
): MockOrganization[] => {
  return mockOrganizations.filter((o) => o.ownerId === userId);
};

export const getMockTeamMembers = (teamId: string): MockTeamMember[] => {
  return mockTeamMembers.filter((m) => m.teamId === teamId);
};

export const getMockWorklogAttachments = (
  worklogId: string,
): MockWorklogAttachment[] => {
  return mockWorklogAttachments.filter((a) => a.worklogId === worklogId);
};

export const getMockRatingsForWorklog = (worklogId: string): MockRating[] => {
  return mockRatings.filter((r) => r.worklogId === worklogId);
};

export const getMockRatingsForOrganization = (orgId: string): MockRating[] => {
  const orgTeams = mockTeams
    .filter((t) => t.organizationId === orgId)
    .map((t) => t.id);
  const orgWorklogs = mockWorklogs
    .filter((w) => orgTeams.includes(w.teamId))
    .map((w) => w.id);
  return mockRatings.filter((r) => orgWorklogs.includes(r.worklogId));
};

// Statistics helpers
export const getMockDashboardStats = (userId: string) => {
  const userWorklogs = getMockWorklogsForUser(userId);
  const userTeams = getMockTeamsForUser(userId);

  return {
    totalWorklogs: userWorklogs.length,
    completedWorklogs: userWorklogs.filter((w) => w.progressStatus === "GRADED")
      .length,
    pendingReviews: userWorklogs.filter((w) => w.progressStatus === "COMPLETED")
      .length,
    overdueWorklogs: userWorklogs.filter(
      (w) =>
        w.deadline && w.deadline < new Date() && w.progressStatus !== "GRADED",
    ).length,
    totalTeams: userTeams.length,
    totalOrganizations: getMockOrganizationsForUser(userId).length,
  };
};
