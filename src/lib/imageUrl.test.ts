import { describe, it, expect } from "vitest";
import { resizedImageUrl } from "./imageUrl";

describe("resizedImageUrl", () => {
  it("renvoie undefined quand il n'y a pas de photo", () => {
    expect(resizedImageUrl(null, 500)).toBeUndefined();
    expect(resizedImageUrl(undefined, 500)).toBeUndefined();
    expect(resizedImageUrl("", 500)).toBeUndefined();
  });

  it("laisse une URL qui ne vient pas du stockage Supabase inchangée", () => {
    const url = "https://example.com/photo.jpg";
    expect(resizedImageUrl(url, 500)).toBe(url);
  });

  it("transforme une photo Supabase en URL redimensionnée", () => {
    const url =
      "https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public/hotel-images/photo.jpg";
    expect(resizedImageUrl(url, 500)).toBe(
      "https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/render/image/public/hotel-images/photo.jpg?width=500&resize=contain&quality=75"
    );
  });

  it("utilise la qualité par défaut (75) si aucune n'est précisée", () => {
    const url =
      "https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public/hotel-images/photo.jpg";
    expect(resizedImageUrl(url, 800)).toContain("quality=75");
  });

  it("respecte une qualité personnalisée", () => {
    const url =
      "https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public/hotel-images/photo.jpg";
    expect(resizedImageUrl(url, 1400, 80)).toBe(
      "https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/render/image/public/hotel-images/photo.jpg?width=1400&resize=contain&quality=80"
    );
  });
});
