/**
 * Barre d'outils commune à tous les onglets de la page Réservations : recherche,
 * filtres de statut en puces, filtre rapide Bateaux, puis Paiement, Période et Canal.
 */

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterChip } from "@/components/admin/catalogue/FilterChip";
import { CHANNEL_OPTIONS } from "@/components/admin/BookingsGrid/columnTypes";
import type { PaymentFilter, PeriodFilter, StatusChip } from "@/lib/reservations/types";

const PAYMENT_OPTIONS: { value: PaymentFilter; label: string }[] = [
  { value: "all", label: "Tous les paiements" },
  { value: "client_unpaid", label: "Client : non payé" },
  { value: "client_deposit", label: "Client : acompte" },
  { value: "client_paid", label: "Client : payé" },
  { value: "supplier_todo", label: "Fournisseur : à payer" },
];

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "all", label: "Toutes les périodes" },
  { value: "upcoming", label: "À venir" },
  { value: "this_month", label: "Ce mois-ci" },
  { value: "last_month", label: "Le mois dernier" },
  { value: "past", label: "Passées" },
];

const CHANNEL_FILTER_OPTIONS = [
  { value: "all", label: "Tous les canaux" },
  { value: "online", label: "En ligne" },
  { value: "request", label: "Demande" },
  { value: "manual", label: "Manuel, sans canal" },
  ...CHANNEL_OPTIONS,
  { value: "dossier", label: "Dossier" },
];

const SELECT_CLASS = "h-8 w-auto gap-1.5 rounded-full px-3 text-xs";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  statusChip: StatusChip;
  onStatusChipChange: (value: StatusChip) => void;
  requestsCount: number;
  todoCount: number;
  showBoatsChip: boolean;
  boatsOnly: boolean;
  onBoatsOnlyChange: (value: boolean) => void;
  payment: PaymentFilter;
  onPaymentChange: (value: PaymentFilter) => void;
  period: PeriodFilter;
  onPeriodChange: (value: PeriodFilter) => void;
  channel: string;
  onChannelChange: (value: string) => void;
}

const ReservationsToolbar = (props: Props) => (
  <div className="flex flex-wrap items-center gap-2">
    <div className="relative min-w-[220px] max-w-[320px] flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        type="search"
        value={props.search}
        onChange={(e) => props.onSearchChange(e.target.value)}
        placeholder="Client, produit, réf, partenaire..."
        aria-label="Rechercher dans les réservations"
        className="h-9 pl-8"
      />
    </div>

    <FilterChip label="Tous statuts" active={props.statusChip === "all"} onClick={() => props.onStatusChipChange("all")} />
    <FilterChip
      label="Demandes"
      count={props.requestsCount}
      active={props.statusChip === "requests"}
      onClick={() => props.onStatusChipChange(props.statusChip === "requests" ? "all" : "requests")}
    />
    <FilterChip
      label="À traiter"
      count={props.todoCount}
      active={props.statusChip === "todo"}
      onClick={() => props.onStatusChipChange(props.statusChip === "todo" ? "all" : "todo")}
    />

    {props.showBoatsChip && (
      <FilterChip label="Bateaux" active={props.boatsOnly} onClick={() => props.onBoatsOnlyChange(!props.boatsOnly)} />
    )}

    <Select value={props.payment} onValueChange={(v) => props.onPaymentChange(v as PaymentFilter)}>
      <SelectTrigger className={SELECT_CLASS} aria-label="Filtrer par paiement">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PAYMENT_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    <Select value={props.period} onValueChange={(v) => props.onPeriodChange(v as PeriodFilter)}>
      <SelectTrigger className={SELECT_CLASS} aria-label="Filtrer par période">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIOD_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    <Select value={props.channel} onValueChange={props.onChannelChange}>
      <SelectTrigger className={SELECT_CLASS} aria-label="Filtrer par canal">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CHANNEL_FILTER_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default ReservationsToolbar;
