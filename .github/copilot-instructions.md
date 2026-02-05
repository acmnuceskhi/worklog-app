# Worklog App - AI Coding Guidelines

## Project Overview

This is a hierarchical worklog tracking system for organizations, teams, and members. Key features:

- **Three-Tier Hierarchy**: Organization Owner → Team Owner → Team Member
- **OAuth Authentication**: Google university email + GitHub login (restriction code has been implemented but commented out for the time being)
- **Organization Management**: Users can create organizations, invite team owners via email to join the organization, and manage teams within them
- **Team Management**: Team owners create teams, invite members, and set worklog deadlines
- **Progress Tracking**: Members update worklog progress (STARTED → HALF_DONE → COMPLETED), team owners set REVIEWED
- **Review System**: Team owners review completed worklogs
- **Rating System**: Organization owners rate reviewed worklogs 1-10 (ratings hidden from lower roles)
- **Deadline Management**: Optional deadlines per worklog with visual indicators
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
}

model Organization {
  id          String   @id @default(cuid())
  name        String
  description String?
  ownerId     String   @map("owner_id")
  owner       User     @relation("OrganizationOwner", fields: [ownerId], references: [id])
  teams       Team[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Team {
  id              String       @id @default(cuid())
  name            String
  description     String?
  project         String?      // What project the team is working on
  organizationId  String?      @map("organization_id") // Optional - teams can exist without organizations
  organization    Organization? @relation(fields: [organizationId], references: [id])
  ownerId         String       @map("owner_id")
  owner           User         @relation("TeamOwner", fields: [ownerId], references: [id])
  members         TeamMember[]
  worklogs        Worklog[]
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
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
  @@map("team_members")
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
- `app/api/auth/[...nextauth]/route.ts`: Authentication API routes
- `app/api/send/route.tsx`: Email testing endpoint
- `app/api/teams/[teamId]/invite/route.tsx`: Team invitation API endpoint
- `app/api/invitations/[token]/accept/route.tsx`: Invitation acceptance endpoint
- `app/api/invitations/[token]/reject/route.tsx`: Invitation rejection endpoint
- `prisma/schema.prisma`: Database schema with Auth.js and hierarchical models
- `app/dashboard/`: Different views for team owners vs members
- `app/teams/`: Team creation, invitation, and management
- `app/worklogs/`: Worklog CRUD operations
- Environment variables loaded via `dotenv/config` in `prisma.config.ts`

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
// Members can update: STARTED → HALF_DONE → COMPLETED
const canUpdateProgress = isMember && 
  (currentStatus === 'STARTED' || currentStatus === 'HALF_DONE');

// Team owners can set: COMPLETED → REVIEWED
const canReview = isOwner && currentStatus === 'COMPLETED';

// Organization owners can rate: REVIEWED worklogs
const canRate = isOrgOwner && currentStatus === 'REVIEWED';
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

Use Resend Node.js SDK for team invitations. Follow [Resend Next.js guide](https://resend.com/docs/send-with-nextjs) for setup. Create pending TeamMember records, send invitation emails, and update status on acceptance.

**Implementation Details:**

- Secure token generation using `crypto.randomBytes(32).toString('hex')`
- React Email templates with styled accept/reject buttons
- Token validation with PENDING status requirement
- Duplicate invitation prevention via database upsert
- University email validation (commented out for the time being. Basic OAuth works 100% ok)

## Development Workflow

- **Database Setup**: Run `npx prisma migrate dev` after schema changes
- **Client Generation**: Prisma client auto-generates to `app/generated/prisma/` on build/migrate
- **Environment**: Requires `DATABASE_URL` in `.env` file
- **Email Setup**: Configure email service for team invitations
- **Linting and Formatting**: Use `npm run lint` for ESLint (with Next.js config) and `npx prettier --write .` for code formatting (Prettier integrated to avoid conflicts)

## UI/UX Best Practices

- **Dashboard Routing**: Main dashboard page (`/dashboard`) with conditional logic:
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
- **Invitation Flow**: Email input field for team member emails (university domain only)
- **Worklog Forms**: Rich text description, optional GitHub link validation, optional images as work evidence, progress status updates
- **Deadline Setting**: Team owners can set optional deadlines per worklog with visual indicators
- **Progress Tracking**: Members update STARTED → HALF_DONE → COMPLETED, team owners set REVIEWED
- **Rating Interface**: 1-10 scale with optional comments, only visible to organization owners
- **Deadline Indicators**: Show "due in X days", "overdue", or "completed on time"
- **Responsive Design**: Mobile-friendly organization/team management and worklog submission

## Current State

- ✅ **Authentication Backend**: Fully implemented with Auth.js v5, GitHub OAuth, Google OAuth, and Prisma integration
- ✅ **Email Workflow**: Complete team invitation system with Resend SDK, secure tokens, and React Email templates
- **Database Schema**: Organization, Team, TeamMember, Worklog, Rating models documented with proper relations (implementation pending)
- ✅ **API Endpoints**: Team invitation, acceptance, and rejection endpoints fully functional
- **Organization Model**: Added to database schema with proper relations
- **Progress Tracking**: Worklog progress status updates (STARTED → HALF_DONE → COMPLETED → REVIEWED)
- **Rating System**: Organization owner rating interface and CRUD operations
- **Rating Automation**: Tentative feature for automatic rating reduction on late worklog completions (details not finalized yet)
- **Deadline System**: Optional deadline setting and visual indicators
- **Multi-Role UI**: Tabbed interface for users with multiple roles
- **Organization Management**: Organization creation, team assignment, and hierarchical permissions

## Common Pitfalls

- Don't import Prisma client from `@prisma/client` - use the custom generated path `../app/generated/prisma`
- Ensure `dotenv/config` is imported before Prisma operations in config files
- Use PostgreSQL connection string format for `DATABASE_URL`
- Ratings must be hidden from team members and team owners (security requirement)
- Progress status transitions must follow: STARTED → HALF_DONE → COMPLETED → REVIEWED (with proper role permissions)
- Organization owners can only access teams/worklogs within their own organizations
- When an organization is deleted, teams/worklogs remain visible but all operations are blocked (read-only). They'll be check whether the organisation that team is tied to was prevously made but deleted. If yes then new team will have to be made
- Google OAuth includes `hd=nu.edu.pk` parameter for university restriction (see Project Overview for implementation status)
- Team invitations validate university email format (commented out for the time being. Basic OAuth works 100% ok)
- Always check team membership status and organizational ownership before allowing access
- Tailwind CSS 4 requires `@import "tailwindcss"` syntax (not v3 style)
- Auth.js middleware requires `runtime = 'nodejs'` for Prisma client compatibility
- Remove `runtime = "vercel-edge"` from Prisma generator for local development

## Backend Requirements

- **Database schema**: Prisma models for User, Organization, Team, TeamMember, Worklog, Rating (with relations and enums). Auth.js models (Account, Session, VerificationToken) implemented.
- **APIs for CRUD operations on member worklogs**: Create, read, update, delete worklogs (members only access their own; includes progress status updates up to COMPLETED and optional images/GitHub links)
- **APIs for team owner worklog management**: Update worklog status to REVIEWED, set deadlines, view all team worklogs up to REVIEWED status.
- **APIs for CRUD operations on organization owner ratings**: Create, read, update, delete ratings (organization owners only for worklogs in their organizations; hidden from lower roles).
- **APIs for organization management**: Create/read/update/delete organizations, assign teams to organizations, view organization details and teams.
- **APIs for team management**: Create/read/update/delete teams, invite/accept/reject/remove members, view team details and members (owners only; includes dashboard data fetching).
- **Progress status validation**: Ensure proper status transitions (STARTED → HALF_DONE → COMPLETED → REVIEWED) with role-based permissions.
- **Deadline management**: CRUD operations on worklog deadlines by team owners, with optional enforcement (enforcement is soft in the sense that they'll be visual indicator only if work completed after deadline set).
- **Authentication with OAuth**: ✅ COMPLETED - Auth.js setup with Prisma adapter, GitHub and Google providers, Node.js runtime compatibility.
- **Email invites**: ✅ COMPLETED - Send invitations via Resend Node.js SDK, handle pending/accepted/rejected statuses in TeamMember model with secure token validation.
- **Authorization checks**: Middleware or per-route validation to ensure users can only access their organizations/teams/worklogs/ratings based on hierarchical permissions.
- **Input validation and error handling**: Use Zod for API request validation, standardize error responses (e.g., 400/403/404).
- **GitHub link validation (optional)**: Utility to verify optional GitHub URLs in worklogs.
- **Database setup and migrations**: Prisma client configuration, run migrations, handle connection pooling for production.

## Frontend Libraries Suggestions

Just suggestions for frontend team. No need for further specifics.

#### Core UI & Component Libraries

- **shadcn/ui**: Accessible components on Radix UI. Includes forms (React Hook Form + Zod), notifications (Sonner), and UI primitives. Use for team creation, worklog submission, and all input forms.
- **Lucide React**: Icon library compatible with shadcn/ui. Provides customizable icons for forms, dashboards, and navigation.

#### Animation & Interaction

- **Framer Motion**: Lightweight React animation library. Use for dashboard transitions, worklog animations, and rating sliders. Compatible with Next.js 16 and edge runtime.

#### Date & Time Handling

- **date-fns**: Modular date utilities. Handle worklog timestamps, durations, and date inputs. Tree-shakable and lightweight.

#### Data Fetching & State Management

- **TanStack Query (React Query)**: Data fetching and caching for React. Manage worklogs, ratings, and team data with efficient caching and auth integration.

#### Additional Utilities

- **clsx** or **cn** (bundled with shadcn/ui): Conditional Tailwind class merging for dynamic styling.
- **Tailwind CSS plugins** (e.g., @tailwindcss/forms): Optional enhancements for form styling.
