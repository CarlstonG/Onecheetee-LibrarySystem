"use client";

import { useCallback, useState } from "react";
import { checkoutBook } from "@/app/actions";
import BookQrScanner from "@/app/dashboard/qr-code-scanner";

interface AvailableBook {
  id: string;
  title: string;
  book_code: string;
}

export default function BookCheckoutForm({ books, today }: { books: AvailableBook[]; today: string }) {
  const [bookId, setBookId] = useState("");
  const [scanError, setScanError] = useState("");
  const [scanNotice, setScanNotice] = useState("");

  const handleScan = useCallback((code: string) => {
    const book = books.find((item) => item.book_code.toLocaleLowerCase() === code.toLocaleLowerCase());
    if (!book) {
      setScanError(`No available book matches catalog code "${code}". Try another QR code or choose a book manually.`);
      setScanNotice("");
      return;
    }

    setBookId(book.id);
    setScanNotice(`Scanned ${book.title} · ${book.book_code}`);
    setScanError("");
  }, [books]);

  const selectBook = useCallback((id: string) => {
    setBookId(id);
    setScanNotice("");
    setScanError("");
  }, []);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <BookQrScanner onScan={handleScan} />
        {scanError && <p role="alert" className="basis-full text-xs leading-5 text-[#9e5745]">{scanError}</p>}
      </div>
      {scanNotice && <p role="status" className="mb-3 rounded-lg border border-[#dce7dc] bg-[#f4f8f2] px-3 py-2.5 text-xs text-[#5d785d]">{scanNotice}</p>}
      <form action={checkoutBook} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3">
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label htmlFor="checkout-book" className="text-[10px] font-semibold text-[#687687]">Book *</label>
          </div>
          <select id="checkout-book" name="book_id" required value={bookId} onChange={(event) => selectBook(event.target.value)} className="block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs">
            <option value="" disabled>Select an available book</option>
            {books.map((book) => <option key={book.id} value={book.id}>{book.title} · {book.book_code}</option>)}
          </select>
        </div>
        <label className="text-[10px] font-semibold text-[#687687]">Borrower name *<input name="borrower_name" required className="mt-1.5 block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs font-normal" /></label>
        <label className="text-[10px] font-semibold text-[#687687]">Borrower type *
          <select name="borrower_type" required defaultValue="" className="mt-1.5 block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs"><option value="" disabled>Select type</option><option value="student">Student</option><option value="faculty">Faculty</option><option value="outsider">Outsider</option></select>
        </label>
        <label className="text-[10px] font-semibold text-[#687687]">Due date *<input name="due_date" type="datetime-local" required min={today} defaultValue={`${today}T16:00`} className="mt-1.5 block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs font-normal" /></label>
        <label className="text-[10px] font-semibold text-[#687687]">Grade / section / department<input name="section" className="mt-1.5 block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs font-normal" /></label>
        <label className="text-[10px] font-semibold text-[#687687] sm:col-span-2 lg:col-span-2">Contact / home address<input name="address" className="mt-1.5 block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs font-normal" /></label>
        <button className="h-10 rounded-lg bg-[#17243b] px-4 text-xs font-semibold text-white hover:bg-[#293b57]">Confirm checkout</button>
      </form>
    </>
  );
}
