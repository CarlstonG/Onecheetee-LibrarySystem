import { connection } from "next/server";
import Link from "next/link";
import { ArrowUpRight, FileText, Plus, Star, Tags } from "lucide-react";
import { deleteCategory, saveCategory } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { BookCategory } from "@/lib/types";

export const instant = false;

export default async function CategoriesPage({ searchParams }: PageProps<"/dashboard/categories">) {
  await connection();
  await requireAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const [categoryResult, featuredResult] = await Promise.all([
    supabase.from("book_categories").select("id,name,slug,created_at").order("name"),
    supabase
      .from("books")
      .select("id,title,author,book_code,cover_image_url,category_id,featured_description,author_url,pdf_url")
      .eq("is_featured", true)
      .order("title")
      .limit(6),
  ]);
  if (categoryResult.error) throw new Error(`Could not load book categories: ${categoryResult.error.message}`);
  if (featuredResult.error) throw new Error(`Could not load featured books: ${featuredResult.error.message}`);

  const categories = (categoryResult.data ?? []) as BookCategory[];
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const featuredBooks = featuredResult.data ?? [];
  return (
    <div>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#a17d46]">Collection settings</p>
        <h1 className="font-editorial mt-2 text-3xl text-[#17243b]">Book categories</h1>
        <p className="mt-1 text-xs text-[#7d8996]">Keep the public catalog organized. Categories with assigned books can’t be deleted until those books are moved.</p>
      </div>
      {params.error && <p role="alert" className="mt-5 rounded-lg border border-[#edd8d2] bg-[#fff4f0] px-4 py-3 text-xs text-[#a25c4c]">{params.error}</p>}
      {(params.saved || params.deleted) && <p role="status" className="mt-5 rounded-lg border border-[#dce7dc] bg-[#f4f8f2] px-4 py-3 text-xs text-[#5d785d]">Category changes saved.</p>}

      <section className="mt-7 overflow-hidden rounded-xl border border-[#e9e2d2] bg-[#fbfaf6]">
        <div className="flex flex-col justify-between gap-3 border-b border-[#eeece5] px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2"><Star size={15} className="text-[#b69a64]" /><h2 className="text-sm font-semibold text-[#27364b]">Featured content</h2></div>
            <p className="mt-1 text-[10px] text-[#939ba3]">These picks appear on the public homepage. Feature or edit books from the catalog.</p>
          </div>
          <Link href="/dashboard/books" className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-lg border border-[#ded9ca] px-3 text-[10px] font-semibold text-[#42536a] hover:bg-[#f2f0e9] sm:self-auto">
            Manage books <ArrowUpRight size={13} />
          </Link>
        </div>
        {featuredBooks.length ? (
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {featuredBooks.map((book) => (
              <Link key={book.id} href={`/dashboard/books?q=${encodeURIComponent(book.title)}`} className="group flex min-w-0 items-center gap-3 rounded-lg border border-[#eeece5] bg-white p-3 transition hover:border-[#d8caa7] hover:shadow-sm">
                <div
                  aria-hidden="true"
                  className="h-16 w-12 shrink-0 rounded bg-[#e9e5da] bg-cover bg-center"
                  style={book.cover_image_url ? { backgroundImage: `url("${book.cover_image_url}")` } : undefined}
                >
                  {!book.cover_image_url && <div className="flex h-full items-center justify-center"><Star size={16} className="text-[#b69a64]" /></div>}
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-[#344258]">{book.title}</span>
                  <span className="mt-1 block truncate text-[10px] text-[#8b949e]">{book.author}</span>
                  <span className="mt-1 block truncate text-[9px] text-[#9b7943]">{categoryNames.get(book.category_id) || "Other / Needs Review"} · {book.book_code}</span>
                  {(book.featured_description || book.author_url || book.pdf_url) && (
                    <span className="mt-2 flex items-center gap-2 text-[9px] text-[#7b8795]">
                      {book.featured_description && <span className="truncate">Description added</span>}
                      {book.author_url && <span>Author link</span>}
                      {book.pdf_url && <span className="inline-flex items-center gap-1"><FileText size={10} /> PDF</span>}
                    </span>
                  )}
                </span>
                <ArrowUpRight size={14} className="shrink-0 text-[#b4a078] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-5 py-7 text-center">
            <p className="text-xs font-medium text-[#526174]">No featured books yet</p>
            <p className="mt-1 text-[10px] text-[#939ba3]">Open a book in the catalog and select “Feature this book on the public homepage”.</p>
            <Link href="/dashboard/books" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#17243b] px-3 py-2 text-[10px] font-semibold text-white hover:bg-[#293b57]">Choose featured books <ArrowUpRight size={12} /></Link>
          </div>
        )}
      </section>

      <section className="mt-7 rounded-xl border border-[#e9e6de] bg-[#fbfaf6] p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0eadc] text-[#a17d46]"><Plus size={17} /></span>
          <div><h2 className="text-sm font-semibold text-[#27364b]">Add a category</h2><p className="mt-1 text-[10px] text-[#939ba3]">For example, “Literature” or “Reference”.</p></div>
        </div>
        <form action={saveCategory} className="flex flex-col gap-3 sm:flex-row">
          <input name="name" required maxLength={60} placeholder="New category name" className="h-10 min-w-0 flex-1 rounded-lg border border-[#e5e2da] bg-white px-3 text-xs outline-none focus:border-[#b6955a]" />
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#17243b] px-4 text-xs font-semibold text-white hover:bg-[#293b57]"><Plus size={14} /> Add category</button>
        </form>
      </section>

      <section className="mt-5 overflow-hidden rounded-xl border border-[#e9e6de] bg-[#fbfaf6]">
        <div className="border-b border-[#eeece5] px-5 py-4">
          <div className="flex items-center gap-2"><Tags size={15} className="text-[#b69a64]" /><h2 className="text-sm font-semibold text-[#27364b]">Editable categories</h2></div>
          <p className="mt-1 text-[10px] text-[#939ba3]">{categories.length} categories</p>
        </div>
        <div className="divide-y divide-[#eeece5]">
          {categories.map((category) => {
            const isReviewCategory = category.slug === "other-needs-review";
            return <div key={category.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f1eee5] text-[#8a7959]"><Tags size={14} /></span>
              <form action={saveCategory} className="flex min-w-0 flex-1 gap-2">
                <input type="hidden" name="id" value={category.id} />
                <input name="name" defaultValue={category.name} required maxLength={60} disabled={isReviewCategory} aria-label={`Category name for ${category.name}`} className="h-9 min-w-0 flex-1 rounded-md border border-[#e5e2da] bg-white px-3 text-xs disabled:bg-[#f3f1ea] disabled:text-[#818995]" />
                <button disabled={isReviewCategory} className="h-9 rounded-md border border-[#ded9ca] px-3 text-[10px] font-semibold text-[#42536a] hover:bg-[#f2f0e9] disabled:cursor-not-allowed disabled:opacity-50">Save</button>
              </form>
              {!isReviewCategory && <form action={deleteCategory}><input type="hidden" name="category_id" value={category.id} /><button className="h-9 rounded-md border border-[#edd8d2] px-3 text-[10px] font-medium text-[#a25c4c] hover:bg-[#fff4f0]">Delete</button></form>}
              {isReviewCategory && <span className="text-[9px] text-[#939ba3]">Default for titles that need review</span>}
            </div>;
          })}
          {!categories.length && <div className="px-5 py-10 text-center text-xs text-[#929aa1]">No categories yet. Add one above.</div>}
        </div>
      </section>
    </div>
  );
}
