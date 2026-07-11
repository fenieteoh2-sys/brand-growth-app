import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import type { Lead, LeadSummary, LeadWithScripts, Script } from "@/lib/types";
import { sortScripts } from "@/lib/sort";
import { normalizeStage } from "@/lib/workflow";

export async function getLeads(): Promise<LeadWithScripts[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*, scripts(*)")
    .order("stage", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((lead) => normalizeLead(lead, lead.scripts ?? []));
}

export async function getLead(id: string): Promise<LeadWithScripts> {
  if (!hasSupabaseEnv()) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*, scripts(*)")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  return {
    ...(data as Lead),
    stage: normalizeStage(data.stage),
    scripts: sortScripts((data.scripts ?? []) as Script[]),
  };
}

export function getSummary(leads: LeadWithScripts[]): LeadSummary {
  return leads.reduce(
    (summary, lead) => {
      summary.total += 1;
      const stage = normalizeStage(lead.stage);
      if (stage === "New Inquiry") summary.newInquiry += 1;
      if (stage === "Open Conversation") summary.openConversation += 1;
      if (stage === "Pending") summary.pending += 1;
      if (stage === "Done") summary.done += 1;
      summary.approvedScripts += lead.scripts.some(
        (script) => script.review_status === "approved",
      )
        ? 1
        : 0;
      return summary;
    },
    {
      total: 0,
      newInquiry: 0,
      openConversation: 0,
      pending: 0,
      done: 0,
      approvedScripts: 0,
    },
  );
}

function normalizeLead(lead: Record<string, unknown>, scripts: unknown[]): LeadWithScripts {
  return {
    ...(lead as Lead),
    stage: normalizeStage(lead.stage),
    scripts: sortScripts(scripts as Script[]),
  };
}
