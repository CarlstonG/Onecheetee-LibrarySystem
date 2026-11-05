"use client";

import { useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const maxFileSize = 5 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png"];

export default function CoverImageField({ initialValue = "" }: { initialValue?: string | null }) {
  const [coverUrl, setCoverUrl] = useState(initialValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadCover(file: File | undefined) {
    if (!file) return;
    setError("");

    if (!allowedTypes.includes(file.type)) {
      setError("Choose a JPEG or PNG image.");
      return;
    }
    if (file.size > maxFileSize) {
      setError("Cover images must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(`Could not verify your account: ${userError.message}`);
      if (!user) throw new Error("Sign in again before uploading a cover image.");

      const extension = file.type === "image/png" ? "png" : "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("book-covers")
        .upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });
      if (uploadError) throw new Error(`Could not upload cover image: ${uploadError.message}`);

      const { data } = supabase.storage.from("book-covers").getPublicUrl(path);
      setCoverUrl(data.publicUrl);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not upload cover image.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="text-[10px] font-semibold text-[#687687]">
      <label>
        Cover image URL (optional)
        <input
          name="cover_image_url"
          type="url"
          value={coverUrl}
          onChange={(event) => setCoverUrl(event.target.value)}
          placeholder="Upload an image or paste a URL"
          className="mt-1.5 block h-10 w-full rounded-lg border border-[#e5e2da] bg-white px-3 text-xs font-normal outline-none focus:border-[#b6955a]"
        />
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#ded9ca] px-3 py-2 text-[10px] font-semibold text-[#42536a] hover:bg-[#f2f0e9] ${uploading ? "pointer-events-none opacity-60" : ""}`}>
          {uploading ? <LoaderCircle size={13} className="animate-spin" /> : <ImagePlus size={13} />}
          {uploading ? "Uploading…" : "Choose JPEG or PNG"}
          <input
            type="file"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            disabled={uploading}
            className="sr-only"
            onChange={(event) => {
              const input = event.currentTarget;
              void uploadCover(input.files?.[0]).finally(() => {
                input.value = "";
              });
            }}
          />
        </label>
        {coverUrl && (
          <>
            <a href={coverUrl} target="_blank" rel="noreferrer" className="max-w-[180px] truncate text-[10px] font-normal text-[#758292] underline">View selected cover</a>
            <button type="button" onClick={() => setCoverUrl("")} className="inline-flex items-center gap-1 text-[10px] font-medium text-[#a25c4c]"><X size={12} /> Remove</button>
          </>
        )}
      </div>
      <p className="mt-1 text-[9px] font-normal text-[#939ba3]">JPEG or PNG, up to 5 MB. Uploading requires an active staff account.</p>
      {error && <p role="alert" className="mt-2 text-[10px] font-medium text-[#a25c4c]">{error}</p>}
      {uploading && <p role="status" className="sr-only">Uploading cover image</p>}
    </div>
  );
}
