# Agentic Layer

## Risk Levels & Actions

### Low — auto-execute (no approval needed)
- `generate_script_draft` — call OpenAI, store draft with review_status='draft'
- `tag_lead_pain_points` — extract structured tags from free text
- `score_script_confidence` — assign confidence numeric to a script row

### Medium — light approval (builder confirms before persist)
- `approve_script` — set review_status='approved'; shown as button in UI
- `change_lead_stage` — MQL ↔ SQL; one-click but logged
- `regenerate_script` — create new version; old version retained

### High — always requires explicit approval
- `send_script_by_email` — not v1; requires human confirmation modal + audit entry

### Critical — human-only, no agent execution
- `delete_lead` — permanent; builder must confirm; logged
- `bulk_delete` — not v1

## Named Tools (v1)
- `generate_script_draft(lead_id)` → calls `/api/generate-script`
- `update_review_status(script_id, status)` → Supabase update
- `log_action(table, row_id, action, payload)` → insert audit_logs

## Audit Log Fields
`table_name | row_id | action | payload (before/after) | user_id | created_at`

## v1 vs Later
| v1 | Later |
|---|---|
| generate + approve in UI | Scheduled nightly script suggestions |
| Manual email copy | Automated email send (high-risk, approval gate) |
