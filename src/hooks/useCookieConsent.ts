import { useState, useCallback } from "react";
import { initAmplitude } from "@/lib/amplitude";

const CONSENT_KEY = "staymakom_cookie_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 an en secondes

type ConsentStatus = "accepted" | "declined" | null;

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Strict`;
}

function readConsent(): ConsentStatus {
  // Priorité 1 : cookie HTTP (résiste mieux aux effacements de localStorage)
  try {
    const cookie = getCookie(CONSENT_KEY);
    if (cookie === "accepted") return "accepted";
    if (cookie === "declined") return "declined";
  } catch {}

  // Priorité 2 : localStorage
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === "accepted") return "accepted";
    if (stored === "declined") return "declined";
  } catch {}

  return null;
}

function writeConsent(value: "accepted" | "declined"): void {
  try { setCookie(CONSENT_KEY, value); } catch {}
  try { localStorage.setItem(CONSENT_KEY, value); } catch {}
}

export const useCookieConsent = () => {
  const [consent, setConsent] = useState<ConsentStatus>(readConsent);

  const acceptCookies = useCallback(() => {
    writeConsent("accepted");
    setConsent("accepted");
    initAmplitude();
  }, []);

  const declineCookies = useCallback(() => {
    writeConsent("declined");
    setConsent("declined");
  }, []);

  const hasConsented = consent !== null;
  const showBanner = consent === null;

  return { consent, hasConsented, showBanner, acceptCookies, declineCookies };
};
