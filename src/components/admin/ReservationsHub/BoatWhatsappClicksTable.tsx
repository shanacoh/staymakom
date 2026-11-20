/**
 * Liste derrière la puce « Clics WhatsApp » : les clics sur le bouton vert des cartes bateau
 * (/boat), dont on ne sait pas encore si le client a vraiment envoyé son message. Chaque clic
 * porte la référence glissée dans le message WhatsApp pré-rempli : quand un client écrit avec
 * cette référence, « Le client a écrit » fait entrer la demande dans le flux.
 */

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { MessageCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { durationLabel } from "@/lib/reservations/whatsapp";
import type { BoatWhatsappClick } from "@/lib/reservations/types";
import ClaimWhatsappClickDialog from "./ClaimWhatsappClickDialog";

interface Props {
  items: BoatWhatsappClick[];
  // Recherche de la barre d'outils : on y tape la référence lue dans WhatsApp.
  search: string;
  onClaimed: () => void;
}

const DATE_RANGE_LABELS: Record<string, string> = {
  "today or tomorrow": "Aujourd'hui ou demain",
  "this week": "Dans la semaine",
};

function whenLabel(item: BoatWhatsappClick): string {
  if (item.requestedDate) return format(parseISO(item.requestedDate), "dd/MM/yy");
  if (item.dateRange) return DATE_RANGE_LABELS[item.dateRange] ?? item.dateRange;
  return "-";
}

function matchesSearch(item: BoatWhatsappClick, search: string): boolean {
  const needle = search.trim().toLowerCase().replace(/^r[ée]f\.?\s*/, "");
  if (!needle) return true;
  return [item.ref, item.product, item.city].some((value) => value?.toLowerCase().includes(needle));
}

const BoatWhatsappClicksTable = ({ items, search, onClaimed }: Props) => {
  const [claiming, setClaiming] = useState<BoatWhatsappClick | null>(null);
  const visible = useMemo(() => items.filter((item) => matchesSearch(item, search)), [items, search]);

  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Clics WhatsApp</h2>
        <p className="text-xs text-muted-foreground">
          Clics sur « Demander sur WhatsApp » des cartes bateau. Le client a peut-être écrit, peut-être pas : quand un
          message arrive avec une référence, tape-la dans la recherche puis « Le client a écrit ». Aucun email n'est envoyé
          pour ces clics, et ils ne comptent dans aucun total.
        </p>
      </div>
      {visible.length === 0 ? (
        <div className="rounded-lg border bg-card py-12 text-center text-sm text-muted-foreground">
          {items.length === 0 ? "Aucun clic en attente." : "Aucun clic ne correspond à cette recherche."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead>Clic le</TableHead>
                <TableHead>Réf.</TableHead>
                <TableHead>Bateau</TableHead>
                <TableHead>Pers.</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Quand</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                    {format(parseISO(item.clickedAt), "dd/MM/yy HH:mm")}
                  </TableCell>
                  <TableCell className="font-mono font-semibold">{item.ref}</TableCell>
                  <TableCell className="max-w-[240px] truncate">
                    {item.product}
                    {item.city ? <span className="text-muted-foreground"> · {item.city}</span> : null}
                  </TableCell>
                  <TableCell className="tabular-nums">{item.persons || "-"}</TableCell>
                  <TableCell className="whitespace-nowrap">{durationLabel(item.durationMinutes) || "-"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {whenLabel(item)}
                    {item.sunset ? " · sunset" : ""}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Button size="sm" variant="outline" onClick={() => setClaiming(item)}>
                      <MessageCircle className="h-3.5 w-3.5" />
                      Le client a écrit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {claiming && <ClaimWhatsappClickDialog click={claiming} onClose={() => setClaiming(null)} onDone={onClaimed} />}
    </section>
  );
};

export default BoatWhatsappClicksTable;
