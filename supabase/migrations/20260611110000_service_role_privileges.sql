-- SQL Editor migrations run as postgres and do not automatically grant the
-- server-only service_role access to newly created application objects.
grant usage on schema public to service_role;

grant select, insert, update, delete on table
  public.teams,
  public.matches,
  public.source_observations,
  public.predictions,
  public.job_runs,
  public.job_locks,
  public.match_result_revisions
to service_role;

grant usage, select on all sequences in schema public to service_role;

grant execute on function public.freeze_due_predictions(timestamptz) to service_role;
grant execute on function public.publish_prediction_version(jsonb) to service_role;
grant execute on function public.void_frozen_predictions_for_match(uuid) to service_role;
grant execute on function public.apply_match_result(jsonb) to service_role;
grant execute on function public.prediction_history(integer) to service_role;

revoke all on table
  public.teams,
  public.matches,
  public.source_observations,
  public.predictions,
  public.job_runs,
  public.job_locks,
  public.match_result_revisions
from anon, authenticated;
