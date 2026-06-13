create or replace function public.prediction_history(history_limit integer default 20)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(item order by frozen_at desc), '[]'::jsonb)
  from (
    select
      p.frozen_at,
      jsonb_build_object(
        'prediction', jsonb_build_object(
          'animationSeed', p.animation_seed,
          'confidence', p.confidence,
          'drawProbability', p.draw_probability,
          'freezeAt', p.freeze_at,
          'frozenAt', p.frozen_at,
          'generatedAt', p.generated_at,
          'predictedAdvancingTeamId', pat.provider_id,
          'predictedScoreA90', p.predicted_score_a_90,
          'predictedScoreB90', p.predicted_score_b_90,
          'publicExplanation', p.public_explanation,
          'reasonCodes', p.reason_codes,
          'selectedOutcome', p.selected_outcome,
          'sourceCount', p.source_count,
          'status', p.status,
          'teamAWinProbability', p.team_a_win_probability,
          'teamBWinProbability', p.team_b_win_probability,
          'version', p.version
        ),
        'match', jsonb_build_object(
          'id', m.provider_id,
          'matchNumber', m.official_match_number,
          'stage', m.stage,
          'groupCode', m.group_code,
          'kickoffAtUtc', m.kickoff_at_utc,
          'venue', coalesce(m.venue, 'Venue to be confirmed'),
          'city', coalesce(m.city, 'City to be confirmed'),
          'status', m.status,
          'teamA', jsonb_build_object('id', ta.provider_id, 'fifaCode', coalesce(ta.fifa_code, 'TBD'), 'flagAssetUrl', ta.flag_asset_url, 'flagEmoji', '', 'name', ta.name, 'shortName', coalesce(ta.short_name, ta.name)),
          'teamB', jsonb_build_object('id', tb.provider_id, 'fifaCode', coalesce(tb.fifa_code, 'TBD'), 'flagAssetUrl', tb.flag_asset_url, 'flagEmoji', '', 'name', tb.name, 'shortName', coalesce(tb.short_name, tb.name))
        ),
        'result', jsonb_build_object(
          'status', m.status,
          'scoreA90', m.score_a_90,
          'scoreB90', m.score_b_90,
          'scoreAFinal', m.score_a_final,
          'scoreBFinal', m.score_b_final,
          'winnerTeamId', wt.provider_id,
          'providerUpdatedAt', m.last_provider_update_at
        )
      ) as item
    from public.predictions p
    join public.matches m on m.id = p.match_id
    join public.teams ta on ta.id = m.team_a_id
    join public.teams tb on tb.id = m.team_b_id
    left join public.teams wt on wt.id = m.winner_team_id
    left join public.teams pat on pat.id = p.predicted_advancing_team_id
    where p.status = 'frozen'
      and m.status in ('finished', 'finished_after_extra_time', 'finished_after_penalties')
      and m.score_a_90 is not null and m.score_b_90 is not null
      and m.score_a_final is not null and m.score_b_final is not null
    order by p.frozen_at desc
    limit greatest(1, least(history_limit, 100))
  ) history;
$$;

revoke all on function public.prediction_history(integer) from public, anon, authenticated;
