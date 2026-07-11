const CONTACT_PREFIX = "Contact number:";
const SOURCE_PREFIX = "Lead source:";
const INQUIRY_TYPE_PREFIX = "Inquiry type:";

export function combineNotesWithMeta({
  notes,
  contactNumber,
  leadSource,
  inquiryType,
}: {
  notes: string;
  contactNumber: string;
  leadSource: string;
  inquiryType: string;
}) {
  const cleanNotes = stripLeadMetaFromNotes(notes);
  const cleanContact = contactNumber.trim();
  const cleanSource = leadSource.trim();
  const cleanInquiryType = inquiryType.trim();
  const parts = [];

  if (cleanContact) parts.push(CONTACT_PREFIX, cleanContact);
  if (cleanSource) parts.push(SOURCE_PREFIX, cleanSource);
  if (cleanInquiryType) parts.push(INQUIRY_TYPE_PREFIX, cleanInquiryType);
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

export function stripLeadMetaFromNotes(notes: string | null) {
  if (!notes) return "";
  const lines = notes.split(/\r?\n/);
  const output: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if ([CONTACT_PREFIX, SOURCE_PREFIX, INQUIRY_TYPE_PREFIX].includes(line)) {
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
