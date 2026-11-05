import { AlertCircle } from "lucide-react";

export default function SetupNotice() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-[#eadfc7] bg-[#fbf6eb] p-7 text-center">
      <AlertCircle className="mx-auto text-[#a17d46]" size={24} />
      <h1 className="font-editorial mt-4 text-2xl text-[#17243b]">Connect your library database</h1>
      <p className="mt-2 text-xs leading-5 text-[#806641]">Add your Supabase URL and anon key to the environment, then run the included migration to enable dashboard data.</p>
    </div>
  );
}
