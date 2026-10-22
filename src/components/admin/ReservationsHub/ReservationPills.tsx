/**
 * Pastilles de la page Réservations (type, statut, paiements). Règle de couleur de la DA :
 * pas de vert, neutre pour ce qui est réglé, ambre pour ce qui reste à régler, bleu clair
 * pour Acompte et Dispo OK. Le rouge est réservé aux actions urgentes, jamais aux pastilles.
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClientPayment, ReservationStatus, ReservationType, SupplierPayment } from "@/lib/reservations/types";
import type { Tone as LookTone } from "@/lib/reservations/entryLook";

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

// Pastilles pleines de l'affichage « Saisie », façon Excel : gris foncé = réglé, ambre = à régler,
// bleu = acompte ou demande, violet = annulé ou remboursé, jaune = avoir. Toujours pas de vert.
const FILLED: Record<LookTone, string> = {
  neutral: "bg-muted text-foreground",
  dark: "bg-neutral-700 text-white",
  amber: "bg-amber-400 text-amber-950",
  blue: "bg-sky-600 text-white",
  violet: "bg-violet-500 text-white",
  yellow: "bg-yellow-300 text-yellow-950",
};

export const FilledPill = ({ tone, children, className }: { tone: LookTone; children: React.ReactNode; className?: string }) => (
  <span
    className={cn(
      "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4",
      FILLED[tone],
      className,
    )}
  >
    {children}
  </span>
);
