import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { jsonError, requiredString } from "@/lib/api";
import {
  extractContactNumber,
  extractInquiryType,
  extractLeadSource,
} from "@/lib/lead-contact";
import type { Lead, ReplyType, Script } from "@/lib/types";
import { REPLY_TYPES, normalizeStage, replyTypeLabel } from "@/lib/workflow";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return jsonError("Supabase is not configured.", 503);

  try {
    const body = await request.json();
    const leadId = requiredString(body.lead_id, "Lead ID");
    const replyType = normalizeReplyType(body.reply_type);
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

    const generation = await generateDraft(lead as Lead, replyType);
    const nextVersion = Number(latest?.version ?? 0) + 1;

    const { data: script, error: insertError } = await supabase
      .from("scripts")
      .insert({
        lead_id: leadId,
        value: generation.value,
        source: `hardware-reply:${replyType}`,
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

async function generateDraft(
  lead: Lead,
  replyType: ReplyType,
): Promise<{
  value: string;
  source: string;
  confidence: number;
}> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackDraft(lead, replyType);
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
            "You write concise WhatsApp-style customer replies for Heng Wei Hardware, a Malaysian hardware retail shop selling hand tools, power tools, workshop tools, plumbing accessories, sanitary ware, toilet fittings, sinks, and renovation supplies. Do not mention SaaS, pipeline, demos, revenue impact, qualified opportunities, or 15-minute calls. Write friendly, practical, shop-ready replies. Return strict JSON with value and confidence from 0 to 1.",
        },
        {
          role: "user",
          content: JSON.stringify({
            reply_type: replyTypeLabel(replyType),
            name: lead.name,
            company: lead.company,
            stage: normalizeStage(lead.stage),
            customer_request: lead.pain_points,
            contact_number: extractContactNumber(lead.notes),
            lead_source: extractLeadSource(lead.notes),
            inquiry_type: extractInquiryType(lead.notes),
            notes: lead.notes,
            channel: "WhatsApp or direct customer follow-up",
            instructions:
              "Keep it short. Ask only the next useful question or give the next useful reply. If asking details, request size, quantity, model, photo, budget, installation/delivery needs when relevant. If quote follow-up, politely ask if they want to proceed or need changes. If stock available, tell them stock/options can be checked and ask pickup/delivery preference. If out of stock, offer alternative size/brand/spec. If payment/pickup/delivery, ask for confirmation and provide clear next step.",
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
        : fallbackDraft(lead, replyType).value,
    source: process.env.OPENAI_MODEL ?? "gpt-4o",
    confidence:
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.82,
  };
}

function fallbackDraft(lead: Lead, replyType: ReplyType) {
  const request =
    lead.pain_points || "hardware, plumbing, tools, or sanitary ware inquiry";
  const name = lead.name || "there";
  const base = `Hi ${name}, thanks for your inquiry. I understand you are looking for ${request}.`;
  const messages: Record<ReplyType, string> = {
    ask_details: `${base} Can you share the quantity, size/spec, preferred brand or a photo of the area/item? Then I can recommend suitable Heng Wei Hardware options for you.`,
    quote_follow_up: `${base} Just following up on this request. Would you like us to prepare or adjust the quotation? If yes, please confirm the quantity/spec and whether you prefer pickup or delivery.`,
    stock_available: `${base} We can help check suitable stock/options for this item. Please confirm the quantity and exact size/model needed, then we can advise availability and next step for pickup or delivery.`,
    out_of_stock: `${base} If the exact item is not available, we can suggest a close alternative by size, brand or function. Can you send a photo/spec so we recommend the nearest suitable option?`,
    payment_pickup_delivery: `${base} If you would like to proceed, please confirm the final quantity and pickup/delivery preference. We can then arrange payment details and prepare the items accordingly.`,
    general_follow_up: `${base} Do you still need help with this? If yes, send us the size/spec, quantity or a photo, and we will suggest suitable products from our hardware, plumbing and sanitary ware range.`,
  };

  return {
    value: messages[replyType],
    source: "rule-based-fallback",
    confidence: 0.84,
  };
}

function normalizeReplyType(value: unknown): ReplyType {
  return REPLY_TYPES.some((type) => type.value === value)
    ? (value as ReplyType)
    : "ask_details";
}
