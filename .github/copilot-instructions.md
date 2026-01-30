# Worklog App - AI Coding Guidelines

## Project Overview

This is a team-based worklog system for tracking member contributions. Key features:

- Users register/login via OAuth (Google university email only, GitHub)
- Users can create teams and invite members via email
- Team members submit worklogs with titles, descriptions, and optional GitHub links
- Team owners rate member contributions 1-10 (ratings hidden from members)
- Users can join multiple teams
- Different dashboards for team owners vs members
- Full CRUD operations on worklogs (members) and ratings (owners)

## Architecture Overview

- **Framework**: Next.js 16 with App Router
- **Database**: Prisma 7 + PostgreSQL (hosted on Prisma Cloud)
- **Styling**: Tailwind CSS 4 with custom theme variables
- **Auth**: ✅ Auth.js v5 with GitHub and Google OAuth (university domain restriction implemented but commented for testing)
- **Email**: For team invitations
- **Runtime**: Node.js-compatible with PrismaPg adapter

## Database Schema

Based on the team-based implementation plan with Auth.js integration:

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
  ownedTeams    Team[]    @relation("TeamOwner")
  memberships   TeamMember[]
  worklogs      Worklog[]
  ratings       Rating[]
}

model Team {
  id          String       @id @default(cuid())
  name        String
  description String?
  project     String?      // What project the team is working on
  organization String?     // Organization name
  ownerId     String       @map("owner_id")
  owner       User         @relation("TeamOwner", fields: [ownerId], references: [id])
  members     TeamMember[]
  worklogs    Worklog[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
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
  id          String   @id @default(cuid())
  title       String
  description String   @db.Text
  githubLink  String?  // Optional GitHub commit/PR link
  userId      String   @map("user_id")
  teamId      String   @map("team_id")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  team        Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  ratings     Rating[]
}

model Rating {
  id        String   @id @default(cuid())
  value     Int      // 1-10 scale
  comment   String?  @db.Text
  worklogId String   @map("worklog_id")
  raterId   String   @map("rater_id") // Team owner who rated
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
```

## Authentication Setup (Auth.js)

Based on [official Prisma Auth.js guide](https://www.prisma.io/docs/guides/authjs-nextjs). Follow the guide for setup with Prisma adapter, Google/GitHub providers, and university domain restriction (e.g., `hd=nu.edu.pk` for Google).

**Team Development Note**: For collaborative development, configure multiple authorized redirect URIs in your OAuth applications to allow team members to run the app on different localhost ports simultaneously:

- Google OAuth: Add `http://localhost:3000/api/auth/callback/google`, `http://localhost:3001/api/auth/callback/google`, etc.
- GitHub OAuth: Add corresponding callback URLs for each port
- Assign different ports to team members to avoid OAuth conflicts

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
- `prisma/schema.prisma`: Database schema with Auth.js and team-based models
- `app/dashboard/`: Different views for team owners vs members
- `app/teams/`: Team creation, invitation, and management
- `app/worklogs/`: Worklog CRUD operations
- Environment variables loaded via `dotenv/config` in `prisma.config.ts`

## Critical Patterns

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

### Worklog Visibility

- **Members**: See only their own worklogs
- **Team Owners**: See all worklogs in their teams
- **Super Admin**: See all worklogs (future feature)

### Rating Visibility

- **Ratings are NEVER visible to team members**
- **Only team owners can see ratings for their teams**
- **Ratings are internal performance metrics**

### Email Invitations

Use Resend Node.js SDK for team invitations. Follow [Resend Next.js guide](https://resend.com/docs/send-with-nextjs) for setup. Create pending TeamMember records, send invitation emails, and update status on acceptance.

**Implementation Details:**

- Secure token generation using `crypto.randomBytes(32).toString('hex')`
- React Email templates with styled accept/reject buttons
- Token validation with PENDING status requirement
- Duplicate invitation prevention via database upsert
- University email validation (commented out for testing)

## Development Workflow

- **Database Setup**: Run `npx prisma migrate dev` after schema changes
- **Client Generation**: Prisma client auto-generates to `app/generated/prisma/` on build/migrate
- **Environment**: Requires `DATABASE_URL` in `.env` file
- **Team Development**: Assign different localhost ports to team members (e.g., 3000, 3001, 3002) to avoid OAuth conflicts. Update `NEXTAUTH_URL` accordingly in each `.env` file
- **Email Setup**: Configure email service for team invitations
- **Linting and Formatting**: Use `npm run lint` for ESLint (with Next.js config) and `npx prettier --write .` for code formatting (Prettier integrated to avoid conflicts)

## UI/UX Best Practices

- **Dashboard Routing**: Main dashboard page (`/dashboard`) with conditional logic:
  - Completely new user with no team invites: Show "Create Team" button
  - Team member: Redirect to `/member` page
  - Team owner: Redirect to `/owner` page
- **Separate Dashboards**: Team owners see team overview, member management, all worklogs, and ratings
- **Member Dashboard**: Shows personal worklogs, team list, and submission forms
- **Team Creation Flow**: Simple form with project name, organization, description
- **Invitation Flow**: Email input field for team member emails (university domain only)
- **Worklog Forms**: Rich text description, optional GitHub link validation
- **Rating Interface**: 1-10 scale with optional comments, only visible to owners
- **Responsive Design**: Mobile-friendly team management and worklog submission

## Current State

- ✅ **Authentication Backend**: Fully implemented with Auth.js v5, GitHub OAuth, Google OAuth, and Prisma integration
- ✅ **Email Workflow**: Complete team invitation system with Resend SDK, secure tokens, and React Email templates
- ✅ **Database Schema**: Team, TeamMember, Worklog, Rating models implemented with proper relations
- ✅ **API Endpoints**: Team invitation, acceptance, and rejection endpoints fully functional
- **Authentication UI**: Sign-in/sign-out components and user data display (pending frontend implementation)
- **Worklog/Rating Features**: Backend APIs ready, frontend implementation pending

## Common Pitfalls

- Don't import Prisma client from `@prisma/client` - use the custom generated path `../app/generated/prisma`
- Ensure `dotenv/config` is imported before Prisma operations in config files
- Use PostgreSQL connection string format for `DATABASE_URL`
- Ratings must be hidden from team members (security requirement)
- Google OAuth includes `hd=nu.edu.pk` parameter for university restriction (currently commented out for testing)
- Team invitations validate university email format (currently commented out for testing)
- Always check team membership status before allowing access
- Tailwind CSS 4 requires `@import "tailwindcss"` syntax (not v3 style)
- Auth.js middleware requires `runtime = 'nodejs'` for Prisma client compatibility
- Remove `runtime = "vercel-edge"` from Prisma generator for local development

## Backend Requirements

- **Database schema**: Prisma models for User, Team, TeamMember, Worklog, Rating (with relations and enums). Auth.js models (Account, Session, VerificationToken) implemented.
- **APIs for CRUD operations on member worklogs**: Create, read, update, delete worklogs (members only access their own; includes dashboard data fetching).
- **APIs for CRUD operations on team owner ratings**: Create, read, update, delete ratings (owners only for their teams' worklogs; hidden from members; includes dashboard data fetching).
- **APIs for team management**: Create/read/update/delete teams, invite/accept/reject/remove members, view team details and members (owners only; includes dashboard data fetching).
- **Authentication with OAuth**: ✅ COMPLETED - Auth.js setup with Prisma adapter, GitHub and Google providers, Node.js runtime compatibility.
- **Email invites**: ✅ COMPLETED - Send invitations via Resend Node.js SDK, handle pending/accepted/rejected statuses in TeamMember model with secure token validation.
- **Authorization checks**: Middleware or per-route validation to ensure users can only access their teams/worklogs/ratings (e.g., `isOwner`, `isMember` queries).
- **Input validation and error handling**: Use Zod for API request validation, standardize error responses (e.g., 400/403/404).
- **GitHub link validation (optional)**: Utility to verify optional GitHub URLs in worklogs.
- **Database setup and migrations**: Prisma client configuration, run migrations, handle connection pooling for production.

## Frontend Libraries Suggestions

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
