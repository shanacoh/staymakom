// Le logo texte STAYMAKOM du site (en-tête public, espace partenaire). Sur téléphone, l'en-tête du
// site le réduit au monogramme « SM » ; `compactOnMobile={false}` garde le nom complet.

import { cn } from "@/lib/utils";

export function BrandWordmark({ compactOnMobile = true, className }: { compactOnMobile?: boolean; className?: string }) {
  const word = "font-sans font-bold tracking-[-0.04em] uppercase text-foreground";
  if (!compactOnMobile) return <span className={cn(word, "text-lg md:text-xl", className)}>STAYMAKOM</span>;
  return (
    <>
      <span className={cn("hidden md:block text-xl", word, className)}>STAYMAKOM</span>
      <span className={cn("md:hidden text-lg", word, className)}>SM</span>
    </>
  );
}
