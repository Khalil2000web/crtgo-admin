import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";

import { uploadMenuImage } from "../lib/uploads";

export default function ImageUploadField({
  label = "Image",
  value,
  onChange,
  folder = "general",
  hint = "PNG, JPG, or WEBP.",
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const hasImage = Boolean(value);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setUploading(true);

    try {
      const url = await uploadMenuImage(file, folder);
      onChange(url);
      toast.success(hasImage ? "Image changed" : "Image added");
    } catch (err) {
      toast.error(err.message || "Image upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </span>

      <div className="rounded-[24px] border border-white/10 bg-black/25 p-3">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
          {uploading ? (
            <div className="flex h-48 flex-col items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ff7a00]/20 bg-[#ff7a00]/10 text-[#ff7a00]">
                <Loader2 size={24} className="animate-spin" />
              </div>

              <p className="mt-4 text-sm font-black text-white">
                Uploading image...
              </p>

              <p className="mt-1 text-xs font-bold text-white/35">
                Please keep this page open.
              </p>
            </div>
          ) : hasImage ? (
            <img src={value} alt="" className="h-48 w-full object-cover" />
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-48 w-full flex-col items-center justify-center text-center transition hover:bg-[#ff7a00]/10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#ff7a00]">
                <ImagePlus size={24} />
              </div>

              <p className="mt-4 text-sm font-black text-white">Add image</p>

              <p className="mt-1 text-xs font-bold text-white/35">{hint}</p>
            </button>
          )}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            dir="ltr"
            className="min-h-11 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-[#ff7a00]"
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/65 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <UploadCloud size={16} />
            )}
            {hasImage ? "Change" : "Add"}
          </button>

          {hasImage && (
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={uploading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 text-sm font-black text-red-200 transition hover:bg-red-500/15 disabled:opacity-50"
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}
        </div>

        <p className="mt-2 text-xs font-bold text-white/30">
          {hasImage
            ? "Image is ready. You can change it or delete it."
            : "No image added yet."}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}