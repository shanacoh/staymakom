// Langue des emails envoyés au client.
// - Réservation faite depuis une page en espagnol, russe ou allemand (client_locale) : cette langue.
// - Sinon la langue habituelle (preferred_lang : anglais, français ou hébreu).
// Le back-office et les emails internes restent en français / anglais, sans changement.

export type EmailLang = "en" | "fr" | "he" | "es" | "ru" | "de";

export function customerEmailLang(clientLocale: unknown, preferredLang: unknown): EmailLang {
  if (clientLocale === "es" || clientLocale === "ru" || clientLocale === "de") return clientLocale;
  return preferredLang === "fr" || preferredLang === "he" ? preferredLang : "en";
}

export function isAutoEmailLang(lang: EmailLang): lang is "es" | "ru" | "de" {
  return lang === "es" || lang === "ru" || lang === "de";
}
