import { cn } from "@/lib/utils";

export type SectionStatus = "empty" | "warning" | "ai" | "ok";

export interface SummarySection {
  id: string;
  label: string;
  status: SectionStatus;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

const STATUS_DOT: Record<SectionStatus, string> = {
  ok: "bg-[#1f7a4d]",
  warning: "bg-[#e0a400]",
  ai: "bg-[#5b3fc4]",
  empty: "bg-muted-foreground/30",
};

// Variante sobre (formulaire expérience seule) : noir = complète, contour rouge = à compléter,
// gris = vide. Pas de vert.
const STATUS_DOT_MONO: Record<SectionStatus, string> = {
  ok: "bg-[#1a1814]",
  warning: "bg-transparent ring-[1.5px] ring-inset ring-action",
  ai: "bg-transparent ring-[1.5px] ring-inset ring-action",
  empty: "bg-muted-foreground/30",
};

/**
 * Options d'affichage facultatives. Sans elles, le rendu est celui d'origine (formulaire hôtel).
 * - `mono` : pastilles noir / contour rouge / gris au lieu des couleurs.
 * - `wide` : colonnes latérales visibles à partir de 1280 px au lieu de 1100 px.
 */
interface DisplayOptions {
  mono?: boolean;
  wide?: boolean;
}

export const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export const getReadinessPercent = (items: ChecklistItem[]) =>
  Math.round((items.filter((c) => c.done).length / items.length) * 100);

// Sommaire à gauche : une ligne par section avec sa pastille d'état, puis
// l'encadré « Prête à publier ».
export function FormSummaryNav({
  sections,
  checklistItems,
  mono,
  wide,
}: { sections: SummarySection[]; checklistItems: ChecklistItem[] } & DisplayOptions) {
  const dots = mono ? STATUS_DOT_MONO : STATUS_DOT;
  const readinessPercent = getReadinessPercent(checklistItems);
  const missing = checklistItems.filter((c) => !c.done);
  return (
    <aside className={cn("hidden sticky top-16 self-start space-y-3", wide ? "min-[1280px]:block" : "min-[1100px]:block")}>
      <nav className="space-y-0.5">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollToSection(s.id)}
            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted text-left"
          >
            <span>{s.label}</span>
            <span className={cn("h-2 w-2 rounded-full shrink-0", dots[s.status])} />
          </button>
        ))}
      </nav>
      <div className="rounded-lg border border-[#e9e6e1] bg-[#faf8f6] p-3 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-medium">Prête à publier</span>
          <span className="font-semibold">{readinessPercent} %</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={cn("h-full", mono ? "bg-[#1a1814]" : "bg-[#1f7a4d]")} style={{ width: `${readinessPercent}%` }} />
        </div>
        {missing.length > 0 && (
          <ul className="text-muted-foreground space-y-0.5 pt-1">
            {missing.map((c) => (
              <li key={c.id}>Manque : {c.label}</li>
            ))}
          </ul>
        )}
        {mono ? (
          <p className="text-muted-foreground pt-1">
            <span className={cn("inline-block h-1.5 w-1.5 rounded-full mr-1", STATUS_DOT_MONO.ok)} /> complète ·{" "}
            <span className={cn("inline-block h-1.5 w-1.5 rounded-full mr-1", STATUS_DOT_MONO.warning)} /> à compléter ·{" "}
            <span className={cn("inline-block h-1.5 w-1.5 rounded-full mr-1", STATUS_DOT_MONO.empty)} /> vide
          </p>
        ) : (
          <p className="text-muted-foreground pt-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#5b3fc4] mr-1" /> IA à relire ·{" "}
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#1f7a4d] mr-1" /> OK ·{" "}
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#e0a400] mr-1" /> à compléter
          </p>
        )}
      </div>
    </aside>
  );
}

// Checklist « Avant de publier ». "side" : dans la colonne de droite ;
// "top" : version affichée sous le formulaire quand l'écran est étroit.
export function PublishChecklist({
  items,
  variant,
  mono,
  wide,
}: { items: ChecklistItem[]; variant: "side" | "top" } & DisplayOptions) {
  const side = variant === "side";
  return (
    <div
      className={cn(
        "rounded-lg border border-[#e9e6e1] bg-[#faf8f6] p-3",
        !side && (wide ? "min-[1280px]:hidden" : "min-[1100px]:hidden"),
      )}
    >
      <p className={cn("font-semibold mb-2", side ? "text-xs" : "text-sm")}>Avant de publier</p>
      <ul className={cn("space-y-1", side ? "text-xs" : "text-sm")}>
        {items.map((c) => (
          <li key={c.id} className={cn("flex items-center gap-1.5", c.done ? (mono ? "text-[#1a1814]" : "text-emerald-600") : "text-muted-foreground")}>
            <span>{c.done ? "✓" : "✗"}</span> {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Aperçu en direct à droite : photo, titre, accroche, puis le contenu propre
// à chaque type de fiche (children), et la checklist en dessous.
export function FormPreviewAside({
  heroImage,
  title,
  subtitle,
  checklistItems,
  children,
}: {
  heroImage: string | null;
  title: string;
  subtitle: string;
  checklistItems: ChecklistItem[];
  children: React.ReactNode;
}) {
  return (
    <aside className="hidden min-[1100px]:block sticky top-16 self-start space-y-3">
      <div className="rounded-2xl border border-[#e9e6e1] overflow-hidden bg-white">
        <div
          className="h-28 bg-muted"
          style={heroImage ? { backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        />
        <div className="p-3 space-y-2">
          <p className="font-extrabold uppercase text-sm leading-tight">{title || "Titre de l'expérience"}</p>
          <p className="text-xs text-muted-foreground">{subtitle || "Accroche de l'expérience…"}</p>
          {children}
        </div>
      </div>
      <PublishChecklist items={checklistItems} variant="side" />
    </aside>
  );
}
