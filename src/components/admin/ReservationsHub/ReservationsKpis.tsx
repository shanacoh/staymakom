/** Chiffres clés en haut de l'affichage « Vue » de la page Réservations. */

import { Tile } from "@/components/admin/DashboardTiles";
import { formatMoneyByCurrency } from "@/lib/reservations/rules";
import type { ReservationKpis } from "@/lib/reservations/types";

const VALUE_CLASS = "text-xl font-semibold tabular-nums";

const ReservationsKpis = ({ kpis }: { kpis: ReservationKpis }) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
    <Tile label="Demandes en cours">
      <p className={VALUE_CLASS}>{kpis.requests}</p>
    </Tile>
    <Tile label="À encaisser (clients)">
      <p className={VALUE_CLASS}>{formatMoneyByCurrency(kpis.toCollect)}</p>
    </Tile>
    <Tile label="À payer (fournisseurs)">
      <p className={VALUE_CLASS}>{formatMoneyByCurrency(kpis.toPaySuppliers)}</p>
    </Tile>
    <Tile label="Marge connue">
      <p className={VALUE_CLASS}>{formatMoneyByCurrency(kpis.knownMargin)}</p>
    </Tile>
    <Tile label="Coût fournisseur manquant">
      <p className={`${VALUE_CLASS} ${kpis.missingCost > 0 ? "text-amber-800" : ""}`}>
        {kpis.missingCost} ligne{kpis.missingCost > 1 ? "s" : ""}
      </p>
    </Tile>
  </div>
);

export default ReservationsKpis;
