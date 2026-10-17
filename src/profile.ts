import { db } from "./service";
export type EditableProfile = {
  display_name: string;
  avatar_url: string | null;
};
export function readLocalProfile(): EditableProfile {
  try {
    return (
      JSON.parse(localStorage.getItem("lip-profile") || "null") || {
        display_name: "Explorador",
        avatar_url: null,
      }
    );
  } catch {
    return { display_name: "Explorador", avatar_url: null };
  }
}
export async function prepareAvatar(file: File): Promise<Blob> {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 2 * 1024 * 1024
  )
    throw new Error("Usa una imagen JPG, PNG o WebP de hasta 2 MB.");
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");
  const side = Math.min(bitmap.width, bitmap.height);
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    256,
    256,
  );
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("No se pudo procesar la imagen.")),
      "image/webp",
      0.85,
    ),
  );
}
export async function persistProfile(
  profile: EditableProfile,
  file: File | null,
  userId?: string,
): Promise<EditableProfile> {
  const name = profile.display_name.trim();
  if (name.length < 2 || name.length > 40)
    throw new Error("El nombre debe tener entre 2 y 40 caracteres.");
  let avatar = profile.avatar_url;
  if (file) {
    const blob = await prepareAvatar(file);
    if (db && userId) {
      const path = `${userId}/avatar.webp`;
      const { error } = await db.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/webp", upsert: true });
      if (error) throw error;
      avatar =
        db.storage.from("avatars").getPublicUrl(path).data.publicUrl +
        `?v=${Date.now()}`;
    } else {
      avatar = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
    }
  }
  const next = { display_name: name, avatar_url: avatar };
  if (db) {
    const { error } = await db.rpc("edit_profile", {
      new_name: name,
      new_avatar: avatar,
    });
    if (error) throw error;
  } else localStorage.setItem("lip-profile", JSON.stringify(next));
  return next;
}
