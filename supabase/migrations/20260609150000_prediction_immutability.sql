create or replace function public.protect_prediction_history()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'frozen' and new.status <> 'void' then
    raise exception 'Frozen predictions are immutable';
  end if;

  if row(
    old.match_id,
    old.version,
    old.team_a_win_probability,
    old.draw_probability,
    old.team_b_win_probability,
    old.expected_goals_a,
    old.expected_goals_b,
    old.predicted_score_a_90,
    old.predicted_score_b_90,
    old.predicted_advancing_team_id,
    old.selected_outcome,
    old.confidence,
    old.reason_codes,
    old.public_explanation,
    old.source_count,
    old.generated_at,
    old.freeze_at,
    old.animation_seed,
    old.model_version,
    old.algorithm_version,
    old.input_snapshot_hash
  ) is distinct from row(
    new.match_id,
    new.version,
    new.team_a_win_probability,
    new.draw_probability,
    new.team_b_win_probability,
    new.expected_goals_a,
    new.expected_goals_b,
    new.predicted_score_a_90,
    new.predicted_score_b_90,
    new.predicted_advancing_team_id,
    new.selected_outcome,
    new.confidence,
    new.reason_codes,
    new.public_explanation,
    new.source_count,
    new.generated_at,
    new.freeze_at,
    new.animation_seed,
    new.model_version,
    new.algorithm_version,
    new.input_snapshot_hash
  ) then
    raise exception 'Prediction analytical fields are immutable; create a new version';
  end if;

  return new;
end;
$$;

create trigger protect_prediction_history_before_update
before update on public.predictions
for each row execute function public.protect_prediction_history();

create or replace function public.freeze_due_predictions(freeze_time timestamptz)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.predictions
  set status = 'frozen', frozen_at = freeze_time
  where status = 'published' and freeze_at <= freeze_time;
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.freeze_due_predictions(timestamptz) from public, anon, authenticated;

create or replace function public.publish_prediction_version(prediction_payload jsonb)
returns public.predictions
language plpgsql
security definer
set search_path = public
as $$
declare
  next_version integer;
  result public.predictions;
  target_match public.matches;
begin
  perform pg_advisory_xact_lock(hashtext(prediction_payload->>'matchId'));

  select * into target_match from public.matches where id = (prediction_payload->>'matchId')::uuid for update;
  if target_match.id is null or target_match.status <> 'scheduled' or target_match.kickoff_at_utc is null then
    raise exception 'Match is not eligible for prediction';
  end if;
  if current_timestamp >= target_match.kickoff_at_utc then
    raise exception 'Prediction cutoff has passed';
  end if;
  if target_match.kickoff_at_utc <> (prediction_payload->>'freezeAt')::timestamptz then
    raise exception 'Prediction kickoff snapshot is stale';
  end if;

  select coalesce(max(version), 0) + 1 into next_version
  from public.predictions
  where match_id = target_match.id;

  update public.predictions
  set status = 'superseded'
  where match_id = target_match.id and status = 'published';

  insert into public.predictions (
    match_id, version, status, team_a_win_probability, draw_probability,
    team_b_win_probability, expected_goals_a, expected_goals_b,
    predicted_score_a_90, predicted_score_b_90, predicted_advancing_team_id,
    selected_outcome, confidence, reason_codes, public_explanation, source_count,
    generated_at, freeze_at, animation_seed, model_version, algorithm_version,
    input_snapshot_hash
  ) values (
    target_match.id, next_version, 'published',
    (prediction_payload->>'teamAWinProbability')::double precision,
    (prediction_payload->>'drawProbability')::double precision,
    (prediction_payload->>'teamBWinProbability')::double precision,
    (prediction_payload->>'expectedGoalsA')::double precision,
    (prediction_payload->>'expectedGoalsB')::double precision,
    (prediction_payload->>'predictedScoreA90')::integer,
    (prediction_payload->>'predictedScoreB90')::integer,
    nullif(prediction_payload->>'predictedAdvancingTeamId', '')::uuid,
    (prediction_payload->>'selectedOutcome')::public.selected_outcome,
    prediction_payload->>'confidence',
    array(select jsonb_array_elements_text(prediction_payload->'reasonCodes')),
    prediction_payload->>'publicExplanation',
    (prediction_payload->>'sourceCount')::integer,
    (prediction_payload->>'generatedAt')::timestamptz,
    (prediction_payload->>'freezeAt')::timestamptz,
    prediction_payload->>'animationSeed',
    prediction_payload->>'modelVersion',
    prediction_payload->>'algorithmVersion',
    prediction_payload->>'inputSnapshotHash'
  ) returning * into result;

  return result;
end;
$$;

create or replace function public.void_frozen_predictions_for_match(target_match_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.predictions set status = 'void'
  where match_id = target_match_id and status = 'frozen';
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.publish_prediction_version(jsonb) from public, anon, authenticated;
revoke all on function public.void_frozen_predictions_for_match(uuid) from public, anon, authenticated;
