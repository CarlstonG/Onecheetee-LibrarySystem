import { connection } from "next/server";
import { CheckCircle2, ShieldCheck, UserRoundCog } from "lucide-react";
import { assignRole, confirmPendingUser } from "@/app/actions";
import { requireSuperAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const instant = false;

interface PendingUser {
  id: string;
  email: string;
  created_at: string;
}

export default async function UsersPage({ searchParams }: PageProps<"/dashboard/users">) {
  await connection();
  await requireSuperAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("id,email,full_name,role,created_at").order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load users: ${error.message}`);
  const profiles = (data ?? []) as Profile[];
  let pendingUsers: PendingUser[] = [];
  const adminConfigured = isSupabaseAdminConfigured();

  if (adminConfigured) {
    const supabaseAdmin = createAdminClient();
    const pendingAuthUsers: PendingUser[] = [];
    for (let page = 1; ; page += 1) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (authError) throw new Error(`Could not load pending user registrations: ${authError.message}`);
      const users = authData.users;
      pendingAuthUsers.push(...users.flatMap((user) => {
        if (user.email_confirmed_at || !user.email) return [];
        return [{ id: user.id, email: user.email, created_at: user.created_at }];
      }));
      if (users.length < 1000) break;
    }

    pendingUsers = pendingAuthUsers;
  }

  return (
    <div>
      <div><p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#a17d46]">Administration</p><h1 className="font-editorial mt-2 text-3xl text-[#17243b]">User roles</h1><p className="mt-1 text-xs text-[#7d8996]">Grant or remove staff access for library accounts.</p></div>
      <div className="mt-7 flex items-start gap-3 rounded-xl border border-[#eadfc7] bg-[#f7f1e4] p-4 text-[11px] leading-5 text-[#826d4c]"><ShieldCheck size={17} className="mt-0.5 shrink-0" />Only super admins can manage roles. Users with guest access cannot sign in to the dashboard.</div>
      {params.error && <p role="alert" className="mt-4 rounded-lg border border-[#edd8d2] bg-[#fff4f0] px-4 py-3 text-xs text-[#a25c4c]">{params.error}</p>}
      {params.confirmed && <p role="status" className="mt-4 rounded-lg border border-[#dce7dc] bg-[#f4f8f2] px-4 py-3 text-xs text-[#5d785d]">User email confirmed. They can now sign in with their existing credentials.</p>}
      {!adminConfigured && <div role="status" className="mt-5 rounded-xl border border-[#eadfc7] bg-[#fbf6eb] p-4 text-xs leading-5 text-[#806641]">Pending-account approval is not configured. Add the server-only <code>SUPABASE_SERVICE_ROLE_KEY</code> to <code>.env.local</code>, then restart the app. Never prefix this key with <code>NEXT_PUBLIC_</code>.</div>}
      {adminConfigured && <section className="mt-5 overflow-hidden rounded-xl border border-[#e9e6de] bg-[#fbfaf6]">
        <div className="border-b border-[#eeece5] px-5 py-4"><h2 className="text-sm font-semibold text-[#27364b]">Pending account confirmations</h2><p className="mt-1 text-[10px] text-[#939ba3]">{pendingUsers.length} unconfirmed {pendingUsers.length === 1 ? "account" : "accounts"}</p></div>
        <div className="divide-y divide-[#eeece5]">
          {pendingUsers.map((user) => <div key={user.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4ead7] text-[#9b7741]"><UserRoundCog size={16} /></span>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#344258]">{user.email}</p><p className="mt-1 text-[10px] text-[#8b949e]">Registered {formatDate(user.created_at)} · Account access: Guest</p></div>
            <form action={confirmPendingUser}><input type="hidden" name="user_id" value={user.id} /><button className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#17243b] px-3 text-[10px] font-semibold text-white hover:bg-[#293b57]"><CheckCircle2 size={13} /> Confirm email</button></form>
          </div>)}
          {!pendingUsers.length && <div className="px-5 py-8 text-center text-xs text-[#929aa1]">No pending account confirmations.</div>}
        </div>
      </section>}
      <div className="mt-5 overflow-hidden rounded-xl border border-[#e9e6de] bg-[#fbfaf6]">
        <div className="border-b border-[#eeece5] px-5 py-4"><h2 className="text-sm font-semibold text-[#27364b]">Registered profiles</h2><p className="mt-1 text-[10px] text-[#939ba3]">{profiles.length} accounts</p></div>
        <div className="divide-y divide-[#eeece5]">
          {profiles.map((profile) => <div key={profile.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8dfcb] text-xs font-bold text-[#5b503e]"><UserRoundCog size={16} /></span>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#344258]">{profile.full_name || "Unnamed account"}</p><p className="mt-1 truncate text-[10px] text-[#8b949e]">{profile.email} · Joined {formatDate(profile.created_at)}</p></div>
            {profile.role === "super_admin" ? <span className="rounded-full bg-[#e8edf4] px-3 py-1.5 text-[9px] font-semibold text-[#51677f]">Super admin</span> : <form action={assignRole} className="flex items-center gap-2"><input type="hidden" name="user_id" value={profile.id} /><select name="role" defaultValue={profile.role} aria-label={`Role for ${profile.email}`} className="h-8 rounded-md border border-[#e5e2da] bg-white px-2 text-[10px] capitalize"><option value="guest">Guest</option><option value="admin">Admin</option></select><button className="h-8 rounded-md bg-[#17243b] px-3 text-[10px] font-semibold text-white">Save</button></form>}
          </div>)}
          {!profiles.length && <div className="px-5 py-12 text-center text-xs text-[#929aa1]">No profiles found.</div>}
        </div>
      </div>
    </div>
  );
}
