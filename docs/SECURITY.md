# Security

## Secret Handling
- `OPENAI_API_KEY` lives in Vercel environment variables only — never referenced in any client component or exposed via a public API route response
- Supabase `service_role` key never sent to the browser; only `anon` key used client-side
- All AI calls go through `POST /api/generate-script` (Next.js server route)

## Permission Model
- **v1 (demo):** open RLS policies — any visitor can read and write (safe for a personal portfolio with no sensitive data)
- **Lock-down sprint:** replace all `using (true)` policies with `auth.uid() = user_id`; API routes validate session before any write
- Agent actions inherit the session's permission level — no elevated service-role calls from client-triggered routes

## Approved Tools Rule
- Only named, scoped server functions may be called by the agent (`generate_script_draft`, `update_review_status`, `log_action`)
- No `run_any` / `eval` / raw SQL from user input
- No tool may delete data without an explicit human confirmation step in the UI

## Audit Principle
- Every approve, reject, regenerate, and stage-change writes a row to `audit_logs` before returning a success response
- If the audit write fails, the primary action is rolled back
- Logs are append-only; no update or delete route exists for `audit_logs`
