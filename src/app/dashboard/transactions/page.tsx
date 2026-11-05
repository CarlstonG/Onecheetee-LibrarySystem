import { connection } from "next/server";
import { AlertCircle, CalendarClock, Check, ClipboardList } from "lucide-react";
import { approveReturn, checkoutBook } from "@/app/actions";
import { formatDate } from "@/lib/format";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Book, BorrowRecord } from "@/lib/types";
import SetupNotice from "@/app/dashboard/setup-notice";

export const instant = false;

export default async function TransactionsPage() {
  await connection();
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const supabase = await createClient();
  const [bookResult, recordsResult] = await Promise.all([
    supabase.from("books").select("id,title,book_code,status").eq("status", "available").order("title"),
    supabase.from("borrow_records").select("id,book_id,borrower_name,borrower_type,section,address,borrowed_at,due_date,returned_at,approved_by,books(title,book_code)").is("returned_at", null).order("due_date"),
  ]);
  if (bookResult.error) throw new Error(`Could not load available books: ${bookResult.error.message}`);
  if (recordsResult.error) throw new Error(`Could not load active transactions: ${recordsResult.error.message}`);
  const availableBooks = (bookResult.data ?? []) as Pick<Book, "id" | "title" | "book_code" | "status">[];
  const records = (recordsResult.data ?? []) as unknown as BorrowRecord[];
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div>
      <div><p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#a17d46]">Circulation desk</p><h1 className="font-editorial mt-2 text-3xl text-[#17243b]">Book transactions</h1><p className="mt-1 text-xs text-[#7d8996]">Record checkouts and verify returned books.</p></div>
      <section className="mt-7 rounded-xl border border-[#e9e6de] bg-[#fbfaf6] p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e9edf3] text-[#53677e]"><ClipboardList size={17} /></span><div><h2 className="text-sm font-semibold text-[#27364b]">Check out a book</h2><p className="mt-1 text-[10px] text-[#939ba3]">Borrower details are visible only to authorized staff.</p></div></div>
        {availableBooks.length ? <form action={checkoutBook} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-[10px] font-semibold text-[#687687] sm:col-span-2 lg:col-span-3">Book *
            <select name="book_id" required defaultValue="" className="mt-1.5 block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs"><option value="" disabled>Select an available book</option>{availableBooks.map((book) => <option key={book.id} value={book.id}>{book.title} · {book.book_code}</option>)}</select>
          </label>
          <label className="text-[10px] font-semibold text-[#687687]">Borrower name *<input name="borrower_name" required className="mt-1.5 block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs font-normal" /></label>
          <label className="text-[10px] font-semibold text-[#687687]">Borrower type *
            <select name="borrower_type" required defaultValue="" className="mt-1.5 block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs"><option value="" disabled>Select type</option><option value="student">Student</option><option value="faculty">Faculty</option><option value="outsider">Outsider</option></select>
          </label>
          <label className="text-[10px] font-semibold text-[#687687]">Due date *<input name="due_date" type="datetime-local" required min={today} defaultValue={`${today}T16:00`} className="mt-1.5 block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs font-normal" /></label>
          <label className="text-[10px] font-semibold text-[#687687]">Grade / section / department<input name="section" className="mt-1.5 block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs font-normal" /></label>
          <label className="text-[10px] font-semibold text-[#687687] sm:col-span-2 lg:col-span-2">Contact / home address<input name="address" className="mt-1.5 block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs font-normal" /></label>
          <button className="h-10 rounded-lg bg-[#17243b] px-4 text-xs font-semibold text-white hover:bg-[#293b57]">Confirm checkout</button>
        </form> : <p className="rounded-lg bg-[#f2f0e9] px-4 py-3 text-xs text-[#7c8792]">There are no available books to check out right now.</p>}
      </section>
      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between"><div><h2 className="text-sm font-semibold text-[#27364b]">Active loans</h2><p className="mt-1 text-[10px] text-[#939ba3]">Outstanding checkouts and return approvals.</p></div><span className="rounded-full bg-[#f1eee5] px-3 py-1 text-[10px] text-[#8a7959]">{records.length} active</span></div>
        <div className="space-y-3">
          {records.map((record) => {
            const book = record.books;
            const overdue = record.due_date.slice(0, 10) < today;
            return <article key={record.id} className="grid gap-4 rounded-xl border border-[#e9e6de] bg-[#fbfaf6] p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h3 className="text-xs font-semibold text-[#344258]">{book?.title ?? "Unknown title"}</h3><span className="text-[9px] text-[#9ba1a5]">{book?.book_code}</span></div>
                <p className="mt-1 text-[10px] text-[#778394]">{record.borrower_name} · <span className="capitalize">{record.borrower_type}</span>{record.section ? ` · ${record.section}` : ""}</p>
                <div className={`mt-2 flex items-center gap-1.5 text-[10px] ${overdue ? "text-[#a45a4b]" : "text-[#89939c]"}`}>{overdue ? <AlertCircle size={12} /> : <CalendarClock size={12} />} Borrowed {formatDate(record.borrowed_at)} · Due {formatDate(record.due_date)}{overdue && <span className="font-semibold"> · Overdue</span>}</div>
                {record.address && <p className="mt-1 text-[10px] text-[#9ba1a5]">Address: {record.address}</p>}
              </div>
              <form action={approveReturn}><input type="hidden" name="record_id" value={record.id} /><button className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#dce7dc] bg-[#f4f8f2] px-3 text-[10px] font-semibold text-[#5d785d] hover:bg-[#eaf2e8]"><Check size={14} /> Approve return</button></form>
            </article>;
          })}
          {!records.length && <div className="rounded-xl border border-dashed border-[#d9d7ce] px-6 py-12 text-center text-xs text-[#929aa1]">No active loans. New checkouts will appear here.</div>}
        </div>
      </section>
    </div>
  );
}
