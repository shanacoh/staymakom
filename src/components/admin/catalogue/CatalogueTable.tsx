import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { resizedImageUrl } from "@/lib/imageUrl";
import { isFollowupDue } from "@/lib/catalogue/filters";
import { LIVE_KIND_LABELS, PLACE_TYPE_OPTIONS, SOURCE_OPTIONS, labelOf, type CatalogueEntry } from "@/lib/catalogue/types";
import { ContentChips, SiteBadge, StatusBadge } from "./CatalogueBadges";

interface CatalogueTableProps {
  entries: CatalogueEntry[];
  today: string;
  onSelect: (id: string) => void;
}

function formatDay(iso: string | null): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function Thumbnail({ entry }: { entry: CatalogueEntry }) {
  const src = resizedImageUrl(entry.display_image, 96) ?? entry.first_thumbnail ?? undefined;
  return src ? (
    <img src={src} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded object-cover" />
  ) : (
    <div className="h-10 w-10 shrink-0 rounded bg-muted" aria-hidden="true" />
  );
}

export function CatalogueTable({ entries, today, onSelect }: CatalogueTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Lieu</TableHead>
            <TableHead className="hidden text-[10px] font-semibold uppercase tracking-wider md:table-cell">Type</TableHead>
            <TableHead className="hidden text-[10px] font-semibold uppercase tracking-wider lg:table-cell">Où</TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Statut</TableHead>
            <TableHead className="hidden text-[10px] font-semibold uppercase tracking-wider md:table-cell">Contenu</TableHead>
            <TableHead className="hidden text-[10px] font-semibold uppercase tracking-wider lg:table-cell">Relance</TableHead>
            <TableHead className="hidden text-[10px] font-semibold uppercase tracking-wider xl:table-cell">Origine</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const where = [entry.display_city, entry.display_region].filter(Boolean).join(", ");
            const overdue = isFollowupDue(entry, today);
            return (
              <TableRow
                key={entry.id}
                className="cursor-pointer"
                onClick={() => onSelect(entry.id)}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(entry.id);
                  }
                }}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Thumbnail entry={entry} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{entry.display_name}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <SiteBadge entry={entry} />
                        {entry.live_kind && (
                          <span className="text-[11px] text-muted-foreground">{LIVE_KIND_LABELS[entry.live_kind]}</span>
                        )}
                        {entry.links_count > 0 && (
                          <span className="text-[11px] text-muted-foreground">
                            {entry.links_count} lien{entry.links_count > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-sm md:table-cell">
                  {labelOf(PLACE_TYPE_OPTIONS, entry.place_type)}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{where || "Non renseigné"}</TableCell>
                <TableCell>
                  <StatusBadge status={entry.commercial_status} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <ContentChips entry={entry} />
                </TableCell>
                <TableCell
                  className={cn("hidden whitespace-nowrap text-sm lg:table-cell", overdue && "font-medium text-destructive")}
                >
                  {formatDay(entry.next_followup_date)}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">
                  {labelOf(SOURCE_OPTIONS, entry.source)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
