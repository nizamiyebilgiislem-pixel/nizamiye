-- Guidance Module - Rehberlik birimi için görüşme, takip, anket ve etkinlik yönetimi

-- 1. guidance_interviews
create table if not exists public.guidance_interviews (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  counselor_id uuid references public.profiles(id) on delete set null,
  interview_date date not null default current_date,
  interview_type text not null default 'individual' check (interview_type in ('individual', 'group', 'parent', 'emergency', 'follow_up')),
  visibility text not null default 'private' check (visibility in ('private', 'summary', 'shared')),
  title text not null,
  summary text,
  private_notes text,
  emotional_state text,
  academic_state text,
  social_state text,
  action_plan text,
  next_follow_up_date date,
  status text not null default 'open' check (status in ('open', 'followed', 'closed')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_guidance_interviews_student_id on public.guidance_interviews (student_id);
create index if not exists idx_guidance_interviews_counselor_id on public.guidance_interviews (counselor_id);
create index if not exists idx_guidance_interviews_interview_date on public.guidance_interviews (interview_date);
create index if not exists idx_guidance_interviews_status on public.guidance_interviews (status);
create index if not exists idx_guidance_interviews_visibility on public.guidance_interviews (visibility);

-- 2. guidance_follow_ups
create table if not exists public.guidance_follow_ups (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid references public.guidance_interviews(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  follow_up_date date not null,
  title text not null,
  description text,
  result_note text,
  status text not null default 'planned' check (status in ('planned', 'completed', 'cancelled')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_guidance_follow_ups_student_id on public.guidance_follow_ups (student_id);
create index if not exists idx_guidance_follow_ups_interview_id on public.guidance_follow_ups (interview_id);
create index if not exists idx_guidance_follow_ups_assigned_to on public.guidance_follow_ups (assigned_to);
create index if not exists idx_guidance_follow_ups_follow_up_date on public.guidance_follow_ups (follow_up_date);
create index if not exists idx_guidance_follow_ups_status on public.guidance_follow_ups (status);

-- 3. guidance_surveys
create table if not exists public.guidance_surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  target_scope text not null default 'all_students' check (target_scope in ('all_students', 'department', 'class')),
  department_id uuid references public.departments(id) on delete set null,
  class_id uuid references public.classes(id) on delete set null,
  starts_at date,
  ends_at date,
  is_anonymous boolean not null default true,
  status text not null default 'draft' check (status in ('draft', 'active', 'closed')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_guidance_surveys_target_scope on public.guidance_surveys (target_scope);
create index if not exists idx_guidance_surveys_department_id on public.guidance_surveys (department_id);
create index if not exists idx_guidance_surveys_class_id on public.guidance_surveys (class_id);
create index if not exists idx_guidance_surveys_status on public.guidance_surveys (status);

-- 4. guidance_survey_questions
create table if not exists public.guidance_survey_questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.guidance_surveys(id) on delete cascade,
  question_text text not null,
  question_type text not null default 'scale' check (question_type in ('scale', 'choice', 'text', 'yes_no')),
  options jsonb,
  sort_order integer not null default 0,
  is_required boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_guidance_survey_questions_survey_id on public.guidance_survey_questions (survey_id);
create index if not exists idx_guidance_survey_questions_sort_order on public.guidance_survey_questions (sort_order);

-- 5. guidance_survey_responses
create table if not exists public.guidance_survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.guidance_surveys(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_guidance_survey_responses_survey_id on public.guidance_survey_responses (survey_id);
create index if not exists idx_guidance_survey_responses_student_id on public.guidance_survey_responses (student_id);

-- 6. guidance_survey_answers
create table if not exists public.guidance_survey_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.guidance_survey_responses(id) on delete cascade,
  question_id uuid not null references public.guidance_survey_questions(id) on delete cascade,
  answer_text text,
  answer_number numeric,
  answer_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_guidance_survey_answers_response_id on public.guidance_survey_answers (response_id);
create index if not exists idx_guidance_survey_answers_question_id on public.guidance_survey_answers (question_id);

-- 7. guidance_activities
create table if not exists public.guidance_activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  activity_type text not null default 'activity' check (activity_type in ('trip', 'seminar', 'meeting', 'sports', 'cultural', 'activity')),
  description text,
  location text,
  activity_date date not null,
  start_time time,
  end_time time,
  status text not null default 'planned' check (status in ('planned', 'completed', 'cancelled')),
  responsible_profile_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_guidance_activities_activity_type on public.guidance_activities (activity_type);
create index if not exists idx_guidance_activities_activity_date on public.guidance_activities (activity_date);
create index if not exists idx_guidance_activities_status on public.guidance_activities (status);

-- 8. guidance_activity_participants
create table if not exists public.guidance_activity_participants (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.guidance_activities(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  participant_type text not null default 'student' check (participant_type in ('student', 'profile')),
  attendance_status text not null default 'planned' check (attendance_status in ('planned', 'attended', 'absent')),
  created_at timestamptz not null default now()
);

create index if not exists idx_guidance_activity_participants_activity_id on public.guidance_activity_participants (activity_id);
create index if not exists idx_guidance_activity_participants_student_id on public.guidance_activity_participants (student_id);
create index if not exists idx_guidance_activity_participants_profile_id on public.guidance_activity_participants (profile_id);
create index if not exists idx_guidance_activity_participants_participant_type on public.guidance_activity_participants (participant_type);

-- 9. Triggers
create trigger set_guidance_interviews_updated_at
  before update on public.guidance_interviews
  for each row
  execute function public.set_updated_at();

create trigger set_guidance_follow_ups_updated_at
  before update on public.guidance_follow_ups
  for each row
  execute function public.set_updated_at();

create trigger set_guidance_surveys_updated_at
  before update on public.guidance_surveys
  for each row
  execute function public.set_updated_at();

create trigger set_guidance_activities_updated_at
  before update on public.guidance_activities
  for each row
  execute function public.set_updated_at();

-- 10. Enable RLS
alter table public.guidance_interviews enable row level security;
alter table public.guidance_follow_ups enable row level security;
alter table public.guidance_surveys enable row level security;
alter table public.guidance_survey_questions enable row level security;
alter table public.guidance_survey_responses enable row level security;
alter table public.guidance_survey_answers enable row level security;
alter table public.guidance_activities enable row level security;
alter table public.guidance_activity_participants enable row level security;

-- 11. RLS: guidance_interviews
create policy "guidance_interviews_select_admin"
  on public.guidance_interviews for select
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ));

create policy "guidance_interviews_select_bolum_muduru"
  on public.guidance_interviews for select
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role = 'bolum_muduru'
  ) and visibility in ('summary', 'shared'));

create policy "guidance_interviews_select_hoca"
  on public.guidance_interviews for select
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role = 'hoca'
  ) and visibility in ('summary', 'shared'));

create policy "guidance_interviews_insert_staff"
  on public.guidance_interviews for insert
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ));

create policy "guidance_interviews_update_staff"
  on public.guidance_interviews for update
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ))
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ));

create policy "guidance_interviews_delete_admin"
  on public.guidance_interviews for delete
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur')
  ));

-- 12. RLS: guidance_follow_ups
create policy "guidance_follow_ups_select_admin"
  on public.guidance_follow_ups for select
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ));

create policy "guidance_follow_ups_select_bolum_muduru"
  on public.guidance_follow_ups for select
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role = 'bolum_muduru'
  ));

create policy "guidance_follow_ups_select_hoca"
  on public.guidance_follow_ups for select
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role = 'hoca'
  ));

create policy "guidance_follow_ups_insert_staff"
  on public.guidance_follow_ups for insert
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ));

create policy "guidance_follow_ups_update_staff"
  on public.guidance_follow_ups for update
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ))
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ));

create policy "guidance_follow_ups_delete_admin"
  on public.guidance_follow_ups for delete
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur')
  ));

-- 13. RLS: guidance_surveys
create policy "guidance_surveys_select_admin"
  on public.guidance_surveys for select
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ));

create policy "guidance_surveys_select_limited"
  on public.guidance_surveys for select
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('bolum_muduru', 'hoca')
  ));

create policy "guidance_surveys_insert_staff"
  on public.guidance_surveys for insert
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ));

create policy "guidance_surveys_update_staff"
  on public.guidance_surveys for update
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ))
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ));

create policy "guidance_surveys_delete_admin"
  on public.guidance_surveys for delete
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur')
  ));

-- 14. RLS: guidance_survey_questions
create policy "guidance_survey_questions_select_admin"
  on public.guidance_survey_questions for select
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ));

create policy "guidance_survey_questions_select_limited"
  on public.guidance_survey_questions for select
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('bolum_muduru', 'hoca')
  ));

create policy "guidance_survey_questions_insert_staff"
  on public.guidance_survey_questions for insert
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ));

create policy "guidance_survey_questions_update_staff"
  on public.guidance_survey_questions for update
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ))
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ));

create policy "guidance_survey_questions_delete_admin"
  on public.guidance_survey_questions for delete
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur')
  ));

-- 15. RLS: guidance_survey_responses
create policy "guidance_survey_responses_select_admin"
  on public.guidance_survey_responses for select
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ));

create policy "guidance_survey_responses_insert_staff"
  on public.guidance_survey_responses for insert
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ));

-- 16. RLS: guidance_survey_answers
create policy "guidance_survey_answers_select_admin"
  on public.guidance_survey_answers for select
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ));

create policy "guidance_survey_answers_insert_staff"
  on public.guidance_survey_answers for insert
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ));

-- 17. RLS: guidance_activities
create policy "guidance_activities_select_all"
  on public.guidance_activities for select
  using (true);

create policy "guidance_activities_insert_staff"
  on public.guidance_activities for insert
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ));

create policy "guidance_activities_update_staff"
  on public.guidance_activities for update
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ))
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ));

create policy "guidance_activities_delete_admin"
  on public.guidance_activities for delete
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur')
  ));

-- 18. RLS: guidance_activity_participants
create policy "guidance_activity_participants_select_all"
  on public.guidance_activity_participants for select
  using (true);

create policy "guidance_activity_participants_insert_staff"
  on public.guidance_activity_participants for insert
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ));

create policy "guidance_activity_participants_update_staff"
  on public.guidance_activity_participants for update
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ))
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'rehberlik')
  ));

create policy "guidance_activity_participants_delete_admin"
  on public.guidance_activity_participants for delete
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur')
  ));

-- 19. Grant permissions
grant all on public.guidance_interviews to authenticated;
grant all on public.guidance_follow_ups to authenticated;
grant all on public.guidance_surveys to authenticated;
grant all on public.guidance_survey_questions to authenticated;
grant all on public.guidance_survey_responses to authenticated;
grant all on public.guidance_survey_answers to authenticated;
grant all on public.guidance_activities to authenticated;
grant all on public.guidance_activity_participants to authenticated;
