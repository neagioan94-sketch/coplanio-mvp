# Coplanio MVP

Football club management platform built with Next.js, TypeScript, Tailwind CSS, and Supabase.

> **Phase 0 — Project Setup**
> This repository currently contains only the project foundation. No product features are implemented. Domain modules (teams, players, sessions, attendance, matches, assessments, reports) will be added in subsequent phases.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui-compatible structure
- **Backend**: Supabase (auth, database, storage) — wired in Phase 1 & 2

## Local Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd coplanio-mvp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase project credentials. Never commit `.env.local`.

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Public URL of the app (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, never expose client-side) |
| `DATABASE_URL` | Postgres connection string for migrations |

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
app/                  # Next.js App Router — pages, layouts, route groups
  (auth)/             # Auth routes (Phase 2)
  (dashboard)/        # Dashboard routes (Phase 4+)
  api/                # API routes
components/
  ui/                 # shadcn/ui base primitives
  layout/             # App shell, sidebar, topbar (Phase 4)
  forms/              # Reusable form components
  tables/             # Reusable table/list components
  domain/             # Domain-specific display components
lib/
  auth/               # Auth helpers (Phase 2)
  db/                 # Supabase client helpers
  permissions/        # Permission helpers (Phase 3)
  audit/              # Audit helpers
  validation/         # Shared validation utilities
  utils/              # Shared utility functions (cn helper)
modules/              # Domain business logic — added per phase
  organizations/ users/ teams/ players/ exercises/
  sessions/ attendance/ matches/ assessments/ reports/ admin/ audit/
schemas/              # Zod schemas and validation definitions
types/                # Shared TypeScript types
supabase/
  migrations/         # Database migrations (Phase 1)
public/               # Static assets
```

## Implementation Phases

- **Phase 0** — Project Setup *(current)*
- **Phase 1** — Database & RLS
- **Phase 2** — Authentication
- **Phase 3** — Organization, Memberships & Roles
- **Phase 4** — App Layout & Navigation
- **Phase 5–13** — Domain modules (Teams, Players, Sessions, Attendance, Matches, Assessments, Reports, Admin & Audit)
- **Phase 14** — Responsive Polish
- **Phase 15** — QA & Deployment
