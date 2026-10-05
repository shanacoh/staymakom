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

export const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export const getReadinessPercent = (items: ChecklistItem[]) =>
  Math.round((items.filter((c) => c.done).length / items.length) * 100);

// Sommaire à gauche : une ligne par section avec sa pastille d'état, puis
// l'encadré « Prête à publier ».
export function FormSummaryNav({ sections, checklistItems }: { sections: SummarySection[]; checklistItems: ChecklistItem[] }) {
  const readinessPercent = getReadinessPercent(checklistItems);
  const missing = checklistItems.filter((c) => !c.done);
  return (
    <aside className="hidden min-[1100px]:block sticky top-16 self-start space-y-3">
      <nav className="space-y-0.5">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollToSection(s.id)}
            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted text-left"
          >
            <span>{s.label}</span>
            <span className={cn("h-2 w-2 rounded-full shrink-0", STATUS_DOT[s.status])} />
          </button>
        ))}
      </nav>
      <div className="rounded-lg border border-[#e9e6e1] bg-[#faf8f6] p-3 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-medium">Prête à publier</span>
          <span className="font-semibold">{readinessPercent} %</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-[#1f7a4d]" style={{ width: `${readinessPercent}%` }} />
        </div>
        {missing.length > 0 && (
          <ul className="text-muted-foreground space-y-0.5 pt-1">
            {missing.map((c) => (
              <li key={c.id}>Manque : {c.label}</li>
            ))}
          </ul>
        )}
        <p className="text-muted-foreground pt-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#5b3fc4] mr-1" /> IA à relire ·{" "}
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#1f7a4d] mr-1" /> OK ·{" "}
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#e0a400] mr-1" /> à compléter
        </p>
      </div>
    </aside>
  );
}

// Checklist « Avant de publier ». "side" : dans la colonne de droite ;
// "top" : version affichée sous le formulaire quand l'écran est étroit.
export function PublishChecklist({ items, variant }: { items: ChecklistItem[]; variant: "side" | "top" }) {
  const side = variant === "side";
  return (
    <div className={cn("rounded-lg border border-[#e9e6e1] bg-[#faf8f6] p-3", !side && "min-[1100px]:hidden")}>
      <p className={cn("font-semibold mb-2", side ? "text-xs" : "text-sm")}>Avant de publier</p>
      <ul className={cn("space-y-1", side ? "text-xs" : "text-sm")}>
        {items.map((c) => (
          <li key={c.id} className={cn("flex items-center gap-1.5", c.done ? "text-emerald-600" : "text-muted-foreground")}>
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
