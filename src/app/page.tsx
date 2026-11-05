import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, BookMarked, BookOpen, GraduationCap, LayoutDashboard, Library, LogIn } from "lucide-react";
import Catalog from "@/app/catalog";
import { getProfile } from "@/lib/auth";

export const instant = false;

export default async function Home() {
  await connection();
  const profile = await getProfile();
  return (
    <main className="min-h-screen bg-[#f7f5ef]">
      <header className="border-b border-[#e9e5db] bg-[#fbfaf6]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#17243b] text-[#e2bd73]"><Library size={19} /></span>
            <span>
              <span className="block text-[13px] font-bold tracking-wide text-[#17243b]">ONG CHE TEE</span>
              <span className="mt-0.5 hidden text-[9px] uppercase tracking-[.19em] text-[#8e8d86] sm:block">Bacong High School Library</span>
            </span>
          </Link>
          <nav className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full bg-[#f0eee7] px-3 py-2 text-[10px] font-medium text-[#748092] sm:flex"><GraduationCap size={14} /> School library</span>
            {profile && profile.role !== "guest" ? (
              <Link href="/dashboard" aria-label="Staff dashboard" className="flex items-center gap-2 rounded-lg bg-[#17243b] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#263954] sm:px-4"><LayoutDashboard size={15} /><span className="hidden sm:inline">Dashboard</span></Link>
            ) : (
              <Link href="/login" aria-label="Staff sign in" className="flex items-center gap-2 rounded-lg border border-[#e1ded5] px-3 py-2.5 text-xs font-semibold text-[#3d4d62] hover:bg-[#f2f0e9] sm:px-4"><LogIn size={14} /><span className="hidden sm:inline">Staff sign in</span></Link>
            )}
          </nav>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-7 sm:px-8 lg:grid-cols-[226px_minmax(0,1fr)] lg:gap-10 lg:px-12 lg:py-10">
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <div className="soft-grid relative overflow-hidden rounded-2xl bg-[#e9e5da] p-5">
              <div className="absolute -right-7 -top-8 h-24 w-24 rounded-full bg-[#d7c89e]/45" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/75 text-[#7b6849]"><BookMarked size={18} /></div>
              <p className="font-editorial relative mt-5 text-xl leading-snug text-[#24344b]">A quiet place to discover.</p>
              <p className="relative mt-2 text-[11px] leading-5 text-[#777a78]">Books open doors. Browse the shelves and find one that speaks to you.</p>
            </div>
            <div className="mt-7 space-y-1">
              <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[.2em] text-[#aaa69b]">Explore</p>
              <div className="flex items-center gap-3 rounded-lg bg-white px-3 py-3 text-xs font-semibold text-[#27364b] shadow-sm"><BookOpen size={15} className="text-[#b68a44]" /> All books <span className="ml-auto text-[#9da2a3]">↗</span></div>
              <a href="#collection" className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs text-[#788391] hover:bg-white/70"><GraduationCap size={15} /> Student favorites</a>
            </div>
            <div className="mt-10 border-t border-[#e5e1d7] pt-5">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#aa9b79]">Read. Imagine. Grow.</p>
              <p className="mt-2 text-[11px] leading-5 text-[#90969c]">Visit the library during school hours. Our librarian is happy to help you find your next read.</p>
            </div>
          </div>
        </aside>
        <div className="min-w-0">
          <section className="relative mb-9 overflow-hidden rounded-2xl bg-[#17243b] px-6 py-8 text-white sm:px-9 sm:py-10">
            <div className="absolute -right-10 -top-16 h-64 w-64 rounded-full border border-white/10" />
            <div className="absolute -right-1 -top-6 h-48 w-48 rounded-full border border-white/10" />
            <div className="relative max-w-[580px]">
              <p className="text-[9px] font-bold uppercase tracking-[.25em] text-[#d9b976]">Ong Che Tee · Bacong High School</p>
              <h1 className="font-editorial mt-4 text-3xl leading-tight sm:text-[40px]">A good book can take you anywhere.</h1>
              <p className="mt-3 max-w-md text-xs leading-6 text-[#c2c9d2] sm:text-sm">Discover the books in our school library. Search by title, author, ISBN, or catalog code.</p>
              <a href="#collection" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#d8b46c] px-4 py-2.5 text-xs font-bold text-[#17243b] transition hover:bg-[#e6c782]">Explore the collection <ArrowRight size={14} /></a>
            </div>
            <div className="absolute bottom-0 right-[5%] hidden h-[88%] w-[160px] rotate-[7deg] rounded-t-lg border-x border-t border-white/25 bg-gradient-to-br from-[#d2b178] via-[#ab8155] to-[#785b47] p-3 shadow-xl md:block">
              <div className="flex h-full flex-col items-center justify-center border border-white/35 px-3 text-center">
                <span className="text-[8px] uppercase tracking-[.25em] text-white/75">A world between</span>
                <span className="font-editorial mt-3 text-2xl leading-tight text-white">the<br />pages</span>
                <span className="mt-3 text-[7px] uppercase tracking-[.18em] text-white/75">OCT Library</span>
              </div>
            </div>
          </section>
          <section id="collection" className="scroll-mt-6">
            <Catalog />
          </section>
          <footer className="mt-14 flex flex-col items-center gap-2 border-t border-[#e7e4dc] py-5 text-center text-[10px] text-[#9a9e9d] sm:flex-row sm:justify-between sm:text-left">
            <p>© 2026 Ong Che Tee - Bacong High School. All rights reserved.</p>
            <p>Website developed by: <a href="http://carlgriff.com/" target="_blank" rel="noopener noreferrer" className="font-medium text-[#7b6849] underline-offset-2 hover:underline">Carl Griff</a></p>
          </footer>
        </div>
      </div>
    </main>
  );
}
