# Repository Navigation Guide

## Project Structure

```
worklog-app/
├── app/                          # Next.js App Router pages and API routes
│   ├── api/                      # All REST API routes
│   │   ├── _idempotency.ts       # Atomic idempotency wrapper (withIdempotency<T>)
│   │   ├── cron/                 # Vercel cron job endpoints
│   │   └── ...                   # auth, dashboard, organizations, teams, etc.
│   ├── generated/prisma/         # Auto-generated Prisma client (gitignored)
│   ├── home/, organizations/     # Main feature pages
│   ├── teams/, profile/          # Feature pages
│   └── globals.css, layout.tsx   # Global styles and root layout
├── components/                   # React components
│   ├── ui/                       # shadcn/ui primitives
│   ├── forms/, wizard/           # Form and wizard infrastructure
│   ├── worklog/, teams/          # Feature-specific components
│   └── providers.tsx, etc.       # Shared providers
├── lib/                          # Shared utilities and logic
│   ├── hooks/                    # Custom React Query hooks
│   ├── types/                    # TypeScript interfaces
│   ├── validations/              # Zod schemas
│   ├── auth-utils.ts             # RBAC helpers
│   ├── prisma.ts                 # Prisma singleton
│   └── api-utils.ts, etc.        # API helpers
├── prisma/                       # Database configuration
│   ├── migrations/               # Applied migration files
│   ├── schema.prisma             # Prisma data model
│   └── seed.ts                   # Database seeder
├── public/                       # Static assets
├── proxy.ts                      # Auth.js proxy (route protection)
├── next.config.ts                # Next.js config & security headers
├── vercel.json                   # Vercel cron job definitions
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
