import type { LeadStage, ReplyType } from "@/lib/types";

export const LEAD_STAGES: LeadStage[] = [
  "New Inquiry",
  "Open Conversation",
  "Pending",
  "Done",
];

export const LEAD_SOURCES = [
  "EXISTING CUSTOMER",
  "FACEBOOK",
  "INSTAGRAM",
  "PHONE CALL",
  "REFERRAL",
  "LOYALTY MEMBER",
  "TELEGRAM",
  "TIKTOK",
  "WALK-IN",
  "WEBSITE",
  "WHATSAPP",
  "XHS",
];

export const INQUIRY_TYPES = [
  "AGRICULTURE",
  "BEARING",
  "DOOR/LOCK",
  "ELECTRICAL",
  "FASTENER",
  "GARDEN",
  "HARDWARE",
  "HOIST",
  "HOME",
  "NETTING",
  "PAINT",
  "PANEL",
  "PLUMBING",
  "PNEUMATIC",
  "POWER",
  "SAFETY",
  "SANITARY WARE",
  "SEALANT",
  "SHOE",
  "TAPE",
  "VEHICLE",
  "WELDING",
  "WHEEL",
];

export const REPLY_TYPES: { value: ReplyType; label: string }[] = [
  { value: "ask_details", label: "Ask for more details" },
  { value: "quote_follow_up", label: "Quote follow-up" },
  { value: "stock_available", label: "Stock available reply" },
  { value: "out_of_stock", label: "Out-of-stock alternative" },
  { value: "payment_pickup_delivery", label: "Payment / pickup / delivery" },
  { value: "general_follow_up", label: "General follow-up" },
];

export function normalizeStage(value: unknown): LeadStage {
  if (value === "SQL") return "Open Conversation";
  if (value === "MQL") return "New Inquiry";
  return LEAD_STAGES.includes(value as LeadStage)
    ? (value as LeadStage)
    : "New Inquiry";
}

export function nextStage(stage: LeadStage): LeadStage {
  const index = LEAD_STAGES.indexOf(normalizeStage(stage));
  return LEAD_STAGES[Math.min(index + 1, LEAD_STAGES.length - 1)];
}

export function previousStage(stage: LeadStage): LeadStage {
  const index = LEAD_STAGES.indexOf(normalizeStage(stage));
  return LEAD_STAGES[Math.max(index - 1, 0)];
}

export function replyTypeLabel(replyType: ReplyType) {
  return REPLY_TYPES.find((type) => type.value === replyType)?.label ?? "Reply";
}

export function parseReplyType(source: string): ReplyType | null {
  if (!source.startsWith("hardware-reply:")) return null;
  const value = source.replace("hardware-reply:", "");
  return REPLY_TYPES.some((type) => type.value === value)
    ? (value as ReplyType)
    : null;
}

export type FollowUpFilter = "All" | "Overdue" | "Today" | "Upcoming" | "No date";

export function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getFollowUpStatus(date: string | null | undefined) {
  if (!date) return "No date";
  const today = getTodayKey();
  if (date < today) return "Overdue";
  if (date === today) return "Today";
  return "Upcoming";
}
