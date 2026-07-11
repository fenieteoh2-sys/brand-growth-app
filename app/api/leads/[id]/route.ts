import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { jsonError, requiredString } from "@/lib/api";
import { combineNotesWithContact } from "@/lib/lead-contact";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  if (!hasSupabaseEnv()) return jsonError("Supabase is not configured.", 503);

  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    const { data: before } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    const patch = {
      name: body.name === undefined ? undefined : requiredString(body.name, "Name"),
      company:
        body.company === undefined
          ? undefined
          : body.company?.trim() || "Personal inquiry",
      stage: body.stage === "SQL" ? "SQL" : body.stage === "MQL" ? "MQL" : undefined,
      pain_points:
        body.pain_points === undefined
          ? undefined
          : requiredString(body.pain_points, "Pain points"),
      email: body.email === undefined ? undefined : body.email?.trim() || null,
      notes:
        body.notes === undefined && body.contact_number === undefined
          ? undefined
          : combineNotesWithContact(
              body.notes?.trim() ?? before?.notes ?? "",
              body.contact_number?.trim() ?? "",
            ),
    };

    const { data: lead, error } = await supabase
      .from("leads")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return jsonError(error.message, 500);

    await supabase.from("audit_logs").insert({
      table_name: "leads",
      row_id: id,
      action: before?.stage !== lead.stage ? "stage_change" : "update_lead",
      payload: { before, after: lead },
    });

    return NextResponse.json({ lead });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid request.");
  }
}

export async function DELETE(_: Request, { params }: Params) {
  if (!hasSupabaseEnv()) return jsonError("Supabase is not configured.", 503);

  const { id } = await params;
  const supabase = await createClient();
  const { data: before } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  const audit = await supabase.from("audit_logs").insert({
    table_name: "leads",
    row_id: id,
    action: "delete_lead",
    payload: { before },
  });

  if (audit.error) return jsonError(audit.error.message, 500);

  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ ok: true });
}
