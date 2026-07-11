import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { jsonError, requiredString } from "@/lib/api";
import { combineNotesWithMeta } from "@/lib/lead-contact";
import { normalizeStage } from "@/lib/workflow";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return jsonError("Supabase is not configured.", 503);
  const { user, response } = await requireApiUser();
  if (response) return response;

  try {
    const body = await request.json();
    const name = requiredString(body.name, "Name");
    const company = body.company?.trim() || "Personal inquiry";
    const requestedStage = normalizeStage(body.stage);
    const stage =
      body.next_follow_up_date?.trim() && requestedStage !== "Done"
        ? "Pending"
        : requestedStage;
    const pain_points = requiredString(body.pain_points, "Pain points");

    const supabase = await createClient();
    const insert = supabase
      .from("leads")
      .insert({
        name,
        user_id: user.id,
        company,
        stage,
        pain_points,
        email: body.email?.trim() || null,
        contact_number: body.contact_number?.trim() || null,
        lead_source: body.lead_source?.trim() || null,
        inquiry_type: body.inquiry_type?.trim() || null,
        next_follow_up_date: body.next_follow_up_date?.trim() || null,
        notes: combineNotesWithMeta({
          notes: body.notes?.trim() ?? "",
          contactNumber: body.contact_number?.trim() ?? "",
          leadSource: body.lead_source?.trim() ?? "",
          inquiryType: body.inquiry_type?.trim() ?? "",
          nextFollowUpDate: body.next_follow_up_date?.trim() ?? "",
        }),
      });

    let { data: lead, error } = await insert.select("*").single();

    if (isMissingColumnError(error)) {
      const fallback = await supabase
        .from("leads")
        .insert({
          name,
          user_id: user.id,
          company,
          stage,
          pain_points,
          email: body.email?.trim() || null,
          notes: combineNotesWithMeta({
            notes: body.notes?.trim() ?? "",
            contactNumber: body.contact_number?.trim() ?? "",
            leadSource: body.lead_source?.trim() ?? "",
            inquiryType: body.inquiry_type?.trim() ?? "",
            nextFollowUpDate: body.next_follow_up_date?.trim() ?? "",
          }),
        })
        .select("*")
        .single();
      lead = fallback.data;
      error = fallback.error;
    }

    if (error || !lead) return jsonError(error?.message ?? "Inquiry not created.", 500);
    await supabase.from("audit_logs").insert({
      table_name: "leads",
      user_id: user.id,
      row_id: lead.id,
      action: "create_lead",
      payload: { after: lead },
    });

    return NextResponse.json({ lead });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid request.");
  }
}

function isMissingColumnError(error: { message?: string; code?: string } | null) {
  return Boolean(
    error &&
      (error.code === "PGRST204" ||
        error.message?.toLowerCase().includes("column") ||
        error.message?.toLowerCase().includes("schema cache")),
  );
}
