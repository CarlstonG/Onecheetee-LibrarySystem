import Link from "next/link";
import { connection } from "next/server";
import { Activity, ArrowLeft, BookOpen, ClipboardList, LayoutDashboard, Library, QrCode, Tags, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import SignOutButton from "@/app/dashboard/sign-out-button";

export const instant = false;

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/books", label: "Book catalog", icon: BookOpen },
  { href: "/dashboard/categories", label: "Book categories", icon: Tags },
  { href: "/dashboard/transactions", label: "Transactions", icon: ClipboardList },
  { href: "/dashboard/scan", label: "Scan a book", icon: QrCode },
];

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  await connection();
  const profile = await requireRole(["guest", "admin", "super_admin"]);
  const isGuest = profile.role === "guest";
  const isSuperAdmin = profile.role === "super_admin";
  return (
    <div className="min-h-screen bg-[#f7f5ef] lg:grid lg:grid-cols-[244px_1fr]">
      <aside className="hidden border-r border-[#e7e4dc] bg-[#fbfaf6] p-5 lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-3 px-2 py-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#17243b] text-[#e2bd73]"><Library size={19} /></span>
          <span><span className="block text-xs font-bold tracking-wide text-[#17243b]">ONG CHE TEE</span><span className="mt-1 block text-[9px] uppercase tracking-[.15em] text-[#8e8d86]">{isGuest ? "Library Reader" : "Library Admin"}</span></span>
        </Link>
        <div className="mt-10">
          <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[.2em] text-[#aaa69b]">{isGuest ? "Read-only access" : "Workspace"}</p>
          <nav className="space-y-1">
            {(isGuest ? links.filter(({ href }) => href === "/dashboard/scan") : links).map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs font-medium text-[#718092] transition hover:bg-[#f1efe8] hover:text-[#17243b]"><Icon size={16} />{label}</Link>
            ))}
            {!isGuest && isSuperAdmin && <>
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
        <header className="sticky top-0 z-30 border-b border-[#e7e4dc] bg-[#fbfaf6]/95 px-4 py-3 shadow-[0_8px_24px_-24px_rgba(23,36,59,.55)] backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex min-h-10 items-center gap-2 text-xs font-bold text-[#17243b]"><Library size={18} /> ONG CHE TEE <span className="font-normal text-[#8e8d86]">/ {isGuest ? "Reader" : "Admin"}</span></Link>
            <SignOutButton />
          </div>
          <nav aria-label="Dashboard navigation" className={`mt-2 grid gap-1 border-t border-[#eeece5] pt-2 ${isGuest ? "grid-cols-1" : isSuperAdmin ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-6"}`}>
            {isGuest ? (
              <Link href="/dashboard/scan" className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium text-[#68778a] transition hover:bg-[#f1efe8] hover:text-[#17243b]"><QrCode size={16} />Scan a book</Link>
            ) : <>
              <Link href="/dashboard" className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium text-[#68778a] transition hover:bg-[#f1efe8] hover:text-[#17243b]"><LayoutDashboard size={16} />Overview</Link>
              <Link href="/dashboard/books" className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium text-[#68778a] transition hover:bg-[#f1efe8] hover:text-[#17243b]"><BookOpen size={16} />Books</Link>
              <Link href="/dashboard/categories" className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium text-[#68778a] transition hover:bg-[#f1efe8] hover:text-[#17243b]"><Tags size={16} />Categories</Link>
              <Link href="/dashboard/transactions" className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium text-[#68778a] transition hover:bg-[#f1efe8] hover:text-[#17243b]"><ClipboardList size={16} />Transactions</Link>
              <Link href="/dashboard/scan" className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium text-[#68778a] transition hover:bg-[#f1efe8] hover:text-[#17243b]"><QrCode size={16} />Scan a book</Link>
            </>}
            {!isGuest && isSuperAdmin && <>
              <Link href="/dashboard/users" className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium text-[#68778a] transition hover:bg-[#f1efe8] hover:text-[#17243b]"><Users size={16} />Users</Link>
              <Link href="/dashboard/logs" className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium text-[#68778a] transition hover:bg-[#f1efe8] hover:text-[#17243b]"><Activity size={16} />Audit trail</Link>
            </>}
          </nav>
        </header>
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 sm:py-7 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
