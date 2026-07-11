"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <button
      className="border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 disabled:opacity-60"
      disabled={isPending}
      onClick={logout}
      type="button"
    >
      {isPending ? "Logging out..." : "Log out"}
    </button>
  );
}
