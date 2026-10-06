// Format commun de la page Réservations : une ligne = une réservation, quelle que soit
// la table d'où elle vient (expérience, demande, hôtel, dossier de voyage payé).

export type ReservationSource = "booking" | "request" | "hotel" | "dossier";
export type ReservationType = "experience" | "boat" | "hotel" | "itinerary";
export type ReservationStatus = "demande" | "dispo_ok" | "confirmee" | "passee" | "annulee";
export type ClientPayment = "unpaid" | "deposit" | "paid" | "refunded";
// "none" : pas de fournisseur à payer suivi sur cette ligne (demande, hôtel synchronisé).
export type SupplierPayment = "todo" | "paid" | "none";

export interface ReservationRow {
  key: string;
  id: string;
  source: ReservationSource;
  ref: string;
  type: ReservationType;
  status: ReservationStatus;
  client: string;
  product: string;
  partner: string | null;
  // Date de la prestation (yyyy-MM-dd). Absente sur une demande sans date précise.
  date: string | null;
  // Date de réception, pour les demandes.
  receivedAt: string | null;
  pax: string;
  amount: number | null;
  currency: string;
  collected: number;
  clientPayment: ClientPayment;
  supplierCost: number | null;
  supplierPayment: SupplierPayment;
  channelKey: string;
  channelLabel: string;
  // Réservation payée en ligne : montant et paiement client viennent de Revolut.
  isOnline: boolean;
  notes: string | null;
  // Demande : date d'envoi au prestataire. Sert à savoir si l'action est urgente.
  sentToProviderAt: string | null;
  // Acompte à demander une fois la dispo confirmée (règle de la fiche expérience).
  depositDue: number | null;
  detailPath: string | null;
}

export type NextActionKind =
  | "send_to_provider"
  | "confirm_availability"
  | "send_deposit_link"
  | "send_payment_link"
  | "send_balance_link"
  | "confirm_collection"
  | "enter_supplier_cost"
  | "pay_supplier";

export interface NextAction {
  kind: NextActionKind;
  label: string;
  urgent: boolean;
}

export type ReservationTab = "all" | "hotels" | "experiences" | "itineraries";
export type StatusChip = "all" | "requests" | "todo";
export type PaymentFilter = "all" | "client_unpaid" | "client_deposit" | "client_paid" | "supplier_todo";
export type PeriodFilter = "all" | "upcoming" | "this_month" | "last_month" | "past";

export interface ReservationFilters {
  tab: ReservationTab;
  search: string;
  boatsOnly: boolean;
  payment: PaymentFilter;
  period: PeriodFilter;
  channel: string;
}

export type MoneyByCurrency = Record<string, number>;

export interface ReservationKpis {
  requests: number;
  toCollect: MoneyByCurrency;
  toPaySuppliers: MoneyByCurrency;
  knownMargin: MoneyByCurrency;
  missingCost: number;
}
