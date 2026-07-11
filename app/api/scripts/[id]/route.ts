import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { jsonError, requiredString } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  if (!hasSupabaseEnv()) return jsonError("Supabase is not configured.", 503);

  try {
    const { id } = await params;
    const body = await request.json();
    const value = requiredString(body.value, "Script");
    const supabase = await createClient();

    const { data: before } = await supabase
      .from("scripts")
      .select("*")
      .eq("id", id)
      .single();

    const { data: script, error } = await supabase
      .from("scripts")
      .update({ value })
      .eq("id", id)
      .select("*")
      .single();

    if (error) return jsonError(error.message, 500);

    const audit = await supabase.from("audit_logs").insert({
      table_name: "scripts",
      row_id: id,
      action: "edit_script",
      payload: { before, after: script },
    });

    if (audit.error) return jsonError(audit.error.message, 500);

    return NextResponse.json({ script });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid request.");
  }
}
