import CoverImageField from "@/app/dashboard/books/cover-image-field";
import type { Book, BookCategory } from "@/lib/types";

export default function BookFormFields({ book, categories }: { book?: Book; categories: BookCategory[] }) {
  return (
    <>
      {book && <input type="hidden" name="id" value={book.id} />}
      <label className="text-[10px] font-semibold text-[#687687]">Catalog code *
        <input name="book_code" defaultValue={book?.book_code} required placeholder="OCT-001" className="mt-1.5 block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs font-normal outline-none focus:border-[#b6955a]" />
      </label>
      <label className="text-[10px] font-semibold text-[#687687]">Title *
        <input name="title" defaultValue={book?.title} required placeholder="Book title" className="mt-1.5 block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs font-normal outline-none focus:border-[#b6955a]" />
      </label>
      <label className="text-[10px] font-semibold text-[#687687]">Author *
        <input name="author" defaultValue={book?.author} required placeholder="Author name" className="mt-1.5 block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs font-normal outline-none focus:border-[#b6955a]" />
      </label>
      <label className="text-[10px] font-semibold text-[#687687]">Category
        <select name="category_id" defaultValue={book?.category_id ?? ""} className="mt-1.5 block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs font-normal">
          <option value="">Suggest from title</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
      <label className="text-[10px] font-semibold text-[#687687]">ISBN
        <input name="isbn" defaultValue={book?.isbn ?? ""} placeholder="ISBN" className="mt-1.5 block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs font-normal outline-none focus:border-[#b6955a]" />
      </label>
      <label className="text-[10px] font-semibold text-[#687687]">Publication date
        <input name="date_published" type="date" defaultValue={book?.date_published ?? ""} className="mt-1.5 block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs font-normal outline-none focus:border-[#b6955a]" />
      </label>
      <CoverImageField initialValue={book?.cover_image_url} />
      <label className="text-[10px] font-semibold text-[#687687] sm:col-span-2 lg:col-span-3">Short description
        <textarea name="short_description" defaultValue={book?.short_description ?? ""} rows={2} placeholder="A short introduction to the book" className="mt-1.5 block w-full rounded-lg border border-[#e5e2da] bg-white px-3 py-2 text-xs font-normal outline-none focus:border-[#b6955a]" />
      </label>
      <label className="flex items-center gap-2 text-[10px] font-semibold text-[#687687] sm:col-span-2 lg:col-span-3">
        <input name="is_featured" type="checkbox" defaultChecked={book?.is_featured ?? false} className="h-4 w-4 accent-[#17243b]" />
        Feature this book on the public homepage (maximum six featured books)
      </label>
      <label className="text-[10px] font-semibold text-[#687687] sm:col-span-2 lg:col-span-3">Featured description
        <textarea name="featured_description" defaultValue={book?.featured_description ?? ""} rows={2} placeholder="Optional highlight shown in the featured book details" className="mt-1.5 block w-full rounded-lg border border-[#e5e2da] bg-white px-3 py-2 text-xs font-normal outline-none focus:border-[#b6955a]" />
      </label>
      <label className="text-[10px] font-semibold text-[#687687]">Author / reference link
        <input name="author_url" type="url" defaultValue={book?.author_url ?? ""} placeholder="https://" className="mt-1.5 block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs font-normal outline-none focus:border-[#b6955a]" />
      </label>
      <label className="text-[10px] font-semibold text-[#687687]">PDF link
        <input name="pdf_url" type="url" defaultValue={book?.pdf_url ?? ""} placeholder="https://" className="mt-1.5 block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs font-normal outline-none focus:border-[#b6955a]" />
      </label>
    </>
  );
}
