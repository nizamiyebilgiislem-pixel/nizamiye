-- Mesajlaşma Sistemi ve Revir Otomatik SMS
-- Messages table, SMS limits, and infirmary notification trigger

-- ============================================
-- MESSAGES TABLE
-- ============================================
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_profile_id uuid not null references profiles(id) on delete cascade,
  recipient_profile_id uuid not null references profiles(id) on delete cascade,
  subject text,
  message text not null,
  is_read boolean not null default false,
  read_at timestamptz,
  student_id uuid references students(id) on delete set null,
  sent_via text check (sent_via in ('app', 'sms')),
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists messages_sender_idx on public.messages (sender_profile_id);
create index if not exists messages_recipient_idx on public.messages (recipient_profile_id);
create index if not exists messages_created_at_idx on public.messages (created_at desc);
create index if not exists messages_student_idx on public.messages (student_id);

-- ============================================
-- MONTHLY SMS LIMITS TABLE
-- ============================================
create table if not exists monthly_sms_limits (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  year_month text not null, -- Format: 'YYYY-MM' e.g., '2026-01'
  sms_count int not null default 0,
  unique(profile_id, year_month)
);

create index if not exists monthly_sms_limits_profile_idx on public.monthly_sms_limits (profile_id);

-- ============================================
-- RLS POLICIES
-- ============================================
alter table messages enable row level security;
alter table monthly_sms_limits enable row level security;

-- Messages: Sender and recipient can access
create policy "messages_access" on messages for all
  using (
    sender_profile_id = auth.uid() 
    or recipient_profile_id = auth.uid()
  );

-- SMS Limits: Profile owner can access
create policy "sms_limits_access" on monthly_sms_limits for all
  using (profile_id = auth.uid());

-- ============================================
-- INFIRMARY AUTO-NOTIFICATION
-- ============================================
-- Function to send SMS to parent when student goes to infirmary
create or replace function notify_parent_on_infirmary()
returns trigger as $$
declare
  parent_phone text;
  student_name text;
  sms_result json;
begin
  -- Get student name
  select full_name into student_name 
  from students 
  where id = new.student_id;
  
  -- Get first parent's phone (primary contact)
  select p.phone into parent_phone
  from parent_student_links psl
  join profiles p on p.id = psl.parent_profile_id
  where psl.student_id = new.student_id
    and p.phone is not null
  limit 1;
  
  -- If parent phone exists, send SMS
  if parent_phone is not null and parent_phone != '' then
    -- Call Twilio Edge Function
    -- Note: This assumes Edge Function is deployed
    -- For now, we'll create a notification record
    -- SMS sending will be handled by the application
    
    -- Log the notification intent
    insert into notifications (profile_id, type, title, message, sent_via)
    select 
      psl.parent_profile_id,
      'sms' as type,
      'Revir Bildirimi' as title,
      'Çocuğunuz ' || student_name || ' revire gitti. Tarih: ' || new.record_date as message,
      'sms' as sent_via
    from parent_student_links psl
    where psl.student_id = new.student_id
    limit 1;
    
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new infirmary records
create trigger infirmary_notify_parent
after insert on infirmary_records
for each row execute function notify_parent_on_infirmary();

-- ============================================
-- ADD TO MODULE ASSIGNMENTS
-- ============================================
alter table module_assignments drop constraint if exists module_assignments_module_key_check;
alter table module_assignments add constraint module_assignments_module_key_check 
check (module_key in ('guidance', 'library', 'infirmary', 'live_sessions', 'messaging'));