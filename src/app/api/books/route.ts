import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/server";
import type { Book, BookCategory, PublicBorrowStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Connect Supabase to load the live catalog." }, { status: 503 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const supabase = await createClient();
  const [bookResult, categoryResult] = await Promise.all([
    supabase.rpc("search_public_books", { p_query: query }),
    supabase.from("book_categories").select("id,name,slug,created_at").order("name"),
  ]);
  const { data: books, error } = bookResult;
  if (error) {
    return NextResponse.json({ error: `Catalog search failed: ${error.message}` }, { status: 500 });
  }
  if (categoryResult.error) {
    return NextResponse.json({ error: `Catalog categories could not be loaded: ${categoryResult.error.message}` }, { status: 500 });
  }

  const bookList = (books ?? []) as Book[];
  const borrowed = bookList.filter((book) => book.status === "borrowed").map((book) => book.id);
  let borrowStatus: PublicBorrowStatus[] = [];
  if (borrowed.length) {
    const { data, error: statusError } = await supabase
      .from("public_borrow_status")
      .select("book_id,borrowed_at,due_date")
      .in("book_id", borrowed);
    if (statusError) {
      return NextResponse.json({ error: `Borrow status could not be loaded: ${statusError.message}` }, { status: 500 });
    }
    borrowStatus = (data ?? []) as PublicBorrowStatus[];
  }
  return NextResponse.json({ books: bookList, borrowStatus, categories: categoryResult.data as BookCategory[] });
}
