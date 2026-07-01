import { supabase } from "./supabase";

export async function uploadMenuImage(file, folder = "general") {
  if (!file) throw new Error("No image selected.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You are not logged in.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";

  const cleanName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  const path = `${user.id}/${folder}/${Date.now()}-${cleanName}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("menu-images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("menu-images").getPublicUrl(path);

  return data.publicUrl;
}