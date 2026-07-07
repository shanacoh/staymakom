export interface BreadcrumbCrumb {
  name: string;
  url: string;
}

/**
 * Construit le schéma BreadcrumbList (schema.org) à partir du même fil
 * d'Ariane que celui affiché à l'écran, pour que Google comprenne la
 * hiérarchie de navigation de façon fiable (pas seulement visuelle).
 */
export function buildBreadcrumbJsonLd(crumbs: BreadcrumbCrumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}
