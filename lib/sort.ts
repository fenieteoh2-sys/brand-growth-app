import type { LeadWithScripts, Script } from "@/lib/types";

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
    if (a.stage !== b.stage) return a.stage === "SQL" ? -1 : 1;
    const aApproved = a.scripts.some((script) => script.review_status === "approved");
    const bApproved = b.scripts.some((script) => script.review_status === "approved");
    if (aApproved !== bApproved) return aApproved ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
