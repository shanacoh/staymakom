/**
 * Chiffres clés en haut de l'affichage « Vue » de la page Réservations. Chacun (sauf la marge)
 * est cliquable : il filtre les lignes concernées, un second clic retire le filtre. Un chiffre
 * qui demande quelque chose prend la couleur de son état (ambre à régler, violet annulation,
 * rouge pour un remboursement à faire).
 */

import { cn } from "@/lib/utils";
import { formatMoneyByCurrency } from "@/lib/reservations/rules";
import type { FocusFilter, MoneyByCurrency, ReservationKpis, StatusChip } from "@/lib/reservations/types";

interface Props {
  kpis: ReservationKpis;
  focus: StatusChip;
  onFocusChange: (focus: FocusFilter) => void;
}

const isEmpty = (money: MoneyByCurrency) => Object.values(money).every((value) => value === 0);

function KpiTile({
  label,
  value,
  alertClass,
  alert,
  focus,
  active,
  onClick,
}: {
  label: string;
  value: string;
  alertClass?: string;
  alert?: boolean;
  focus?: FocusFilter;
  active?: boolean;
  onClick?: (focus: FocusFilter) => void;
}) {
  const content = (
    <>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={cn("text-xl font-semibold tabular-nums", alert && alertClass)}>{value}</span>
    </>
  );
  const base = "flex flex-col gap-1 rounded-lg border bg-card p-3 text-left";
  if (!focus || !onClick) return <div className={base}>{content}</div>;
  return (
    <button
      type="button"
      onClick={() => onClick(focus)}
      aria-pressed={active}
      title={active ? "Retirer ce filtre" : "Voir ces lignes"}
      className={cn(
        base,
        "transition-colors hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground",
        active && "border-foreground ring-1 ring-foreground",
      )}
    >
      {content}
    </button>
  );
}

const ReservationsKpis = ({ kpis, focus, onFocusChange }: Props) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
    <KpiTile
      label="Demandes en cours"
      value={String(kpis.requests)}
      alert={kpis.requests > 0}
      alertClass="text-sky-700"
      focus="requests"
      active={focus === "requests"}
      onClick={onFocusChange}
    />
    <KpiTile
      label="À encaisser (clients)"
      value={formatMoneyByCurrency(kpis.toCollect)}
      alert={!isEmpty(kpis.toCollect)}
      alertClass="text-amber-700"
      focus="to_collect"
      active={focus === "to_collect"}
      onClick={onFocusChange}
    />
    <KpiTile
      label="À payer (fournisseurs)"
      value={formatMoneyByCurrency(kpis.toPaySuppliers)}
      alert={!isEmpty(kpis.toPaySuppliers)}
      alertClass="text-amber-700"
      focus="to_pay"
      active={focus === "to_pay"}
      onClick={onFocusChange}
    />
    <KpiTile label="Marge connue" value={formatMoneyByCurrency(kpis.knownMargin)} />
    <KpiTile
      label="Coût fournisseur manquant"
      value={`${kpis.missingCost} ligne${kpis.missingCost > 1 ? "s" : ""}`}
      alert={kpis.missingCost > 0}
      alertClass="text-amber-700"
      focus="missing_cost"
      active={focus === "missing_cost"}
      onClick={onFocusChange}
    />
    <KpiTile
      label="Remboursements à faire"
      value={formatMoneyByCurrency(kpis.refundsToDo)}
      alert={!isEmpty(kpis.refundsToDo)}
      alertClass="text-destructive"
      focus="refunds"
      active={focus === "refunds"}
      onClick={onFocusChange}
    />
    <KpiTile
      label="À récupérer / avoirs ouverts"
      value={formatMoneyByCurrency(kpis.supplierToRecover)}
      alert={!isEmpty(kpis.supplierToRecover)}
      alertClass="text-violet-700"
      focus="to_recover"
      active={focus === "to_recover"}
      onClick={onFocusChange}
    />
  </div>
);

export default ReservationsKpis;
