# Repository Navigation Guide

## Project Structure

```
worklog-app/
├── app/                          # Frontend pages, layouts, and API routes
│   ├── generated/prisma/         # Auto-generated Prisma client (DO NOT EDIT)
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout (frontend)
│   ├── page.tsx                 # Home page (frontend)
│   └── api/auth/[...nextauth]/  # Authentication API routes (backend)
├── lib/                          # Shared utilities (backend/frontend)
│   └── prisma.ts                # Database client setup
├── prisma/                       # Database configuration (backend)
│   ├── schema.prisma            # Database models
│   └── migrations/              # Database migrations
└── public/                       # Static assets (images, fonts)
```

## Where Files Go

### Frontend Files

- **Pages**: `app/[route]/page.tsx`
- **Layouts**: `app/[route]/layout.tsx`
- **Components**: `app/_components/` or `app/[route]/_components/`
- **Styles**: `app/globals.css` (global) or component-scoped
- **Loading/Error states**: `app/[route]/loading.tsx`, `app/[route]/error.tsx`

### Backend Files

- **API Routes**: `app/api/[route]/route.ts`
- **Database Models**: `prisma/schema.prisma`
- **Database Logic**: `lib/` (utilities, queries, business logic)
- **Auth Config**: `lib/auth.ts` (when implemented)
- **Middleware**: `middleware.ts` (global middleware)

### Shared Files

- **Utilities**: `lib/` directory
- **Types**: `lib/types.ts` or alongside components
- **Constants**: `lib/constants.ts`

## Key Conventions

### File Naming

- **Pages/Routes**: `kebab-case.tsx` (e.g., `team-invites.tsx`)
- **Components**: `PascalCase.tsx` (e.g., `TeamCard.tsx`)
- **Directories**: `kebab-case/` for routes, `PascalCase/` for components

### Route Structure

- **Public routes**: `app/page.tsx` → `/`
- **Dynamic routes**: `app/[id]/page.tsx` → `/123`
- **Nested routes**: `app/teams/create/page.tsx` → `/teams/create`
- **API routes**: `app/api/teams/route.ts` → `/api/teams`

### Private Folders

- **Non-routable**: `app/_components/` (components not in URL)
- **Route groups**: `app/(auth)/` (organize without affecting URL)

## Development Commands

```bash
npm run dev      # Start frontend development server
npm run build    # Build for production
npm run lint     # Check code quality
npx prisma studio # View database
```

## Important: File Locations

- ❌ **Don't put API logic in components**
- ❌ **Don't put components in `lib/`**
- ✅ **API routes go in `app/api/`**
- ✅ **Reusable components go in `app/_components/`**
- ✅ **Database queries go in `lib/`**
- ✅ **Page components go in `app/[route]/`**
