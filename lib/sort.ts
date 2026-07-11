import type { LeadWithScripts, Script } from "@/lib/types";
import { LEAD_STAGES, normalizeStage } from "@/lib/workflow";

export function sortScripts(scripts: Script[]) {
  const statusRank = { approved: 0, draft: 1, rejected: 2 };
  return [...scripts].sort((a, b) => {
    const statusDelta = statusRank[a.review_status] - statusRank[b.review_status];
    if (statusDelta !== 0) return statusDelta;
    return b.version - a.version;
  });
}

export function sortLeads(leads: LeadWithScripts[]) {
  return [...leads].sort((a, b) => {
    const stageDelta =
      LEAD_STAGES.indexOf(normalizeStage(a.stage)) -
      LEAD_STAGES.indexOf(normalizeStage(b.stage));
    if (stageDelta !== 0) return stageDelta;
    const aApproved = a.scripts.some((script) => script.review_status === "approved");
    const bApproved = b.scripts.some((script) => script.review_status === "approved");
    if (aApproved !== bApproved) return aApproved ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
