import { requirePageUser } from "@/lib/auth";
import { getLeads, getSummary } from "@/lib/data";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { LeadBoard } from "./LeadBoard";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const user = await requirePageUser();
  const leads = await getLeads();

  return (
    <LeadBoard
      envReady={hasSupabaseEnv()}
      initialLeads={leads}
      initialSummary={getSummary(leads)}
      userEmail={user.email ?? "Logged in"}
    />
  );
}
