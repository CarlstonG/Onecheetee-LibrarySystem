"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { ArrowUpRight, BookOpen, CalendarClock, CalendarDays, CheckCircle2, Clock3, LoaderCircle, Search, ShieldCheck } from "lucide-react";
import BookQrScanner from "@/app/dashboard/qr-code-scanner";
import { formatDate } from "@/lib/format";
import type { Book, PublicBorrowStatus } from "@/lib/types";

interface CatalogResponse {
  books: Book[];
  borrowStatus: PublicBorrowStatus[];
  error?: string;
}

interface BookLookupResult {
  book: Book;
  borrowStatus?: PublicBorrowStatus;
}

export default function BookLookup({ canEdit }: { canEdit: boolean }) {
  const [lookup, setLookup] = useState<BookLookupResult | null>(null);
  const [scannedCode, setScannedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const requestId = useRef(0);
  const book = lookup?.book;
  const borrowedAt = lookup?.borrowStatus?.borrowed_at;

  const handleScan = useCallback(async (code: string) => {
    const currentRequest = ++requestId.current;
    setScannedCode(code);
    setLookup(null);
    setLoading(true);
    setError("");
    setCurrentTime(null);

    try {
      const response = await fetch(`/api/books?q=${encodeURIComponent(code)}`);
      const result = await response.json() as CatalogResponse;
      if (!response.ok) throw new Error(result.error || "Could not look up this book.");

      const book = result.books.find((item) => item.book_code.toLocaleLowerCase() === code.toLocaleLowerCase());
      if (!book) throw new Error(`No book matches catalog code "${code}". Check the QR code or try scanning again.`);
      const borrowStatus = result.borrowStatus.find((item) => item.book_id === book.id);
      if (currentRequest === requestId.current) {
        setLookup({ book, borrowStatus });
        setCurrentTime(Date.now());
      }
    } catch (reason) {
      if (currentRequest === requestId.current) {
        setError(reason instanceof Error ? reason.message : "Could not look up this book.");
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, []);

  const borrowedAtTime = borrowedAt ? new Date(borrowedAt).getTime() : Number.NaN;
  const daysOut = currentTime !== null && Number.isFinite(borrowedAtTime)
    ? Math.max(0, Math.floor((currentTime - borrowedAtTime) / 86_400_000))
    : null;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#e9e6de] bg-[#fbfaf6] p-5 sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f0eadc] text-[#a17d46]"><Search size={16} /></span>
          <div>
            <h2 className="text-sm font-semibold text-[#27364b]">Scan a book&apos;s QR code</h2>
            <p className="mt-1 text-[10px] leading-5 text-[#939ba3]">Scan the QR code containing the catalog code to check current book information and loan status.</p>
          </div>
        </div>
        <BookQrScanner onScan={handleScan} />
        <p className="mt-3 text-[10px] leading-5 text-[#939ba3]">This lookup is read-only. Borrower identity and contact information are not shown.</p>
      </section>

      {loading && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-[#e9e6de] bg-[#fbfaf6] p-5 text-xs text-[#778394]">
          <LoaderCircle size={16} className="animate-spin" /> Looking up {scannedCode}…
        </div>
      )}
      {error && <p role="alert" className="rounded-xl border border-[#edd8d2] bg-[#fff4f0] px-4 py-3 text-xs leading-5 text-[#9e5745]">{error}</p>}

      {book && (
        <article className="overflow-hidden rounded-xl border border-[#e9e6de] bg-[#fbfaf6]">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
            <div
              aria-hidden="true"
              className="mx-auto h-48 w-32 shrink-0 rounded-md bg-[#e9e5da] bg-cover bg-center sm:mx-0"
              style={book.cover_image_url ? { backgroundImage: `url("${book.cover_image_url}")` } : undefined}
            >
              {!book.cover_image_url && <div className="flex h-full items-center justify-center p-3 text-center"><BookOpen size={24} className="text-[#b69a64]" /></div>}
            </div>
            <div className="min-w-0 flex-1">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${book.status === "available" ? "bg-[#e6eee6] text-[#42684b]" : book.status === "borrowed" ? "bg-[#f5e8d2] text-[#8b6734]" : "bg-[#e7eaf0] text-[#56677d]"}`}>
                {book.status === "available" ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
                {book.status}
              </span>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[.2em] text-[#a17d46]">{book.book_code}</p>
              <h2 className="font-editorial mt-1 break-words text-2xl leading-tight text-[#17243b]">{book.title}</h2>
              <p className="mt-2 text-sm text-[#697687]">by {book.author}</p>
              <p className="mt-1 text-xs text-[#89929b]">{book.category_name || "Other / Needs Review"}</p>
              {book.isbn && <p className="mt-3 text-xs text-[#778394]">ISBN: {book.isbn}</p>}
              <div className="mt-4 flex items-center gap-2 text-xs text-[#778394]"><CalendarDays size={14} /> Published {formatDate(book.date_published)}</div>
              {book.short_description && <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-[#586578]">{book.short_description}</p>}
              {(book.author_url || book.pdf_url) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {book.author_url && <a href={book.author_url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-lg border border-[#e5e2da] bg-white px-3 text-[10px] font-semibold text-[#526174] hover:bg-[#f5f3ed]">Author reference <ArrowUpRight size={12} className="ml-1" /></a>}
                  {book.pdf_url && <a href={book.pdf_url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-lg bg-[#17243b] px-3 text-[10px] font-semibold text-white hover:bg-[#293b57]">Open PDF <ArrowUpRight size={12} className="ml-1" /></a>}
                </div>
              )}
              {canEdit && <Link href={`/dashboard/books?q=${encodeURIComponent(book.book_code)}`} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#17243b] px-4 text-xs font-semibold text-white hover:bg-[#293b57]">Edit book information <ArrowUpRight size={14} /></Link>}
            </div>
          </div>
          {book.status === "borrowed" && (
            <div className="grid gap-3 border-t border-[#eeece5] bg-[#f6f3eb] p-5 sm:grid-cols-3 sm:p-6">
              <div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#8b9298]">Borrowed</p><p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#526174]"><CalendarClock size={13} />{borrowedAt ? formatDate(borrowedAt) : "Date unavailable"}</p></div>
              <div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#8b9298]">Days out</p><p className="mt-1 text-sm font-semibold text-[#8b6734]">{daysOut === null ? currentTime === null ? "Calculating…" : "Unavailable" : `${daysOut} ${daysOut === 1 ? "day" : "days"}`}</p></div>
              <div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#8b9298]">Due date</p><p className="mt-1 text-xs font-medium text-[#526174]">{lookup.borrowStatus ? formatDate(lookup.borrowStatus.due_date) : "Date unavailable"}</p></div>
            </div>
          )}
          {canEdit && <p className="flex items-start gap-2 border-t border-[#eeece5] px-5 py-3 text-[10px] leading-5 text-[#778394] sm:px-6"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#9b7943]" /> Staff view. Borrower identity and contact details are available only in the authorized transactions dashboard.</p>}
        </article>
      )}
    </div>
  );
}
