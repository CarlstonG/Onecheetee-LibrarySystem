import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowDown, ArrowRight, GraduationCap, LayoutDashboard, Library, LogIn } from "lucide-react";
import Catalog from "@/app/catalog";
import { getProfile } from "@/lib/auth";

export const instant = false;

export default async function Home() {
  await connection();
  const profile = await getProfile();

  return (
    <main className="min-h-screen bg-[#f7f5ef]">
      <header className="relative z-20 border-b border-[#e9e5db] bg-[#fbfaf6]">
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

      <section aria-labelledby="home-title" className="relative isolate min-h-[680px] overflow-hidden bg-[#17243b] md:h-[min(780px,calc(100svh-72px))] md:min-h-[640px]">
        <Image
          src="/campus-courtyard.jpg"
          alt="Ong Che Tee - Bacong High School campus beneath a bright blue sky"
          fill
          preload
          sizes="100vw"
          className="object-cover object-[center_57%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#101d30]/85 via-[#17243b]/55 to-[#17243b]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101d30]/70 via-transparent to-[#101d30]/10" />
        <div className="relative mx-auto flex min-h-[680px] max-w-[1440px] items-center px-6 pb-20 pt-16 sm:px-10 md:h-full md:min-h-0 md:px-16">
          <div className="max-w-3xl text-white">
            <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.24em] text-[#f0d08b] sm:text-xs">
              <span className="h-px w-8 bg-[#f0d08b]" />
              Ong Che Tee · Bacong High School
            </p>
            <h1 id="home-title" className="font-editorial mt-6 text-5xl leading-[1.05] tracking-[-.035em] sm:text-6xl md:text-7xl lg:text-[88px]">
              A place to learn.
              <span className="mt-2 block text-[#f0d08b]">A world to imagine.</span>
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/80 sm:text-base sm:leading-8">
              Find a little inspiration between the shelves. Explore the books waiting for you at our school library.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a href="#collection" className="inline-flex items-center gap-3 rounded-full bg-[#e6c27b] px-6 py-3.5 text-xs font-bold text-[#17243b] shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:bg-[#f0d08b]">
                Explore the catalog <ArrowRight size={15} />
              </a>
              <a href="#school-gallery" className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-xs font-semibold text-white/90 transition hover:text-[#f0d08b]">
                Get to know us <ArrowDown size={14} />
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-7 right-7 hidden items-center gap-3 text-[9px] font-semibold uppercase tracking-[.2em] text-white/75 md:flex">
          <span className="h-px w-10 bg-white/50" /> Read · Imagine · Grow
        </div>
      </section>

      <section id="school-gallery" aria-labelledby="gallery-title" className="mx-auto max-w-[1240px] scroll-mt-8 px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mb-9 flex flex-col justify-between gap-5 sm:mb-12 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#a17d46]">A glimpse of campus</p>
            <h2 id="gallery-title" className="font-editorial mt-3 max-w-2xl text-3xl leading-tight text-[#17243b] sm:text-5xl">A place for learning, and a little wonder.</h2>
          </div>
          <p className="max-w-sm text-xs leading-6 text-[#748092] sm:text-sm sm:leading-7">From familiar school grounds to the quiet joy of finding a new book, there is always something to discover here.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-12">
          <figure className="group relative min-h-[360px] overflow-hidden rounded-2xl bg-[#d8d1bd] md:col-span-7 md:row-span-2 md:min-h-[560px]">
            <Image src="/campus-facade.jpg" alt="The main building of Ong Che Tee - Bacong High School" fill sizes="(max-width: 768px) 100vw, 58vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101d30]/75 via-transparent to-transparent" />
            <figcaption className="absolute bottom-0 left-0 p-6 text-white sm:p-8">
              <span className="text-[9px] font-bold uppercase tracking-[.2em] text-[#f0d08b]">Our school</span>
              <p className="font-editorial mt-2 text-2xl sm:text-3xl">A home for curious minds.</p>
            </figcaption>
          </figure>
          <figure className="group relative min-h-[260px] overflow-hidden rounded-2xl bg-[#d8d1bd] md:col-span-5">
            <Image src="/library-shelves.jpg" alt="Rows of books on the library shelves" fill sizes="(max-width: 768px) 100vw, 42vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101d30]/70 via-transparent to-transparent" />
            <figcaption className="absolute bottom-0 left-0 p-5 text-white sm:p-6">
              <span className="text-[9px] font-bold uppercase tracking-[.2em] text-[#f0d08b]">Find your next read</span>
              <p className="font-editorial mt-1 text-xl sm:text-2xl">Stories for every shelf.</p>
            </figcaption>
          </figure>
          <figure className="group relative min-h-[260px] overflow-hidden rounded-2xl bg-[#d8d1bd] md:col-span-5">
            <Image src="/library-reading-room.jpg" alt="The library reading room with tables and bookshelves" fill sizes="(max-width: 768px) 100vw, 42vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101d30]/70 via-transparent to-transparent" />
            <figcaption className="absolute bottom-0 left-0 p-5 text-white sm:p-6">
              <span className="text-[9px] font-bold uppercase tracking-[.2em] text-[#f0d08b]">Your library</span>
              <p className="font-editorial mt-1 text-xl sm:text-2xl">A quiet place to discover.</p>
            </figcaption>
          </figure>
        </div>
      </section>

      <section aria-labelledby="featured-cta-title" className="mx-auto max-w-[1240px] px-5 pb-20 sm:px-8 sm:pb-28 lg:px-12">
        <div className="relative overflow-hidden rounded-2xl bg-[#17243b] px-6 py-10 text-white sm:px-12 sm:py-12">
          <div className="absolute -right-16 -top-32 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -right-2 -top-20 h-56 w-56 rounded-full border border-white/10" />
          <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#e6c27b]">Handpicked for you</p>
              <h2 id="featured-cta-title" className="font-editorial mt-2 text-3xl sm:text-4xl">Your next favorite might be here.</h2>
              <p className="mt-3 max-w-xl text-xs leading-6 text-white/70 sm:text-sm">Take a look at the titles our librarian has picked out for curious readers.</p>
            </div>
            <a href="#featured-books" className="inline-flex shrink-0 items-center justify-center gap-3 self-start rounded-full bg-[#e6c27b] px-6 py-3.5 text-xs font-bold text-[#17243b] transition hover:-translate-y-0.5 hover:bg-[#f0d08b] sm:self-center">
              Check featured books <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </section>

      <section id="collection" aria-label="Library catalog" className="mx-auto max-w-[1240px] scroll-mt-8 px-5 pb-20 sm:px-8 lg:px-12">
        <Catalog />
      </section>

      <footer className="border-t border-[#e7e4dc]">
        <div className="mx-auto flex max-w-[1240px] flex-col items-center gap-2 px-5 py-6 text-center text-[10px] text-[#9a9e9d] sm:flex-row sm:justify-between sm:text-left sm:px-8 lg:px-12">
          <p>© 2026 Ong Che Tee - Bacong High School. All rights reserved.</p>
          <p>Website developed by: <a href="http://carlgriff.com/" target="_blank" rel="noopener noreferrer" className="font-medium text-[#7b6849] underline-offset-2 hover:underline">Carl Griff</a></p>
        </div>
      </footer>
    </main>
  );
}
