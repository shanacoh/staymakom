import { useState, useCallback } from "react";
import { initAmplitude } from "@/lib/amplitude";

const CONSENT_KEY = "staymakom_cookie_consent";

type ConsentStatus = "accepted" | "declined" | null;

export const useCookieConsent = () => {
  const [consent, setConsent] = useState<ConsentStatus>(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === "accepted") return "accepted";
    if (stored === "declined") return "declined";
    return null;
  });

  const acceptCookies = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setConsent("accepted");
    initAmplitude();
  }, []);

  const declineCookies = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setConsent("declined");
  }, []);

  const hasConsented = consent !== null;
  const showBanner = consent === null;

  return { consent, hasConsented, showBanner, acceptCookies, declineCookies };
};
