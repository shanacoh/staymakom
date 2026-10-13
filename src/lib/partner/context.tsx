// Ce que tous les écrans de l'espace partenaire partagent : la langue, les textes dans cette
// langue, et (une fois connecté) le prestataire et l'état de ses conditions.

import { createContext, useContext } from "react";
import { PARTNER_TEXTS, type PartnerTexts } from "./i18n";
import type { PartnerLang, PartnerSession } from "./types";

export interface PartnerContextValue {
  lang: PartnerLang;
  t: PartnerTexts;
  setLang: (lang: PartnerLang) => void;
  /** Absent sur la page de connexion. */
  session: PartnerSession | null;
  /** Remplace la session en mémoire par celle que la base vient de renvoyer. */
  setSession: (session: PartnerSession) => void;
}

export const PartnerContext = createContext<PartnerContextValue>({
  lang: "en",
  t: PARTNER_TEXTS.en,
  setLang: () => {},
  session: null,
  setSession: () => {},
});

export const usePartner = () => useContext(PartnerContext);

/** Pour les écrans affichés une fois connecté : la session est forcément là. */
export function usePartnerSession(): PartnerSession {
  const { session } = usePartner();
  if (!session) throw new Error("usePartnerSession utilisé hors de l'espace connecté");
  return session;
}

export const PARTNER_LANG_STORAGE_KEY = "partnerLang";
