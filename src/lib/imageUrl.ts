/**
 * Demande à Supabase de redimensionner une image à la volée, au lieu
 * d'envoyer la photo dans sa taille d'origine pour une simple vignette.
 * Sans effet sur les URLs qui ne viennent pas du stockage Supabase
 * (elles sont renvoyées telles quelles).
 */
export function resizedImageUrl(
  url: string | null | undefined,
  width: number,
  quality = 75
): string | undefined {
  if (!url) return undefined;
  const marker = "/storage/v1/object/public/";
  const index = url.indexOf(marker);
  if (index === -1) return url;

  const base = url.slice(0, index);
  const path = url.slice(index + marker.length);
  // "resize=contain" sans hauteur imposée : Supabase calcule la hauteur
  // proportionnellement à la largeur au lieu de garder la hauteur d'origine
  // (qui déformait la photo et forçait un zoom énorme au recadrage).
  return `${base}/storage/v1/render/image/public/${path}?width=${width}&resize=contain&quality=${quality}`;
}
