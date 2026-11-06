import Link from "next/link";
import { ArrowLeft, Library } from "lucide-react";
import { signIn, signInWithGoogle } from "@/app/actions";
import { getProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export const instant = false;

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  await connection();
  const profile = await getProfile();
  if (profile) redirect(profile.role === "guest" ? "/dashboard/scan" : "/dashboard");
  const configured = isSupabaseConfigured();
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5ef] px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-[#fbfaf6] shadow-[0_24px_70px_-35px_rgba(23,36,59,.35)] md:grid-cols-[1fr_1.05fr]">
        <section className="relative hidden min-h-[550px] overflow-hidden bg-[#17243b] p-9 text-white md:flex md:flex-col md:justify-between">
          <div className="absolute -right-28 top-16 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -right-8 top-36 h-48 w-48 rounded-full border border-white/10" />
          <Link href="/" className="relative flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#e5c27e]"><Library size={19} /></span>
            <span className="text-xs font-semibold tracking-wider">ONG CHE TEE LIBRARY</span>
          </Link>
          <div className="relative">
            <p className="text-[9px] uppercase tracking-[.24em] text-[#d6b879]">For library staff</p>
            <h1 className="font-editorial mt-4 text-4xl leading-tight">A thoughtful way to care for every book.</h1>
            <p className="mt-4 max-w-xs text-sm leading-6 text-[#bfc7d1]">Manage the collection, keep lending records, and help every reader find their next story.</p>
          </div>
          <p className="relative text-[10px] text-[#a5afbb]">Ong Che Tee - Bacong High School</p>
        </section>
        <section className="p-5 sm:p-10 md:p-12">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-[#7e8995] hover:text-[#17243b]"><ArrowLeft size={14} /> Back to catalog</Link>
          <div className="mt-12 md:mt-16">
            <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#a17d46]">Staff portal</p>
            <h2 className="font-editorial mt-2 text-3xl text-[#17243b]">Welcome back</h2>
            <p className="mt-2 text-xs text-[#818c98]">Sign in or register with Google for library access.</p>
          </div>
            {!configured && <p role="status" className="mt-5 rounded-lg border border-[#eadfc7] bg-[#f7f1e4] px-3 py-2.5 text-xs leading-5 text-[#826d4c]">Staff sign-in is unavailable until Supabase is configured. Add the project URL and anon key to your environment.</p>}
            {error && <p role="alert" className="mt-5 rounded-lg border border-[#efd2c9] bg-[#fff4f0] px-3 py-2.5 text-xs text-[#9e5745]">{error}</p>}
            <form action={signIn} className="mt-7 space-y-4">
              <label className="block text-xs font-semibold text-[#46556a]">Email address
                <input name="email" type="email" autoComplete="email" required disabled={!configured} className="mt-2 h-11 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-sm outline-none transition focus:border-[#b6955a] disabled:cursor-not-allowed disabled:opacity-50" placeholder="you@school.edu.ph" />
              </label>
              <label className="block text-xs font-semibold text-[#46556a]">Password
                <input name="password" type="password" autoComplete="current-password" required disabled={!configured} className="mt-2 h-11 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-sm outline-none transition focus:border-[#b6955a] disabled:cursor-not-allowed disabled:opacity-50" placeholder="Enter your password" />
              </label>
              <button type="submit" disabled={!configured} className="h-11 w-full rounded-lg bg-[#17243b] text-xs font-semibold text-white transition hover:bg-[#293b57] disabled:cursor-not-allowed disabled:opacity-50">Sign in to dashboard</button>
          </form>
          <div className="my-5 flex items-center gap-3 text-[9px] uppercase tracking-[.16em] text-[#a2a7a9]"><span className="h-px flex-1 bg-[#e9e6de]" /> or continue with <span className="h-px flex-1 bg-[#e9e6de]" /></div>
          <form action={signInWithGoogle}>
            <button type="submit" disabled={!configured} className="h-11 w-full rounded-lg border border-[#e5e2da] bg-white text-xs font-semibold text-[#4c5a6c] transition hover:bg-[#f5f3ed] disabled:cursor-not-allowed disabled:opacity-50">Register or sign in with Google</button>
          </form>
          <p className="mt-7 text-center text-[10px] leading-5 text-[#a0a5a6]">New Google accounts start with limited Guest access.<br />A super admin must approve staff access.</p>
        </section>
      </div>
    </main>
  );
}
