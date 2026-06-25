-- =============================================================================
-- CCR-002 Phase 1: Schema — Extensions, Tables, Constraints, Indexes, Triggers
-- Source: 21 Phase 1 Database & RLS Readiness Pack, 15 MVP Database Schema
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- updated_at trigger function (applied to all mutable tables except audit_events)
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. profiles
-- Purpose: application-level user profile data linked to Supabase Auth users.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  avatar_url  text,
  status      text not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint profiles_status_check check (status in ('active', 'inactive', 'suspended'))
);

create index idx_profiles_email  on public.profiles(email);
create index idx_profiles_status on public.profiles(status);

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. organizations
-- Purpose: tenant-level organization records.
-- ---------------------------------------------------------------------------

create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique,
  timezone    text default 'UTC',
  country     text,
  status      text not null default 'active',
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,

  constraint organizations_status_check check (status in ('active', 'inactive', 'archived'))
);

create index idx_organizations_created_by on public.organizations(created_by);
create index idx_organizations_status     on public.organizations(status);

create trigger set_organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. memberships
-- Purpose: links users to organizations and defines organization-level role.
-- ---------------------------------------------------------------------------

create table public.memberships (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  role            text not null,
  status          text not null default 'active',
  invited_by      uuid references public.profiles(id),
  joined_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (organization_id, user_id),

  constraint memberships_role_check   check (role in ('organization_admin', 'head_coach', 'coach', 'staff')),
  constraint memberships_status_check check (status in ('invited', 'active', 'suspended', 'removed'))
);

create index idx_memberships_user_id         on public.memberships(user_id);
create index idx_memberships_org_id          on public.memberships(organization_id);
create index idx_memberships_org_user_status on public.memberships(organization_id, user_id, status);

create trigger set_memberships_updated_at
  before update on public.memberships
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. teams
-- Purpose: stores team records inside an organization.
-- ---------------------------------------------------------------------------

create table public.teams (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  age_group       text,
  season          text,
  level           text,
  status          text not null default 'active',
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,

  constraint teams_status_check check (status in ('active', 'inactive', 'archived'))
);

create index idx_teams_org_id     on public.teams(organization_id);
create index idx_teams_org_status on public.teams(organization_id, status);

create trigger set_teams_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. team_staff
-- Purpose: links staff users to teams.
-- ---------------------------------------------------------------------------

create table public.team_staff (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  team_id         uuid not null references public.teams(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  staff_role      text not null default 'coach',
  status          text not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (team_id, user_id),

  constraint team_staff_role_check   check (staff_role in ('head_coach', 'coach', 'staff')),
  constraint team_staff_status_check check (status in ('active', 'inactive', 'removed'))
);

create index idx_team_staff_org_id  on public.team_staff(organization_id);
create index idx_team_staff_team_id on public.team_staff(team_id);
create index idx_team_staff_user_id on public.team_staff(user_id);

create trigger set_team_staff_updated_at
  before update on public.team_staff
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. players
-- Purpose: stores player records within an organization.
-- ---------------------------------------------------------------------------

create table public.players (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  first_name        text not null,
  last_name         text not null,
  display_name      text,
  date_of_birth     date,
  primary_position  text,
  preferred_foot    text,
  status            text not null default 'active',
  notes             text,
  created_by        uuid references public.profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,

  constraint players_status_check         check (status in ('active', 'inactive', 'archived')),
  constraint players_preferred_foot_check check (preferred_foot is null or preferred_foot in ('left', 'right', 'both', 'unknown'))
);

create index idx_players_org_id     on public.players(organization_id);
create index idx_players_org_status on public.players(organization_id, status);
create index idx_players_name       on public.players(last_name, first_name);

create trigger set_players_updated_at
  before update on public.players
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. player_team_memberships
-- Purpose: links players to teams and seasons.
-- ---------------------------------------------------------------------------

create table public.player_team_memberships (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  player_id       uuid not null references public.players(id) on delete cascade,
  team_id         uuid not null references public.teams(id) on delete cascade,
  squad_number    integer,
  status          text not null default 'active',
  start_date      date,
  end_date        date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (player_id, team_id, start_date),

  constraint player_team_memberships_status_check       check (status in ('active', 'inactive', 'transferred', 'archived')),
  constraint player_team_memberships_squad_number_check check (squad_number is null or squad_number between 0 and 999),
  constraint player_team_memberships_dates_check        check (end_date is null or start_date is null or end_date >= start_date)
);

create index idx_player_team_memberships_player on public.player_team_memberships(player_id);
create index idx_player_team_memberships_team   on public.player_team_memberships(team_id);
create index idx_player_team_memberships_org    on public.player_team_memberships(organization_id);

create trigger set_player_team_memberships_updated_at
  before update on public.player_team_memberships
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 8. exercises
-- Purpose: stores reusable training exercises.
-- ---------------------------------------------------------------------------

create table public.exercises (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  name                text not null,
  objective           text not null,
  category            text,
  description         text,
  coaching_points     text,
  duration_minutes    integer,
  player_count_min    integer,
  player_count_max    integer,
  difficulty          text,
  tags                text[] default '{}',
  created_by          uuid references public.profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz,

  constraint exercises_duration_check         check (duration_minutes is null or duration_minutes > 0),
  constraint exercises_player_count_min_check check (player_count_min is null or player_count_min >= 0),
  constraint exercises_player_count_max_check check (player_count_max is null or player_count_max >= 0),
  constraint exercises_player_count_order     check (player_count_min is null or player_count_max is null or player_count_max >= player_count_min),
  constraint exercises_difficulty_check       check (difficulty is null or difficulty in ('low', 'medium', 'high'))
);

create index idx_exercises_org_id       on public.exercises(organization_id);
create index idx_exercises_org_category on public.exercises(organization_id, category);

create trigger set_exercises_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 9. training_sessions
-- Purpose: stores planned or completed training sessions.
-- ---------------------------------------------------------------------------

create table public.training_sessions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  team_id         uuid not null references public.teams(id) on delete cascade,
  title           text not null,
  session_date    date not null,
  start_time      time,
  duration_minutes integer,
  objective       text,
  location        text,
  status          text not null default 'planned',
  notes           text,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,

  constraint training_sessions_status_check   check (status in ('planned', 'completed', 'cancelled')),
  constraint training_sessions_duration_check check (duration_minutes is null or duration_minutes > 0)
);

create index idx_training_sessions_org_team_date on public.training_sessions(organization_id, team_id, session_date);
create index idx_training_sessions_org_status    on public.training_sessions(organization_id, status);

create trigger set_training_sessions_updated_at
  before update on public.training_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 10. session_exercises
-- Purpose: links exercises to training sessions.
-- ---------------------------------------------------------------------------

create table public.session_exercises (
  id                       uuid primary key default gen_random_uuid(),
  organization_id          uuid not null references public.organizations(id) on delete cascade,
  session_id               uuid not null references public.training_sessions(id) on delete cascade,
  exercise_id              uuid references public.exercises(id),
  sort_order               integer not null default 0,
  planned_duration_minutes integer,
  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  constraint session_exercises_sort_order_check check (sort_order >= 0),
  constraint session_exercises_duration_check   check (planned_duration_minutes is null or planned_duration_minutes > 0)
);

create index idx_session_exercises_org      on public.session_exercises(organization_id);
create index idx_session_exercises_session  on public.session_exercises(session_id);
create index idx_session_exercises_exercise on public.session_exercises(exercise_id);

create trigger set_session_exercises_updated_at
  before update on public.session_exercises
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 11. attendance_records
-- Purpose: stores attendance status for players in training sessions.
-- ---------------------------------------------------------------------------

create table public.attendance_records (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  session_id      uuid not null references public.training_sessions(id) on delete cascade,
  player_id       uuid not null references public.players(id) on delete cascade,
  status          text not null default 'unknown',
  notes           text,
  recorded_by     uuid references public.profiles(id),
  recorded_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (session_id, player_id),

  constraint attendance_records_status_check check (status in ('present', 'absent', 'late', 'limited', 'excused', 'unknown'))
);

create index idx_attendance_session     on public.attendance_records(session_id);
create index idx_attendance_org_session on public.attendance_records(organization_id, session_id);
create index idx_attendance_player      on public.attendance_records(player_id);

create trigger set_attendance_records_updated_at
  before update on public.attendance_records
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 12. matches
-- Purpose: stores basic match records.
-- ---------------------------------------------------------------------------

create table public.matches (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  team_id         uuid not null references public.teams(id) on delete cascade,
  match_date      date not null,
  opponent        text not null,
  location        text,
  competition     text,
  home_away       text,
  goals_for       integer,
  goals_against   integer,
  status          text not null default 'scheduled',
  notes           text,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,

  constraint matches_status_check        check (status in ('scheduled', 'completed', 'cancelled')),
  constraint matches_home_away_check     check (home_away is null or home_away in ('home', 'away', 'neutral')),
  constraint matches_goals_for_check     check (goals_for is null or goals_for >= 0),
  constraint matches_goals_against_check check (goals_against is null or goals_against >= 0)
);

create index idx_matches_org_team_date on public.matches(organization_id, team_id, match_date);
create index idx_matches_org_status    on public.matches(organization_id, status);

create trigger set_matches_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 13. assessment_types
-- Purpose: defines reusable assessment or test types.
-- ---------------------------------------------------------------------------

create table public.assessment_types (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  category         text,
  unit             text,
  description      text,
  higher_is_better boolean default true,
  created_by       uuid references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create index idx_assessment_types_org          on public.assessment_types(organization_id);
create index idx_assessment_types_org_category on public.assessment_types(organization_id, category);

create trigger set_assessment_types_updated_at
  before update on public.assessment_types
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 14. assessment_results
-- Purpose: stores player assessment results.
-- ---------------------------------------------------------------------------

create table public.assessment_results (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  assessment_type_id  uuid not null references public.assessment_types(id) on delete restrict,
  player_id           uuid not null references public.players(id) on delete cascade,
  team_id             uuid references public.teams(id) on delete set null,
  assessed_at         date not null,
  value               numeric not null,
  unit                text,
  notes               text,
  recorded_by         uuid references public.profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_assessment_results_player_date on public.assessment_results(player_id, assessed_at);
create index idx_assessment_results_org_date    on public.assessment_results(organization_id, assessed_at);
create index idx_assessment_results_type        on public.assessment_results(assessment_type_id);

create trigger set_assessment_results_updated_at
  before update on public.assessment_results
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 15. reports
-- Purpose: stores generated or manually created report records.
-- ---------------------------------------------------------------------------

create table public.reports (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  title               text not null,
  report_type         text not null,
  source_entity_type  text,
  source_entity_id    uuid,
  content             jsonb,
  summary             text,
  status              text not null default 'draft',
  generated_by        uuid references public.profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz,

  constraint reports_report_type_check        check (report_type in ('player_summary', 'team_summary', 'session_summary', 'match_summary', 'assessment_summary')),
  constraint reports_status_check             check (status in ('draft', 'generated', 'archived')),
  constraint reports_source_entity_type_check check (source_entity_type is null or source_entity_type in ('player', 'team', 'training_session', 'match', 'assessment'))
);

create index idx_reports_org_type   on public.reports(organization_id, report_type);
create index idx_reports_org_status on public.reports(organization_id, status);

create trigger set_reports_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 16. audit_events
-- Purpose: stores important domain and admin actions. Append-only — no updated_at.
-- ---------------------------------------------------------------------------

create table public.audit_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_user_id   uuid references public.profiles(id),
  action_type     text not null,
  target_type     text,
  target_id       uuid,
  previous_value  jsonb,
  new_value       jsonb,
  source          text default 'web_app',
  created_at      timestamptz not null default now(),

  constraint audit_events_source_check check (source in ('web_app', 'server_action', 'api_route', 'system'))
);

create index idx_audit_events_org_created_at on public.audit_events(organization_id, created_at desc);
create index idx_audit_events_actor          on public.audit_events(actor_user_id);
create index idx_audit_events_action_type    on public.audit_events(action_type);
create index idx_audit_events_target         on public.audit_events(target_type, target_id);

-- NOTE: No updated_at column and no updated_at trigger on audit_events.
-- audit_events is append-only by design.
