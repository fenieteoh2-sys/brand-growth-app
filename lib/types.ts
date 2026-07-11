export type LeadStage = "MQL" | "SQL";
export type ReviewStatus = "draft" | "approved" | "rejected";

export type Lead = {
  id: string;
  user_id: string | null;
  name: string;
  company: string;
  stage: LeadStage;
  pain_points: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
};

export type Script = {
  id: string;
  user_id: string | null;
  lead_id: string;
  value: string;
  source: string;
  confidence: number | null;
  review_status: ReviewStatus;
  version: number;
  created_at: string;
};

export type LeadWithScripts = Lead & {
  scripts: Script[];
};

export type LeadSummary = {
  total: number;
  mql: number;
  sql: number;
  approvedScripts: number;
};
