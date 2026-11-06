import { connection } from "next/server";
import { requireRole } from "@/lib/auth";
import BookLookup from "@/app/dashboard/scan/book-lookup";

export const instant = false;

export default async function ScanBookPage() {
  await connection();
  const profile = await requireRole(["guest", "admin", "super_admin"]);
  const canEdit = profile.role !== "guest";

  return (
    <div>
      <div className="mb-7">
        <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#a17d46]">{canEdit ? "Library workspace" : "Reader access"}</p>
        <h1 className="font-editorial mt-2 text-3xl text-[#17243b]">Scan a book</h1>
        <p className="mt-1 max-w-xl text-xs leading-5 text-[#7d8996]">{canEdit ? "Scan a catalog code to review the book or open its catalog record for editing." : "Scan a catalog code to read book details and see how long a borrowed book has been out. Guest access is read-only."}</p>
      </div>
      <BookLookup canEdit={canEdit} />
    </div>
  );
}
