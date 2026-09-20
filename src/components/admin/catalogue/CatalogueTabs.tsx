import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TabKey } from "@/lib/catalogue/filters";
import { NATURE_OPTIONS } from "@/lib/catalogue/types";

interface CatalogueTabsProps {
  value: TabKey;
  counts: Record<TabKey, number>;
  onChange: (tab: TabKey) => void;
  /** Ajoute l'onglet "À trier" (la boîte de réception). La carte n'en a pas besoin. */
  withInbox?: boolean;
}

const NATURE_TABS: { value: TabKey; label: string }[] = [
  { value: "all", label: "Tous" },
  ...NATURE_OPTIONS.map((n) => ({ value: n.value as TabKey, label: n.label })),
];

/** Onglets par nature (Tous / Partenaires / Hors réseau / Inspiration), avec le nombre de lieux de chacun. */
export function CatalogueTabs({ value, counts, onChange, withInbox = false }: CatalogueTabsProps) {
  const tabs = withInbox ? [...NATURE_TABS, { value: "a_trier" as TabKey, label: "À trier" }] : NATURE_TABS;
  return (
    <Tabs value={value} onValueChange={(tab) => onChange(tab as TabKey)}>
      <TabsList className="h-auto flex-wrap justify-start">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
            {tab.label}
            <span className="ml-1.5 text-muted-foreground">{counts[tab.value]}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
