import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import type { Lead, LeadSummary, LeadWithScripts, Script } from "@/lib/types";
import { sortScripts } from "@/lib/sort";

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

  return (data ?? []).map((lead) => ({
    ...(lead as Lead),
    scripts: sortScripts((lead.scripts ?? []) as Script[]),
  }));
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
    scripts: sortScripts((data.scripts ?? []) as Script[]),
  };
}

export function getSummary(leads: LeadWithScripts[]): LeadSummary {
  return leads.reduce(
    (summary, lead) => {
      summary.total += 1;
      summary[lead.stage.toLowerCase() as "mql" | "sql"] += 1;
      summary.approvedScripts += lead.scripts.some(
        (script) => script.review_status === "approved",
      )
        ? 1
        : 0;
      return summary;
    },
    { total: 0, mql: 0, sql: 0, approvedScripts: 0 },
  );
}
