"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LeadStage, LeadSummary, LeadWithScripts } from "@/lib/types";
import {
  getLeadInquiryType,
  getLeadNextFollowUpDate,
  getLeadSource,
} from "@/lib/lead-contact";
import { sortLeads } from "@/lib/sort";
import {
  INQUIRY_TYPES,
  LEAD_SOURCES,
  LEAD_STAGES,
  type FollowUpFilter,
  getFollowUpStatus,
  normalizeStage,
} from "@/lib/workflow";
import { LogoutButton } from "./LogoutButton";

type Filter = "All" | LeadStage;
type OptionFilter = "All" | string;

export function LeadBoard({
  initialLeads,
  initialSummary,
  envReady,
  userEmail,
}: {
  initialLeads: LeadWithScripts[];
  initialSummary: LeadSummary;
  envReady: boolean;
  userEmail: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("All");
  const [sourceFilter, setSourceFilter] = useState<OptionFilter>("All");
  const [typeFilter, setTypeFilter] = useState<OptionFilter>("All");
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilter>("All");
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredLeads = useMemo(() => {
    const sorted = sortLeads(initialLeads);
    return sorted.filter((lead) => {
      const stageMatch = filter === "All" || normalizeStage(lead.stage) === filter;
      const sourceMatch =
        sourceFilter === "All" || getLeadSource(lead) === sourceFilter;
      const typeMatch =
        typeFilter === "All" || getLeadInquiryType(lead) === typeFilter;
      const followUpMatch =
        followUpFilter === "All" ||
        getFollowUpStatus(getLeadNextFollowUpDate(lead)) === followUpFilter;

      return stageMatch && sourceMatch && typeMatch && followUpMatch;
    });
  }, [filter, sourceFilter, typeFilter, followUpFilter, initialLeads]);

  const followUpQueue = useMemo(() => {
    const activeLeads = sortLeads(initialLeads).filter(
      (lead) => normalizeStage(lead.stage) !== "Done",
    );
    return {
      overdue: activeLeads.filter(
        (lead) => getFollowUpStatus(getLeadNextFollowUpDate(lead)) === "Overdue",
      ),
      today: activeLeads.filter(
        (lead) => getFollowUpStatus(getLeadNextFollowUpDate(lead)) === "Today",
      ),
      noDatePending: activeLeads.filter(
        (lead) =>
          normalizeStage(lead.stage) === "Pending" &&
          getFollowUpStatus(getLeadNextFollowUpDate(lead)) === "No date",
      ),
    };
  }, [initialLeads]);

  async function createLead(formData: FormData) {
    setFormError("");

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

    if (!body.name.trim()) {
      setFormError("Name is required.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();

      if (!response.ok) {
        setFormError(result.error ?? "Inquiry could not be created.");
        return;
      }

      router.push(`/leads/${result.lead.id}`);
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">Heng Wei Hardware</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Inquiry follow-up board</h1>
            <p className="mt-1 text-sm text-zinc-500">{userEmail}</p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <LogoutButton />
            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
              <Metric label="Total" value={initialSummary.total} />
              <Metric label="New" value={initialSummary.newInquiry} />
              <Metric label="Open" value={initialSummary.openConversation} />
              <Metric label="Pending" value={initialSummary.pending} />
              <Metric label="Done" value={initialSummary.done} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[380px_1fr]">
        <section className="h-fit border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">New Inquiry</h2>
          <form action={createLead} className="mt-4 space-y-4">
            <Field name="name" label="Name" required />
            <Field name="company" label="Company / project name" />
            <Field name="contact_number" label="Contact number" type="tel" />
            <Field name="next_follow_up_date" label="Next follow-up date" type="date" />
            <div>
              <label className="text-sm font-medium text-zinc-700" htmlFor="stage">
                Stage
              </label>
              <select
                className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
                id="stage"
                name="stage"
                defaultValue="New Inquiry"
              >
                {LEAD_STAGES.map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>
            </div>
            <SelectField label="Lead source" name="lead_source" options={LEAD_SOURCES} />
            <SelectField label="Inquiry type" name="inquiry_type" options={INQUIRY_TYPES} />
            <Field name="email" label="Email" type="email" />
            <TextArea name="pain_points" label="Customer request" required />
            <TextArea name="notes" label="Notes" />
            {formError ? <p className="text-sm text-red-700">{formError}</p> : null}
            {!envReady ? (
              <p className="text-sm text-amber-700">
                Supabase env is missing locally. Pull Vercel env to create inquiries.
              </p>
            ) : null}
            <button
              className="w-full bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
              disabled={isPending || !envReady}
              type="submit"
            >
              {isPending ? "Creating..." : "Create Inquiry"}
            </button>
          </form>
        </section>

        <section>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <QueueCard
              count={followUpQueue.overdue.length}
              label="Overdue"
              leads={followUpQueue.overdue}
              onClick={() => setFollowUpFilter("Overdue")}
              tone="red"
            />
            <QueueCard
              count={followUpQueue.today.length}
              label="Today"
              leads={followUpQueue.today}
              onClick={() => setFollowUpFilter("Today")}
              tone="green"
            />
            <QueueCard
              count={followUpQueue.noDatePending.length}
              label="Pending no date"
              leads={followUpQueue.noDatePending}
              onClick={() => {
                setFilter("Pending");
                setFollowUpFilter("No date");
              }}
              tone="amber"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap border border-zinc-200 bg-white p-1">
              {(["All", ...LEAD_STAGES] as Filter[]).map((tab) => (
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    filter === tab ? "bg-teal-700 text-white" : "text-zinc-600"
                  }`}
                  key={tab}
                  onClick={() => setFilter(tab)}
                  type="button"
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="grid w-full gap-2 md:grid-cols-3">
              <FilterSelect
                label="Source"
                onChange={setSourceFilter}
                options={LEAD_SOURCES}
                value={sourceFilter}
              />
              <FilterSelect
                label="Type"
                onChange={setTypeFilter}
                options={INQUIRY_TYPES}
                value={typeFilter}
              />
              <FilterSelect
                label="Follow-up"
                onChange={(value) => setFollowUpFilter(value as FollowUpFilter)}
                options={["Overdue", "Today", "Upcoming", "No date"]}
                value={followUpFilter}
              />
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {filteredLeads.length === 0 ? (
              <div className="border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600">
                No inquiries yet. Add your first inquiry above.
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const script = lead.scripts[0];
                const followUpStatus = getFollowUpStatus(getLeadNextFollowUpDate(lead));
                return (
                  <Link
                    className="border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-teal-500"
                    href={`/leads/${lead.id}`}
                    key={lead.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{lead.name}</h3>
                          <StageBadge stage={lead.stage} />
                          <FollowUpBadge status={followUpStatus} />
                        </div>
                        <p className="text-sm text-zinc-600">
                          {lead.company || "Personal inquiry"}
                        </p>
                      </div>
                      {script ? (
                        <span className="border border-zinc-200 px-2 py-1 text-xs font-medium capitalize text-zinc-700">
                          {script.review_status} v{script.version}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-600">
                      {getLeadSource(lead) ? (
                        <span className="border border-zinc-200 px-2 py-1">
                          {getLeadSource(lead)}
                        </span>
                      ) : null}
                      {getLeadInquiryType(lead) ? (
                        <span className="border border-zinc-200 px-2 py-1">
                          {getLeadInquiryType(lead)}
                        </span>
                      ) : null}
                      {getLeadNextFollowUpDate(lead) ? (
                        <span className="border border-zinc-200 px-2 py-1">
                          Follow-up {getLeadNextFollowUpDate(lead)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-zinc-700">
                      {lead.pain_points || "No customer request captured yet."}
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function QueueCard({
  count,
  label,
  leads,
  onClick,
  tone,
}: {
  count: number;
  label: string;
  leads: LeadWithScripts[];
  onClick: () => void;
  tone: "red" | "green" | "amber";
}) {
  const className =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-900"
      : tone === "green"
        ? "border-green-200 bg-green-50 text-green-900"
        : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <button
      className={`border p-4 text-left shadow-sm transition hover:border-zinc-400 ${className}`}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-2xl font-semibold">{count}</span>
      </div>
      <p className="mt-2 line-clamp-1 text-xs">
        {leads[0] ? leads.slice(0, 2).map((lead) => lead.name).join(", ") : "Clear"}
      </p>
    </button>
  );
}

function FollowUpBadge({ status }: { status: string }) {
  if (status !== "Overdue" && status !== "Today") return null;
  return (
    <span
      className={`px-2 py-1 text-xs font-bold ${
        status === "Overdue"
          ? "bg-red-100 text-red-800"
          : "bg-green-100 text-green-800"
      }`}
    >
      {status}
    </span>
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="text-xs font-medium text-zinc-600">
      {label}
      <select
        className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-teal-600"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option>All</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-zinc-200 bg-zinc-50 px-4 py-3">
      <div className="text-xs font-medium uppercase text-zinc-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

export function StageBadge({ stage }: { stage: LeadStage }) {
  const normalized = normalizeStage(stage);
  const className =
    normalized === "Done"
      ? "bg-emerald-100 text-emerald-800"
      : normalized === "Pending"
        ? "bg-amber-100 text-amber-800"
        : normalized === "Open Conversation"
          ? "bg-violet-100 text-violet-800"
          : "bg-sky-100 text-sky-800";

  return (
    <span className={`px-2 py-1 text-xs font-bold ${className}`}>
      {normalized}
    </span>
  );
}

function SelectField({
  label,
  name,
  options,
}: {
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
        id={name}
        name={name}
        defaultValue=""
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
}: {
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
        id={name}
        name={name}
        required={required}
        type={type}
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  required,
}: {
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
        id={name}
        name={name}
        required={required}
      />
    </div>
  );
}
