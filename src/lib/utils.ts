import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Nom de fichier photo lisible (ex: hotel-pereh-3f9a1c2d.jpg) au lieu d'un
// nom aléatoire, pour que Google puisse comprendre de quoi parle la photo.
// Les accents sont convertis (é -> e) plutôt que supprimés, contrairement à
// generateSlug, pour que le nom reste lisible avec des titres en français.
// Le suffixe court évite qu'une photo écrase une autre en cas de nom identique.
export function buildImageFileName(name: string | undefined | null, fileExt: string | undefined): string {
  const slug = name
    ? name
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '') // enleve les accents (e.g. e -> e, o -> o)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    : '';
  const uniqueId = crypto.randomUUID().slice(0, 8);
  const ext = fileExt || 'jpg';
  return slug ? `${slug}-${uniqueId}.${ext}` : `${uniqueId}.${ext}`;
}
