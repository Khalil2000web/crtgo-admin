import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";

import { uploadMenuImage } from "../lib/uploads";
import { Button, Input } from "./ui";

export default function ImageUploadField({
  label,
  value,
  onChange,
  folder = "general",
  hint,
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const hasImage = Boolean(value?.trim());

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    setUploading(true);

    try {
      const url = await uploadMenuImage(file, folder);
      onChange(url);
      toast.success(hasImage ? "Image changed" : "Image added");
    } catch (err) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    onChange("");
    toast.success("Image removed");
  }

  return (
    <div className="min-w-0">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <div className="mt-3 min-w-0 overflow-hidden rounded-[24px] border border-white/10 bg-black/25">
        <div className="relative flex aspect-[16/9] min-h-48 w-full min-w-0 items-center justify-center overflow-hidden bg-white/[0.035]">
          {hasImage ? (
            <img
              src={value}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid place-items-center px-5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#ff7a00]">
                <ImagePlus size={25} />
              </div>

              <p className="mt-4 text-sm font-black text-white">
                Add image
              </p>

              <p className="mt-1 max-w-xs text-xs font-bold leading-5 text-white/35">
                {hint || "Upload an image or paste an image URL below."}
              </p>
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-black/70 backdrop-blur-sm">
              <div className="grid place-items-center gap-3 text-center">
                <Loader2 className="animate-spin text-[#ff7a00]" size={30} />
                <p className="text-sm font-black text-white">Uploading...</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid min-w-0 gap-2 border-t border-white/10 p-3">
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            dir="ltr"
            disabled={uploading}
          />

          <div
            className={`grid min-w-0 gap-2 ${
              hasImage ? "sm:grid-cols-2" : "grid-cols-1"
            }`}
          >
            <Button
              type="button"
              variant={hasImage ? "secondary" : "primary"}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <UploadCloud size={16} />
              )}
              {uploading ? "Uploading..." : hasImage ? "Change" : "Add image"}
            </Button>

            {hasImage && (
              <Button
                type="button"
                variant="secondary"
                onClick={removeImage}
                disabled={uploading}
                className="w-full"
              >
                <Trash2 size={16} />
                Delete
              </Button>
            )}
          </div>

          <p className="text-xs font-bold leading-5 text-white/35">
            {hasImage ? "Image added." : "No image added yet."}
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}