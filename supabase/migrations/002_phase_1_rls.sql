-- =============================================================================
-- CCR-002 Phase 1: RLS — Enablement, Helper Functions, Policies
-- Source: 21 Phase 1 Database & RLS Readiness Pack (sections 16, 17, 18, 19)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enable RLS on every MVP table
-- ---------------------------------------------------------------------------

alter table public.profiles                enable row level security;
alter table public.organizations           enable row level security;
alter table public.memberships             enable row level security;
alter table public.teams                   enable row level security;
alter table public.team_staff              enable row level security;
alter table public.players                 enable row level security;
alter table public.player_team_memberships enable row level security;
alter table public.exercises               enable row level security;
alter table public.training_sessions       enable row level security;
alter table public.session_exercises       enable row level security;
alter table public.attendance_records      enable row level security;
alter table public.matches                 enable row level security;
alter table public.assessment_types        enable row level security;
alter table public.assessment_results      enable row level security;
alter table public.reports                 enable row level security;
alter table public.audit_events            enable row level security;

-- ---------------------------------------------------------------------------
-- RLS Helper Functions
-- Security: all functions use SECURITY DEFINER with explicit search_path.
-- ---------------------------------------------------------------------------

-- Returns true if the current user has an active membership in the given org.
create or replace function public.is_org_member(target_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = target_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

-- Returns true if the current user has one of the allowed roles in the given org.
create or replace function public.has_org_role(target_organization_id uuid, allowed_roles text[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = target_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any(allowed_roles)
  );
$$;

-- Returns true if the current user is an org-level admin/head_coach OR
-- is an active team staff member for the given team.
create or replace function public.has_team_access(target_organization_id uuid, target_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = target_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('organization_admin', 'head_coach')
  )
  or exists (
    select 1
    from public.team_staff ts
    where ts.organization_id = target_organization_id
      and ts.team_id = target_team_id
      and ts.user_id = auth.uid()
      and ts.status = 'active'
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS Policies
-- ---------------------------------------------------------------------------

-- ---- profiles ---------------------------------------------------------------

create policy "users can view own profile"
  on public.profiles
  for select
  using (id = auth.uid());

create policy "users can view profiles of shared org members"
  on public.profiles
  for select
  using (
    exists (
      select 1
      from public.memberships m1
      join public.memberships m2
        on m1.organization_id = m2.organization_id
      where m1.user_id = auth.uid()
        and m1.status = 'active'
        and m2.user_id = public.profiles.id
        and m2.status = 'active'
    )
  );

create policy "users can insert own profile"
  on public.profiles
  for insert
  with check (id = auth.uid());

create policy "users can update own profile"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---- organizations ----------------------------------------------------------

create policy "members can view organizations"
  on public.organizations
  for select
  using (public.is_org_member(id));

create policy "authenticated users can create organizations"
  on public.organizations
  for insert
  with check (created_by = auth.uid());

create policy "org admins can update organizations"
  on public.organizations
  for update
  using (public.has_org_role(id, array['organization_admin']))
  with check (public.has_org_role(id, array['organization_admin']));

-- ---- memberships ------------------------------------------------------------

create policy "members can view memberships"
  on public.memberships
  for select
  using (public.is_org_member(organization_id));

create policy "org admins can insert memberships"
  on public.memberships
  for insert
  with check (public.has_org_role(organization_id, array['organization_admin']));

create policy "org admins can update memberships"
  on public.memberships
  for update
  using (public.has_org_role(organization_id, array['organization_admin']))
  with check (public.has_org_role(organization_id, array['organization_admin']));

-- ---- teams ------------------------------------------------------------------

create policy "members can view teams"
  on public.teams
  for select
  using (public.is_org_member(organization_id));

create policy "org admins and head coaches can insert teams"
  on public.teams
  for insert
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach']));

create policy "org admins and head coaches can update teams"
  on public.teams
  for update
  using (public.has_org_role(organization_id, array['organization_admin', 'head_coach']))
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach']));

-- ---- team_staff -------------------------------------------------------------

create policy "members can view team staff"
  on public.team_staff
  for select
  using (public.is_org_member(organization_id));

create policy "org admins and head coaches can insert team staff"
  on public.team_staff
  for insert
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach']));

create policy "org admins and head coaches can update team staff"
  on public.team_staff
  for update
  using (public.has_org_role(organization_id, array['organization_admin', 'head_coach']))
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach']));

-- ---- players ----------------------------------------------------------------

create policy "members can view players"
  on public.players
  for select
  using (public.is_org_member(organization_id));

create policy "org admins, head coaches and coaches can insert players"
  on public.players
  for insert
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach']));

create policy "org admins and head coaches can update players"
  on public.players
  for update
  using (public.has_org_role(organization_id, array['organization_admin', 'head_coach']))
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach']));

-- ---- player_team_memberships ------------------------------------------------

create policy "members can view player team memberships"
  on public.player_team_memberships
  for select
  using (public.is_org_member(organization_id));

create policy "org admins and head coaches can insert player team memberships"
  on public.player_team_memberships
  for insert
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach']));

create policy "org admins and head coaches can update player team memberships"
  on public.player_team_memberships
  for update
  using (public.has_org_role(organization_id, array['organization_admin', 'head_coach']))
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach']));

-- ---- exercises --------------------------------------------------------------

create policy "members can view exercises"
  on public.exercises
  for select
  using (public.is_org_member(organization_id));

create policy "org admins, head coaches and coaches can insert exercises"
  on public.exercises
  for insert
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach']));

create policy "org admins, head coaches and coaches can update exercises"
  on public.exercises
  for update
  using (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach']))
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach']));

-- ---- training_sessions ------------------------------------------------------

create policy "members can view training sessions"
  on public.training_sessions
  for select
  using (public.is_org_member(organization_id));

create policy "org admins, head coaches and coaches can insert training sessions"
  on public.training_sessions
  for insert
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach']));

create policy "org admins and head coaches can update training sessions"
  on public.training_sessions
  for update
  using (public.has_org_role(organization_id, array['organization_admin', 'head_coach']))
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach']));

-- ---- session_exercises ------------------------------------------------------

create policy "members can view session exercises"
  on public.session_exercises
  for select
  using (public.is_org_member(organization_id));

create policy "org admins, head coaches and coaches can insert session exercises"
  on public.session_exercises
  for insert
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach']));

create policy "org admins, head coaches and coaches can update session exercises"
  on public.session_exercises
  for update
  using (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach']))
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach']));

-- session_exercises is a planning join row; delete is permitted for authorized roles
-- before session completion rules are enforced in later phases.
create policy "org admins, head coaches and coaches can delete session exercises"
  on public.session_exercises
  for delete
  using (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach']));

-- ---- attendance_records -----------------------------------------------------

create policy "members can view attendance records"
  on public.attendance_records
  for select
  using (public.is_org_member(organization_id));

create policy "org admins, head coaches, coaches and staff can insert attendance records"
  on public.attendance_records
  for insert
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach', 'staff']));

create policy "org admins, head coaches, coaches and staff can update attendance records"
  on public.attendance_records
  for update
  using (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach', 'staff']))
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach', 'staff']));

-- ---- matches ----------------------------------------------------------------

create policy "members can view matches"
  on public.matches
  for select
  using (public.is_org_member(organization_id));

create policy "org admins, head coaches and coaches can insert matches"
  on public.matches
  for insert
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach']));

create policy "org admins, head coaches and coaches can update matches"
  on public.matches
  for update
  using (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach']))
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach']));

-- ---- assessment_types -------------------------------------------------------

create policy "members can view assessment types"
  on public.assessment_types
  for select
  using (public.is_org_member(organization_id));

create policy "org admins and head coaches can insert assessment types"
  on public.assessment_types
  for insert
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach']));

create policy "org admins and head coaches can update assessment types"
  on public.assessment_types
  for update
  using (public.has_org_role(organization_id, array['organization_admin', 'head_coach']))
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach']));

-- ---- assessment_results -----------------------------------------------------

create policy "members can view assessment results"
  on public.assessment_results
  for select
  using (public.is_org_member(organization_id));

create policy "org admins, head coaches, coaches and staff can insert assessment results"
  on public.assessment_results
  for insert
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach', 'staff']));

create policy "org admins, head coaches, coaches and staff can update assessment results"
  on public.assessment_results
  for update
  using (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach', 'staff']))
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach', 'staff']));

-- ---- reports ----------------------------------------------------------------

create policy "members can view reports"
  on public.reports
  for select
  using (public.is_org_member(organization_id));

create policy "org admins, head coaches and coaches can insert reports"
  on public.reports
  for insert
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach']));

create policy "org admins, head coaches and coaches can update reports"
  on public.reports
  for update
  using (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach']))
  with check (public.has_org_role(organization_id, array['organization_admin', 'head_coach', 'coach']));

-- ---- audit_events -----------------------------------------------------------
-- audit_events is append-only. No UPDATE or DELETE policy is created.

create policy "org admins can view audit events"
  on public.audit_events
  for select
  using (public.has_org_role(organization_id, array['organization_admin']));

create policy "active org members can insert audit events for their org"
  on public.audit_events
  for insert
  with check (public.is_org_member(organization_id));

-- No update policy for audit_events.
-- No delete policy for audit_events.
