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
- **Auth**: NextAuth 5 with Google/GitHub OAuth (university domain restriction)
- **Email**: For team invitations
- **Runtime**: Edge-compatible with PrismaPg adapter

## Database Schema

Based on the team-based implementation plan:

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
  userId    String   @map("user_id")
  email     String   // Email used for invitation
  status    MemberStatus @default(PENDING) // PENDING, ACCEPTED, REJECTED
  invitedAt DateTime @default(now())
  joinedAt  DateTime?

  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@unique([teamId, email])
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

## Authentication Setup (Auth.js/NextAuth)

Based on [official Prisma Auth.js guide](https://www.prisma.io/docs/guides/authjs-nextjs):

### Required Dependencies

```bash
npm install @auth/prisma-adapter next-auth@beta
```

### Environment Variables

Add to `.env`:

```env
AUTH_SECRET=<generated-via-npx-auth-secret>
AUTH_GITHUB_ID=<github-oauth-app-client-id>
AUTH_GITHUB_SECRET=<github-oauth-app-client-secret>
AUTH_GOOGLE_ID=<google-oauth-app-client-id>
AUTH_GOOGLE_SECRET=<google-oauth-app-client-secret>
```

### Auth Configuration (`lib/auth.ts`)

```typescript
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub,
    Google({
      authorization: {
        params: {
          hd: "nu.edu.pk", // Restrict to university domain
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Additional validation for university email
      if (
        account?.provider === "google" &&
        !user.email?.endsWith("@nu.edu.pk")
      ) {
        return "/auth/error?error=UniversityEmailRequired";
      }
      return true;
    },
  },
});
```

### Route Handler (`app/api/auth/[...nextauth]/route.ts`)

```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

### Middleware (`middleware.ts`)

```typescript
export { auth as middleware } from "@/lib/auth";
```

### Error Handling

For non-university Google emails, redirect to error page with message: "Please sign in using your NU ID (university email only)"

## Key Project Structure

- `app/generated/prisma/`: Custom Prisma client output location
- `lib/prisma.ts`: Singleton Prisma client with PostgreSQL adapter
- `prisma/schema.prisma`: Database schema with team-based models
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

```typescript
// When sending team invitation
await prisma.teamMember.create({
  data: {
    teamId,
    email: inviteeEmail,
    status: "PENDING",
  },
});
// Send email with invitation link
// On acceptance, update status to 'ACCEPTED' and link user
```

## Development Workflow

- **Database Setup**: Run `npx prisma migrate dev` after schema changes
- **Client Generation**: Prisma client auto-generates to `app/generated/prisma/` on build/migrate
- **Environment**: Requires `DATABASE_URL` in `.env` file
- **Email Setup**: Configure email service for team invitations
- **Linting and Formatting**: Use `npm run lint` for ESLint (with Next.js config) and `npx prettier --write .` for code formatting (Prettier integrated to avoid conflicts)

## UI/UX Best Practices

- **Separate Dashboards**: Team owners see team overview, member management, all worklogs, and ratings
- **Member Dashboard**: Shows personal worklogs, team list, and submission forms
- **Team Creation Flow**: Simple form with project name, organization, description
- **Invitation Flow**: Email input field for team member emails (university domain only)
- **Worklog Forms**: Rich text description, optional GitHub link validation
- **Rating Interface**: 1-10 scale with optional comments, only visible to owners
- **Responsive Design**: Mobile-friendly team management and worklog submission

## Current State

- Project is in early bootstrap phase
- Authentication schema exists but team models need implementation
- No team/worklog/rating features implemented yet
- Default Next.js starter page still active

## Common Pitfalls

- Don't import Prisma client from `@prisma/client` - use the custom generated path
- Ensure `dotenv/config` is imported before Prisma operations in config files
- Use PostgreSQL connection string format for `DATABASE_URL`
- Ratings must be hidden from team members (security requirement)
- Google OAuth requires `hd=nu.edu.pk` parameter for university restriction
- Team invitations should validate university email format
- Always check team membership status before allowing access
- Tailwind CSS 4 requires `@import "tailwindcss"` syntax (not v3 style)
