# PRD — Brand Growth App

## Problem
Builders applying for product/engineering roles need proof they can ship. A live, working app that generates AI sales scripts and tracks MQL/SQL leads is a concrete portfolio artefact — better than a slide deck.

## Target User
The builder (owner). One person. No multi-tenant SaaS.

## Core Objects
- **Lead** — a prospect with a stage (MQL or SQL), pain points, and contact info.
- **Script** — an AI-drafted sales script tied to a lead; editable and approvable.
- **Audit Log** — a record of every meaningful action (approve, regenerate, stage change).

## MVP Must-Haves
- [ ] Add a lead (name, company, stage, pain points)
- [ ] Generate an AI sales script for that lead (server-side, key never in client)
- [ ] View, edit, and approve the draft script
- [ ] Mark a lead MQL or SQL; see counts on a summary bar
- [ ] App renders with seed data for anonymous visitors (no login wall)
- [ ] Every button and form persists to the database; UI reflects changes on reload

## Non-Goals (v1)
- No CRM integration
- No email send feature
- No multi-user / team access
- No login/auth (added in lock-down sprint after core works)

## Success Criteria
> A visitor opens the live URL, sees 4 real-looking leads with MQL/SQL badges, clicks one, reads the approved script, fills in the 'New Lead' form, hits 'Generate Script', and sees a draft script appear — all persisted in the database and visible after a page refresh.

**Definition of Done:** The above scenario passes manually on the deployed Vercel URL. No dead buttons. No seed-data-only screens. Empty, loading, and error states all render correct copy.
