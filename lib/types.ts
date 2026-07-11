export type LeadStage =
  | "New Inquiry"
  | "Open Conversation"
  | "Pending"
  | "Done";
export type ReviewStatus = "draft" | "approved" | "rejected";
export type ReplyType =
  | "ask_details"
  | "quote_follow_up"
  | "stock_available"
  | "out_of_stock"
  | "payment_pickup_delivery"
  | "general_follow_up";

export type Lead = {
  id: string;
  user_id: string | null;
  name: string;
  company: string;
  stage: LeadStage;
  pain_points: string | null;
  email: string | null;
  contact_number?: string | null;
  lead_source?: string | null;
  inquiry_type?: string | null;
  next_follow_up_date?: string | null;
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
  newInquiry: number;
  openConversation: number;
  pending: number;
  done: number;
  approvedScripts: number;
};
