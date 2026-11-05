import Link from "next/link";
import { connection } from "next/server";
import { Activity, ArrowLeft, BookCopy, BookOpen, ClipboardList, LayoutDashboard, Library, Tags, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import SignOutButton from "@/app/dashboard/sign-out-button";

export const instant = false;

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/books", label: "Book catalog", icon: BookOpen },
  { href: "/dashboard/categories", label: "Book categories", icon: Tags },
  { href: "/dashboard/transactions", label: "Transactions", icon: ClipboardList },
];

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  await connection();
  const profile = await requireAdmin();
  const isSuperAdmin = profile.role === "super_admin";
  return (
    <div className="min-h-screen bg-[#f7f5ef] lg:grid lg:grid-cols-[244px_1fr]">
      <aside className="hidden border-r border-[#e7e4dc] bg-[#fbfaf6] p-5 lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-3 px-2 py-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#17243b] text-[#e2bd73]"><Library size={19} /></span>
          <span><span className="block text-xs font-bold tracking-wide text-[#17243b]">ONG CHE TEE</span><span className="mt-1 block text-[9px] uppercase tracking-[.15em] text-[#8e8d86]">Library Admin</span></span>
        </Link>
        <div className="mt-10">
          <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[.2em] text-[#aaa69b]">Workspace</p>
          <nav className="space-y-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs font-medium text-[#718092] transition hover:bg-[#f1efe8] hover:text-[#17243b]"><Icon size={16} />{label}</Link>
            ))}
            {isSuperAdmin && <>
              <p className="mb-2 mt-8 px-3 text-[9px] font-bold uppercase tracking-[.2em] text-[#aaa69b]">Administration</p>
              <Link href="/dashboard/users" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs font-medium text-[#718092] transition hover:bg-[#f1efe8] hover:text-[#17243b]"><Users size={16} />User roles</Link>
              <Link href="/dashboard/logs" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs font-medium text-[#718092] transition hover:bg-[#f1efe8] hover:text-[#17243b]"><Activity size={16} />Audit trail</Link>
            </>}
          </nav>
        </div>
        <div className="mt-auto">
          <Link href="/" className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#778394] hover:bg-[#f1efe8]"><ArrowLeft size={14} /> View public catalog</Link>
          <div className="flex items-center gap-3 border-t border-[#e7e4dc] px-2 pt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8dfcb] text-xs font-bold text-[#5b503e]">{(profile.full_name || profile.email).slice(0, 1).toUpperCase()}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#27364b]">{profile.full_name || profile.email}</p><p className="mt-0.5 text-[9px] capitalize text-[#8b9299]">{profile.role.replace("_", " ")}</p></div>
            <SignOutButton />
          </div>
        </div>
      </aside>
      <main className="min-w-0">
        <header className="flex items-center justify-between border-b border-[#e7e4dc] bg-[#fbfaf6] px-5 py-3 lg:hidden">
          <Link href="/" className="flex items-center gap-2 text-xs font-bold text-[#17243b]"><Library size={18} /> ONG CHE TEE <span className="font-normal text-[#8e8d86]">/ Admin</span></Link>
          <nav aria-label="Dashboard navigation" className="flex min-w-0 flex-1 items-center justify-end gap-3 overflow-x-auto">
            <Link href="/dashboard" aria-label="Overview" className="text-[#748092]"><LayoutDashboard size={17} /></Link>
            <Link href="/dashboard/books" aria-label="Book catalog" className="text-[#748092]"><BookCopy size={17} /></Link>
            <Link href="/dashboard/categories" aria-label="Book categories" className="text-[#748092]"><Tags size={17} /></Link>
            <Link href="/dashboard/transactions" aria-label="Transactions" className="text-[#748092]"><ClipboardList size={17} /></Link>
            {isSuperAdmin && <>
              <Link href="/dashboard/users" aria-label="Users" className="text-[#748092]"><Users size={17} /></Link>
              <Link href="/dashboard/logs" aria-label="Audit trail" className="text-[#748092]"><Activity size={17} /></Link>
            </>}
            <SignOutButton />
          </nav>
        </header>
        <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
