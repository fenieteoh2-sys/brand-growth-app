# Architecture

## Stack
- **Frontend:** Next.js 14 (App Router) — React server + client components
- **Database:** Supabase (Postgres + RLS)
- **AI:** OpenAI GPT-4o via Next.js API route (secret server-side only)
- **Hosting:** Vercel

## Now vs Later
| Now (v1) | Later |
|---|---|
| Leads CRUD + script generation | Auth + per-user RLS |
| MQL/SQL filter + summary bar | Script version history |
| Demo seed data, open read/write | Email send (human-approval) |
| Deployed live URL | Case-study export page |

## Key Action Flow: Generate a Sales Script
1. **Capture** — user submits New Lead form (name, company, stage, pain points)
2. **Store** — `leads` row created in Supabase
3. **Generate** — client calls `POST /api/generate-script` with lead ID
4. **AI runs server-side** — route fetches lead, builds prompt, calls OpenAI
5. **Store result** — `scripts` row saved: value + source + confidence + review_status='draft'
6. **Show** — lead detail page renders the draft script
7. **Approve/Regenerate** — user action updates review_status or creates new version; audit_log row written
8. **Survives refresh** — all state is in Postgres, not localStorage

## Layer Order
1. **Database** — tables, constraints, RLS policies (truth lives here)
2. **App logic** — Next.js routes and server actions for CRUD
3. **AI on top** — script generation enhances the core; disabling it leaves leads fully usable
