# Test Plan

## V1 Success Scenario (manual, on deployed Vercel URL)
1. Open live URL without logging in → `/leads` renders 4 seed leads with MQL/SQL badges
2. Click lead 'Sarah Chen' → detail page shows her pain points and an approved script
3. Click 'New Lead' → fill name='Test Co', company='Acme', stage='MQL', pain_points='No pipeline visibility' → submit
4. Redirected to new lead detail — fields match what was entered
5. Click 'Generate Script' → button shows loading state → draft script appears with confidence badge
6. Hard-refresh page → draft script still present (DB-persisted, not memory-only)
7. Click 'Approve' → review_status badge changes to 'Approved'; button replaced by 'Regenerate'
8. Hard-refresh → status still 'Approved'
9. Click 'Regenerate' → new draft appears; previous version retained (version number increments)
10. Return to `/leads` → new lead appears in list; MQL count incremented in summary bar

## Empty State
- Delete all leads → list page shows: *"No leads yet. Add your first lead above."*
- Open a lead with no script → detail shows: *"No script yet. Click Generate Script to create one."*

## Error States
- Submit New Lead form with blank name → inline validation error, no DB write
- Simulate OpenAI failure (disable key) → error toast: *"Script generation failed. Try again."* — no broken script row saved
- Navigate to `/leads/non-existent-id` → 404 page with 'Back to leads' link

## Loading States
- 'Generate Script' button disabled + spinner while API request in flight
- List page shows skeleton rows while Supabase query resolves

## Regression (after Sprint 4 lock-down)
- Log in as User A, create a lead → log in as User B → User B's `/leads` returns zero rows
- Unauthenticated `POST /api/generate-script` returns 401
