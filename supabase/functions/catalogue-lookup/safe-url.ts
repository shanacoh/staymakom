// Garde-fou : la fonction va lire des adresses saisies par l'utilisateur. On refuse tout ce qui
// pointerait vers l'intérieur de notre propre infrastructure (localhost, réseaux privés, etc.).

export function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;
  return (
    a === 0 || // "ce réseau"
    a === 10 || // réseau privé
    a === 127 || // boucle locale
    (a === 100 && b >= 64 && b <= 127) || // partage d'opérateur (CGNAT)
    (a === 169 && b === 254) || // lien local, dont les services de métadonnées des hébergeurs
    (a === 172 && b >= 16 && b <= 31) || // réseau privé
    (a === 192 && b === 168) || // réseau privé
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multidiffusion et réservé
  );
}

export function isPrivateIpv6(ip: string): boolean {
  const value = ip.toLowerCase().replace(/^\[|\]$/g, "");
  if (value === "::" || value === "::1") return true;
  if (/^f[cd]/.test(value) || /^fe[89ab]/.test(value)) return true; // privé (fc00::/7) et lien local (fe80::/10)
  const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/); // IPv4 déguisée en IPv6
  return mapped ? isPrivateIpv4(mapped[1]) : false;
}

export function isPrivateIp(ip: string): boolean {
  return ip.includes(":") ? isPrivateIpv6(ip) : isPrivateIpv4(ip);
}

const BLOCKED_SUFFIXES = [".local", ".localhost", ".internal", ".localdomain", ".lan", ".home", ".corp"];

export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host) return true;
  if (host === "localhost" || BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  if (host.startsWith("[") || host.includes(":")) return isPrivateIpv6(host);
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return isPrivateIpv4(host);
  return !host.includes("."); // un nom sans point ("intranet", "db") n'est pas un site public
}

/**
 * Adresse web acceptable pour une lecture : http(s), sans identifiants, ports habituels uniquement,
 * et pas de machine interne. Renvoie null sinon.
 */
export function parsePublicHttpUrl(input: string): URL | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== "80" && url.port !== "443") return null;
  if (isBlockedHostname(url.hostname)) return null;
  return url;
}
