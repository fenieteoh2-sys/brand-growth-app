drop policy if exists "leads_v1_read" on leads;
drop policy if exists "leads_v1_write" on leads;
drop policy if exists "leads_authenticated_read" on leads;
drop policy if exists "leads_authenticated_write" on leads;
create policy "leads_authenticated_read" on leads
  for select to authenticated using (true);
create policy "leads_authenticated_write" on leads
  for all to authenticated using (true) with check (true);

drop policy if exists "scripts_v1_read" on scripts;
drop policy if exists "scripts_v1_write" on scripts;
drop policy if exists "scripts_authenticated_read" on scripts;
drop policy if exists "scripts_authenticated_write" on scripts;
create policy "scripts_authenticated_read" on scripts
  for select to authenticated using (true);
create policy "scripts_authenticated_write" on scripts
  for all to authenticated using (true) with check (true);

drop policy if exists "audit_logs_v1_read" on audit_logs;
drop policy if exists "audit_logs_v1_write" on audit_logs;
drop policy if exists "audit_logs_authenticated_read" on audit_logs;
drop policy if exists "audit_logs_authenticated_write" on audit_logs;
create policy "audit_logs_authenticated_read" on audit_logs
  for select to authenticated using (true);
create policy "audit_logs_authenticated_write" on audit_logs
  for all to authenticated using (true) with check (true);
