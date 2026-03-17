# Repository Navigation Guide

## Project Structure

```
worklog-app/
├── app/                          # Next.js App Router pages and API routes
│   ├── api/                      # All REST API routes
│   │   ├── _idempotency.ts       # Atomic idempotency wrapper (withIdempotency<T>)
│   │   ├── auth/                 # Auth.js route handler
│   │   ├── cron/                 # Vercel cron job endpoints (require CRON_SECRET)
│   │   ├── dashboard/            # Combined dashboard data endpoint
│   │   ├── health/               # Health check (no auth required)
│   │   ├── invitations/          # Accept/reject invitation tokens
│   │   ├── organizations/        # Organization CRUD + credits + invite + worklogs
│   │   ├── ratings/              # Individual rating management
│   │   ├── sidebar/              # Sidebar stats endpoint
│   │   ├── teams/                # Team CRUD + credits + members + invite + worklogs
│   │   ├── uploads/              # File upload for worklog attachments
│   │   ├── webhooks/             # Resend webhook handler
│   │   └── worklogs/             # Worklog CRUD + status + ratings
│   ├── generated/prisma/         # Auto-generated Prisma client (DO NOT EDIT, gitignored)
│   ├── home/                     # Main dashboard (multi-role sidebar navigation)
│   ├── organizations/            # Organization detail and create pages
│   ├── profile/                  # User profile page
│   ├── teams/                    # Role-based team views (lead/ and member/ subdirs)
│   ├── globals.css               # Tailwind CSS entry + CSS variables for theming
│   ├── layout.tsx                # Root layout (metadata, Analytics, SpeedInsights)
│   ├── page.tsx                  # Login/landing page (Google OAuth sign-in)
│   ├── robots.ts                 # Programmatic robots.txt
│   └── sitemap.ts                # Programmatic sitemap.xml
├── components/                   # Reusable UI components
│   ├── emails/                   # React Email templates (invitation emails)
│   ├── entities/                 # Entity card and list components
│   ├── filters/                  # Worklog and team filter components
│   ├── forms/                    # Form components (bulk email input, standardized form)
│   ├── organizations/            # Organization-specific components
│   ├── teams/                    # Team management components (creation wizard, settings)
│   ├── ui/                       # shadcn/ui primitives (button, dialog, input, etc.)
│   ├── wizard/                   # Multi-step wizard infrastructure
│   └── *.tsx                     # Shared components (providers, theme-provider, etc.)
├── lib/                          # Shared utilities
│   ├── api-utils/                # API helpers (idempotency headers, fetch wrappers)
│   ├── hooks/                    # React Query hooks (all include dev mock guards)
│   ├── types/                    # TypeScript types (pagination, etc.)
│   ├── api-pagination.ts         # Pagination helpers (parsePaginationParams, etc.)
│   ├── api-utils.ts              # apiResponse(), handleApiError()
│   ├── auth-utils.ts             # RBAC helpers (isOrganizationOwner, isTeamOwner, etc.)
│   ├── auth.ts                   # Auth.js config (Google OAuth + disabled GitHub)
│   ├── mock-data.ts              # Dev mock data (used by all hooks in development)
│   ├── prisma.ts                 # Singleton Prisma client with PgAdapter
│   ├── query-optimizations.ts    # Batch queries, cursor pagination, minimal selects
│   └── validations.ts            # Zod schemas for all API request validation
├── prisma/                       # Database configuration
│   ├── migrations/               # Applied migration files
│   ├── schema.prisma             # Prisma data model
│   └── seed.ts                   # Database seeder
├── proxy.ts                      # Auth.js proxy (protects all routes except / and /api/health)
├── next.config.ts                # Security headers, image config, API cache control
├── vercel.json                   # Vercel cron job definitions only
└── CLAUDE.md                     # AI coding guidelines for this repo
```

## Key Conventions

### File Naming

- **Pages**: `kebab-case/page.tsx` (e.g., `teams/lead/page.tsx`)
- **Components**: `PascalCase.tsx` (e.g., `TeamCard.tsx`) or `kebab-case.tsx` for shadcn/ui
- **API routes**: `app/api/[route]/route.ts`
- **Hooks**: `use-kebab-case.ts` in `lib/hooks/`

### API Route Pattern

Every API route follows this structure:

```typescript
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = await req.json();
  const validated = mySchema.parse(body); // Zod validation

  // Authorization check (use helpers from lib/auth-utils.ts)
  const isOwner = await isOrganizationOwner(session.user.id, orgId);
  if (!isOwner) return forbidden();

  // Business logic
  const result = await prisma.someModel.create({ data: ... });
  return apiResponse(result, 201);
}
```

All `catch` blocks must use `handleApiError()`. All responses use `apiResponse()` (sets `Cache-Control: no-store`).

### Data Fetching Hooks

Every hook in `lib/hooks/` includes a dev mock guard:

```typescript
if (process.env.NODE_ENV === "development") {
  return { data: mockData, isLoading: false };
}
// Real fetch in production
```

This allows 100% frontend development without a database.

## Development Commands

```bash
npm install                    # Install all dependencies
npm run dev                    # Start dev server (http://localhost:3000)
npm run build                  # Build (runs prisma generate + next build)
npm run lint                   # ESLint
npx prisma migrate dev         # Run migrations + regenerate Prisma client
npx prisma studio              # Visual database browser
npm run db:seed                # Seed with sample data
```

## Important: Where Things Go

- **API logic** → `app/api/` (not in components)
- **Database queries** → `lib/` or directly in API routes
- **Reusable components** → `components/` (not `app/`)
- **Business logic types** → `lib/types/`
- **Validation schemas** → `lib/validations.ts`
- **Auth checks** → `lib/auth-utils.ts` helpers (don't inline)
