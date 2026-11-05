"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { BorrowerType } from "@/lib/types";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/login?error=Enter+your+email+and+password");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback` },
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  if (data.url) redirect(data.url);
  redirect("/login?error=Could+not+start+Google+sign+in");
}

export async function saveBook(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "") || null;
  const bookCode = String(formData.get("book_code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const authorUrl = String(formData.get("author_url") ?? "").trim() || null;
  const pdfUrl = String(formData.get("pdf_url") ?? "").trim() || null;
  if (!bookCode || !title || !author) throw new Error("Book code, title, and author are required.");
  for (const [label, value] of [["Author link", authorUrl], ["PDF link", pdfUrl]] as const) {
    if (!value) continue;
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`${label} must be a valid URL.`);
    }
    if (!["http:", "https:"].includes(url.protocol)) throw new Error(`${label} must use http or https.`);
  }
  const featuredDescription = String(formData.get("featured_description") ?? "").trim() || null;
  const { error } = await supabase.rpc("save_book", {
    p_id: id,
    p_book_code: bookCode,
    p_isbn: String(formData.get("isbn") ?? "").trim() || null,
    p_title: title,
    p_author: author,
    p_date_published: String(formData.get("date_published") ?? "") || null,
    p_short_description: String(formData.get("short_description") ?? "").trim() || null,
    p_cover_image_url: String(formData.get("cover_image_url") ?? "").trim() || null,
    p_category_id: String(formData.get("category_id") ?? "") || null,
    p_is_featured: formData.get("is_featured") === "on",
    p_featured_description: featuredDescription,
    p_author_url: authorUrl,
    p_pdf_url: pdfUrl,
  });
  if (error) throw new Error(`Could not save book: ${error.message}`);
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/books");
  revalidatePath("/dashboard/categories");
}

export async function importBooks(formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!file || typeof file === "string" || file.size === 0) throw new Error("Choose a CSV or JSON file to import.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Import files must be 5 MB or smaller.");

  const extension = file.name.split(".").pop()?.toLowerCase();
  const content = await file.text();
  let rows: unknown[];
  if (extension === "json") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("The JSON file is not valid JSON.");
    }
    if (!Array.isArray(parsed)) throw new Error("The JSON file must contain an array of book records.");
    rows = parsed;
  } else if (extension === "csv") {
    const parsed = Papa.parse<Record<string, string>>(content, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim().toLowerCase(),
    });
    if (parsed.errors.length) throw new Error(`Could not read CSV: ${parsed.errors[0].message}`);
    rows = parsed.data;
  } else {
    throw new Error("Only .csv and .json files are supported.");
  }

  if (!rows.length) throw new Error("The import file does not contain any book rows.");
  if (rows.length > 500) throw new Error("Import up to 500 books at a time.");
  const books = rows.map((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error(`Row ${index + 1} must be an object.`);
    const values = row as Record<string, unknown>;
    const field = (name: string) => typeof values[name] === "string" ? (values[name] as string).trim() : "";
    const book = {
      book_code: field("book_code"),
      isbn: field("isbn") || null,
      title: field("title"),
      author: field("author") || "Not listed yet",
      date_published: field("date_published") || null,
      short_description: field("short_description") || null,
      cover_image_url: field("cover_image_url") || null,
    };
    if (!book.book_code || !book.title) {
      throw new Error(`Row ${index + 1} must include book_code and title.`);
    }
    if (book.date_published && (!/^\d{4}-\d{2}-\d{2}$/.test(book.date_published) || Number.isNaN(Date.parse(book.date_published)))) {
      throw new Error(`Row ${index + 1} has an invalid date_published value; use YYYY-MM-DD.`);
    }
    if (book.cover_image_url) {
      try {
        const url = new URL(book.cover_image_url);
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
      } catch {
        throw new Error(`Row ${index + 1} has an invalid cover_image_url.`);
      }
    }
    return book;
  });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("import_books", { p_books: books });
  if (error) throw new Error(`Could not import catalog: ${error.message}`);
  const count = typeof data === "number" ? data : books.length;
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/books");
  redirect(`/dashboard/books?imported=${count}`);
}

export async function deleteBook(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Book ID is required.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_book_by_id", { p_book_id: id });
  if (error) throw new Error(`Could not delete book: ${error.message}`);
  revalidatePath("/");
  revalidatePath("/dashboard/books");
}

export async function checkoutBook(formData: FormData) {
  const admin = await requireAdmin();
  const bookId = String(formData.get("book_id") ?? "");
  const borrowerName = String(formData.get("borrower_name") ?? "").trim();
  const borrowerType = String(formData.get("borrower_type") ?? "") as BorrowerType;
  const section = String(formData.get("section") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "");
  if (!bookId || !borrowerName || !dueDate || !["student", "faculty", "outsider"].includes(borrowerType)) {
    throw new Error("Complete all required checkout fields.");
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("checkout_book", {
    p_book_id: bookId,
    p_borrower_name: borrowerName,
    p_borrower_type: borrowerType,
    p_section: section || null,
    p_address: address || null,
    p_due_date: dueDate,
    p_approved_by: admin.id,
  });
  if (error) throw new Error(`Could not check out book: ${error.message}`);
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
}

export async function approveReturn(formData: FormData) {
  const admin = await requireAdmin();
  const recordId = String(formData.get("record_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_book_return", {
    p_record_id: recordId,
    p_approved_by: admin.id,
  });
  if (error) throw new Error(`Could not approve return: ${error.message}`);
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
}

export async function assignRole(formData: FormData) {
  const admin = await requireSuperAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!userId || !["admin", "guest"].includes(role)) throw new Error("Choose a valid user and role.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("assign_profile_role", {
    p_user_id: userId,
    p_role: role,
    p_admin_id: admin.id,
  });
  if (error) throw new Error(`Could not assign role: ${error.message}`);
  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/logs");
}

export async function saveCategory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 60) redirect("/dashboard/categories?error=Category+name+must+be+1+to+60+characters");
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) redirect("/dashboard/categories?error=Enter+a+category+name+with+letters+or+numbers");

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_book_category", { p_id: id, p_name: name, p_slug: slug });
  if (error) redirect(`/dashboard/categories?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/");
  revalidatePath("/dashboard/books");
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/logs");
  redirect("/dashboard/categories?saved=1");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("category_id") ?? "");
  if (!id) redirect("/dashboard/categories?error=Category+ID+is+required");
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_book_category", { p_id: id });
  if (error) redirect(`/dashboard/categories?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/");
  revalidatePath("/dashboard/books");
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/logs");
  redirect("/dashboard/categories?deleted=1");
}

export async function confirmPendingUser(formData: FormData) {
  const admin = await requireSuperAdmin();
  const userId = String(formData.get("user_id") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    redirect("/dashboard/users?error=Invalid+user+ID");
  }

  const supabaseAdmin = createAdminClient();
  const { data: userResult, error: lookupError } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (lookupError) redirect(`/dashboard/users?error=${encodeURIComponent(`Could not find account: ${lookupError.message}`)}`);
  if (!userResult.user) redirect("/dashboard/users?error=Account+not+found");
  if (userResult.user.email_confirmed_at) redirect("/dashboard/users?error=This+account+is+already+confirmed");

  const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });
  if (confirmError) redirect(`/dashboard/users?error=${encodeURIComponent(`Could not confirm account: ${confirmError.message}`)}`);

  const { error: auditError } = await supabaseAdmin.from("audit_logs").insert({
    admin_id: admin.id,
    action: "CONFIRM_USER",
    details: { user_id: userId, email: userResult.user.email ?? null },
  });
  if (auditError) {
    redirect(`/dashboard/users?error=${encodeURIComponent(`Account was confirmed, but its audit entry failed: ${auditError.message}`)}`);
  }

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/logs");
  redirect("/dashboard/users?confirmed=1");
}
