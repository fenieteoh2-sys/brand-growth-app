import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { jsonError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Params) {
  if (!hasSupabaseEnv()) return jsonError("Supabase is not configured.", 503);
  const { user, response } = await requireApiUser();
  if (response) return response;

  const { id } = await params;
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("scripts")
    .select("*")
    .eq("id", id)
    .single();

  const { data: script, error } = await supabase
    .from("scripts")
    .update({ review_status: "approved" })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return jsonError(error.message, 500);

  const audit = await supabase.from("audit_logs").insert({
    table_name: "scripts",
    user_id: user.id,
    row_id: id,
    action: "approve_script",
    payload: { before, after: script },
  });

  if (audit.error) {
    await supabase
      .from("scripts")
      .update({ review_status: before?.review_status ?? "draft" })
      .eq("id", id);
    return jsonError(audit.error.message, 500);
  }

  return NextResponse.json({ script });
}
