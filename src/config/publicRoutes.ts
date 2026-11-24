// Plan des adresses du site, vu par le guichet robots (middleware.ts).
//
// Sert à trois choses :
//  1. ne JAMAIS toucher aux zones privées ni aux parcours de paiement (PRIVATE_PREFIXES) ;
//  2. reconnaître une adresse qui n'existe pas, pour répondre « 404 page introuvable »
//     aux robots au lieu de leur servir l'accueil (« soft 404 » relevé par l'audit IA) ;
//  3. savoir quelles pages ont un contenu à préparer pour les robots.
//
// Doit rester aligné sur les <Route> de src/App.tsx : le test publicRoutes.test.ts
// échoue si une adresse de App.tsx n'est pas classée ici.
// Fichier sans dépendance : lu par le middleware (Edge) et par les tests.

/** Zones privées et parcours de réservation / paiement : le guichet robots les laisse passer tels quels. */
export const PRIVATE_PREFIXES: readonly string[] = [
  "/admin",
  "/hotel-admin",
  "/partner",
  "/account",
  "/auth",
  "/mobile-login",
  "/cart",
  "/checkout",
  "/standalone-checkout",
  "/booking",
  "/standalone-booking",
  "/billet",
  "/gift-card",
  "/avis",
  "/tailor-questionnaire",
  "/swipe",
  "/voyage",
];

/** Pages publiques sans paramètre (une seule adresse chacune). */
export const STATIC_PATHS: readonly string[] = [
  "/",
  "/experiences",
  "/boat",
  "/journal",
  "/about",
  "/contact",
  "/companies",
  "/corporate",
  "/partners",
  "/consulting",
  "/terms",
  "/privacy",
  "/cancellation-policy",
  "/cookies",
  "/legal",
  // Pages anciennes, de lancement ou faites sur mesure pour un client : elles existent
  // (pas de 404), mais le guichet robots ne leur prépare pas de contenu.
  "/coming-soon",
  "/home",
  "/v3",
  "/vitrine",
  "/votre-itineraire",
  "/launch",
  "/launch/experiences",
  "/experiences2",
  "/experiences-old",
  "/partner-exp",
  "/partner-form",
  "/itineraries-AJ",
  "/Celine30",
  "/itineraire-tsfat",
  "/happy-birthday-mom",
  "/carrie-safed",
  "/rebeca",
  "/jade",
  "/vern",
  "/laura-mer-morte",
  "/NP",
  "/ilona",
  "/ilona-hotels",
  "/proposal",
  "/sharon",
  "/EL",
];

/** Pages publiques avec un identifiant de fiche (slug) : /hotel/the-inbal-jerusalem... */
export const SLUG_PREFIXES: readonly string[] = [
  "/hotel",
  "/hotels",
  "/hotel-old",
  "/experience",
  "/experience2",
  "/experience-old",
  "/standalone-experience",
  "/boat",
  "/category",
  "/journal",
];

export type PathKind = "private" | "page" | "unknown";

function normalize(pathname: string): string {
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return trimmed.toLowerCase();
}

/** Comme le site (React Router), les adresses ne tiennent pas compte des majuscules. */
export function classifyPath(pathname: string): PathKind {
  const path = normalize(pathname);
  if (PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return "private";
  if (STATIC_PATHS.some((p) => p.toLowerCase() === path)) return "page";
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 2 && SLUG_PREFIXES.includes(`/${segments[0]}`)) return "page";
  return "unknown";
}
