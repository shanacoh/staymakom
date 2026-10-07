/**
 * Pastilles de la page Réservations (type, statut, paiements). Règle de couleur de la DA :
 * pas de vert, neutre pour ce qui est réglé, ambre pour ce qui reste à régler, bleu clair
 * pour Acompte et Dispo OK. Le rouge est réservé aux actions urgentes, jamais aux pastilles.
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClientPayment, ReservationStatus, ReservationType, SupplierPayment } from "@/lib/reservations/types";

const TONE = {
  neutral: "border-transparent bg-muted text-foreground",
  muted: "border-border bg-transparent text-muted-foreground",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  blue: "border-sky-200 bg-sky-50 text-sky-900",
} as const;

type Tone = keyof typeof TONE;

const Pill = ({ tone, children }: { tone: Tone; children: React.ReactNode }) => (
  <Badge variant="outline" className={cn("whitespace-nowrap font-medium", TONE[tone])}>
    {children}
  </Badge>
);

const TYPE_LABELS: Record<ReservationType, string> = {
  boat: "Bateau",
  experience: "Expérience",
  hotel: "Hôtel",
  itinerary: "Itinéraire",
};

export const TypeTag = ({ type }: { type: ReservationType }) => (
  <Badge
    variant="outline"
    className="rounded-md px-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
  >
    {TYPE_LABELS[type]}
  </Badge>
);

const STATUS: Record<ReservationStatus, { label: string; tone: Tone }> = {
  demande: { label: "Demande", tone: "amber" },
  dispo_ok: { label: "Dispo OK", tone: "blue" },
  demande_sur_mesure: { label: "Demande sur-mesure", tone: "amber" },
  confirmee: { label: "Confirmée", tone: "neutral" },
  passee: { label: "Passée", tone: "muted" },
  annulee: { label: "Annulée", tone: "muted" },
};

export const StatusPill = ({ status }: { status: ReservationStatus }) => (
  <Pill tone={STATUS[status].tone}>{STATUS[status].label}</Pill>
);

const CLIENT_PAYMENT: Record<ClientPayment, { label: string; tone: Tone }> = {
  unpaid: { label: "Non payé", tone: "amber" },
  deposit: { label: "Acompte", tone: "blue" },
  paid: { label: "Payé", tone: "neutral" },
  refunded: { label: "Remboursé", tone: "muted" },
};

export const ClientPaymentPill = ({ payment }: { payment: ClientPayment }) => (
  <Pill tone={CLIENT_PAYMENT[payment].tone}>{CLIENT_PAYMENT[payment].label}</Pill>
);

export const SupplierPaymentPill = ({ payment }: { payment: SupplierPayment }) => {
  if (payment === "none") return <span className="text-muted-foreground">—</span>;
  return payment === "paid" ? <Pill tone="neutral">Payé</Pill> : <Pill tone="amber">À payer</Pill>;
};
