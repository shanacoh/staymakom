import { Send, MapPin, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_OPTIONS, type CatalogueEntry, type CommercialStatus } from "@/lib/catalogue/types";

export function StatusBadge({ status }: { status: CommercialStatus }) {
  const option = STATUS_OPTIONS.find((o) => o.value === status);
  if (!option) return null;
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap font-medium", option.className)}>
      {option.label}
    </Badge>
  );
}

/** Indique si un lieu est déjà sur le site (et publié) ou seulement en brouillon. */
export function SiteBadge({ entry }: { entry: Pick<CatalogueEntry, "live_kind" | "live_status"> }) {
  if (!entry.live_kind) return null;
  const published = entry.live_status === "published";
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap text-[10px] font-medium",
        published ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-50 text-slate-500"
      )}
    >
      {published ? "Sur le site" : "Brouillon"}
    </Badge>
  );
}

function Chip({ done, label, children }: { done: boolean; label: string; children: React.ReactNode }) {
  return (
    <span
      title={`${label} : ${done ? "oui" : "non"}`}
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-full border",
        done ? "border-green-200 bg-green-50 text-green-700" : "border-dashed border-border text-muted-foreground/40"
      )}
    >
      {children}
      <span className="sr-only">
        {label} : {done ? "oui" : "non"}
      </span>
    </span>
  );
}

/** Les 3 cases du suivi contenu, en un coup d'œil : contenu envoyé, lieu visité, vidéo faite. */
export function ContentChips({
  entry,
}: {
  entry: Pick<CatalogueEntry, "content_sent" | "visited" | "video_done">;
}) {
  return (
    <div className="flex items-center gap-1">
      <Chip done={entry.content_sent} label="Contenu envoyé">
        <Send className="h-3 w-3" />
      </Chip>
      <Chip done={entry.visited} label="Visité">
        <MapPin className="h-3 w-3" />
      </Chip>
      <Chip done={entry.video_done} label="Vidéo faite">
        <Video className="h-3 w-3" />
      </Chip>
    </div>
  );
}
