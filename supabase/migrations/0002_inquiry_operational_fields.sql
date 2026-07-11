alter table leads add column if not exists contact_number text;
alter table leads add column if not exists lead_source text;
alter table leads add column if not exists inquiry_type text;
alter table leads add column if not exists next_follow_up_date date;

create index if not exists leads_stage_idx on leads(stage);
create index if not exists leads_lead_source_idx on leads(lead_source);
create index if not exists leads_inquiry_type_idx on leads(inquiry_type);
create index if not exists leads_next_follow_up_date_idx on leads(next_follow_up_date);
