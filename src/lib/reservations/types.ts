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
  // Prestataire lié (réservation d'expérience), pour retrouver ses avoirs.
  providerId: string | null;
  // Annulation, côté client : remboursement (montant, à faire ou fait, moyen) et ce que Staymakom garde.
  refundAmount: number | null;
  refundStatus: RefundStatus;
  refundMethod: RefundMethod | null;
  keptAmount: number | null;
  // Annulation, côté prestataire : rien, à récupérer, récupéré ou gardé en avoir (montant), avoir encore ouvert.
  supplierRefundStatus: SupplierRefundStatus;
  supplierRefundAmount: number | null;
  supplierCreditOpen: boolean;
  phone: string | null;
  // Nuits d'un hôtel (vide pour les autres lignes).
  nights: number | null;
  // Marquée « à vérifier » (clic droit dans la Saisie), avec sa note éventuelle.
  flagged: boolean;
  checkNote: string | null;
}

export type RefundStatus = "none" | "todo" | "done";
export type RefundMethod = "revolut_business" | "revolut_perso" | "especes" | "avoir_client" | "autre";
export type SupplierRefundStatus = "none" | "a_recuperer" | "recupere" | "avoir";

// Avoir prestataire encore ouvert (vue SQL `admin_supplier_credits`).
export interface SupplierCredit {
  id: string;
  ref: string;
  providerId: string | null;
  providerName: string | null;
  client: string;
  product: string;
  date: string | null;
  amount: number;
  currency: string;
}

export type NextActionKind =
  | "open_request"
  | "convert_request"
  | "archive_request"
  | "cancel_refund"
  | "refund_client"
  | "recover_supplier"
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
// Filtre posé par une puce de la barre d'outils ou par un chiffre clé cliqué.
export type FocusFilter =
  | "requests"
  | "now"
  | "watch"
  | "to_check"
  | "to_collect"
  | "to_pay"
  | "missing_cost"
  | "refunds"
  | "to_recover";
export type StatusChip = "all" | FocusFilter;
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
  // Annulations : remboursements clients encore à faire, et argent chez les prestataires
  // (à récupérer, ou gardé en avoir pas encore utilisé).
  refundsToDo: MoneyByCurrency;
  supplierToRecover: MoneyByCurrency;
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

// Motif d'archivage d'une demande sans suite.
export type LostReason = "prix" | "pas_de_dispo" | "client_ne_repond_plus" | "a_reserve_ailleurs" | "date_passee" | "autre";

// Demande sortie du flux : convertie en réservation, ou archivée à la main avec un motif.
export interface ArchivedRequest {
  id: string;
  receivedAt: string;
  client: string;
  phone: string | null;
  email: string | null;
  product: string;
  type: "experience" | "boat";
  requestedDate: string | null;
  pax: string;
  exitStatus: "converted" | "closed";
  lostReason: LostReason | null;
  lostNote: string | null;
  closedAt: string | null;
  bookingId: string | null;
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

// Onglet Itinéraire : un dossier de voyage, quel que soit son statut (vue SQL `admin_itineraries`).
export type ItineraryGroup = "converti" | "en_cours" | "collab" | "modele" | "non_converti";
export type DossierLostReason = "prix" | "client_ne_repond_plus" | "a_reserve_ailleurs" | "v0_test" | "autre";

export interface ItineraryDossier {
  id: string;
  ref: string;
  // Nom du dossier (ex. « HAPPY BIRTHDAY MOM ») et client quand il est connu (ex. Josh Sirota).
  name: string;
  client: string | null;
  createdAt: string;
  arrival: string | null;
  departure: string | null;
  travelers: number | null;
  objective: "vente" | "collab";
  statut: string;
  archived: boolean;
  group: ItineraryGroup;
  opens: number;
  lastOpenedAt: string | null;
  sentAt: string | null;
  paidAt: string | null;
  // Montant convenu, seulement pour un dossier payé.
  amount: number | null;
  collected: number | null;
  proposedPrice: number | null;
  currency: string;
  token: string;
  // Page-itinéraire écrite dans le code du site (ex. /happy-birthday-mom) : le lien client y mène.
  customPage: string | null;
  lostReason: DossierLostReason | null;
  lostNote: string | null;
}

export interface ItineraryKpis {
  created: number;
  sent: number;
  converted: number;
  // Convertis / envoyés, en pourcentage arrondi. Absent tant que rien n'est envoyé.
  conversionRate: number | null;
  revenue: MoneyByCurrency;
}
