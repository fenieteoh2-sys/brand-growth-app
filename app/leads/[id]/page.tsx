import { getLead } from "@/lib/data";
import { LeadDetail } from "./LeadDetail";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLead(id);

  return <LeadDetail initialLead={lead} />;
}
