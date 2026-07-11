const CONTACT_PREFIX = "Contact number:";

export function combineNotesWithContact(notes: string, contactNumber: string) {
  const cleanNotes = stripContactFromNotes(notes);
  const cleanContact = contactNumber.trim();

  if (!cleanContact) return cleanNotes || null;
  return [CONTACT_PREFIX, cleanContact, cleanNotes].filter(Boolean).join("\n");
}

export function extractContactNumber(notes: string | null) {
  if (!notes) return "";
  const lines = notes.split(/\r?\n/);
  const index = lines.findIndex((line) => line.trim() === CONTACT_PREFIX);
  return index >= 0 ? lines[index + 1]?.trim() ?? "" : "";
}

export function stripContactFromNotes(notes: string | null) {
  if (!notes) return "";
  const lines = notes.split(/\r?\n/);
  const index = lines.findIndex((line) => line.trim() === CONTACT_PREFIX);
  if (index < 0) return notes.trim();
  return [...lines.slice(0, index), ...lines.slice(index + 2)].join("\n").trim();
}
