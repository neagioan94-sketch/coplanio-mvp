# Supabase — Database Notes

## Migration Files

Migration files are located in `supabase/migrations/` and are applied in order:

| File | Purpose |
|------|---------|
| `001_phase_1_schema.sql` | Extensions, 16 MVP tables, constraints, indexes, `updated_at` triggers |
| `002_phase_1_rls.sql` | RLS enablement, helper functions, RLS policies for all 16 tables |

## Applying Migrations

### Local development (Supabase CLI)

```bash
# Start Supabase local stack
supabase start

# Apply all pending migrations
supabase db reset

# Or push incremental migrations
supabase db push
```

### Hosted project

```bash
supabase db push --project-ref <project-ref>
```

## Database Type Generation

TypeScript types in `types/database.types.ts` are a hand-written placeholder for Phase 1.
Regenerate from the actual schema once a Supabase project is running:

```bash
# Local
supabase gen types typescript --local > types/database.types.ts

# Hosted
supabase gen types typescript --project-id <project-id> > types/database.types.ts
```

**Important:** regenerate types after every schema migration in later phases.

## Supabase CLI Limitation — Phase 1

The Supabase CLI (`supabase start`) was not executed during Phase 1 because no local
Supabase project was configured in this environment. The migrations are valid SQL and
were verified by manual review against the Phase 1 readiness pack.

Before Phase 2 begins, configure a local or hosted Supabase project and run:

```bash
supabase db reset
supabase gen types typescript --local > types/database.types.ts
```

Record the result in CCR-002.

## RLS Helper Functions

Three helper functions are defined in `002_phase_1_rls.sql`:

| Function | Purpose |
|----------|---------|
| `public.is_org_member(org_id)` | Returns true if current user has active membership |
| `public.has_org_role(org_id, roles[])` | Returns true if current user has one of the given roles |
| `public.has_team_access(org_id, team_id)` | Returns true if user is admin/head_coach or active team staff |

All helper functions use `SECURITY DEFINER` with `SET search_path = public`.

## Security Rules Summary

- Organization is the primary tenant boundary.
- No public read policies exist.
- No anonymous access to organization data.
- No cross-organization data access.
- No player login policies.
- No post-MVP roles.
- `audit_events` is append-only — no UPDATE or DELETE policy.
- Service role key must never be used in client-side code.
