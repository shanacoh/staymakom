// Format commun de la page Réservations : une ligne = une réservation, quelle que soit
// la table d'où elle vient (expérience, demande, hôtel, dossier de voyage payé).

export type ReservationSource = "booking" | "request" | "hotel" | "dossier";
export type ReservationType = "experience" | "boat" | "hotel" | "itinerary";
// "demande_sur_mesure" : demande de voyage sur mesure reçue par le formulaire du site, pas encore de dossier ouvert.
export type ReservationStatus = "demande" | "dispo_ok" | "demande_sur_mesure" | "confirmee" | "passee" | "annulee";
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
  // Nombre de coûts fournisseur encore à saisir (1 pour une réservation, une par ligne pour un dossier).
  missingCosts: number;
  // Ce qui reste à payer aux fournisseurs sur cette ligne, quand les coûts sont connus.
  supplierDue: number | null;
  detailPath: string | null;
}

export type NextActionKind =
  | "open_request"
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

// Paiement en ligne non abouti : une ligne par client et par expérience, tentatives regroupées.
export interface UnfinishedPayment {
  key: string;
  client: string;
  customerPhone: string | null;
  // Nom affiché dans la liste (français quand il existe).
  product: string;
  // Nom de l'expérience à citer dans le message de relance, selon la langue choisie.
  productByLanguage: { fr: string; en: string; he: string };
  attempts: number;
  amount: number | null;
  currency: string;
  lastAttemptAt: string;
  // "failed" : paiement échoué. "unfinished" : commencé, pas terminé depuis plus de 24 h.
  kind: "failed" | "unfinished";
  // Une réservation confirmée existe ensuite pour ce client (saisie à la main).
  converted: boolean;
}

// Ligne supprimée, gardée dans la corbeille pour pouvoir être restaurée.
export interface DeletedReservation {
  id: string;
  source: ReservationSource;
  client: string;
  product: string;
  amount: number | null;
  currency: string | null;
  deletedAt: string;
}

// Ligne de réservation d'un dossier de voyage payé (hôtel, activité, transport...).
export interface DossierLine {
  id: string;
  dossierId: string;
  nature: string;
  product: string;
  date: string | null;
  pax: string;
  currency: string;
  estimatedCost: number | null;
  cost: number | null;
  supplierPaid: boolean;
}

// Dossier de voyage pas encore payé, proposé dans « Lier un dossier payé ».
export interface UnpaidDossier {
  id: string;
  label: string;
  currency: string;
  proposedTotal: number | null;
}
