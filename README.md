# Worklog App

A hierarchical worklog tracking system for organizations, teams, and members with credits management, 5-state progress tracking, and rating system.

## Features

- **Three-Tier Hierarchy**: Organization Owner → Team Owner → Team Member
- **Credits Management**: Add/subtract/set credits for organizations and teams
- **5-State Progress Tracking**: STARTED → HALF_DONE → COMPLETED → REVIEWED → GRADED
- **Rating System**: Organization owners rate worklogs 1-10 (hidden from team members/owners)
- **File Attachments**: Support for images and documents as worklog evidence
- **OAuth Authentication**: Google + GitHub login with Auth.js v5
- **Team Management**: Invite members via email, set deadlines, review worklogs
- **Role-Based Access Control**: Strict permissions based on organizational hierarchy

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Prisma 7 + PostgreSQL
- **Styling**: Tailwind CSS 4
- **Authentication**: Auth.js v5 (Google/GitHub OAuth)
- **Validation**: Zod for API request validation
- **Email**: Resend SDK with React Email templates

## Getting Started

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables**:

   ```bash
   cp .env.example .env
   # Configure DATABASE_URL, AUTH_SECRET, and OAuth credentials
   ```

3. **Run database migrations**:

   ```bash
   npx prisma migrate dev
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Documentation

- **[api-documentation.md](./api-documentation.md)** - Complete API reference
- **[onboarding.md](./onboarding.md)** - Repository navigation and file organization
- **[.github/copilot-instructions.md](./.github/copilot-instructions.md)** - AI coding guidelines

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prettier` - Format code with Prettier
- `npm run db:seed` - Seed database with initial data
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Run database migrations
