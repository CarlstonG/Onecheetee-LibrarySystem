import { connection } from "next/server";
import { Plus, Search } from "lucide-react";
import { deleteBook, importBooks, saveBook } from "@/app/actions";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Book, BookCategory } from "@/lib/types";
import SetupNotice from "@/app/dashboard/setup-notice";
import BookFormFields from "@/app/dashboard/books/book-form-fields";

export const instant = false;

export default async function BooksPage({ searchParams }: PageProps<"/dashboard/books">) {
  await connection();
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const params = await searchParams;
  const supabase = await createClient();
  const [bookResult, categoryResult] = await Promise.all([
    supabase.from("books").select("*").order("title").limit(1000),
    supabase.from("book_categories").select("id,name,slug,created_at").order("name"),
  ]);
  if (bookResult.error) throw new Error(`Could not load books: ${bookResult.error.message}`);
  if (categoryResult.error) throw new Error(`Could not load book categories: ${categoryResult.error.message}`);
  const categories = (categoryResult.data ?? []) as BookCategory[];
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const books = (bookResult.data ?? []).map((book) => ({
    ...book,
    category_name: categoryById.get(book.category_id)?.name ?? "Other / Needs Review",
    category_slug: categoryById.get(book.category_id)?.slug ?? "other-needs-review",
  })) as Book[];
  const query = typeof params.q === "string" ? params.q.toLowerCase() : "";
  const filteredBooks = books.filter((book) => !query || `${book.title} ${book.author} ${book.book_code}`.toLowerCase().includes(query));
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#a17d46]">Collection</p><h1 className="font-editorial mt-2 text-3xl text-[#17243b]">Book catalog</h1><p className="mt-1 text-xs text-[#7d8996]">Add, update, and maintain the library collection.</p></div><a href="#add-book" className="inline-flex items-center gap-2 self-start rounded-lg bg-[#17243b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#293b57] sm:self-auto"><Plus size={14} /> Add a book</a></div>
      <form className="mt-7 flex max-w-sm items-center gap-2 rounded-lg border border-[#e5e2da] bg-[#fbfaf6] px-3 py-2.5"><Search size={15} className="text-[#8993a0]" /><input name="q" defaultValue={typeof params.q === "string" ? params.q : ""} placeholder="Filter by title or author" className="min-w-0 flex-1 bg-transparent text-xs outline-none" /><button className="text-[10px] font-semibold text-[#987644]">Filter</button></form>
      {params.error && <p role="alert" className="mt-4 text-xs text-[#9e5745]">{params.error}</p>}
      {params.imported && <p role="status" className="mt-4 text-xs text-[#587355]">Imported {params.imported} books into the catalog.</p>}
      <section id="add-book" className="mt-5 scroll-mt-4 rounded-xl border border-[#e9e6de] bg-[#fbfaf6] p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0eadc] text-[#a17d46]"><Plus size={17} /></span><div><h2 className="text-sm font-semibold text-[#27364b]">Add a title</h2><p className="mt-1 text-[10px] text-[#939ba3]">Enter the key details for this book.</p></div></div>
        <form action={saveBook} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <BookFormFields categories={categories} />
          <button className="h-10 rounded-lg bg-[#17243b] px-4 text-xs font-semibold text-white hover:bg-[#293b57] sm:col-span-2 lg:col-span-1">Add to collection</button>
        </form>
      </section>
      <details className="mt-5 rounded-xl border border-[#e9e6de] bg-[#fbfaf6] p-4">
        <summary className="cursor-pointer text-xs font-semibold text-[#42536a]">Import books from CSV or JSON</summary>
        <p className="mt-2 text-[10px] leading-5 text-[#8b949e]">Include <code>book_code</code> and <code>title</code>. <code>author</code> is optional; missing authors are set to “Not listed yet” so the librarian can update them later. Other optional columns: <code>isbn</code>, <code>date_published</code> (YYYY-MM-DD), <code>short_description</code>, and <code>cover_image_url</code>. Up to 500 books, 5 MB per file. Existing catalog codes are not overwritten.</p>
        <form action={importBooks} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input name="file" type="file" accept=".csv,.json,text/csv,application/json" required className="block w-full text-[10px] text-[#7d8996] file:mr-3 file:rounded-md file:border-0 file:bg-[#f0eee7] file:px-3 file:py-2 file:text-[10px] file:font-semibold file:text-[#42536a] sm:max-w-sm" />
          <button className="h-9 shrink-0 rounded-lg border border-[#ded9ca] px-4 text-[10px] font-semibold text-[#42536a] hover:bg-[#f2f0e9]">Import file</button>
        </form>
      </details>
      <div className="mt-5 overflow-visible rounded-xl border border-[#e9e6de] bg-[#fbfaf6]">
        <table className="w-full table-fixed text-left">
            <thead className="bg-[#f3f1ea] text-[9px] uppercase tracking-[.16em] text-[#8e969c]"><tr><th className="w-auto px-3 py-3 sm:px-5">Book title</th><th className="hidden px-4 py-3 sm:table-cell">Catalog code</th><th className="hidden px-4 py-3 sm:table-cell">Status</th><th className="hidden px-4 py-3 sm:table-cell">Published</th><th className="w-[64px] px-2 py-3 text-right sm:w-auto sm:px-4">Edit</th></tr></thead>
            <tbody className="divide-y divide-[#eeece5]">
              {filteredBooks.map((book) => <tr key={book.id} className="text-xs text-[#687687]"><td className="break-words px-3 py-4 sm:px-5"><span className="block font-semibold text-[#344258]">{book.title}</span><span className="mt-1 block text-[10px] text-[#929aa1]">{book.author}</span><span className="mt-1 block text-[9px] text-[#9b7943]">{book.category_name || "Other / Needs Review"}{book.is_featured ? " · Featured" : ""}</span><span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] sm:hidden"><span>{book.book_code}</span><span className="capitalize">{book.status}</span><span>{book.date_published || "Not dated"}</span></span></td><td className="hidden px-4 py-4 text-[10px] sm:table-cell">{book.book_code}</td><td className="hidden px-4 py-4 sm:table-cell"><span className="rounded-full bg-[#e7eee6] px-2.5 py-1 text-[9px] capitalize text-[#5b795c]">{book.status}</span></td><td className="hidden px-4 py-4 text-[10px] sm:table-cell">{book.date_published || "—"}</td><td className="px-2 py-4 text-right sm:px-4"><details className="relative inline-block text-left"><summary className="cursor-pointer rounded border border-[#e5e2da] px-2.5 py-1.5 text-[10px]">Edit</summary><div className="absolute right-0 z-10 mt-2 max-h-[80vh] w-[min(90vw,440px)] overflow-y-auto rounded-xl border border-[#e5e2da] bg-white p-4 text-left shadow-xl"><form action={saveBook} className="grid gap-3 sm:grid-cols-2"><BookFormFields book={book} categories={categories} /><button className="rounded bg-[#17243b] py-2 text-xs font-semibold text-white sm:col-span-2">Save changes</button></form><form action={deleteBook} className="mt-2"><input type="hidden" name="id" value={book.id} /><button className="w-full rounded border border-[#edd8d2] py-2 text-xs text-[#a25c4c]">Delete book</button></form></div></details></td></tr>)}
              {!filteredBooks.length && <tr><td colSpan={5} className="px-5 py-12 text-center text-xs text-[#929aa1]">{books.length ? "No books match your filter." : "No books have been added to the catalog yet."}</td></tr>}
            </tbody>
        </table>
      </div>
    </div>
  );
}
