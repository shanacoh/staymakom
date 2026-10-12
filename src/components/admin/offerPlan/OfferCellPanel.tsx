import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CellDetail, GridCell } from "@/lib/offerPlan/compute";
import { formatLabel, type OfferExperience } from "@/lib/offerPlan/types";
import { findLinkedExperience } from "./display";
import { CommitInput, CoreBadge, ExperienceLink, MustHaveStatusBadge } from "./MustHaveBits";

interface OfferCellPanelProps {
  moodName: string;
  regionName: string;
  cell: GridCell;
  detail: CellDetail;
  experiences: OfferExperience[];
  onTargetChange: (target: number) => void;
  onClose: () => void;
}

/** Le détail d'une case de la grille : son objectif, ses must-haves et ses expériences hors plan. */
export function OfferCellPanel({ moodName, regionName, cell, detail, experiences, onTargetChange, onClose }: OfferCellPanelProps) {
  const commitTarget = (raw: string) => {
    const target = Math.max(0, Math.floor(Number(raw) || 0));
    if (target !== cell.target) onTargetChange(target);
  };

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-4" aria-label={`${moodName}, ${regionName}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {moodName} · {regionName}
          </h2>
          <p className="text-xs text-muted-foreground">
            {cell.live} en ligne sur un objectif de {cell.target}
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="offer-target" className="text-xs">
              Objectif
            </Label>
            <CommitInput
              id="offer-target"
              type="number"
              min={0}
              inputMode="numeric"
              className="h-8 w-20"
              value={String(cell.target)}
              onCommit={commitTarget}
            />
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Fermer le détail">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Must-haves de cette case ({detail.mustHaves.length})
        </h3>
        {detail.mustHaves.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun must-have de ce mood n'a cette région parmi ses régions candidates.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Partenaire</TableHead>
                <TableHead>Expérience liée</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.mustHaves.map((m) => {
                const linked = findLinkedExperience(m, experiences);
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <span className="mr-2">{m.name}</span>
                      <CoreBadge core={m.is_core} />
                    </TableCell>
                    <TableCell>{formatLabel(m.format) || "–"}</TableCell>
                    <TableCell>
                      <MustHaveStatusBadge status={m.status} />
                    </TableCell>
                    <TableCell>{m.partner || "–"}</TableCell>
                    <TableCell>{linked ? <ExperienceLink experience={linked} /> : "–"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {detail.offPlan.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            En ligne, hors plan ({detail.offPlan.length})
          </h3>
          <ul className="space-y-1 text-sm">
            {detail.offPlan.map((e) => (
              <li key={`${e.kind}:${e.id}`} className="flex flex-wrap items-center gap-2">
                <ExperienceLink experience={e} />
                <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Hors plan
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
