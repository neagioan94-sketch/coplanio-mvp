-- Parent & Player Portal (CCR-020): external, read-only, revocable access
-- linking a Supabase Auth user to a single player. Deliberately independent
-- of `memberships` — portal users never receive an internal role, so every
-- existing canManageX()/requireRole() check and the dashboard layout's
-- "no membership -> redirect" gate deny them internal access with no new code.

create table public.portal_access (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  player_id       uuid not null references public.players(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  relationship    text not null default 'guardian',
  status          text not null default 'active',
  granted_by      uuid references public.profiles(id),
  granted_at      timestamptz not null default now(),
  revoked_at      timestamptz,
  revoked_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (player_id, user_id),
  constraint portal_access_relationship_check check (relationship in ('guardian', 'player')),
  constraint portal_access_status_check       check (status in ('active', 'revoked'))
);

create index idx_portal_access_user on public.portal_access(user_id);
create index idx_portal_access_org  on public.portal_access(organization_id, player_id);

create trigger set_portal_access_updated_at
  before update on public.portal_access
  for each row execute function public.set_updated_at();

alter table public.portal_access enable row level security;

-- Only organization_admin may grant/revoke/view portal access. Portal users
-- themselves never query this table via the RLS-scoped client — all portal
-- reads (including of this table, to resolve which players a portal user may
-- see) go through the service-role client with authorization enforced in
-- application code (lib/portal/*), never via a policy here.
create policy "org admins can manage portal access"
  on public.portal_access
  for all
  using (public.has_org_role(organization_id, array['organization_admin']))
  with check (public.has_org_role(organization_id, array['organization_admin']));
