create table public.match_result_revisions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id),
  status public.match_status not null,
  score_a_90 integer,
  score_b_90 integer,
  score_a_final integer,
  score_b_final integer,
  winner_team_id uuid references public.teams(id),
  provider_updated_at timestamptz not null,
  recorded_at timestamptz not null default now()
);

alter table public.match_result_revisions enable row level security;
revoke all on public.match_result_revisions from anon, authenticated;

create or replace function public.apply_match_result(result_payload jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_match public.matches;
  winner_id uuid;
  changed boolean;
begin
  select * into target_match from public.matches
  where provider_id = result_payload->>'matchProviderId'
  for update;
  if target_match.id is null then
    raise exception 'Unknown match';
  end if;

  select id into winner_id from public.teams
  where provider_id = nullif(result_payload->>'winnerProviderTeamId', '');
  if nullif(result_payload->>'winnerProviderTeamId', '') is not null and winner_id is null then
    raise exception 'Unknown winning team';
  end if;

  changed := row(
    target_match.status, target_match.score_a_90, target_match.score_b_90,
    target_match.score_a_final, target_match.score_b_final, target_match.winner_team_id
  ) is distinct from row(
    (result_payload->>'status')::public.match_status,
    (result_payload->>'scoreA90')::integer,
    (result_payload->>'scoreB90')::integer,
    (result_payload->>'scoreAFinal')::integer,
    (result_payload->>'scoreBFinal')::integer,
    winner_id
  );

  insert into public.match_result_revisions (
    match_id, status, score_a_90, score_b_90, score_a_final, score_b_final,
    winner_team_id, provider_updated_at
  ) select
    target_match.id, (result_payload->>'status')::public.match_status,
    (result_payload->>'scoreA90')::integer, (result_payload->>'scoreB90')::integer,
    (result_payload->>'scoreAFinal')::integer, (result_payload->>'scoreBFinal')::integer,
    winner_id, (result_payload->>'providerUpdatedAt')::timestamptz
  where not exists (
    select 1 from public.match_result_revisions r
    where r.match_id = target_match.id
      and r.status = (result_payload->>'status')::public.match_status
      and r.score_a_90 is not distinct from (result_payload->>'scoreA90')::integer
      and r.score_b_90 is not distinct from (result_payload->>'scoreB90')::integer
      and r.score_a_final is not distinct from (result_payload->>'scoreAFinal')::integer
      and r.score_b_final is not distinct from (result_payload->>'scoreBFinal')::integer
      and r.winner_team_id is not distinct from winner_id
      and r.provider_updated_at = (result_payload->>'providerUpdatedAt')::timestamptz
  );

  if changed then
    update public.matches set
      status = (result_payload->>'status')::public.match_status,
      score_a_90 = (result_payload->>'scoreA90')::integer,
      score_b_90 = (result_payload->>'scoreB90')::integer,
      score_a_final = (result_payload->>'scoreAFinal')::integer,
      score_b_final = (result_payload->>'scoreBFinal')::integer,
      winner_team_id = winner_id,
      last_provider_update_at = (result_payload->>'providerUpdatedAt')::timestamptz,
      updated_at = now()
    where id = target_match.id;
  end if;
  return changed;
end;
$$;

revoke all on function public.apply_match_result(jsonb) from public, anon, authenticated;
