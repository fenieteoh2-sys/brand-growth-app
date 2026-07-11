create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  company text not null,
  stage text not null default 'MQL',
  pain_points text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

alter table leads enable row level security;
drop policy if exists "leads_v1_read" on leads;
create policy "leads_v1_read" on leads for select using (true);
drop policy if exists "leads_v1_write" on leads;
create policy "leads_v1_write" on leads for all using (true) with check (true);

create table if not exists scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  lead_id uuid references leads(id) on delete cascade,
  value text not null,
  source text not null default 'openai-gpt4o',
  confidence numeric,
  review_status text not null default 'draft',
  version integer not null default 1,
  created_at timestamptz not null default now()
);

alter table scripts enable row level security;
drop policy if exists "scripts_v1_read" on scripts;
create policy "scripts_v1_read" on scripts for select using (true);
drop policy if exists "scripts_v1_write" on scripts;
create policy "scripts_v1_write" on scripts for all using (true) with check (true);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  table_name text not null,
  row_id uuid not null,
  action text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table audit_logs enable row level security;
drop policy if exists "audit_logs_v1_read" on audit_logs;
create policy "audit_logs_v1_read" on audit_logs for select using (true);
drop policy if exists "audit_logs_v1_write" on audit_logs;
create policy "audit_logs_v1_write" on audit_logs for all using (true) with check (true);

insert into leads (id, name, company, stage, pain_points, email, notes) values
  ('a1000000-0000-0000-0000-000000000001', 'Sarah Chen', 'Northlight SaaS', 'SQL', 'Long sales cycles, reps improvise pitches, no consistent messaging', 'sarah@northlightsaas.com', 'Demo booked for next Tuesday'),
  ('a1000000-0000-0000-0000-000000000002', 'Marcus Webb', 'Driftwood Logistics', 'MQL', 'Downloaded pricing guide, hasn''t replied to follow-up', 'mwebb@driftwoodlog.com', 'Came in via LinkedIn ad'),
  ('a1000000-0000-0000-0000-000000000003', 'Priya Nair', 'Solvent Analytics', 'SQL', 'Team of 12 SDRs, inconsistent close rates, needs script standardisation', 'priya.n@solventanalytics.io', 'Referred by Sarah Chen'),
  ('a1000000-0000-0000-0000-000000000004', 'Tom Adeyemi', 'Greenvine Media', 'MQL', 'Attended webinar, asked one question in chat', 'tadeyemi@greenvinemedia.com', 'Low engagement so far — needs nurture angle');

insert into scripts (lead_id, value, source, confidence, review_status, version) values
  ('a1000000-0000-0000-0000-000000000001', 'Hi Sarah — most SaaS sales teams lose 30% of pipeline to inconsistent pitches. I''d love to show you how a structured script cut our clients'' sales cycles by 2 weeks on average. Worth a 15-min call this week?', 'openai-gpt4o', 0.91, 'approved', 1),
  ('a1000000-0000-0000-0000-000000000002', 'Hey Marcus — saw you grabbed our pricing guide. Logistics teams usually have one big pain: quoting speed. Is that on your radar right now? Happy to share how others in your space solved it fast.', 'openai-gpt4o', 0.85, 'approved', 1),
  ('a1000000-0000-0000-0000-000000000003', 'Priya — 12 SDRs and varying close rates usually points to one thing: the pitch diverges by rep. A single approved script framework has lifted team close rates 18% for teams your size. Want to see the template?', 'openai-gpt4o', 0.93, 'approved', 1),
  ('a1000000-0000-0000-0000-000000000004', 'Tom — your webinar question about attribution was sharp. Most media teams are flying blind on which content actually moves buyers. I can send a 2-minute breakdown of how we''d map that for Greenvine. Interested?', 'openai-gpt4o', 0.78, 'draft', 1);