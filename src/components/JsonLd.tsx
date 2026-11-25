// Bloc de données structurées (JSON-LD) d'une page du site.
//
// Les robots (Google, IA...) reçoivent une page préparée par le guichet robots
// (api/bot-meta.ts) qui contient déjà, dans l'en-tête, TOUTES les données structurées de la
// page, marquées data-seo="bot". Quand l'outil de Google exécute ensuite le site, les pages
// ajoutaient leurs propres blocs : 2 Product, 2 BreadcrumbList pour une même fiche (constaté
// le 25/11/2026). Ce composant n'écrit donc rien si la page vient du guichet robots : une
// seule source par page. Pour un visiteur (ou un outil qui n'est pas reconnu comme robot),
// il écrit le bloc normalement.

let servedByBotDesk: boolean | null = null;

/** true = l'en-tête contient déjà les données structurées préparées pour les robots. */
export function pageHasBotJsonLd(): boolean {
  if (servedByBotDesk === null) {
    servedByBotDesk =
      typeof document !== "undefined" &&
      !!document.head.querySelector('script[type="application/ld+json"][data-seo="bot"]');
  }
  return servedByBotDesk;
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  if (pageHasBotJsonLd()) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
