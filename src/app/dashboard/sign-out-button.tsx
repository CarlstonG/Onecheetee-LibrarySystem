"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw new Error(signOutError.message);
      router.replace("/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign out. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Sign out"
        disabled={pending}
        onClick={handleSignOut}
        className="rounded-md p-2 text-[#89929b] hover:bg-[#f1efe8] hover:text-[#17243b] disabled:cursor-wait disabled:opacity-50"
      >
        <LogOut size={15} />
      </button>
      {error && <p role="alert" className="absolute bottom-full right-0 mb-2 w-56 rounded-md border border-[#edd8d2] bg-white p-2 text-[10px] text-[#a25c4c] shadow">{error}</p>}
    </div>
  );
}
