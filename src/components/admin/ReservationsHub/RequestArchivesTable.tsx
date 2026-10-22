/**
 * Liste derrière la puce « Archives » : les demandes sorties du flux, converties en réservation
 * ou archivées à la main avec un motif. En lecture, avec un filtre Bateaux et un export pour
 * relancer ces contacts plus tard. Une demande archivée peut être réouverte.
 */

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Download, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/admin/catalogue/FilterChip";
import { reopenRequest } from "@/lib/reservations/actions";
import { archivesToCsv, exitStatusLabel, lostReasonLabel } from "@/lib/reservations/archives";
import type { ArchivedRequest } from "@/lib/reservations/types";

interface Props {
  items: ArchivedRequest[];
  // Recherche de la barre d'outils, appliquée aussi ici.
  search: string;
  onReopened: () => void;
}

const day = (value: string | null) => (value ? format(parseISO(value), "dd/MM/yy") : "-");

function matchesSearch(item: ArchivedRequest, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return [item.client, item.phone, item.email, item.product].some((value) => value?.toLowerCase().includes(needle));
}

function downloadCsv(items: ArchivedRequest[]) {
  const blob = new Blob([archivesToCsv(items)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `demandes-archivees-${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const RequestArchivesTable = ({ items, search, onReopened }: Props) => {
  const [boatsOnly, setBoatsOnly] = useState(false);
  const visible = useMemo(
    () => items.filter((item) => (!boatsOnly || item.type === "boat") && matchesSearch(item, search)),
    [items, boatsOnly, search],
  );

  const reopen = useMutation({
    mutationFn: (item: ArchivedRequest) => reopenRequest(item.id),
    onSuccess: () => {
      toast.success("Demande réouverte : elle est de retour dans le flux");
      onReopened();
    },
    onError: (error: Error) => toast.error("Réouverture impossible", { description: error.message }),
  });

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Archives</h2>
          <p className="text-xs text-muted-foreground">
            Demandes converties en réservation ou archivées. Elles ne comptent dans aucun total.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FilterChip
            label="Bateaux"
            count={items.filter((item) => item.type === "boat").length}
            active={boatsOnly}
            onClick={() => setBoatsOnly(!boatsOnly)}
          />
          <Button size="sm" variant="outline" disabled={visible.length === 0} onClick={() => downloadCsv(visible)}>
            <Download className="h-3.5 w-3.5" />
            Exporter
          </Button>
        </div>
      </div>
      {visible.length === 0 ? (
        <div className="rounded-lg border bg-card py-12 text-center text-sm text-muted-foreground">
          {items.length === 0 ? "Aucune demande archivée." : "Aucune demande archivée ne correspond à ces filtres."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table className="min-w-[1080px]">
            <TableHeader>
              <TableRow>
                <TableHead>Reçue le</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Date demandée</TableHead>
                <TableHead>Pers.</TableHead>
                <TableHead>Sortie</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{day(item.receivedAt)}</TableCell>
                  <TableCell className="font-medium">{item.client}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">{item.phone || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{item.email || "-"}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{item.product}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">{day(item.requestedDate)}</TableCell>
                  <TableCell className="tabular-nums">{item.pax || "-"}</TableCell>
                  <TableCell className="whitespace-nowrap">{exitStatusLabel(item)}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">{lostReasonLabel(item) || "-"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {item.exitStatus === "closed" && (
                      <Button size="sm" variant="outline" disabled={reopen.isPending} onClick={() => reopen.mutate(item)}>
                        <Undo2 className="h-3.5 w-3.5" />
                        Réouvrir
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
};

export default RequestArchivesTable;
