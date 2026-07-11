"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function submit(formData: FormData) {
    setError("");
    setMessage("");
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
              },
            });

      if (result.error) {
        setError(authErrorMessage(result.error.message));
        return;
      }

      if (mode === "signup" && !result.data.session) {
        setMessage("Account created. Please check your email to confirm it.");
        return;
      }

      router.push(searchParams.get("next") || "/");
      router.refresh();
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-5 text-zinc-950">
      <section className="w-full max-w-md border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-teal-700">Heng Wei Hardware</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {mode === "login" ? "Log in" : "Create account"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          {mode === "login"
            ? "Use the email and password you created for this app."
            : "Create your account first, then confirm the email if Supabase asks for confirmation."}
        </p>
        <form action={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-zinc-700" htmlFor="email">
              Email
            </label>
            <input
              className="mt-1 w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              id="email"
              name="email"
              required
              type="email"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700" htmlFor="password">
              Password
            </label>
            <input
              className="mt-1 w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              id="password"
              minLength={6}
              name="password"
              required
              type="password"
            />
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {message ? <p className="text-sm text-teal-700">{message}</p> : null}
          <button
            className="w-full bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
            disabled={isPending}
            type="submit"
          >
            {isPending
              ? "Please wait..."
              : mode === "login"
                ? "Log in"
                : "Create account"}
          </button>
        </form>
        <button
          className="mt-4 text-sm font-medium text-teal-700"
          onClick={() => {
            setError("");
            setMessage("");
            setMode(mode === "login" ? "signup" : "login");
          }}
          type="button"
        >
          {mode === "login"
            ? "Need an account? Create one"
            : "Already have an account? Log in"}
        </button>
      </section>
    </main>
  );
}

function authErrorMessage(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Login failed. Please create an account first, or check that the email and password are correct.";
  }

  if (lower.includes("email not confirmed")) {
    return "Your email is not confirmed yet. Please open the confirmation email from Supabase, then log in again.";
  }

  if (lower.includes("rate") || lower.includes("too many")) {
    return "Supabase is temporarily blocking new login/signup attempts because of rate limit. Please wait a few minutes, or create the user manually in Supabase Auth.";
  }

  return message;
}
