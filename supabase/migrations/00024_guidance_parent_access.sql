-- Guidance Module - Veli (Parent) Access
-- Allows parents to view guidance data and participate in surveys for their children

-- 1. Add profile_id to guidance_survey_responses for parent responses
alter table public.guidance_survey_responses add column if not exists profile_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_guidance_survey_responses_profile_id on public.guidance_survey_responses (profile_id);

-- 2. Add department_id to guidance_activities for department targeting
alter table public.guidance_activities add column if not exists department_id uuid references public.departments(id) on delete set null;

create index if not exists idx_guidance_activities_department_id on public.guidance_activities (department_id);

-- 3. RLS: Veli can view surveys relevant to their children
create policy "guidance_surveys_select_veli"
  on public.guidance_surveys for select
  using (exists (
    select 1 from public.profiles p
    join public.parent_student_links psl on psl.parent_profile_id = p.id
    join public.students s on s.id = psl.student_id
    join public.classes c on c.id = s.course_class_id
    where p.auth_user_id = auth.uid()
      and p.is_active = true
      and p.role = 'veli'
      and guidance_surveys.status = 'active'
      and (
        guidance_surveys.target_scope = 'all_students'
        or (guidance_surveys.target_scope = 'department' and guidance_surveys.department_id = c.department_id)
      )
  ));

-- 4. RLS: Veli can view questions for surveys they can see
create policy "guidance_survey_questions_select_veli"
  on public.guidance_survey_questions for select
  using (exists (
    select 1 from public.guidance_surveys
    where guidance_surveys.id = guidance_survey_questions.survey_id
      and exists (
        select 1 from public.profiles p
        join public.parent_student_links psl on psl.parent_profile_id = p.id
        join public.students s on s.id = psl.student_id
        join public.classes c on c.id = s.course_class_id
        where p.auth_user_id = auth.uid()
          and p.is_active = true
          and p.role = 'veli'
          and guidance_surveys.status = 'active'
          and (
            guidance_surveys.target_scope = 'all_students'
            or (guidance_surveys.target_scope = 'department' and guidance_surveys.department_id = c.department_id)
          )
      )
  ));

-- 5. RLS: Veli can insert survey responses
create policy "guidance_survey_responses_insert_veli"
  on public.guidance_survey_responses for insert
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role = 'veli'
  ));

-- 6. RLS: Veli can view their own survey responses
create policy "guidance_survey_responses_select_veli"
  on public.guidance_survey_responses for select
  using (exists (
    select 1 from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.is_active = true
      and p.role = 'veli'
      and guidance_survey_responses.profile_id = p.id
  ));

-- 7. RLS: Veli can insert answers for their own responses
create policy "guidance_survey_answers_insert_veli"
  on public.guidance_survey_answers for insert
  with check (exists (
    select 1 from public.guidance_survey_responses r
    join public.profiles p on p.id = r.profile_id
    where p.auth_user_id = auth.uid()
      and p.is_active = true
      and p.role = 'veli'
      and r.id = guidance_survey_answers.response_id
  ));

-- 8. RLS: Veli can view answers for their own responses
create policy "guidance_survey_answers_select_veli"
  on public.guidance_survey_answers for select
  using (exists (
    select 1 from public.guidance_survey_responses r
    join public.profiles p on p.id = r.profile_id
    where p.auth_user_id = auth.uid()
      and p.is_active = true
      and p.role = 'veli'
      and r.id = guidance_survey_answers.response_id
  ));

-- 9. RLS: Veli can view guidance interviews for their children
create policy "guidance_interviews_select_veli"
  on public.guidance_interviews for select
  using (exists (
    select 1 from public.profiles p
    join public.parent_student_links psl on psl.parent_profile_id = p.id
    where p.auth_user_id = auth.uid()
      and p.is_active = true
      and p.role = 'veli'
      and psl.student_id = guidance_interviews.student_id
      and guidance_interviews.visibility in ('summary', 'shared')
  ));

-- 10. RLS: Veli can view follow-ups for their children
create policy "guidance_follow_ups_select_veli"
  on public.guidance_follow_ups for select
  using (exists (
    select 1 from public.profiles p
    join public.parent_student_links psl on psl.parent_profile_id = p.id
    where p.auth_user_id = auth.uid()
      and p.is_active = true
      and p.role = 'veli'
      and psl.student_id = guidance_follow_ups.student_id
  ));
