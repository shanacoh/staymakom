import type { LinkPlatform, Source } from "./types";

function parseUrl(value: string): URL | null {
  try {
    return new URL(value.trim());
  } catch {
    return null;
  }
}

/** Seuls les liens http(s) sont acceptés : jamais de "javascript:" ou autre dans un lien cliquable. */
export function isHttpUrl(value: string): boolean {
  const url = parseUrl(value);
  return !!url && (url.protocol === "http:" || url.protocol === "https:");
}

export function detectPlatform(value: string): LinkPlatform {
  const url = parseUrl(value);
  if (!url) return "autre";
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "tiktok";
  if (host === "instagram.com" || host.endsWith(".instagram.com")) return "instagram";
  if (host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com")) return "youtube";
  if (host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.watch") return "facebook";
  if (
    host === "maps.app.goo.gl" ||
    host === "goo.gl" ||
    ((host === "google.com" || host.startsWith("maps.google.")) && (host.startsWith("maps.") || url.pathname.startsWith("/maps")))
  ) {
    return "google_maps";
  }
  return "site_web";
}

/** D'où vient l'idée, déduit de la plateforme du lien collé. */
export function sourceFromPlatform(platform: LinkPlatform): Source {
  if (platform === "tiktok") return "tiktok";
  if (platform === "instagram") return "instagram";
  return "autre";
}

export interface EmbedInfo {
  src: string;
  height: number;
  maxWidth: number;
}

/**
 * Adresse du lecteur intégré pour un lien vidéo, ou null si on ne sait pas l'afficher.
 * L'adresse est reconstruite à partir de l'identifiant de la vidéo uniquement (jamais recopiée
 * telle quelle), donc on n'affiche que des lecteurs officiels de TikTok, Instagram et YouTube.
 * Les liens courts TikTok (vm.tiktok.com, tiktok.com/t/...) ne contiennent pas l'identifiant :
 * ils sont résolus côté serveur au Lot 2.
 */
export function getEmbed(value: string): EmbedInfo | null {
  const url = parseUrl(value);
  if (!url || !isHttpUrl(value)) return null;
  const platform = detectPlatform(value);

  if (platform === "tiktok") {
    const id = url.pathname.match(/\/video\/(\d{6,25})/)?.[1];
    return id ? { src: `https://www.tiktok.com/embed/v2/${id}`, height: 620, maxWidth: 340 } : null;
  }

  if (platform === "instagram") {
    const match = url.pathname.match(/\/(p|reel|reels|tv)\/([A-Za-z0-9_-]{5,20})/);
    if (!match) return null;
    const kind = match[1] === "reels" ? "reel" : match[1];
    return { src: `https://www.instagram.com/${kind}/${match[2]}/embed`, height: 640, maxWidth: 340 };
  }

  if (platform === "youtube") {
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const isShort = url.pathname.startsWith("/shorts/");
    const candidate =
      host === "youtu.be"
        ? url.pathname.slice(1)
        : url.searchParams.get("v") ?? url.pathname.match(/^\/(?:shorts|embed)\/([^/?]+)/)?.[1] ?? "";
    const id = candidate.match(/^[A-Za-z0-9_-]{11}$/)?.[0];
    if (!id) return null;
    return isShort
      ? { src: `https://www.youtube-nocookie.com/embed/${id}`, height: 600, maxWidth: 340 }
      : { src: `https://www.youtube-nocookie.com/embed/${id}`, height: 315, maxWidth: 560 };
  }

  return null;
}
