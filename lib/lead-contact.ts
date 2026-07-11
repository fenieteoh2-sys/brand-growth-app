import type { Lead } from "@/lib/types";

const CONTACT_PREFIX = "Contact number:";
const SOURCE_PREFIX = "Lead source:";
const INQUIRY_TYPE_PREFIX = "Inquiry type:";
const FOLLOW_UP_PREFIX = "Next follow-up:";

export function combineNotesWithMeta({
  notes,
  contactNumber,
  leadSource,
  inquiryType,
  nextFollowUpDate,
}: {
  notes: string;
  contactNumber: string;
  leadSource: string;
  inquiryType: string;
  nextFollowUpDate: string;
}) {
  const cleanNotes = stripLeadMetaFromNotes(notes);
  const cleanContact = contactNumber.trim();
  const cleanSource = leadSource.trim();
  const cleanInquiryType = inquiryType.trim();
  const cleanFollowUp = nextFollowUpDate.trim();
  const parts = [];

  if (cleanContact) parts.push(CONTACT_PREFIX, cleanContact);
  if (cleanSource) parts.push(SOURCE_PREFIX, cleanSource);
  if (cleanInquiryType) parts.push(INQUIRY_TYPE_PREFIX, cleanInquiryType);
  if (cleanFollowUp) parts.push(FOLLOW_UP_PREFIX, cleanFollowUp);
  if (cleanNotes) parts.push(cleanNotes);

  return parts.length ? parts.join("\n") : null;
}

export function extractContactNumber(notes: string | null) {
  return extractMetaValue(notes, CONTACT_PREFIX);
}

export function extractLeadSource(notes: string | null) {
  return extractMetaValue(notes, SOURCE_PREFIX);
}

export function extractInquiryType(notes: string | null) {
  return extractMetaValue(notes, INQUIRY_TYPE_PREFIX);
}

export function extractNextFollowUpDate(notes: string | null) {
  return extractMetaValue(notes, FOLLOW_UP_PREFIX);
}

export function getLeadContactNumber(lead: Pick<Lead, "contact_number" | "notes">) {
  return lead.contact_number?.trim() || extractContactNumber(lead.notes);
}

export function getLeadSource(lead: Pick<Lead, "lead_source" | "notes">) {
  return lead.lead_source?.trim() || extractLeadSource(lead.notes);
}

export function getLeadInquiryType(lead: Pick<Lead, "inquiry_type" | "notes">) {
  return lead.inquiry_type?.trim() || extractInquiryType(lead.notes);
}

export function getLeadNextFollowUpDate(
  lead: Pick<Lead, "next_follow_up_date" | "notes">,
) {
  return lead.next_follow_up_date?.trim() || extractNextFollowUpDate(lead.notes);
}

export function stripLeadMetaFromNotes(notes: string | null) {
  if (!notes) return "";
  const lines = notes.split(/\r?\n/);
  const output: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (
      [CONTACT_PREFIX, SOURCE_PREFIX, INQUIRY_TYPE_PREFIX, FOLLOW_UP_PREFIX].includes(
        line,
      )
    ) {
      index += 1;
      continue;
    }
    output.push(lines[index]);
  }

  return output.join("\n").trim();
}

function extractMetaValue(notes: string | null, prefix: string) {
  if (!notes) return "";
  const lines = notes.split(/\r?\n/);
  const index = lines.findIndex((line) => line.trim() === prefix);
  return index >= 0 ? lines[index + 1]?.trim() ?? "" : "";
}
