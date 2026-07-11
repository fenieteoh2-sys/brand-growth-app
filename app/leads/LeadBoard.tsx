"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LeadStage, LeadSummary, LeadWithScripts } from "@/lib/types";
import { sortLeads } from "@/lib/sort";

type Filter = "All" | LeadStage;

export function LeadBoard({
  initialLeads,
  initialSummary,
  envReady,
}: {
  initialLeads: LeadWithScripts[];
  initialSummary: LeadSummary;
  envReady: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("All");
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredLeads = useMemo(() => {
    const sorted = sortLeads(initialLeads);
    return filter === "All"
      ? sorted
      : sorted.filter((lead) => lead.stage === filter);
  }, [filter, initialLeads]);

  async function createLead(formData: FormData) {
    setFormError("");

    const body = {
      name: String(formData.get("name") ?? ""),
      company: String(formData.get("company") ?? ""),
      contact_number: String(formData.get("contact_number") ?? ""),
      stage: String(formData.get("stage") ?? "MQL"),
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
        setFormError(result.error ?? "Lead could not be created.");
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
            <p className="text-sm font-medium text-teal-700">Brand Growth App</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Lead scripts workspace</h1>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <Metric label="Total" value={initialSummary.total} />
            <Metric label="MQL" value={initialSummary.mql} />
            <Metric label="SQL" value={initialSummary.sql} />
            <Metric label="Approved" value={initialSummary.approvedScripts} />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[380px_1fr]">
        <section className="h-fit border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">New Lead</h2>
          <form action={createLead} className="mt-4 space-y-4">
            <Field name="name" label="Name" required />
            <Field name="company" label="Company / project name" />
            <Field name="contact_number" label="Contact number" type="tel" />
            <div>
              <label className="text-sm font-medium text-zinc-700" htmlFor="stage">
                Stage
              </label>
              <select
                className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
                id="stage"
                name="stage"
                defaultValue="MQL"
              >
                <option>MQL</option>
                <option>SQL</option>
              </select>
            </div>
            <Field name="email" label="Email" type="email" />
            <TextArea name="pain_points" label="Pain points" required />
            <TextArea name="notes" label="Notes" />
            {formError ? <p className="text-sm text-red-700">{formError}</p> : null}
            {!envReady ? (
              <p className="text-sm text-amber-700">
                Supabase env is missing locally. Pull Vercel env to create leads.
              </p>
            ) : null}
            <button
              className="w-full bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
              disabled={isPending || !envReady}
              type="submit"
            >
              {isPending ? "Creating..." : "Create Lead"}
            </button>
          </form>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex border border-zinc-200 bg-white p-1">
              {(["All", "MQL", "SQL"] as Filter[]).map((tab) => (
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
          </div>

          <div className="mt-4 grid gap-3">
            {filteredLeads.length === 0 ? (
              <div className="border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600">
                No leads yet. Add your first lead above.
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const script = lead.scripts[0];
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
                    <p className="mt-3 line-clamp-2 text-sm text-zinc-700">
                      {lead.pain_points || "No pain points captured yet."}
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-zinc-200 bg-zinc-50 px-4 py-3">
      <div className="text-xs font-medium uppercase text-zinc-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

export function StageBadge({ stage }: { stage: LeadStage }) {
  return (
    <span
      className={`px-2 py-1 text-xs font-bold ${
        stage === "SQL" ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"
      }`}
    >
      {stage}
    </span>
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
