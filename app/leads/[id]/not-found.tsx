import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-5 text-zinc-950">
      <div className="border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Inquiry not found</h1>
        <p className="mt-2 text-zinc-600">This inquiry does not exist or was deleted.</p>
        <Link
          className="mt-5 inline-block bg-zinc-950 px-4 py-2 text-sm font-semibold text-white"
          href="/leads"
        >
          Back to inquiries
        </Link>
      </div>
    </main>
  );
}
