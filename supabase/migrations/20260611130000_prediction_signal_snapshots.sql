create table public.prediction_signal_snapshots (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id),
  input_snapshot_hash text not null unique,
  team_a_signals jsonb not null,
  team_b_signals jsonb not null,
  team_a_history_provider_ids text[] not null default '{}',
  team_b_history_provider_ids text[] not null default '{}',
  source_count integer not null check (source_count >= 0),
  calculated_at timestamptz not null,
  cutoff_at timestamptz not null,
  algorithm_version text not null,
  created_at timestamptz not null default now()
);

create index prediction_signal_snapshots_match_idx
  on public.prediction_signal_snapshots(match_id, calculated_at desc);

alter table public.prediction_signal_snapshots enable row level security;

grant select, insert on table public.prediction_signal_snapshots to service_role;
revoke all on table public.prediction_signal_snapshots from anon, authenticated;
