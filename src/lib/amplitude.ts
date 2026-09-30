import * as amplitude from "@amplitude/unified";

type Language = "en" | "he" | "fr";
const LANG_STORAGE_KEY = "preferredLang";
const VALID_LANGS: Language[] = ["en", "he", "fr"];

function getCurrentLang(): Language {
  try {
    const urlLang = new URLSearchParams(window.location.search).get("lang");
    if (urlLang && VALID_LANGS.includes(urlLang as Language)) return urlLang as Language;

    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved && VALID_LANGS.includes(saved as Language)) return saved as Language;

    const browserLang = (navigator.language || "").split("-")[0].toLowerCase();
    if (browserLang === "fr") return "fr";
    if (browserLang === "he" || browserLang === "iw") return "he";
  } catch {}
  return "en";
}

function getPageType(path: string): string {
  if (path === "/") return "home";
  if (path === "/experiences") return "listing";
  if (path.startsWith("/category/")) return "category";
  if (path.startsWith("/standalone-experience/") || path.startsWith("/experience/")) return "experience";
  if (path.startsWith("/hotel/")) return "hotel";
  if (path === "/boat") return "boat_list";
  if (path.toLowerCase().includes("checkout")) return "checkout";
  if (path.toLowerCase().includes("confirmation")) return "confirmation";
  return "other";
}

function getDeviceType(): string {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function getEntrySource(): string | undefined {
  try {
    return sessionStorage.getItem("staymakom_entry_source") || undefined;
  } catch {
    return undefined;
  }
}

function getCommonProperties(): Record<string, any> {
  return {
    lang: getCurrentLang(),
    page_path: window.location.pathname,
    page_type: getPageType(window.location.pathname),
    device_type: getDeviceType(),
    entry_source: getEntrySource(),
  };
}

export function isAmplitudeReady(): boolean {
  return typeof window !== "undefined";
}

export function initAmplitude() {
  // Instance unique désormais initialisée dans main.tsx via @amplitude/unified.
  // Conservée ici pour ne pas casser les appels existants (ex: useCookieConsent).
}

export function safeTrack(eventName: string, properties?: Record<string, any>) {
  if (!isAmplitudeReady()) return;
  const mergedProperties = { ...getCommonProperties(), ...properties };
  if (import.meta.env.DEV) {
    console.debug("[amp]", eventName, mergedProperties);
  }
  amplitude.track(eventName, mergedProperties);
}

export function safeIdentify(userId: string, properties?: Record<string, any>) {
  if (!isAmplitudeReady()) return;
  amplitude.setUserId(userId);
  if (properties) {
    const identify = new amplitude.Identify();
    Object.entries(properties).forEach(([key, value]) => {
      identify.set(key, value);
    });
    amplitude.identify(identify);
  }
}

export function safeSetUserProperty(key: string, value: any) {
  if (!isAmplitudeReady()) return;
  const identify = new amplitude.Identify();
  identify.set(key, value);
  amplitude.identify(identify);
}

export function safeIdentifySetOnce(properties: Record<string, any>) {
  if (!isAmplitudeReady()) return;
  const identify = new amplitude.Identify();
  Object.entries(properties).forEach(([key, value]) => {
    if (value === undefined) return;
    identify.setOnce(key, value);
  });
  amplitude.identify(identify);
}
