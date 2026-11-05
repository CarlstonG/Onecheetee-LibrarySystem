"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDownRight, ArrowUpRight, BookOpen, CalendarDays, ChevronLeft, ChevronRight, ExternalLink, FileText, Search, Star, X } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { Book, BookCategory, PublicBorrowStatus } from "@/lib/types";

type CatalogResponse = { books: Book[]; borrowStatus: PublicBorrowStatus[]; categories: BookCategory[] };
const booksPerPage = 12;

const colors = [
  "from-[#596d79] to-[#263d4d]",
  "from-[#d3ad70] to-[#8d613e]",
  "from-[#829188] to-[#3f5b52]",
  "from-[#9d7680] to-[#614b62]",
  "from-[#8798a6] to-[#44576c]",
  "from-[#b77d52] to-[#7c493b]",
];

function BookCover({ book, index, large = false }: { book: Book; index: number; large?: boolean }) {
  return (
    <div
      className={`book-cover relative flex shrink-0 flex-col justify-between overflow-hidden rounded-sm bg-gradient-to-br ${colors[index % colors.length]} ${
        large ? "h-48 w-32 sm:h-64 sm:w-44" : "h-[204px] w-[142px]"
      }`}
      role="img"
      aria-label={book.cover_image_url ? `${book.title} cover` : `${book.title} cover placeholder`}
      style={book.cover_image_url ? { backgroundImage: `linear-gradient(180deg,transparent 35%,#122031cc),url("${book.cover_image_url}")`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
    >
      <div className="absolute inset-2 border border-white/30" />
      {!book.cover_image_url && (
        <div className="relative z-10 m-auto max-w-[85%] px-2 text-center text-white">
          <div className="mb-3 text-[10px] uppercase tracking-[.24em] opacity-80">OCT • Library</div>
          <span className={`font-editorial block leading-tight ${large ? "line-clamp-5 text-base sm:text-2xl" : "line-clamp-5 text-lg"}`}>{book.title}</span>
          <span className="mt-3 block text-[9px] uppercase tracking-[.18em] opacity-75">{book.author}</span>
        </div>
      )}
      <span className="relative z-10 p-3 text-[9px] uppercase tracking-[.16em] text-white/75">Bacong High School</span>
    </div>
  );
}

function Status({ status }: { status: Book["status"] }) {
  const available = status === "available";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize tracking-wide ${
      available ? "bg-[#e6eee6] text-[#42684b]" : status === "borrowed" ? "bg-[#f5e8d2] text-[#8b6734]" : "bg-[#e7eaf0] text-[#56677d]"
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${available ? "bg-[#5b8363]" : status === "borrowed" ? "bg-[#c18a32]" : "bg-[#697b91]"}`} />
      {status}
    </span>
  );
}

function Details({ book, index, due, onClose }: { book: Book; index: number; due?: PublicBorrowStatus; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    const handleClose = () => onClose();
    document.body.style.overflow = "hidden";
    dialog.addEventListener("close", handleClose);
    if (!dialog.open) dialog.showModal();

    return () => {
      dialog.removeEventListener("close", handleClose);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <dialog
      ref={dialogRef}
      className="book-details-backdrop"
      aria-modal="true"
      aria-labelledby="book-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="book-details-dialog flex w-full max-w-2xl min-w-0 flex-col overflow-hidden rounded-2xl bg-[#fbfaf6] p-3 shadow-2xl sm:p-6">
        <div className="flex shrink-0 justify-end">
          <button onClick={onClose} aria-label="Close book details" className="rounded-full p-2 text-[#647184] hover:bg-[#ece9e1]"><X size={18} /></button>
        </div>
        <div className="book-details-content min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-7">
        <div className="flex min-w-0 justify-center sm:justify-start"><BookCover book={book} index={index} large /></div>
        <div className="min-w-0 break-words pb-1 sm:pr-1 sm:pt-2">
          <Status status={book.status} />
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[.2em] text-[#a17d46]">{book.book_code}</p>
          <h2 id="book-title" className="font-editorial mt-2 break-words text-2xl leading-tight text-[#17243b] sm:text-3xl">{book.title}</h2>
          <p className="mt-2 text-sm text-[#697687]">by {book.author}</p>
          {book.category_name && <span className="mt-3 inline-flex rounded-full bg-[#f0eee7] px-2.5 py-1 text-[10px] text-[#7b6849]">{book.category_name}</span>}
          <div className="mt-5 flex items-center gap-2 text-xs text-[#778394]"><CalendarDays size={14} /> Published {formatDate(book.date_published)}</div>
          <p className="mt-5 break-words text-sm leading-6 text-[#586578]">{book.short_description || "A title in the Ong Che Tee - Bacong High School Library collection."}</p>
          {book.is_featured && book.featured_description && <p className="mt-4 break-words rounded-lg bg-[#f2eee4] p-3 text-xs leading-5 text-[#697687]">{book.featured_description}</p>}
          {(book.author_url || book.pdf_url) && <div className="mt-5 flex min-w-0 flex-wrap gap-2">
            {book.author_url && <a href={book.author_url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-2 break-all rounded-lg border border-[#e5e2da] bg-white px-3 py-2 text-[10px] font-semibold text-[#526174] hover:bg-[#f5f3ed]"><ExternalLink size={13} /> Author / reference link</a>}
            {book.pdf_url && <a href={book.pdf_url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-2 break-all rounded-lg bg-[#17243b] px-3 py-2 text-[10px] font-semibold text-white hover:bg-[#293b57]"><FileText size={13} /> Open PDF</a>}
          </div>}
          {book.status === "borrowed" && (
            <div className="mt-5 rounded-xl bg-[#f2eee4] p-4 text-xs text-[#697687]">
              <p className="font-semibold text-[#17243b]">Currently on loan</p>
              <p className="mt-1">Due {due ? formatDate(due.due_date) : "Date unavailable"}</p>
              {due && <p className="mt-1">Borrowed {formatDate(due.borrowed_at)}</p>}
            </div>
          )}
        </div>
        </div>
        </div>
      </section>
    </dialog>,
    document.body,
  );
}

export default function Catalog({ initialBooks = [] }: { initialBooks?: Book[] }) {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [borrowStatus, setBorrowStatus] = useState<PublicBorrowStatus[]>([]);
  const [selected, setSelected] = useState<Book | null>(null);
  const closeDetails = useCallback(() => setSelected(null), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/books?q=${encodeURIComponent(search)}`);
      const result = await response.json() as CatalogResponse & { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not load catalog.");
      setBooks(result.books);
      setBorrowStatus(result.borrowStatus);
      setCategories(result.categories);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load catalog.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(query), 240);
    return () => window.clearTimeout(timer);
  }, [load, query]);

  const dueByBook = useMemo(() => new Map(borrowStatus.map((row) => [row.book_id, row])), [borrowStatus]);
  const featuredBooks = useMemo(() => books.filter((book) => book.is_featured).slice(0, 6), [books]);
  const visibleBooks = useMemo(
    () => selectedCategory ? books.filter((book) => book.category_id === selectedCategory) : books,
    [books, selectedCategory],
  );
  const pageCount = Math.max(1, Math.ceil(visibleBooks.length / booksPerPage));
  const currentPage = Math.min(page, pageCount);
  const pageBooks = visibleBooks.slice((currentPage - 1) * booksPerPage, currentPage * booksPerPage);

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#a17d46]">The school collection</p>
          <h2 className="font-editorial mt-2 text-3xl text-[#17243b]">Find your next read</h2>
          <p className="mt-1 text-sm text-[#7a8693]">A little curiosity goes a long way.</p>
        </div>
        <label className="flex h-11 w-full items-center gap-3 rounded-xl border border-[#e7e4dc] bg-white px-4 text-[#7c8792] shadow-sm sm:max-w-[330px]">
          <Search size={16} />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Title, author, ISBN or code" className="w-full bg-transparent text-xs text-[#17243b] outline-none placeholder:text-[#a7adb3]" aria-label="Search books" />
          {query && <button type="button" aria-label="Clear search" onClick={() => { setQuery(""); setPage(1); }}><X size={14} /></button>}
        </label>
      </div>
      <div className="mb-4 flex items-center justify-between border-b border-[#e7e4dc] pb-3">
        <p className="text-xs font-semibold text-[#526174]">{loading ? "Searching…" : `${visibleBooks.length} ${visibleBooks.length === 1 ? "book" : "books"} in the collection`}</p>
        <span className="text-[10px] uppercase tracking-[.14em] text-[#9ba1a5]">Curated for curious minds</span>
      </div>
      {!query && (
        <section aria-labelledby="featured-books" className="mb-9 rounded-2xl border border-[#e9e2d2] bg-[#fbfaf6] p-4 sm:p-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div><p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#a17d46]">Handpicked by the librarian</p><h3 id="featured-books" className="font-editorial mt-1 text-2xl text-[#17243b]">Featured books</h3></div>
            {featuredBooks.length > 0 && <span className="text-[9px] text-[#929aa1]">{featuredBooks.length} featured</span>}
          </div>
          {featuredBooks.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {featuredBooks.map((book) => {
                const bookIndex = books.findIndex((item) => item.id === book.id);
                return <button key={book.id} onClick={() => setSelected(book)} className="group flex min-w-0 items-center gap-3 rounded-xl border border-[#eeece5] bg-white p-3 text-left transition hover:border-[#d8caa7] hover:shadow-sm">
                  <BookCover book={book} index={bookIndex} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[.14em] text-[#a17d46]"><Star size={11} /> Featured</span>
                    <span className="mt-1 block line-clamp-2 text-xs font-semibold text-[#27364b]">{book.title}</span>
                    <span className="mt-1 block truncate text-[10px] text-[#808b98]">{book.author}</span>
                    <span className="mt-2 block text-[9px] text-[#9b7943]">{book.category_name || "Other / Needs Review"}</span>
                  </span>
                  <ArrowUpRight size={14} className="shrink-0 text-[#b4a078] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </button>;
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-[#ded9ca] bg-white/70 px-4 py-5 text-center text-xs text-[#818b96]">
              Featured books selected by the librarian will appear here.
            </p>
          )}
        </section>
      )}
      <section aria-label="Filter by category" className="mb-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#7b8795]">Browse by category</p>
          {selectedCategory && <button onClick={() => { setSelectedCategory(null); setPage(1); }} className="text-[10px] font-semibold text-[#987644]">Clear category</button>}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button type="button" aria-pressed={!selectedCategory} onClick={() => { setSelectedCategory(null); setPage(1); }} className={`shrink-0 rounded-full border px-3 py-2 text-[10px] font-semibold transition ${!selectedCategory ? "border-[#17243b] bg-[#17243b] text-white" : "border-[#e5e2da] bg-white text-[#657386] hover:bg-[#f1efe8]"}`}>All categories</button>
          {categories.map((category) => {
            const count = books.filter((book) => book.category_id === category.id).length;
            if (!count) return null;
            const active = selectedCategory === category.id;
            return <button key={category.id} type="button" aria-pressed={active} onClick={() => { setSelectedCategory(active ? null : category.id); setPage(1); }} className={`shrink-0 rounded-full border px-3 py-2 text-[10px] font-semibold transition ${active ? "border-[#17243b] bg-[#17243b] text-white" : "border-[#e5e2da] bg-white text-[#657386] hover:bg-[#f1efe8]"}`}>{category.name}<span className={`ml-1.5 ${active ? "text-white/70" : "text-[#9ca1a2]"}`}>{count}</span></button>;
          })}
        </div>
      </section>
      {error ? (
        <div role="alert" className="rounded-xl border border-[#ead8b8] bg-[#fbf6eb] px-5 py-4 text-sm text-[#806641]">{error} Add your Supabase settings and run the database migration to connect the catalog.</div>
      ) : visibleBooks.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-[#d9d7ce] px-6 py-16 text-center">
          <BookOpen className="mx-auto text-[#b3a78e]" size={28} />
          <p className="font-editorial mt-4 text-xl text-[#344258]">{query || selectedCategory ? "No titles found" : "Your shelves are waiting"}</p>
          <p className="mt-2 text-xs text-[#8b9299]">{query ? "Try another title, author, ISBN, or book code." : selectedCategory ? "Try another category or clear the category filter." : "Books added by the library team will appear here."}</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {pageBooks.map((book) => {
            const index = books.findIndex((item) => item.id === book.id);
            return (
            <button key={book.id} onClick={() => setSelected(book)} className="group min-w-0 text-left">
              <div className="relative flex justify-center overflow-hidden rounded-xl bg-[#f0ede5] p-4 transition-colors group-hover:bg-[#eae6dc]">
                <BookCover book={book} index={index} />
                <span className="absolute bottom-5 right-5 translate-y-1 rounded-full bg-white/95 p-2 text-[#17243b] opacity-0 shadow transition-all group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight size={14} /></span>
              </div>
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-[#27364b]">{book.title}</h3>
                  <p className="mt-1 truncate text-xs text-[#808b98]">{book.author}</p>
                </div>
                <ArrowDownRight className="mt-0.5 shrink-0 text-[#b4a078]" size={14} />
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <Status status={book.status} />
                <span className="text-[9px] tracking-wide text-[#9ca1a2]">{book.book_code}</span>
              </div>
              <span className="mt-2 block truncate text-[9px] font-medium text-[#9b7943]">{book.category_name || "Other / Needs Review"}</span>
            </button>
          );})}
        </div>
        {pageCount > 1 && <nav aria-label="Catalog pages" className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#e5e2da] bg-white px-3 text-[10px] font-semibold text-[#536174] hover:bg-[#f1efe8] disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={14} /> Previous</button>
          <div role="radiogroup" aria-label="Choose catalog page" className="flex items-center gap-2">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => <label key={pageNumber} className="flex cursor-pointer items-center justify-center">
              <input type="radio" name="catalog-page" value={pageNumber} checked={currentPage === pageNumber} onChange={() => setPage(pageNumber)} aria-label={`Page ${pageNumber}`} className="peer sr-only" />
              <span className={`flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-[10px] font-semibold transition ${currentPage === pageNumber ? "border-[#17243b] bg-[#17243b] text-white" : "border-[#e5e2da] bg-white text-[#657386] hover:bg-[#f1efe8]"} peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#b6955a]`}>{pageNumber}</span>
            </label>)}
          </div>
          <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#e5e2da] bg-white px-3 text-[10px] font-semibold text-[#536174] hover:bg-[#f1efe8] disabled:cursor-not-allowed disabled:opacity-40">Next <ChevronRight size={14} /></button>
          <p className="w-full text-center text-[10px] text-[#929aa1]">Showing {(currentPage - 1) * booksPerPage + 1}–{Math.min(currentPage * booksPerPage, visibleBooks.length)} of {visibleBooks.length}</p>
        </nav>}
        </>
      )}
      {selected && <Details book={selected} index={books.findIndex((book) => book.id === selected.id)} due={dueByBook.get(selected.id)} onClose={closeDetails} />}
    </>
  );
}
