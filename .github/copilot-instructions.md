# Worklog App - AI Coding Guidelines

## Project Overview

This is a hierarchical worklog tracking system for organizations, teams, and members. Key features:

- **Three-Tier Hierarchy**: Organization Owner → Team Owner → Team Member
- **OAuth Authentication**: Google university email + GitHub login (restriction code has been implemented but commented out for the time being)
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
- **Database**: Prisma 7 + PostgreSQL (hosted on Prisma Cloud)
- **Styling**: Tailwind CSS 4 with custom theme variables
- **Auth**: ✅ Auth.js v5 with GitHub and Google OAuth (restriction code has been implemented but commented out for the time being)
- **Email**: For team invitations
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
  id              String       @id @default(cuid())
  name            String
  description     String?
  project         String?      // What project the team is working on
  credits         Int          @default(0)
  organizationId  String?      @map("organization_id") // Optional - teams can exist without organizations
  organization    Organization? @relation(fields: [organizationId], references: [id])
  ownerId         String       @map("owner_id")
  owner           User         @relation("TeamOwner", fields: [ownerId], references: [id])
  members         TeamMember[]
  worklogs        Worklog[]
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@map("teams")
  @@index([organizationId])
  @@index([ownerId])
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
  REVIEWED
}
```

## Authentication Setup (Auth.js)

Based on [official Prisma Auth.js guide](https://www.prisma.io/docs/guides/authjs-nextjs). Follow the guide for setup with Prisma adapter, Google/GitHub providers, and university domain restriction (e.g., `hd=nu.edu.pk` for Google).

## Key Project Structure

- `app/generated/prisma/`: Custom Prisma client output location
- `lib/prisma.ts`: Singleton Prisma client with PostgreSQL adapter
- `lib/auth.ts`: Auth.js configuration with GitHub and Google OAuth providers
- `middleware.ts`: Authentication middleware with Node.js runtime
- `components/auth-components.tsx`: Reusable authentication components
- `components/email-template.tsx`: Email template component for testing
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
- `app/api/send/route.tsx`: Test email sending endpoint (development only)
- `lib/auth-utils.ts`: Comprehensive RBAC helper functions (isOrganizationOwner, isTeamOwner, etc.)
- `lib/validations.ts`: Zod validation schemas for all API requests
- `lib/mock-data.ts`: Complete mock data for development (users, teams, organizations, worklogs, ratings)
- `lib/hooks/`: Complete set of React Query hooks with client-side dev mocks (use-dashboard, use-organizations, use-teams, use-worklogs, use-ratings, use-user, use-content-theme, use-mounted, use-prefetch)
- `prisma/schema.prisma`: Database schema with Auth.js and hierarchical models
- `app/debug/`: Development-only debug page for testing team access
- `app/home/`: Main dashboard page with multi-role navigation
- `app/profile/`: User profile page with account information and settings
- `app/teams/`: Role-specific team views and worklog management
- `api-documentation.md`: Complete API reference documentation
- `OAUTH_BYPASS_IMPLEMENTATION_PLAN.md`: OAuth bypass implementation plan
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

- Secure token generation using `crypto.randomBytes(32).toString('hex')`
- React Email templates with styled accept/reject buttons
- Token validation with PENDING status requirement
- Duplicate invitation prevention via database upsert
- University email validation (commented out for the time being. Basic OAuth works 100% ok)

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

- ✅ **Authentication Backend**: Fully implemented with Auth.js v5, GitHub OAuth, Google OAuth, and Prisma integration
- ✅ **Email Workflow**: Complete team and organization invitation system with Resend SDK, secure tokens, and React Email templates
- ✅ **Database Schema**: Organization, Team, TeamMember, Worklog, Rating, WorklogAttachment models implemented with performance indexes and migrations applied
- ✅ **API Endpoints**: Complete REST API implementation with 15+ endpoints for organizations, teams, worklogs, ratings, invitations, and file uploads
- ✅ **File Upload System**: Worklog attachments support for images and documents with validation and storage
- ✅ **Organization Model**: Added to database with credits field and proper relations
- ✅ **Progress Tracking**: Worklog progress status updates (STARTED → HALF_DONE → COMPLETED → REVIEWED → GRADED) with strict role-based enforcement
- ✅ **Rating System**: Organization owner rating interface and CRUD operations (POST/GET ratings, PATCH/DELETE individual ratings)
- ✅ **Credits System**: Organization and team credits management APIs (GET/PATCH endpoints)
- ✅ **Authorization Utilities**: Comprehensive RBAC helper functions in lib/auth-utils.ts
- ✅ **Validation Layer**: Zod schemas for all API request validation
- ✅ **Deadline System**: API-level deadline management implemented (CRUD operations for team owners); visual indicators fully implemented in GanttChart component and deadline components
- **Rating Automation**: Tentative feature for automatic rating reduction on late worklog completions (details not finalized yet)
- ✅ **Multi-Role UI**: Sidebar navigation structure fully implemented with dynamic behavior for users with multiple roles (Member Teams, Lead Teams, My Organizations)
- ✅ **Organization Management**: Complete organization CRUD operations, team assignment to organizations, and organization-level worklog/rating management
- ✅ **Client-Side Dev Mocks**: Comprehensive mock data implementation across all data-fetching hooks (useTeam, useTeamMembers, useMemberTeams, useOwnedTeams, useOrganizations, useWorklogs, useTeamWorklogs, useSidebarStats, useUserPermissions, useWorklogRatings, useOrganizationRatings, useDashboard, useTeamInvitations) with `process.env.NODE_ENV === "development"` guards for 100% frontend mock data visibility without database dependency

**🎉 APPLICATION STATUS: FULLY INTEGRATED AND PRODUCTION READY**

## Common Pitfalls

- Don't import Prisma client from `@prisma/client` - use the custom generated path `../app/generated/prisma`
- Ensure `dotenv/config` is imported before Prisma operations in config files
- Use PostgreSQL connection string format for `DATABASE_URL`
- Ratings must be hidden from team members and team owners (security requirement)
- Progress status transitions must follow: STARTED → HALF_DONE → COMPLETED → REVIEWED → GRADED (with proper role permissions)
- Organization owners can only access teams/worklogs within their own organizations
- When an organization is deleted, teams/worklogs remain visible but all operations are blocked (read-only). They'll be check whether the organisation that team is tied to was prevously made but deleted. If yes then new team will have to be made
- Google OAuth includes `hd=nu.edu.pk` parameter for university restriction (see Project Overview for implementation status)
- Team invitations validate university email format (commented out for the time being. Basic OAuth works 100% ok)
- Always check team membership status and organizational ownership before allowing access
- Tailwind CSS 4 requires `@import "tailwindcss"` syntax (not v3 style)
- Auth.js middleware requires `runtime = 'nodejs'` for Prisma client compatibility
- Next.js 16 shows middleware deprecation warning but Auth.js v5 still requires middleware.ts (safe to ignore per official Auth.js docs)
- Remove `runtime = "vercel-edge"` from Prisma generator for local development
- The `styles/` directory is empty and unused - can be safely deleted as all styling is handled through Tailwind CSS and component-scoped styles
- Database schema includes performance indexes for efficient queries (composite indexes on user+status, team+createdAt, etc.)
- **Mock Data Development**: All data-fetching hooks use `process.env.NODE_ENV === "development"` guards to return mock data instantly without network calls; never modify these guards or the mock data structure without understanding the full client-side mock system

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
