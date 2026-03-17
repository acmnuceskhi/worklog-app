# Worklog App - AI Coding Guidelines

## Project Overview

This is a hierarchical worklog tracking system for organizations, teams, and members. Key features:

- **Three-Tier Hierarchy**: Organization Owner → Team Owner → Team Member
- **OAuth Authentication**: Google OAuth restricted to dual university domains (`@nu.edu.pk` and `@isb.nu.edu.pk`) via `hd` parameter + `signIn` callback. GitHub OAuth is implemented in `lib/auth.ts` but currently disabled (commented out)
- **Organization Management**: Users can create organizations, invite team owners via email to join the organization, and manage teams within them
- **Team Management**: Team owners create teams, invite members, and set worklog deadlines
- **Credits System**: Organizations and teams have credit management (add/subtract/set credits)
- **Progress Tracking**: 5-state worklog progress (STARTED → HALF_DONE → COMPLETED → REVIEWED → GRADED) with strict role-based transitions
- **Review System**: Team owners review completed worklogs (COMPLETED → REVIEWED)
- **Rating System**: Organization owners rate reviewed worklogs 1-10 (REVIEWED → GRADED, ratings hidden from lower roles)
- **Deadline Management**: Optional deadlines per worklog with visual indicators
- **File Attachments**: Support for images and documents as worklog evidence
- **Multi-Role Support**: Users can have different roles across organizations/teams
- **Role-Based Dashboards**: Separate views for organization owners, team owners, and members

## Architecture Overview

- **Framework**: Next.js 16 with App Router
- **Database**: Prisma 7 + PostgreSQL (custom client output at `app/generated/prisma/`)
- **Styling**: Tailwind CSS 4 with custom theme variables
- **Auth**: ✅ Auth.js v5 with Google OAuth (primary, enforces `@nu.edu.pk`/`@isb.nu.edu.pk` via `hd` + `signIn` callback) and GitHub OAuth (implemented but disabled in `lib/auth.ts`)
- **Email**: Resend SDK with dual domain validation for invitations
- **Runtime**: Node.js-compatible with PrismaPg adapter

## Database Schema

Based on the hierarchical worklog system with Auth.js integration:

### Auth.js Models

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
  @@index([userId])
  @@index([expires])
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

### Core Models

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime? @map("email_verified")
  image         String?
  accounts      Account[]
  sessions      Session[]
  ownedOrganizations Organization[] @relation("OrganizationOwner")
  ownedTeams    Team[]    @relation("TeamOwner")
  memberships   TeamMember[]
  worklogs      Worklog[]
  ratings       Rating[]
  organizationInvitations OrganizationInvitation[]

  @@map("users")
}

model Organization {
  id          String   @id @default(cuid())
  name        String
  description String?
  credits     Int      @default(0)
  ownerId     String   @map("owner_id")
  owner       User     @relation("OrganizationOwner", fields: [ownerId], references: [id])
  teams       Team[]
  invitations OrganizationInvitation[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("organizations")
  @@index([ownerId])
}

model Team {
  id                     String        @id @default(cuid())
  name                   String
  description            String?
  project                String?      // What project the team is working on
  credits                Int          @default(0)
  organizationId         String?      @map("organization_id") // Optional - teams can exist without organizations
  organization           Organization? @relation(fields: [organizationId], references: [id])
  organizationWasDeleted Boolean       @default(false) @map("organization_was_deleted") // Set to true when parent org is deleted; makes team read-only until re-linked
  ownerId                String       @map("owner_id")
  owner                  User         @relation("TeamOwner", fields: [ownerId], references: [id])
  members                TeamMember[]
  worklogs               Worklog[]
  createdAt              DateTime     @default(now())
  updatedAt              DateTime     @updatedAt

  @@map("teams")
  @@index([organizationId])
  @@index([ownerId])
}

model IdempotencyKey {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String   @map("user_id")
  opType    String   @map("op_type") // e.g., "CREATE_TEAM", "CREATE_WORKLOG"
  status    Int      // HTTP status code (201, etc.)
  response  String   @db.Text // Cached JSON response
  expiresAt DateTime @map("expires_at") // 24 hours from creation

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([token, userId])
  @@index([expiresAt])
  @@index([userId])
  @@map("idempotency_keys")
}

model TeamMember {
  id        String   @id @default(cuid())
  teamId    String   @map("team_id")
  userId    String?  @map("user_id")
  email     String
  token     String?  @unique // Invitation token
  status    MemberStatus @default(PENDING) // PENDING, ACCEPTED, REJECTED
  invitedAt DateTime @default(now())
  joinedAt  DateTime?

  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@unique([teamId, email])
  @@index([userId])
  @@index([status])
  @@index([userId, status])
  @@index([teamId, status])
  @@map("team_members")
}

model OrganizationInvitation {
  id             String   @id @default(cuid())
  organizationId String   @map("organization_id")
  userId         String?  @map("user_id")
  email          String
  token          String?  @unique // Invitation token
  status         MemberStatus @default(PENDING)
  invitedAt      DateTime @default(now())
  joinedAt       DateTime?

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user          User?       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId])
  @@unique([organizationId, email])
  @@index([userId])
  @@index([status])
  @@index([userId, status])
  @@index([organizationId, status])
  @@map("organization_invitations")
}

model Worklog {
  id             String        @id @default(cuid())
  title          String
  description    String        @db.Text
  githubLink     String?       // Optional GitHub commit/PR link
  progressStatus ProgressStatus @default(STARTED)
  deadline       DateTime?     // Optional deadline set by team owner
  userId         String        @map("user_id")
  teamId         String        @map("team_id")
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  team           Team          @relation(fields: [teamId], references: [id], onDelete: Cascade)
  ratings        Rating[]
  attachments    WorklogAttachment[]

  @@map("worklogs")
  @@index([userId])
  @@index([teamId])
  @@index([userId, progressStatus])
  @@index([userId, createdAt])
  @@index([teamId, createdAt])
  @@index([createdAt])
  @@index([deadline])
}

model WorklogAttachment {
  id        String   @id @default(cuid())
  worklogId String   @map("worklog_id")
  url       String
  fileName  String
  mimeType  String
  size      Int
  kind      String   // "image" or "file"
  createdAt DateTime @default(now())

  worklog Worklog @relation(fields: [worklogId], references: [id], onDelete: Cascade)

  @@map("worklog_attachments")
}

model Rating {
  id        String   @id @default(cuid())
  value     Int      // 1-10 scale
  comment   String?  @db.Text
  worklogId String   @map("worklog_id")
  raterId   String   @map("rater_id") // Organization owner who rated
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  worklog   Worklog  @relation(fields: [worklogId], references: [id], onDelete: Cascade)
  rater     User     @relation(fields: [raterId], references: [id], onDelete: Cascade)

  @@unique([worklogId, raterId]) // One rating per worklog per rater
  @@map("ratings")
}

enum MemberStatus {
  PENDING
  ACCEPTED
  REJECTED
}

enum ProgressStatus {
  STARTED
  HALF_DONE
  COMPLETED
  REVIEWED
  GRADED
}
```

## Authentication Setup (Auth.js)

Based on [official Prisma Auth.js guide](https://www.prisma.io/docs/guides/authjs-nextjs). Implemented with Prisma adapter, Google OAuth (with `hd=nu.edu.pk` domain enforcement), and GitHub OAuth (implemented but disabled in `lib/auth.ts`). Google OAuth restricts to dual domains: `@nu.edu.pk` and `@isb.nu.edu.pk` via OpenID Connect hd parameter AND runtime validation in `signIn` callback (defense in depth). Email domain validation for invitations enforced at API level in `lib/validations.ts`.

## Pagination Implementation

**Status**: ✅ **100% IMPLEMENTED** across all paginated endpoints following best practices.

### Pagination Pattern

All paginated endpoints return responses in this format:

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}
```

### Paginated Endpoints (8/8)

- `GET /api/teams/owned?page=1&limit=25` — Teams owned by user
- `GET /api/teams/member?page=1&limit=25` — Teams where user is member
- `GET /api/organizations?page=1&limit=25` — Organizations owned by user
- `GET /api/teams/[teamId]/members?page=1&limit=50` — Team members list
- `GET /api/teams/[teamId]/worklogs?page=1&limit=25` — Team worklogs
- `GET /api/organizations/[id]/worklogs?page=1&limit=25` — Organization worklogs
- `GET /api/worklogs/[worklogId]/ratings?page=1&limit=25` — Worklog ratings
- `GET /api/dashboard?worklogPage=1&worklogLimit=25` — Dashboard with paginated worklogs

### React Query Hooks (6/6)

All hooks accept `page` and `limit` parameters:

```typescript
// Example: useTeamWorklogs(teamId, page, limit)
const { data: paginatedWorklogs } = useTeamWorklogs(teamId, 1, 25);
const worklogs = paginatedWorklogs?.items ?? [];
const totalPages = paginatedWorklogs?.meta.totalPages ?? 1;
```

### UI Component

```typescript
<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
  isLoading={isLoading}
/>
```

## Idempotency for Duplicate Prevention

**Status**: ✅ **100% IMPLEMENTED** using atomic transactions.

### Pattern

All data-mutating hooks generate and inject idempotency tokens:

```typescript
const { mutateAsync: createTeam } = useCreateTeam();
// Hook internally:
// 1. Generates UUID on component mount via useRef
// 2. Injects Idempotency-Key header on every request
// 3. Resets token after success
```

### Server Implementation

Atomic transaction wrapper in `app/api/_idempotency.ts`:

```typescript
const result = await withIdempotency<Team>(
  token,
  userId,
  "CREATE_TEAM",
  201,
  (tx) => tx.team.create({ data: teamData }),
);

if (result.cached) return result.response; // Duplicate — return previous response
return apiResponse(result.data, 201); // New — return created data
```

### Covered Routes

- `POST /api/teams` — Team creation
- `POST /api/organizations` — Organization creation
- `POST /api/worklogs` — Worklog creation

### Cleanup

Vercel cron job (`app/api/cron/cleanup-idempotency-keys/route.ts`) runs daily at 03:00 UTC to delete expired keys (24-hour lifetime).

## Critical Patterns

- `app/generated/prisma/`: Custom Prisma client output location
- `lib/prisma.ts`: Singleton Prisma client with PostgreSQL adapter
- `lib/auth.ts`: Auth.js configuration with Google OAuth (primary) and GitHub OAuth (disabled)
- `proxy.ts`: Auth.js proxy (Next.js 16 renamed middleware.ts → proxy.ts; export is `auth as proxy`)
- `components/auth-components.tsx`: Reusable authentication components
- `components/team-invitation-email.tsx`: React Email template for team invitations
- `components/emails/OrganizationInvitationEmail.tsx`: React Email template for organization invitations
- `app/api/dashboard/route.ts`: Optimized dashboard data endpoint (combines sidebar stats, worklogs, and team data in single request)
- `app/api/sidebar/stats/route.ts`: Real-time sidebar statistics endpoint
- `app/api/teams/member/route.ts`: Get teams where user is a member
- `app/api/teams/owned/route.ts`: Get teams owned by user
- `app/api/teams/accessible/route.ts`: Get all teams user can access (owned + member)
- `app/api/teams/invitations/route.ts`: Get pending team invitations for user
- `app/api/teams/[teamId]/invite/route.tsx`: Team invitation API endpoint
- `app/api/teams/[teamId]/credits/route.ts`: Team credits management API (GET/PATCH)
- `app/api/teams/[teamId]/worklogs/route.ts`: Get worklogs for specific team
- `app/api/teams/[teamId]/members/route.ts`: Team member management (GET/POST)
- `app/api/teams/[teamId]/members/[memberId]/route.ts`: Individual team member management (DELETE)
- `app/api/organizations/[organizationId]/invite/route.ts`: Organization invitation API endpoint
- `app/api/organizations/[organizationId]/credits/route.ts`: Organization credits API (GET/PATCH)
- `app/api/organizations/[organizationId]/worklogs/route.ts`: Get worklogs for specific organization
- `app/api/worklogs/[worklogId]/status/route.ts`: Worklog status transition API with strict validation
- `app/api/worklogs/[worklogId]/ratings/route.ts`: Create and list ratings (org owners only)
- `app/api/ratings/[ratingId]/route.ts`: Individual rating management (GET/PATCH/DELETE)
- `app/api/invitations/[token]/accept/route.tsx`: Invitation acceptance endpoint
- `app/api/invitations/[token]/reject/route.tsx`: Invitation rejection endpoint
- `app/api/cron/cleanup-idempotency-keys/route.ts`: Vercel cron job (daily at 03:00 UTC) to clean expired idempotency keys
- `lib/auth-utils.ts`: Comprehensive RBAC helper functions (isOrganizationOwner, isTeamOwner, etc.)
- `lib/validations.ts`: Zod validation schemas for all API requests
- `lib/mock-data.ts`: Complete mock data for development (users, teams, organizations, worklogs, ratings)
- `lib/api-pagination.ts`: Pagination helpers — `parsePaginationParams()`, `createPaginatedResponse()` for all paginated endpoints
- `lib/query-optimizations.ts`: Query optimization helpers — cursor pagination (`buildCursorPage()`), batch statistics, minimal selects
- `lib/types/pagination.ts`: Pagination types — `PaginatedResponse<T>`, `PaginationMeta`, helpers
- `lib/api-utils/idempotency-middleware.ts`: Idempotency header helpers — `fetchWithIdempotency()`, `idempotencyHeaders()`
- `lib/hooks/use-idempotency-token.ts`: React hook for per-component idempotency token management
- `app/api/_idempotency.ts`: Atomic transaction wrapper `withIdempotency<T>()` for duplicate prevention
- `components/ui/pagination.tsx`: Pagination control component (with page ellipsis, accessibility)
- `lib/hooks/`: Complete set of React Query hooks with client-side dev mocks (use-dashboard, use-organizations, use-teams, use-worklogs, use-ratings, use-user, use-content-theme, use-mounted, use-prefetch)
- `prisma/schema.prisma`: Database schema with Auth.js and hierarchical models
- `app/debug/`: Development-only debug page for testing team access
- `app/home/`: Main dashboard page with multi-role navigation
- `app/profile/`: User profile page with account information and settings
- `app/teams/`: Role-specific team views and worklog management
- `api-documentation.md`: Complete API reference documentation
- Environment variables loaded via `dotenv/config` in `prisma.config.ts`

## Component Organization

The application follows a modular component architecture:

- **`components/ui/`**: shadcn/ui components (buttons, inputs, dialogs, etc.)
- **`components/forms/`**: Form components and wizards (team creation, worklog forms)
- **`components/worklog/`**: Worklog-specific components (rich text editor, deadline components)
- **`components/teams/`**: Team management components (creation wizard, settings)
- **`components/filters/`**: Filtering components for worklogs and teams
- **`components/wizard/`**: Multi-step wizard components
- **`components/states/`**: Loading, error, and empty state components
- **`components/entities/`**: Reusable entity cards and list components
- **`components/actions/`**: CRUD action components
- **`components/auth/`**: Authentication-related components (test user switcher)
- **`components/emails/`**: Email template components (OrganizationInvitationEmail)
- **`components/` (root level)**: Core components (auth-components, email templates, providers, rating modal, GanttChart, error-boundary, organization-settings-dialog)

## Critical Patterns

### Organization Authorization

```typescript
// Check if user is organization owner
const isOrgOwner = await prisma.organization.findFirst({
  where: { id: organizationId, ownerId: session.user.id },
});

// Check if user owns a team in an organization
const ownsTeamInOrg = await prisma.team.findFirst({
  where: {
    id: teamId,
    ownerId: session.user.id,
    organizationId: organizationId,
  },
});
```

### Team Authorization

```typescript
// Check if user is team owner
const isOwner = await prisma.team.findFirst({
  where: { id: teamId, ownerId: session.user.id },
});

// Check if user is team member
const isMember = await prisma.teamMember.findFirst({
  where: {
    teamId,
    userId: session.user.id,
    status: "ACCEPTED",
  },
});
```

### Progress Status Authorization

```typescript
// Use auth-utils helper functions for authorization checks
import {
  getCurrentUser,
  isOrganizationOwner,
  isTeamOwner,
  isTeamMember,
  isWorklogOwner,
} from "@/lib/auth-utils";

// Members can update: STARTED → HALF_DONE → COMPLETED
const canUpdateProgress =
  (await isWorklogOwner(userId, worklogId)) ||
  (await isTeamMember(userId, teamId));

// Team owners can set: COMPLETED → REVIEWED
const canReview =
  (await isTeamOwner(userId, teamId)) && currentStatus === "COMPLETED";

// Organization owners can rate: REVIEWED → GRADED
const canRate =
  (await isOrganizationOwner(userId, organizationId)) &&
  currentStatus === "REVIEWED";

// Valid status transitions (enforced by API)
const VALID_TRANSITIONS = {
  STARTED: ["HALF_DONE"],
  HALF_DONE: ["COMPLETED"],
  COMPLETED: ["REVIEWED"],
  REVIEWED: ["GRADED"],
  GRADED: [], // Terminal state
};
```

### Worklog Visibility

- **Members**: See only their own worklogs (up to COMPLETED status)
- **Team Owners**: See all worklogs in their teams (up to REVIEWED status)
- **Organization Owners**: See all worklogs in their organizations (all statuses + ratings)

### Rating Visibility

- **Ratings are NEVER visible to team members or team owners**
- **Only organization owners can see and manage ratings for worklogs in their organizations**
- **Ratings are internal performance metrics**

### Email Invitations

Use Resend Node.js SDK for team and organization invitations. Follow [Resend Next.js guide](https://resend.com/docs/send-with-nextjs) for setup. Create pending TeamMember records, send invitation emails, and update status on acceptance.

**Implementation Details:**

- **Email Domain Validation**: Both OAuth and Resend enforce dual domain restriction (`@nu.edu.pk`, `@isb.nu.edu.pk`). Validated in `lib/validations.ts` and API endpoints before sending.
- Secure token generation using `crypto.randomBytes(32).toString('hex')`
- React Email templates with styled accept/reject buttons
- Token validation with PENDING status requirement
- Duplicate invitation prevention via database upsert
- Invitation expiration: 7 days for team invites, 14 days for org invites (see `RESEND_EMAIL_IMPLEMENTATION_PLAN.md`)

## Development Workflow

- **Database Setup**: Run `npx prisma migrate dev` after schema changes
- **Database Seeding**: Run `npm run db:seed` for initial data
- **Client Generation**: Prisma client auto-generates to `app/generated/prisma/` on build/migrate
- **Environment**: Requires `DATABASE_URL` in `.env` file
- **Email Setup**: Configure email service for team invitations
- **Mock Data Development**: All data-fetching hooks include `process.env.NODE_ENV === "development"` guards that return mock data instantly without network calls (see lib/mock-data.ts for mock data structure)
- **Linting and Formatting**: Use `npm run lint` for ESLint (with Next.js config) and `npx prettier --write .` for code formatting (Prettier integrated to avoid conflicts)

## UI/UX Best Practices

- **Dashboard Routing**: Main dashboard page (`/home`) with conditional logic:
  - Completely new user with no team invites: Show "Create Organization" and "Create Team" buttons
  - Users with multiple roles: Show tabbed interface for different roles (no need to focus on the specifics. Just know that for users with more than single role, they can navigate role-suitable dashboard using navigation sidebar)
- **Multi-Role Tabs**: When users have multiple roles, display tabs:
  - "My Organizations" (for organization owners)
  - "My Teams (as Owner)" (for team ownership)
  - "My Teams (as Member)" (for team membership)
- **Role-Based Visibility**:
  - **Members**: See worklog progress up to COMPLETED, their own deadlines
  - **Team Owners**: See worklog progress up to REVIEWED, can set deadlines, review worklogs
  - **Organization Owners**: See all progress statuses, ratings interface, organization management
- **Organization Dashboard**: Organization owners see organization overview, team management, all worklogs and ratings
- **Team Owner Dashboard**: Shows team overview, member management, worklogs up to REVIEWED status
- **Member Dashboard**: Shows personal worklogs, team list, progress updates
- **Organization Creation Flow**: Simple form with name and description
- **Team Creation Flow**: Simple form with project name, optional organization selection, description
- **Invitation Flow**: Email input field for team member emails (university domain only) and organization owner emails
- **Worklog Forms**: Rich text description, optional GitHub link validation, optional images as work evidence, progress status updates
- **Deadline Setting**: Team owners can set optional deadlines per worklog with visual indicators
- **Progress Tracking**: Members update STARTED → HALF_DONE → COMPLETED, team owners set REVIEWED, organization owners set GRADED
- **Rating Interface**: 1-10 scale with optional comments, only visible to organization owners, can only rate REVIEWED or GRADED worklogs
- **Deadline Indicators**: Show "due in X days", "overdue", or "completed on time"
- **Responsive Design**: Mobile-friendly organization/team management and worklog submission

## Current State

- ✅ **Authentication Backend**: Fully implemented with Auth.js v5, GitHub OAuth, Google OAuth (dual domain restriction `@nu.edu.pk` and `@isb.nu.edu.pk`), and Prisma integration
- ✅ **Email Workflow**: Complete team and organization invitation system with Resend SDK, secure tokens, React Email templates, dual domain validation, and invitation expiration (7/14 days)
- ✅ **Database Schema**: Organization, Team, TeamMember, Worklog, Rating, WorklogAttachment, IdempotencyKey models with performance indexes and migrations applied
- ✅ **API Endpoints**: 15+ REST endpoints for organizations, teams, worklogs, ratings, invitations, and file uploads
- ✅ **File Upload System**: Worklog attachments support for images and documents with validation
- ✅ **Organization Model**: Full CRUD with credits field, team assignment, and proper relations
- ✅ **Progress Tracking**: 5-state progression (STARTED → HALF_DONE → COMPLETED → REVIEWED → GRADED) with strict role-based enforcement
- ✅ **Rating System**: Organization owner rating interface and CRUD operations (hidden from lower roles)
- ✅ **Credits System**: Organization and team credits management APIs (GET/PATCH with add/subtract/set actions)
- ✅ **Authorization Utilities**: Comprehensive RBAC helper functions in lib/auth-utils.ts
- ✅ **Validation Layer**: Zod schemas for all API request validation
- ✅ **Deadline System**: Full CRUD operations with visual indicators in GanttChart and deadline components
- ✅ **Multi-Role UI**: Sidebar navigation with dynamic behavior for users with multiple roles
- ✅ **Organization Management**: Complete org CRUD, team assignment, org-level worklog/rating management
- ✅ **Client-Side Dev Mocks**: Comprehensive mock data for all data-fetching hooks with NODE_ENV guards
- ✅ **Pagination Implementation**: 100% implemented across 8 paginated endpoints (teams/owned, teams/member, organizations, team members, team worklogs, org worklogs, worklog ratings, dashboard)
- ✅ **Idempotency for Duplicate Prevention**: Atomic transaction pattern with per-hook token generation; covers team, org, and worklog creation; 24-hour TTL with Vercel cron cleanup
- ✅ **Org-Deleted Teams Read-Only State**: Atomic `organizationWasDeleted` flag with API and UI enforcement; supports re-linking migration path
- ✅ **HTTP Cache Collision Fix**: `Cache-Control: no-store` enforced globally on all API routes; TanStack Query now receives fresh data after mutations
- ✅ **Security Hardening**: Unauthenticated test endpoint removed, cron auth fail-closed, rating data leaks fixed, DB version disclosure removed, Zod validation on all mutation endpoints, `handleApiError()` standardized, Dependabot configured

**🎉 APPLICATION STATUS: FULLY INTEGRATED AND PRODUCTION READY**

## Common Pitfalls

### TanStack Query + HTTP Cache Collision (CRITICAL)

**Problem**: Adding `Cache-Control: max-age > 0` to API routes in `next.config.ts` causes `refetchQueries` to receive stale HTTP-cached responses after mutations — shows correct data briefly then reverts to old data.

**Solution**:

- ✅ ALL `/api/:path*` routes MUST use `Cache-Control: no-store` (enforced in `next.config.ts`)
- ✅ `apiResponse()` helper in `lib/api-utils.ts` adds `no-store` header on every response (defense-in-depth)
- ✅ In mutation `onSettled`, use `refetchQueries(specificKey)` for primary data list instead of `invalidateQueries(broadPrefix)` — refetter directly triggers network fetch; invalidate only marks stale and relies on observer re-render cycles

### Org-Deleted Teams Read-Only Enforcement

**Problem**: When an organization is deleted, Prisma's `SetNull` cascade sets `organizationId = null` on all linked teams. After deletion, org-deleted teams are indistinguishable from standalone teams (both have `organizationId = null`).

**Solution**:

- ✅ Added `organizationWasDeleted Boolean @default(false)` to `Team` model in Prisma schema
- ✅ Org DELETE handler uses atomic `prisma.$transaction(async tx => { ... })` form to:
  1. Set `organizationWasDeleted = true` on all linked teams
  2. Delete the org
  - This guarantees ordering — updateMany completes before Prisma's SetNull cascade runs
- ✅ API-level read-only enforcement (return 403) on:
  - `POST /api/teams/[teamId]/invite` (team invitations blocked)
  - `PATCH /api/teams/[teamId]/credits` (credits updates blocked)
  - `DELETE /api/teams/[teamId]` (team deletion blocked)
  - `POST /api/worklogs` (worklog creation blocked if team is org-deleted)
  - **Exception**: `PATCH /api/teams/[teamId]` with ONLY `organizationId` field is allowed (re-linking migration path) — automatically resets `organizationWasDeleted: false` when re-linking
- ✅ UI-level read-only enforcement:
  - Amber "Organization deleted · Read-only" badge on team cards in `/teams/lead`
  - Amber banner + disabled form fields in TeamSettingsDialog (only org select is enabled)
  - Amber banner + disabled "Assign Task" button in `/teams/lead/[teamId]`
  - Hidden delete/status action buttons in TeamWorklogTable when `isReadOnly`

### Team Settings Form Submission Bug (Fixed 2026-03-14)

**Problem**: `onSubmit` always included all form fields (name, description, project) in the payload, even when disabled. For org-deleted teams, the backend guard checked `if (name !== undefined)` and returned 403 — blocking legitimate re-links.

**Solution**:

- ✅ Frontend: When `isOrgDeleted`, `onSubmit` sends ONLY `{ organizationId }` and skips all other fields
- ✅ Backend: Early-return path for org-deleted teams that applies ONLY the org change (any extra fields silently discarded)
- ✅ Mutation hook now surfaces actual server error messages in toast instead of generic "Failed to update team"

### Prisma Client Import Pitfall

- ❌ DON'T: `import { PrismaClient } from "@prisma/client"`
- ✅ DO: Use singleton from `lib/prisma.ts` — custom output path at `app/generated/prisma/`

### Idempotency Implementation

- ✅ Per-hook idempotency via `useIdempotencyToken()` — each hook creates its own UUID on mount, resets after success
- ✅ Server pattern: `withIdempotency<T>(token, userId, opType, status, action)` atomic transaction wrapper
- ✅ Atomic design prevents TOCTOU races — check + execute + record in single transaction; P2002 race rolls back entire transaction
- ✅ Idempotency keys expire after 24 hours (cleanup via Vercel cron job)

### Database Connectivity

- Requires `DATABASE_URL` in `.env` (PostgreSQL connection string)
- For development: `postgresql://postgres:password@localhost:5432/worklog_app`
- Ensure dotenv is imported BEFORE Prisma operations in config files

### Tailwind CSS 4

- Uses `@import "tailwindcss"` as entry point (NOT v3 style `@tailwind directives`)
- `utilities/` directory handles no custom Tailwind output — all CSS is Tailwind
- CSS variables in `app/globals.css` `:root` and `.dark {}` for theme support

### Auth.js Proxy

- Next.js 16 renamed `middleware.ts` → `proxy.ts`; export must be `auth as proxy` (NOT `auth as middleware`)
- **No `runtime` export**: proxy always runs on Node.js runtime in Next.js 16+ — `export const runtime` is not allowed in proxy files and will throw an error
- Remove `runtime = "vercel-edge"` from Prisma generator for local development

### OAuth Domain Restriction

- Google OAuth enforces `@nu.edu.pk` via OpenID Connect HDomain (`hd`) parameter
- Fallback validation in `signIn` callback extends to `@isb.nu.edu.pk` (defense-in-depth)
- BOTH domains must be validated together in API invitation endpoints
- GitHub OAuth has no domain restriction; email domain validation happens at invitation level

### Email Domain Validation

- Invitations require valid dual-domain emails (`@nu.edu.pk`, `@isb.nu.edu.pk`)
- Enforced in three layers:
  1. OAuth (`hd` parameter for Google)
  2. API validation in `lib/validations.ts` (invitation endpoints)
  3. Resend email sending layer (email service respects domain restrictions)

### Progress Status Transitions

- ALWAYS validate via `VALID_TRANSITIONS` map in API route
- ALWAYS check role permissions before allowing transition
- NEVER allow backdoor state changes (e.g., skipping HALF_DONE)
- Transitions enforced: STARTED → HALF_DONE → COMPLETED → REVIEWED → GRADED

### Rating Visibility (Security Requirement)

- Ratings MUST be hidden from team members AND team owners
- ONLY organization owners can see/manage ratings for worklogs in their organizations

### Pagination Best Practices

- ✅ All paginated endpoints return `{ items, meta: { page, limit, total, totalPages, hasNextPage } }`
- ✅ Hooks accept `page` and `limit` parameters; default to page=1, limit=25
- ✅ UI components pass `currentPage`, `totalPages`, `onPageChange` to `<Pagination />`
- ✅ TanStack Query caching handles pagination automatically per (page, limit) combination

### Mock Data Development

- ✅ All data-fetching hooks include `process.env.NODE_ENV === "development"` guards that return mock data instantly without database calls
- ✅ Never modify mock data guards or structure without understanding the full client-side mock system
- ✅ Frontend dev can proceed 100% independently of database

### Stale `.next` Cache Error

- On TypeScript errors like `Type error: ';' expected` in `.next/dev/types/routes.d.ts`, run `rm -rf .next` before rebuilding
- Ensures clean typecheck after schema changes

### Disabled Form Fields in React Hook Form

- Disabled inputs don't get included in form submission by default
- When form fields are disabled via `disabled={condition}`, their values still reach `handleSubmit()` via `watch()` or control
- Solution: Strip disabled fields from payload in `onSubmit` before calling mutation (see org-deleted team re-link pattern)

### User Invitations & Duplicate Prevention

- TeamMember and OrganizationInvitation both use `MemberStatus` enum (PENDING/ACCEPTED/REJECTED)
- Unique constraint on `(teamId, email)` and `(organizationId, email)` prevents duplicate invitations
- Tokens must be unique and validated before status update
- Idempotency keys prevent duplicate resource creation on retry

### File Upload & Attachments

- Files stored via WorklogAttachment model
- Type/size validation enforced (images and documents supported)
- Kind field distinguishes image vs file for UI rendering

### CSP Headers

- Content-Security-Policy headers in `next.config.ts` restrict external resources
- Update if adding new external services (check current config before integrating third-party assets)

### Cron Endpoint Security

- All cron endpoints (`app/api/cron/`) require `CRON_SECRET` via `Authorization: Bearer` header
- Guard MUST use fail-closed pattern: `if (!cronSecret || authHeader !== ...)` — returns 401 if secret is unset
- ❌ NEVER use `if (cronSecret && ...)` — skips auth when secret is unset (fail-open vulnerability)

### Error Handling Standard

- All API route `catch` blocks MUST use `handleApiError()` from `lib/api-utils.ts`
- ❌ NEVER use bare `console.error(...)` + `NextResponse.json({ error: "..." })` in catch blocks
- `handleApiError()` logs full error server-side, returns generic "Internal server error" to client, handles ZodError as 400

### Rating Visibility (Security Requirement)

- Ratings MUST NEVER be returned to team members or team owners via ANY API route
- `GET /api/teams/[teamId]/worklogs` MUST NOT include `ratings` in Prisma query
- `GET /api/worklogs` (member's own worklogs) MUST NOT fetch or return rating data
- ONLY org-owner-gated endpoints (`/api/worklogs/[id]/ratings`, `/api/ratings/[id]`) may return ratings

### Session Token Encryption

- Session tokens encrypted with AUTH_SECRET environment variable
- Rotate AUTH_SECRET in production after deployment (existing sessions become invalid)

## Backend Requirements

- **Database schema**: ✅ COMPLETED - Prisma models for User, Organization (with credits), Team (with credits), TeamMember, Worklog (with 5-state ProgressStatus), Rating (with relations and enums). Auth.js models (Account, Session, VerificationToken) implemented. Migrations applied successfully.
- **APIs for CRUD operations on member worklogs**: ✅ COMPLETED - Create, read, update, delete worklogs (members only access their own; includes progress status updates up to COMPLETED and optional images/documents attachments)
- **APIs for team owner worklog management**: ✅ COMPLETED - Update worklog status to REVIEWED via /api/worklogs/[worklogId]/status, set deadlines, view all team worklogs up to REVIEWED status.
- **APIs for CRUD operations on organization owner ratings**: ✅ COMPLETED - Create, read, update, delete ratings (POST/GET at /api/worklogs/[worklogId]/ratings, GET/PATCH/DELETE at /api/ratings/[ratingId]; organization owners only for worklogs in their organizations; hidden from lower roles).
- **APIs for credits management**: ✅ COMPLETED - Organization credits (GET/PATCH at /api/organizations/[organizationId]/credits) and team credits (GET/PATCH at /api/teams/[teamId]/credits) with add/subtract/set actions.
- **APIs for organization management**: ✅ COMPLETED - Full CRUD operations for organizations (POST/GET/PATCH/DELETE /api/organizations), list organizations (GET /api/organizations with teams included), assign teams on creation, individual org management, team reassignment to different orgs, org updates/deletion.
- **APIs for team management**: ✅ COMPLETED - Full CRUD operations for teams (POST/GET/PATCH/DELETE /api/teams), invite/accept/reject members, view team details (via owned/member routes), member removal, team updates/deletion.
- **Progress status validation**: ✅ COMPLETED - Ensure proper status transitions (STARTED → HALF_DONE → COMPLETED → REVIEWED → GRADED) with role-based permissions enforced at API level.
- **Authorization layer**: ✅ COMPLETED - Comprehensive RBAC helper functions in lib/auth-utils.ts (isOrganizationOwner, isTeamOwner, isTeamMember, isWorklogOwner, canTeamOwnerAccessTeam, etc.).
- **Input validation**: ✅ COMPLETED - Zod schemas for all API request validation in lib/validations.ts (credits, status, ratings, organizations, teams, worklogs).
- **Deadline management**: ✅ COMPLETED - Deadlines can be set on worklog creation, updated, and deleted; visual indicators fully implemented in GanttChart component and dedicated deadline components.
- **Authentication with OAuth**: ✅ COMPLETED - Auth.js setup with Prisma adapter, GitHub and Google providers, Node.js runtime compatibility.
- **Email invites**: ✅ COMPLETED - Send invitations via Resend Node.js SDK, handle pending/accepted/rejected statuses in TeamMember model with secure token validation. Organization invitations also implemented with dedicated email templates.
- **Authorization checks**: ✅ COMPLETED - Middleware or per-route validation to ensure users can only access their organizations/teams/worklogs/ratings based on hierarchical permissions.
- **Input validation and error handling**: ✅ COMPLETED - Use Zod for API request validation, standardize error responses (e.g., 400/403/404).
- **GitHub link validation (optional)**: ✅ COMPLETED - Zod schema validation for GitHub URLs in worklog creation
- **Database setup and migrations**: ✅ COMPLETED - Prisma client configuration, run migrations, handle connection pooling for production.

## Frontend Libraries (Implemented)

The following libraries are actively used in the project:

#### Core UI & Component Libraries

- **shadcn/ui**: ✅ IMPLEMENTED - Accessible components on Radix UI. Includes forms (React Hook Form + Zod), notifications (Sonner), and UI primitives. Used for team creation, worklog submission, and all input forms.
- **Lucide React**: ✅ IMPLEMENTED - Icon library compatible with shadcn/ui. Provides customizable icons for forms, dashboards, and navigation.
- **React Icons**: ✅ IMPLEMENTED - Popular icon library with multiple icon packs. Used for additional icon options throughout the application.

#### Animation & Interaction

- **Framer Motion**: ✅ IMPLEMENTED - Lightweight React animation library. Used for dashboard transitions, worklog animations, and rating sliders. Compatible with Next.js 16 and edge runtime.

#### Date & Time Handling

- **date-fns**: ✅ IMPLEMENTED - Modular date utilities. Used to handle worklog timestamps, durations, and date inputs. Tree-shakable and lightweight.
- **react-day-picker**: ✅ IMPLEMENTED - Flexible date picker component for React. Used for deadline selection and date inputs.

#### Data Fetching & State Management

- **TanStack Query (React Query)**: ✅ IMPLEMENTED - Data fetching and caching for React. Used to manage worklogs, ratings, and team data with efficient caching and auth integration.

#### Rich Text Editing

- **TipTap**: ✅ IMPLEMENTED - Headless rich text editor framework. Used for worklog description editing with advanced formatting capabilities.

#### Form Handling

- **React Hook Form**: ✅ IMPLEMENTED - Performant forms with easy validation. Used throughout the application for form state management and validation.
- **@hookform/resolvers**: ✅ IMPLEMENTED - Resolvers for React Hook Form to work with validation libraries like Zod.

#### Email & Communication

- **Resend**: ✅ IMPLEMENTED - Email service SDK for sending transactional emails. Used for team invitations and notifications.
- **@react-email/components**: ✅ IMPLEMENTED - React components for building email templates. Used for styled invitation emails.

#### Theming & Styling

- **next-themes**: ✅ IMPLEMENTED - Theme provider for Next.js applications. Enables dark/light mode switching.
- **clsx**: ✅ IMPLEMENTED - Conditional Tailwind class merging for dynamic styling.
- **tailwind-merge**: ✅ IMPLEMENTED - Utility for merging Tailwind CSS classes intelligently.
- **class-variance-authority**: ✅ IMPLEMENTED - Utility for creating variant-based component styles.

#### Additional Utilities

- **Tailwind CSS plugins** (e.g., @tailwindcss/forms): Optional enhancements for form styling.
