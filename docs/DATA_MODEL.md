# Data Model

## leads
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| user_id | uuid nullable | owner-scoping at lock-down |
| name | text | required |
| company | text | required |
| stage | text | 'MQL' or 'SQL', default 'MQL' |
| pain_points | text | free text from intake form |
| email | text | optional |
| notes | text | optional |
| created_at | timestamptz | default now() |

## scripts
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid nullable | |
| lead_id | uuid FK → leads | cascade delete |
| value | text | **AI field** — the script body |
| source | text | e.g. 'openai-gpt4o' |
| confidence | numeric | 0–1 score from model or heuristic |
| review_status | text | 'draft' / 'approved' / 'rejected' |
| version | integer | increments on regenerate |
| created_at | timestamptz | |

## audit_logs
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid nullable | |
| table_name | text | e.g. 'scripts' |
| row_id | uuid | the affected row |
| action | text | e.g. 'approve_script', 'stage_change' |
| payload | jsonb | before/after snapshot |
| created_at | timestamptz | |

## RLS
- v1: permissive open policies on all tables (demo works without login)
- Lock-down sprint: replace with `auth.uid() = user_id` owner policies
