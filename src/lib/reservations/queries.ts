// Lecture des réservations pour la page unique du back-office. Tout le travail de mise au
// format commun (statut, type, encaissé...) est fait par la vue SQL `admin_reservations`
// (migration 20261006120000) : ici on ne fait que lire la vue et habiller les libellés.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CHANNEL_LABELS } from "@/components/admin/BookingsGrid/columnTypes";
import type {
  ClientPayment,
  ReservationRow,
  ReservationSource,
  ReservationStatus,
  ReservationType,
  SupplierPayment,
} from "./types";

export const RESERVATIONS_QUERY_KEY = ["admin-reservations-unified"];

// Une ligne de la vue `admin_reservations`, telle que la base la renvoie.
interface AdminReservationViewRow {
  source: ReservationSource;
  id: string;
  ref: string;
  type: ReservationType;
  status: ReservationStatus;
  client: string;
  product: string;
  partner: string | null;
  service_date: string | null;
  received_at: string | null;
  pax: string | null;
  amount: number | null;
  currency: string;
  collected: number | null;
  client_payment: ClientPayment;
  supplier_cost: number | null;
  supplier_payment: SupplierPayment;
  channel_key: string;
  origin: string | null;
  is_online: boolean;
  notes: string | null;
  sent_to_provider_at: string | null;
  deposit_due: number | null;
}

const DETAIL_PATHS: Record<ReservationSource, ((id: string) => string) | null> = {
  booking: (id) => `/admin/standalone-bookings/${id}`,
  hotel: (id) => `/admin/reservations/${id}`,
  dossier: (id) => `/admin/dossiers/${id}`,
  request: null,
};

function channelLabel(row: AdminReservationViewRow): string {
  if (row.source === "request") return row.origin === "card_whatsapp" ? "Bouton WhatsApp" : "Demande site";
  if (row.source === "dossier") return "Dossier";
  if (row.is_online) return "En ligne";
  const channel = CHANNEL_LABELS[row.channel_key];
  return channel ? `Manuel · ${channel}` : "Manuel";
}

const toNumber = (value: number | string | null): number | null => (value === null ? null : Number(value));

function toReservationRow(row: AdminReservationViewRow): ReservationRow {
  return {
    key: `${row.source}:${row.id}`,
    id: row.id,
    source: row.source,
    ref: row.ref,
    type: row.type,
    status: row.status,
    client: row.client,
    product: row.product,
    partner: row.partner,
    date: row.service_date,
    receivedAt: row.received_at,
    pax: row.pax ?? "",
    amount: toNumber(row.amount),
    currency: row.currency,
    collected: toNumber(row.collected) ?? 0,
    clientPayment: row.client_payment,
    supplierCost: toNumber(row.supplier_cost),
    supplierPayment: row.supplier_payment,
    channelKey: row.channel_key,
    channelLabel: channelLabel(row),
    isOnline: row.is_online,
    notes: row.notes,
    sentToProviderAt: row.sent_to_provider_at,
    depositDue: toNumber(row.deposit_due),
    detailPath: DETAIL_PATHS[row.source]?.(row.id) ?? null,
  };
}

async function fetchReservationRows(): Promise<ReservationRow[]> {
  // La vue n'est pas encore dans les types générés de la base.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).from("admin_reservations").select("*");
  if (error) throw error;

  const rows = (data as AdminReservationViewRow[]).map(toReservationRow);
  // Du plus récent au plus ancien ; une demande sans date précise se classe à sa date de réception.
  const sortDate = (row: ReservationRow) => row.date ?? row.receivedAt?.slice(0, 10) ?? "";
  return rows.sort((a, b) => sortDate(b).localeCompare(sortDate(a)));
}

export function useReservationRows() {
  return useQuery({ queryKey: RESERVATIONS_QUERY_KEY, queryFn: fetchReservationRows });
}
