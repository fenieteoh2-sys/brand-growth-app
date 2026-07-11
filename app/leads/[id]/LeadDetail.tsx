"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LeadWithScripts, ReplyType, Script } from "@/lib/types";
import {
  getLeadContactNumber,
  getLeadInquiryType,
  getLeadNextFollowUpDate,
  getLeadSource,
  stripLeadMetaFromNotes,
} from "@/lib/lead-contact";
import {
  INQUIRY_TYPES,
  LEAD_SOURCES,
  LEAD_STAGES,
  REPLY_TYPES,
  nextStage,
  normalizeStage,
  parseReplyType,
  previousStage,
  replyTypeLabel,
} from "@/lib/workflow";
import { StageBadge } from "../LeadBoard";

export function LeadDetail({ initialLead }: { initialLead: LeadWithScripts }) {
  const router = useRouter();
  const [lead, setLead] = useState(initialLead);
  const [scripts, setScripts] = useState<Script[]>(initialLead.scripts);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [replyType, setReplyType] = useState<ReplyType>("ask_details");
  const [isSaving, startSaving] = useTransition();
  const [isGenerating, startGenerating] = useTransition();
  const primaryScript = scripts[0];

  async function updateLead(formData: FormData) {
    setMessage("");
    setError("");
    const body = {
      name: String(formData.get("name") ?? ""),
      company: String(formData.get("company") ?? ""),
      contact_number: String(formData.get("contact_number") ?? ""),
      lead_source: String(formData.get("lead_source") ?? ""),
      inquiry_type: String(formData.get("inquiry_type") ?? ""),
      next_follow_up_date: String(formData.get("next_follow_up_date") ?? ""),
      stage: String(formData.get("stage") ?? "New Inquiry"),
      pain_points: String(formData.get("pain_points") ?? ""),
      email: String(formData.get("email") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    };

    startSaving(async () => {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Inquiry could not be saved.");
        return;
      }
      setLead({ ...lead, ...result.lead });
      setMessage("Lead saved.");
      router.refresh();
    });
  }

  async function changeStage() {
    const targetStage = nextStage(normalizeStage(lead.stage));
    startSaving(async () => {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: targetStage }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Stage could not be changed.");
        return;
      }
      setLead({ ...lead, ...result.lead });
      router.refresh();
    });
  }

  async function moveBackStage() {
    const targetStage = previousStage(normalizeStage(lead.stage));
    startSaving(async () => {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: targetStage }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Stage could not be changed.");
        return;
      }
      setLead({ ...lead, ...result.lead });
      router.refresh();
    });
  }

  async function deleteLead() {
    const confirmed = window.confirm("Delete this inquiry permanently?");
    if (!confirmed) return;

    startSaving(async () => {
      const response = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json();
        setError(result.error ?? "Inquiry could not be deleted.");
        return;
      }
      router.push("/leads");
      router.refresh();
    });
  }

  async function generateScript() {
    setMessage("");
    setError("");
    startGenerating(async () => {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: lead.id, reply_type: replyType }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Script generation failed. Try again.");
        return;
      }
      setScripts([result.script, ...scripts]);
      setMessage("Draft script generated.");
      router.refresh();
    });
  }

  async function approveScript(scriptId: string) {
    startSaving(async () => {
      const response = await fetch(`/api/scripts/${scriptId}/approve`, {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Script could not be approved.");
        return;
      }
      setScripts((current) =>
        current.map((script) => (script.id === scriptId ? result.script : script)),
      );
      router.refresh();
    });
  }

  async function saveScript(scriptId: string, value: string) {
    startSaving(async () => {
      const response = await fetch(`/api/scripts/${scriptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Script could not be saved.");
        return;
      }
      setScripts((current) =>
        current.map((script) => (script.id === scriptId ? result.script : script)),
      );
      setMessage("Script saved.");
      router.refresh();
    });
  }

  async function copyScript(value: string) {
    await navigator.clipboard.writeText(value);
    setMessage("Script copied.");
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link className="text-sm font-medium text-teal-700" href="/leads">
              Back to inquiries
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">{lead.name}</h1>
              <StageBadge stage={lead.stage} />
            </div>
            <p className="text-zinc-600">{lead.company || "Personal inquiry"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 disabled:opacity-60"
              disabled={
                isSaving || normalizeStage(lead.stage) === "New Inquiry"
              }
              onClick={moveBackStage}
              type="button"
            >
              Move back
            </button>
            <button
              className="border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 disabled:opacity-60"
              disabled={isSaving || normalizeStage(lead.stage) === "Done"}
              onClick={changeStage}
              type="button"
            >
              Move to {nextStage(normalizeStage(lead.stage))}
            </button>
            <button
              className="bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={isSaving}
              onClick={deleteLead}
              type="button"
            >
              Delete
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:grid-cols-[360px_1fr]">
        <section className="h-fit border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Inquiry details</h2>
          <form action={updateLead} className="mt-4 space-y-4">
            <Field defaultValue={lead.name} label="Name" name="name" required />
            <Field
              defaultValue={lead.company === "Personal inquiry" ? "" : lead.company}
              label="Company / project name"
              name="company"
            />
            <div>
              <label className="text-sm font-medium text-zinc-700" htmlFor="stage">
                Stage
              </label>
              <select
                className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
                defaultValue={normalizeStage(lead.stage)}
                id="stage"
                name="stage"
              >
                {LEAD_STAGES.map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>
            </div>
            <SelectField
              defaultValue={getLeadSource(lead)}
              label="Lead source"
              name="lead_source"
              options={LEAD_SOURCES}
            />
            <SelectField
              defaultValue={getLeadInquiryType(lead)}
              label="Inquiry type"
              name="inquiry_type"
              options={INQUIRY_TYPES}
            />
            <Field defaultValue={lead.email ?? ""} label="Email" name="email" type="email" />
            <Field
              defaultValue={getLeadContactNumber(lead)}
              label="Contact number"
              name="contact_number"
              type="tel"
            />
            <Field
              defaultValue={getLeadNextFollowUpDate(lead)}
              label="Next follow-up date"
              name="next_follow_up_date"
              type="date"
            />
            <TextArea
              defaultValue={lead.pain_points ?? ""}
              label="Customer request"
              name="pain_points"
              required
            />
            <TextArea
              defaultValue={stripLeadMetaFromNotes(lead.notes)}
              label="Notes"
              name="notes"
            />
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {message ? <p className="text-sm text-teal-700">{message}</p> : null}
            <button
              className="w-full bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border border-zinc-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold">Reply script</h2>
              <p className="text-sm text-zinc-600">
                {primaryScript
                  ? `Showing version ${primaryScript.version}`
                  : "No reply yet. Choose an action and generate one."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
                onChange={(event) => setReplyType(event.target.value as ReplyType)}
                value={replyType}
              >
                {REPLY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <button
                className="bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
                disabled={isGenerating}
                onClick={generateScript}
                type="button"
              >
                {isGenerating ? "Generating..." : "Generate Reply"}
              </button>
            </div>
          </div>

          {primaryScript ? (
            <ScriptPanel
              isSaving={isSaving}
              key={primaryScript.id}
              onApprove={approveScript}
              onCopy={copyScript}
              onSave={saveScript}
              script={primaryScript}
            />
          ) : (
            <div className="border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600">
              No reply yet. Choose an action and generate one.
            </div>
          )}

          {scripts.length > 1 ? (
            <div className="border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Version history</h2>
              <div className="mt-3 space-y-3">
                {scripts.slice(1).map((script) => (
                  <div className="border border-zinc-200 p-3" key={script.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold">Version {script.version}</span>
                      <StatusBadge status={script.review_status} />
                    </div>
                    {parseReplyType(script.source) ? (
                      <div className="mt-2 text-xs font-medium text-teal-700">
                        {replyTypeLabel(parseReplyType(script.source)!)}
                      </div>
                    ) : null}
                    <p className="mt-2 text-sm text-zinc-700">{script.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function ScriptPanel({
  script,
  isSaving,
  onApprove,
  onCopy,
  onSave,
}: {
  script: Script;
  isSaving: boolean;
  onApprove: (id: string) => void;
  onCopy: (value: string) => void;
  onSave: (id: string, value: string) => void;
}) {
  const lowConfidence = Number(script.confidence ?? 0) < 0.75;
  const [value, setValue] = useState(script.value);

  return (
    <article className="border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={script.review_status} />
          {parseReplyType(script.source) ? (
            <span className="border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-medium text-teal-800">
              {replyTypeLabel(parseReplyType(script.source)!)}
            </span>
          ) : null}
          <span className="border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700">
            Confidence {Math.round(Number(script.confidence ?? 0) * 100)}%
          </span>
          {lowConfidence ? (
            <span className="bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
              Low confidence - review carefully
            </span>
          ) : null}
        </div>
        <div className="flex gap-2">
          {script.review_status !== "approved" ? (
            <button
              className="bg-zinc-950 px-3 py-2 text-sm font-semibold text-white disabled:bg-zinc-400"
              disabled={isSaving}
              onClick={() => onApprove(script.id)}
              type="button"
            >
              Approve
            </button>
          ) : null}
          <button
            className="border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800"
            onClick={() => onCopy(script.value)}
            type="button"
          >
            Copy
          </button>
        </div>
      </div>
      <textarea
        className="mt-4 min-h-52 w-full border border-zinc-300 px-3 py-3 text-base leading-7 text-zinc-800 outline-none focus:border-teal-600"
        onChange={(event) => setValue(event.target.value)}
        value={value}
      />
      <button
        className="mt-3 border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 disabled:opacity-60"
        disabled={isSaving || value.trim() === script.value.trim()}
        onClick={() => onSave(script.id, value)}
        type="button"
      >
        Save script edit
      </button>
    </article>
  );
}

function StatusBadge({ status }: { status: Script["review_status"] }) {
  return (
    <span
      className={`px-2 py-1 text-xs font-bold capitalize ${
        status === "approved"
          ? "bg-emerald-100 text-emerald-800"
          : status === "draft"
            ? "bg-amber-100 text-amber-800"
            : "bg-zinc-200 text-zinc-700"
      }`}
    >
      {status}
    </span>
  );
}

function Field({
  defaultValue,
  label,
  name,
  required,
  type = "text",
}: {
  defaultValue: string;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-zinc-700" htmlFor={name}>
        {label}
      </label>
      <input
        className="mt-1 w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
        defaultValue={defaultValue}
        id={name}
        name={name}
        required={required}
        type={type}
      />
    </div>
  );
}

function SelectField({
  defaultValue,
  label,
  name,
  options,
}: {
  defaultValue: string;
  label: string;
  name: string;
  options: string[];
}) {
  return (
    <div>
      <label className="text-sm font-medium text-zinc-700" htmlFor={name}>
        {label}
      </label>
      <select
        className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
        defaultValue={defaultValue}
        id={name}
        name={name}
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function TextArea({
  defaultValue,
  label,
  name,
  required,
}: {
  defaultValue: string;
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-zinc-700" htmlFor={name}>
        {label}
      </label>
      <textarea
        className="mt-1 min-h-24 w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
        defaultValue={defaultValue}
        id={name}
        name={name}
        required={required}
      />
    </div>
  );
}
