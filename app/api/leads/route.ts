import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { jsonError, requiredString } from "@/lib/api";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return jsonError("Supabase is not configured.", 503);

  try {
    const body = await request.json();
    const name = requiredString(body.name, "Name");
    const company = requiredString(body.company, "Company");
    const stage = body.stage === "SQL" ? "SQL" : "MQL";
    const pain_points = requiredString(body.pain_points, "Pain points");

    const supabase = await createClient();
    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        name,
        company,
        stage,
        pain_points,
        email: body.email?.trim() || null,
        notes: body.notes?.trim() || null,
      })
      .select("*")
      .single();

    if (error) return jsonError(error.message, 500);

    await supabase.from("audit_logs").insert({
      table_name: "leads",
      row_id: lead.id,
      action: "create_lead",
      payload: { after: lead },
    });

    return NextResponse.json({ lead });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid request.");
  }
}
