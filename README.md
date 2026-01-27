# Worklog App

A team-based worklog system where users can create teams, invite members, and track contributions. Team owners can rate member worklogs on a 1-10 scale with ratings hidden from team members.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Prisma 7 + PostgreSQL
- **Styling**: Tailwind CSS 4
- **Authentication**: NextAuth 5 (Google/GitHub OAuth)

## Getting Started

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables**:

   ```bash
   cp .env.example .env
   # Configure DATABASE_URL and auth secrets
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

- **[ONBOARDING.md](./ONBOARDING.md)** - Repository navigation and file organization
- **[.github/copilot-instructions.md](./.github/copilot-instructions.md)** - Technical implementation details

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
