alter table public.student_term_snapshots
  add column if not exists infirmary_summary jsonb;

create or replace function public.complete_term_closure(
  p_term_id uuid,
  p_run_id uuid,
  p_profile_id uuid,
  p_summary jsonb,
  p_simulation_result jsonb
)
returns public.term_closure_runs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_term public.academic_terms;
  v_run public.term_closure_runs;
begin
  update public.academic_terms
  set
    status = 'closed',
    closed_at = now(),
    closed_by = p_profile_id,
    is_active = false,
    is_current = false
  where id = p_term_id
    and status = 'active'
  returning * into v_term;

  if not found then
    raise exception 'Term closure could not be completed because the term is not active.';
  end if;

  update public.term_closure_runs
  set
    status = 'completed',
    completed_at = now(),
    completed_by = p_profile_id,
    summary_json = p_summary,
    simulation_result = p_simulation_result
  where id = p_run_id
    and term_id = p_term_id
    and status in ('pending', 'running')
  returning * into v_run;

  if not found then
    raise exception 'Term closure run could not be finalized.';
  end if;

  return v_run;
end;
$$;

grant execute on function public.complete_term_closure(uuid, uuid, uuid, jsonb, jsonb) to authenticated;
