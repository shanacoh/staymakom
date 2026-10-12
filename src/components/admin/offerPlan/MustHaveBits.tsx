import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { statusLabel, type MustHaveStatus, type OfferExperience } from "@/lib/offerPlan/types";
import { cn } from "@/lib/utils";
import { STATUS_CLASS, experienceEditUrl } from "./display";

// Petits éléments d'affichage partagés par la grille, le panneau d'une case et la liste.

export function MustHaveStatusBadge({ status }: { status: MustHaveStatus }) {
  return (
    <span className={cn("inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_CLASS[status])}>
      {statusLabel(status)}
    </span>
  );
}

export function CoreBadge({ core }: { core: boolean }) {
  if (!core) return null;
  return <span className="rounded-full bg-black px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Socle</span>;
}

export function ExperienceLink({ experience }: { experience: OfferExperience }) {
  return (
    <Link to={experienceEditUrl(experience)} className="underline underline-offset-2 hover:text-red-600">
      {experience.title}
      {experience.kind === "experience2" && <span className="text-muted-foreground"> · hôtel</span>}
      {!experience.published && <span className="text-muted-foreground"> · brouillon</span>}
    </Link>
  );
}

/** Un champ texte qui n'enregistre qu'en quittant le champ (ou avec Entrée), et seulement s'il a changé. */
export function CommitInput({
  value,
  onCommit,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "onBlur"> & {
  value: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <Input
      {...props}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft.trim() !== value.trim()) onCommit(draft.trim());
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}
