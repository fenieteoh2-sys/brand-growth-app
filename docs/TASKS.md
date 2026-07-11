# Tasks & Sprints

## Sprint 1 — DB + Lead CRUD (demo-first)
**Goal:** App renders real data for anonymous visitors. Every lead action persists.

- [ ] Run migration SQL (leads, scripts, audit_logs + v1 RLS + seed data)
- [ ] `/leads` list page — renders seed rows, loading/empty/error states
- [ ] Lead detail page — shows all fields + linked script if exists
- [ ] 'New Lead' form — POST to Supabase, redirects to new lead detail
- [ ] Edit lead inline — PATCH persists, UI updates without full reload
- [ ] Delete lead — confirmation modal, DELETE persists, lead removed from list
- [ ] Stage badge (MQL/SQL) visible on list and detail

**Definition of Done:** `/leads` loads 4 seed rows in a browser with no login. Creating, editing, and deleting a lead all persist and survive a hard refresh. Empty state shows correct copy when all leads deleted.

---

## Sprint 2 — Core Engine: Script Generation ✦ v1 functional milestone
**Goal:** End-to-end success scenario passes on deployed URL.

- [ ] `POST /api/generate-script` server route (OpenAI call, key server-only)
- [ ] 'Generate Script' button on lead detail → calls route → stores draft scripts row
- [ ] Draft script displayed with confidence badge and review_status
- [ ] 'Approve' button → sets review_status='approved' + audit_log row
- [ ] 'Regenerate' button → new scripts row (version+1), old retained
- [ ] Low-confidence badge (< 0.75) renders warning copy
- [ ] All buttons disabled during in-flight request (loading state)
- [ ] Deploy to Vercel; confirm live URL works end-to-end

**Definition of Done:** Visitor on live URL can open a lead, generate a script, see the draft, approve it, and confirm the approved status survives a page refresh. Audit log has a row for the approval.

---

## Sprint 3 — Dashboard + MQL/SQL Tracking
**Goal:** Builder can filter, track, and copy scripts.

- [ ] Summary bar: total leads / MQL count / SQL count / approved scripts count
- [ ] MQL / SQL filter tabs on `/leads`
- [ ] Stage-change button (MQL ↔ SQL) on detail — persists + audit log
- [ ] Copy-to-clipboard on approved script text
- [ ] Sort: SQL leads first, approved scripts first
- [ ] Responsive layout — readable on mobile

**Definition of Done:** Filter tabs return correct subsets. Stage change persists and summary bar updates. Copy button copies script text to clipboard.

---

## Sprint 4 — Lock it Down
**Goal:** Per-user data isolation before any real leads go in.

- [ ] Supabase Auth (email/password) — signup + login pages
- [ ] Set `user_id = auth.uid()` on all inserts
- [ ] Replace v1 open RLS policies with `auth.uid() = user_id` owner policies
- [ ] Protect all API routes — reject unauthenticated requests
- [ ] Confirm no cross-user row leakage (test with two accounts)
- [ ] No secrets in client bundle (audit Network tab)

**Definition of Done:** User A cannot read or write User B's leads or scripts. API routes return 401 without a valid session. Secrets absent from browser Network responses.

---

## Sprint 5 — Case Study Export
**Goal:** Shareable proof for employers.

- [ ] `/case-study` public page — lead count, scripts generated, MQL→SQL conversions
- [ ] Auto-generated summary paragraph using stored stats
- [ ] Link from homepage / README

**Definition of Done:** `/case-study` renders correct stats without login and is shareable as a URL.

---

## Gantt (sprint → feature)
```
Sprint 1 │ DB setup · leads CRUD · seed data · list + detail pages
Sprint 2 │ Script generation API · approve/regenerate · Vercel deploy  ← v1 functional
Sprint 3 │ Summary bar · MQL/SQL filters · stage change · copy button
Sprint 4 │ Auth · owner RLS · API auth guards
Sprint 5 │ Case study page · portfolio link
```
