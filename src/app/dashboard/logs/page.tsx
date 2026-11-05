import { connection } from "next/server";
import { Activity } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { AuditLog } from "@/lib/types";

export const instant = false;

export default async function LogsPage() {
  await connection();
  await requireSuperAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("audit_logs").select("id,admin_id,action,details,created_at,profiles(full_name,email)").order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error(`Could not load audit trail: ${error.message}`);
  const logs = (data ?? []) as unknown as AuditLog[];
  return (
    <div>
      <div><p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#a17d46]">Administration</p><h1 className="font-editorial mt-2 text-3xl text-[#17243b]">Audit trail</h1><p className="mt-1 text-xs text-[#7d8996]">A time-stamped record of library administration activity.</p></div>
      <div className="mt-7 overflow-hidden rounded-xl border border-[#e9e6de] bg-[#fbfaf6]">
        <div className="flex items-center justify-between border-b border-[#eeece5] px-5 py-4"><div><h2 className="text-sm font-semibold text-[#27364b]">Recent activity</h2><p className="mt-1 text-[10px] text-[#939ba3]">Showing the latest {logs.length} events</p></div><Activity size={17} className="text-[#b69a64]" /></div>
        {logs.length ? <div className="divide-y divide-[#eeece5]">{logs.map((log) => <article key={log.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#edf0f4] px-2.5 py-1 text-[9px] font-bold tracking-wide text-[#5c6e83]">{log.action.replaceAll("_", " ")}</span><span className="text-[10px] text-[#86919e]">{log.profiles?.full_name || log.profiles?.email || "Library administrator"}</span></div><pre className="mt-2 whitespace-pre-wrap break-words font-sans text-[10px] leading-5 text-[#788491]">{JSON.stringify(log.details, null, 2)}</pre></div><time className="text-[9px] text-[#9ba1a5]">{formatDateTime(log.created_at)}</time></article>)}</div> : <div className="px-5 py-12 text-center text-xs text-[#929aa1]">No administrative activity recorded yet.</div>}
      </div>
    </div>
  );
}
