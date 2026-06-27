# Deployment Readiness — Coplanio MVP

## Required Environment Variables

Set these in your deployment platform (Vercel, Railway, etc.) before going live.

| Variable | Visibility | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Supabase service role key — server only, never expose to browser |
| `DATABASE_URL` | **Secret** | Postgres connection string (used for migrations) |
| `NEXT_PUBLIC_APP_URL` | Public | Production URL (e.g. `https://coplanio.com`) — must NOT be localhost |

> **Important:** Never commit `.env.local` to git. Use `.env.example` as the template.

---

## Pre-Deploy Commands

Run these locally (or in CI) before every deployment:

```bash
npx tsc --noEmit   # TypeScript — must pass with 0 errors
npm run lint       # ESLint — must pass with 0 errors
npm run build      # Next.js production build — must pass
```

---

## Production Checklist

Before going live, verify:

- [ ] All 5 environment variables are set in the deployment platform
- [ ] `NEXT_PUBLIC_APP_URL` is the production domain (not localhost)
- [ ] Supabase RLS is enabled on all tables (verify in Supabase dashboard)
- [ ] Supabase Auth settings: confirm allowed redirect URLs include the production domain
- [ ] `npm run build` passes cleanly in the deployment environment
- [ ] `/login` is accessible without authentication
- [ ] `/dashboard` redirects to `/login` when not authenticated
- [ ] Organization creation flow works end-to-end on production Supabase project
- [ ] Audit events are being written (check `audit_events` table after a test action)
- [ ] No `.env.local` or secrets committed to the repository

---

## Architecture Notes

- **Framework:** Next.js 16.2.9 App Router, TypeScript, React 19
- **Auth:** Supabase Auth with SSR cookies (`@supabase/ssr`)
- **Database:** Supabase Postgres with Row Level Security (RLS)
- **Middleware:** `middleware.ts` at repo root — redirects unauthenticated requests to `/login`
- **Organization scoping:** `organizationId` always resolved server-side from the authenticated user's active membership; never trusted from client input
- **Role model:** `organization_admin`, `head_coach`, `coach`, `staff` — enforced in server actions via `requireRole()`

---

## Modules Implemented (Phases 1–15)

| Phase | Module | Branch |
|---|---|---|
| 1 | Database & RLS | phase-1/database-rls |
| 2 | Authentication | phase-2/authentication |
| 3 | Organizations & Memberships | phase-3/organization-memberships |
| 4 | App Layout & Navigation | phase-4/app-layout-navigation |
| 5 | Teams | phase-5/teams-module |
| 6 | Players | phase-6/players-module |
| 7 | Exercises | phase-7/exercises-module |
| 8 | Training Sessions | phase-8/training-sessions-module |
| 9 | Attendance | phase-9/attendance-module |
| 10 | Matches | phase-10/matches-module |
| 11 | Assessments | phase-11/assessments-module |
| 12 | Reports | phase-12/reports-module |
| 13 | Admin & Settings | phase-13/admin-settings-module |
| 14 | Responsive Polish | phase-14/responsive-polish |
| 15 | QA & Deployment Readiness | phase-15/qa-deployment-readiness |
