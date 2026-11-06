import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, BookOpen, CircleCheck, Clock3, Library } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import type { Book } from "@/lib/types";
import SetupNotice from "@/app/dashboard/setup-notice";

export const instant = false;

export default async function DashboardHome() {
  await connection();
  const profile = await requireRole(["guest", "admin", "super_admin"]);
  if (profile.role === "guest") redirect("/dashboard/scan");
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const supabase = await createClient();
  const [bookCount, availableCount, borrowedCount, activeRecords, recentBooks] = await Promise.all([
    supabase.from("books").select("*", { count: "exact", head: true }),
    supabase.from("books").select("*", { count: "exact", head: true }).eq("status", "available"),
    supabase.from("books").select("*", { count: "exact", head: true }).eq("status", "borrowed"),
    supabase.from("borrow_records").select("id,borrower_name,borrower_type,due_date,books(title)").is("returned_at", null).order("borrowed_at", { ascending: false }).limit(5),
    supabase.from("books").select("id,title,author,status,book_code").order("created_at", { ascending: false }).limit(5),
  ]);
  for (const result of [bookCount, availableCount, borrowedCount, activeRecords, recentBooks]) {
    if (result.error) throw new Error(`Could not load dashboard: ${result.error.message}`);
  }

  const stats = [
    { label: "Total books", value: bookCount.count ?? 0, icon: Library, tone: "bg-[#e9edf3] text-[#53677e]" },
    { label: "Available now", value: availableCount.count ?? 0, icon: CircleCheck, tone: "bg-[#e7eee6] text-[#5e7d5e]" },
    { label: "On loan", value: borrowedCount.count ?? 0, icon: Clock3, tone: "bg-[#f4ead7] text-[#a17d46]" },
  ];
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#a17d46]">Library operations</p><h1 className="font-editorial mt-2 text-3xl text-[#17243b]">Good day, librarian.</h1><p className="mt-1 text-xs text-[#7d8996]">Here&apos;s what&apos;s happening across your shelves.</p></div>
        <Link href="/dashboard/books" className="inline-flex items-center gap-2 self-start rounded-lg bg-[#17243b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#293b57] sm:self-auto">Manage catalog <ArrowRight size={14} /></Link>
      </div>
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, tone }) => <article key={label} className="rounded-xl border border-[#e9e6de] bg-[#fbfaf6] p-5 shadow-[0_8px_24px_-22px_rgba(23,36,59,.4)]"><div className="flex items-center justify-between"><p className="text-xs text-[#7c8792]">{label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}><Icon size={17} /></span></div><p className="font-editorial mt-4 text-3xl text-[#17243b]">{value}</p><p className="mt-1 text-[10px] text-[#9ba1a5]">Across the school library</p></article>)}
      </section>
      <section className="mt-8 grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border border-[#e9e6de] bg-[#fbfaf6]">
          <div className="flex items-center justify-between border-b border-[#eeece5] px-5 py-4"><div><h2 className="text-sm font-semibold text-[#27364b]">Current loans</h2><p className="mt-1 text-[10px] text-[#939ba3]">Books currently checked out</p></div><Link href="/dashboard/transactions" className="text-[10px] font-semibold text-[#9b7943] hover:text-[#6f542e]">View all →</Link></div>
          {activeRecords.data?.length ? <div className="divide-y divide-[#eeece5]">{activeRecords.data.map((record) => {
            const book = record.books as unknown as { title: string } | null;
            return <div key={record.id} className="flex items-center justify-between gap-4 px-5 py-3.5"><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#36455a]">{book?.title ?? "Unknown title"}</p><p className="mt-1 truncate text-[10px] text-[#8d96a0]">{record.borrower_name} · {record.borrower_type}</p></div><span className="shrink-0 rounded-full bg-[#f4ead7] px-2.5 py-1 text-[9px] text-[#9b7741]">Due {formatDate(record.due_date)}</span></div>;
          })}</div> : <div className="px-5 py-10 text-center text-xs text-[#959da3]">No books are currently on loan.</div>}
        </div>
        <div className="rounded-xl border border-[#e9e6de] bg-[#fbfaf6]">
          <div className="flex items-center justify-between border-b border-[#eeece5] px-5 py-4"><div><h2 className="text-sm font-semibold text-[#27364b]">Recently added</h2><p className="mt-1 text-[10px] text-[#939ba3]">New additions to the collection</p></div><BookOpen size={16} className="text-[#b69a64]" /></div>
          {recentBooks.data?.length ? <div className="divide-y divide-[#eeece5]">{(recentBooks.data as Pick<Book, "id" | "title" | "author" | "status" | "book_code">[]).map((book) => <div key={book.id} className="flex items-center justify-between gap-3 px-5 py-3.5"><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#36455a]">{book.title}</p><p className="mt-1 truncate text-[10px] text-[#8d96a0]">{book.author} · {book.book_code}</p></div><span className="text-[9px] capitalize text-[#89948c]">{book.status}</span></div>)}</div> : <div className="px-5 py-10 text-center text-xs text-[#959da3]">Your new additions will show here.</div>}
        </div>
      </section>
    </div>
  );
}
