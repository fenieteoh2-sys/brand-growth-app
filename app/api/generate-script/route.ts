import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { jsonError, requiredString } from "@/lib/api";
import type { Lead, Script } from "@/lib/types";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return jsonError("Supabase is not configured.", 503);

  try {
    const body = await request.json();
    const leadId = requiredString(body.lead_id, "Lead ID");
    const supabase = await createClient();

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) return jsonError("Lead not found.", 404);

    const { data: latest } = await supabase
      .from("scripts")
      .select("version")
      .eq("lead_id", leadId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const generation = await generateDraft(lead as Lead);
    const nextVersion = Number(latest?.version ?? 0) + 1;

    const { data: script, error: insertError } = await supabase
      .from("scripts")
      .insert({
        lead_id: leadId,
        value: generation.value,
        source: generation.source,
        confidence: generation.confidence,
        review_status: "draft",
        version: nextVersion,
      })
      .select("*")
      .single();

    if (insertError) return jsonError(insertError.message, 500);

    const audit = await supabase.from("audit_logs").insert({
      table_name: "scripts",
      row_id: script.id,
      action: nextVersion === 1 ? "generate_script" : "regenerate_script",
      payload: { lead_id: leadId, after: script },
    });

    if (audit.error) {
      await supabase.from("scripts").delete().eq("id", script.id);
      return jsonError(audit.error.message, 500);
    }

    return NextResponse.json({ script });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Script generation failed. Try again.",
    );
  }
}

async function generateDraft(lead: Lead): Promise<{
  value: string;
  source: string;
  confidence: number;
}> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackDraft(lead);
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You draft concise outbound sales scripts. Return strict JSON with value and confidence from 0 to 1.",
        },
        {
          role: "user",
          content: JSON.stringify({
            name: lead.name,
            company: lead.company,
            stage: lead.stage,
            pain_points: lead.pain_points,
            notes: lead.notes,
          }),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    throw new Error("Script generation failed. Try again.");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  const parsed = JSON.parse(content ?? "{}") as Partial<Script>;

  return {
    value:
      typeof parsed.value === "string" && parsed.value.trim()
        ? parsed.value.trim()
        : fallbackDraft(lead).value,
    source: process.env.OPENAI_MODEL ?? "gpt-4o",
    confidence:
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.82,
  };
}

function fallbackDraft(lead: Lead) {
  const pain = lead.pain_points || "turning interested prospects into qualified pipeline";
  return {
    value: `Hi ${lead.name} - I noticed ${lead.company} is dealing with ${pain}. Teams at the ${lead.stage} stage usually need a clear next step that connects the pain to measurable revenue impact. Worth a 15-minute conversation this week to map the fastest path from interest to a qualified opportunity?`,
    source: "rule-based-fallback",
    confidence: 0.76,
  };
}
