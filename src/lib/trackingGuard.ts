// Qui est compté dans Amplitude (sprint SEO + tracking du 25/11/2026).
//
// Audit du 24-25/11 : plus de la moitié des sessions sur 90 jours étaient des robots, dont
// ~2 650 visiteurs « Chrome 145 » venant TOUS de New York, en anglais, quelques secondes,
// sans clic, chaque jour depuis fin août : un robot qui se présente comme un vieux Chrome
// 145 de bureau (les vrais visiteurs ont Chrome 150 à 158). Ce n'est pas un pré-rendu du
// site : le guichet robots (api/bot-meta.ts) n'exécute aucun script.
//
// On n'initialise donc Amplitude (ni Session Replay) que pour un vrai visiteur, sur le vrai
// site, hors back-office et hors tests. Fichier sans dépendance (testé à part).

/** Robots connus et navigateurs automatisés (sans interface, pilotés par un programme). */
const BOT_PATTERN =
  /bot\b|bot\/|crawler|crawl|spider|slurp|googlebot|google-inspectiontool|googleother|bingbot|meta-webindexer|meta-externalagent|facebookexternalhit|facebot|headlesschrome|prerender|lighthouse|pagespeed|chrome-lighthouse|gtmetrix|webpagetest|ptst|pingdom|uptimerobot|statuscake|site24x7|semrush|ahrefs|mj12|dotbot|petalbot|yandex|baiduspider|bytespider|duckduckbot|duckassistbot|applebot|amazonbot|gptbot|chatgpt-user|oai-searchbot|claudebot|claude-user|perplexity|ccbot|diffbot|shapbot|storebot|phantomjs|puppeteer|playwright|selenium|vercel-screenshot|vercelbot/i;

/**
 * Robot déguisé repéré dans Amplitude : Chrome 145.0.0.0 de BUREAU (Windows / Mac / Linux),
 * version figée depuis des mois alors que Chrome se met à jour seul. Les mobiles ne sont
 * pas concernés. À retirer si un jour un vrai client s'en plaint (très improbable).
 */
const SPOOFED_DESKTOP_CHROME = /(Windows NT|Macintosh|X11; Linux)[^)]*\).*Chrome\/145\.0\.0\.0 Safari/;

export function isBotUserAgent(userAgent: string): boolean {
  if (!userAgent) return true;
  return BOT_PATTERN.test(userAgent) || SPOOFED_DESKTOP_CHROME.test(userAgent);
}

/** Seul le vrai site est compté : pas localhost, pas les adresses de test Vercel (preview). */
export function isProductionHost(hostname: string): boolean {
  return hostname === "www.staymakom.com" || hostname === "staymakom.com";
}

/** Back-office et espace hôtel : jamais comptés. */
export function isUntrackedPath(pathname: string): boolean {
  const path = pathname.toLowerCase();
  return ["/admin", "/hotel-admin"].some((p) => path === p || path.startsWith(`${p}/`));
}

const TEST_FLAG = "staymakom_test_session";

/** Visite de test (ex. utm_source=claude-test) : toute la session n'est pas comptée. */
export function isTestSession(search: string): boolean {
  const source = new URLSearchParams(search).get("utm_source") || "";
  try {
    if (/test/i.test(source)) sessionStorage.setItem(TEST_FLAG, "1");
    return sessionStorage.getItem(TEST_FLAG) === "1";
  } catch {
    return /test/i.test(source);
  }
}

/** true = on peut démarrer Amplitude pour cette visite. */
export function shouldStartTracking(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if ((navigator as Navigator & { webdriver?: boolean }).webdriver) return false; // navigateur piloté par un programme
  if (isBotUserAgent(navigator.userAgent || "")) return false;
  if (!isProductionHost(window.location.hostname)) return false;
  if (isTestSession(window.location.search)) return false;
  return true;
}

let started = false;
export function markTrackingStarted(): void {
  started = true;
}

export function isTrackingStarted(): boolean {
  return started;
}

/** Envoi autorisé maintenant : Amplitude démarré et page hors back-office. */
export function isTrackingActive(): boolean {
  return started && typeof window !== "undefined" && !isUntrackedPath(window.location.pathname);
}
