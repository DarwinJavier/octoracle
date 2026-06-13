create extension if not exists pgcrypto;

create type public.match_status as enum (
  'scheduled',
  'live',
  'halftime',
  'finished',
  'finished_after_extra_time',
  'finished_after_penalties',
  'postponed',
  'suspended',
  'cancelled',
  'abandoned',
  'unknown'
);

create type public.prediction_status as enum ('draft', 'published', 'frozen', 'superseded', 'void');
create type public.selected_outcome as enum ('team_a', 'draw', 'team_b');
create type public.source_lean as enum ('team_a', 'draw', 'team_b', 'unclear');
create type public.job_status as enum ('running', 'succeeded', 'failed', 'skipped');

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null unique,
  fifa_code text,
  name text not null,
  short_name text,
  flag_asset_url text,
  group_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null unique,
  official_match_number integer,
  stage text not null,
  group_code text,
  team_a_id uuid references public.teams(id),
  team_b_id uuid references public.teams(id),
  team_a_placeholder text,
  team_b_placeholder text,
  kickoff_at_utc timestamptz,
  venue text,
  city text,
  status public.match_status not null default 'unknown',
  score_a_90 integer,
  score_b_90 integer,
  score_a_final integer,
  score_b_final integer,
  winner_team_id uuid references public.teams(id),
  last_provider_update_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_participants_check check (
    (team_a_id is not null or team_a_placeholder is not null)
    and (team_b_id is not null or team_b_placeholder is not null)
  )
);

create table public.source_observations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id),
  source_domain text not null,
  canonical_url text not null,
  title text not null,
  published_at timestamptz,
  retrieved_at timestamptz not null,
  content_hash text not null,
  lean public.source_lean not null,
  confidence double precision not null check (confidence between 0 and 1),
  evidence_categories text[] not null default '{}',
  summary text not null,
  parser_version text not null,
  model_version text not null,
  created_at timestamptz not null default now(),
  unique (match_id, source_domain, content_hash)
);

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id),
  version integer not null check (version > 0),
  status public.prediction_status not null,
  team_a_win_probability double precision not null check (team_a_win_probability between 0 and 1),
  draw_probability double precision not null check (draw_probability between 0 and 1),
  team_b_win_probability double precision not null check (team_b_win_probability between 0 and 1),
  expected_goals_a double precision not null check (expected_goals_a >= 0),
  expected_goals_b double precision not null check (expected_goals_b >= 0),
  predicted_score_a_90 integer not null check (predicted_score_a_90 >= 0),
  predicted_score_b_90 integer not null check (predicted_score_b_90 >= 0),
  predicted_advancing_team_id uuid references public.teams(id),
  selected_outcome public.selected_outcome not null,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  reason_codes text[] not null default '{}',
  public_explanation text not null,
  source_count integer not null check (source_count >= 0),
  generated_at timestamptz not null,
  freeze_at timestamptz not null,
  frozen_at timestamptz,
  animation_seed text not null,
  model_version text not null,
  algorithm_version text not null,
  input_snapshot_hash text not null,
  created_at timestamptz not null default now(),
  unique (match_id, version),
  constraint predictions_probability_sum_check check (
    abs((team_a_win_probability + draw_probability + team_b_win_probability) - 1) < 0.000001
  )
);

create table public.job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  status public.job_status not null,
  started_at timestamptz not null,
  finished_at timestamptz,
  records_read integer not null default 0 check (records_read >= 0),
  records_written integer not null default 0 check (records_written >= 0),
  error_code text,
  error_summary text,
  run_key text not null,
  created_at timestamptz not null default now(),
  unique (job_name, run_key)
);

-- A small coordination table gives serverless workers an atomic, expiring job lock.
create table public.job_locks (
  job_name text primary key,
  acquired_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index matches_status_kickoff_idx on public.matches(status, kickoff_at_utc);
create index source_observations_match_idx on public.source_observations(match_id);
create index predictions_match_status_idx on public.predictions(match_id, status);

alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.source_observations enable row level security;
alter table public.predictions enable row level security;
alter table public.job_runs enable row level security;
alter table public.job_locks enable row level security;

revoke all on public.teams, public.matches, public.source_observations, public.predictions, public.job_runs, public.job_locks from anon, authenticated;
