export type UserRole = "super_admin" | "admin" | "guest";
export type BookStatus = "available" | "borrowed" | "reserved";
export type BorrowerType = "student" | "faculty" | "outsider";

export interface BookCategory {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Book {
  id: string;
  book_code: string;
  isbn: string | null;
  title: string;
  author: string;
  date_published: string | null;
  short_description: string | null;
  cover_image_url: string | null;
  category_id: string | null;
  category_name: string;
  category_slug: string;
  is_featured: boolean;
  featured_description: string | null;
  author_url: string | null;
  pdf_url: string | null;
  status: BookStatus;
  created_at: string;
}

export interface PublicBorrowStatus {
  book_id: string;
  borrowed_at: string;
  due_date: string;
}

export interface BorrowRecord {
  id: string;
  book_id: string;
  borrower_name: string;
  borrower_type: BorrowerType;
  section: string | null;
  address: string | null;
  borrowed_at: string;
  due_date: string;
  returned_at: string | null;
  approved_by: string | null;
  books?: Pick<Book, "title" | "book_code"> | null;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  profiles?: Pick<Profile, "full_name" | "email"> | null;
}
