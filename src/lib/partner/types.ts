// Ce que l'espace partenaire reçoit des fonctions `partner_*` de la base.
// Ces formes sont décidées côté base : marge, majoration, prix client, email et téléphone des
// clients n'y figurent pas et ne peuvent pas y être ajoutés depuis l'écran.

export type PartnerLang = "he" | "en" | "fr";

export interface PartnerProvider {
  id: string;
  name: string;
  provider_type: string;
  language: string | null;
  contact_name: string | null;
  email: string | null;
  whatsapp: string | null;
  legal_name: string | null;
  tax_id: string | null;
  address: string | null;
  day_contact_name: string | null;
  day_contact_whatsapp: string | null;
  day_contact_language: string | null;
  signatory_name?: string | null;
  signatory_title?: string | null;
  golive_target_date?: string | null;
}

/** Commission convenue (vide tant que l'équipe ne l'a pas saisie). */
export interface PartnerCommission {
  type?: "percent" | "fixed";
  value?: number;
  unit?: "per_person" | "per_booking";
  experiences?: Record<string, { type?: "percent" | "fixed"; value?: number; unit?: "per_person" | "per_booking" }>;
}

export type TermsKind = "experience_terms" | "hotel_contract";

export interface PartnerTerms {
  current_version: number | null;
  must_accept: boolean;
  accepted_version: string | null;
  accepted_at: string | null;
  signer_name: string | null;
  text_he: string | null;
  text_en: string | null;
  text_fr: string | null;
  published_at: string | null;
  kind?: TermsKind;
  display_version?: number | null;
  last_acceptance_id?: string | null;
  last_contract_pdf?: boolean | null;
  commission?: PartnerCommission | null;
  commission_label?: string | null;
  commission_ready?: boolean;
}

/** Contrat hôtel : les informations pré-remplies du modèle. */
export interface ContractVariables {
  hotel_name: string;
  company: string;
  registration_number: string;
  address: string;
  signatory_name: string;
  signatory_title: string;
  commission: string;
  date: string;
}

export interface PartnerSession {
  provider: PartnerProvider;
  user_email: string | null;
  terms: PartnerTerms;
  contract_variables?: ContractVariables | null;
  /** Vrai quand la session vient du lien partenaire (sans compte). */
  link_mode?: boolean;
}

export type PartnerProfilePatch = Partial<
  Pick<
    PartnerProvider,
    | "contact_name" | "whatsapp" | "legal_name" | "tax_id" | "address" | "language"
    | "day_contact_name" | "day_contact_whatsapp" | "day_contact_language"
  >
>;

export interface PartnerExperienceSummary {
  id: string;
  slug: string;
  status: "draft" | "published" | "archived";
  title: string | null;
  title_fr: string | null;
  title_he: string | null;
  image: string | null;
  is_primary: boolean;
  needs_questionnaire: boolean;
  needs_availability: boolean;
}

export interface PartnerAvailability {
  availability_mode: "whitelist" | "blacklist";
  /** 1 = lundi ... 7 = dimanche. */
  available_days: number[];
  blocked_dates: string[];
  whitelisted_dates: string[];
  has_time_slots: boolean;
  time_slots: string[];
}

export type ProposalType = "text" | "photos" | "price" | "practical_info" | "new_experience" | "note";
export type ProposalStatus = "pending" | "accepted" | "rejected";

export interface PartnerPendingProposal {
  id: string;
  proposal_type: ProposalType;
  lang: PartnerLang;
  proposed: Record<string, unknown>;
  created_at: string;
}

export interface PartnerExperienceDetail extends Record<string, unknown> {
  id: string;
  slug: string;
  status: "draft" | "published" | "archived";
  is_primary: boolean;
  hero_image: string | null;
  photos: string[];
  arrive_minutes_before: number | null;
  availability: PartnerAvailability;
  day_contact: { name: string | null; phone: string | null; language: string | null } | null;
  supplier_price: { adult: number | null; child: number | null } | null;
  currency: string;
  pending_proposals: PartnerPendingProposal[];
}

export interface PartnerProposal {
  id: string;
  experience_id: string | null;
  hotel_id?: string | null;
  section?: string | null;
  experience_title: string | null;
  experience_title_fr: string | null;
  experience_title_he: string | null;
  proposal_type: ProposalType;
  lang: PartnerLang;
  proposed: Record<string, unknown>;
  current: Record<string, unknown>;
  note: string | null;
  status: ProposalStatus;
  admin_comment: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface PartnerBooking {
  id: string;
  ref: string;
  experience_id: string | null;
  experience_title: string | null;
  experience_title_fr: string | null;
  experience_title_he: string | null;
  booking_date: string;
  time_slot: string | null;
  party_size: number;
  adults: number;
  children: number;
  customer_first_name: string;
  customer_last_initial: string | null;
  customer_language: string | null;
  special_requests: string | null;
  /** Ce qui revient au prestataire. Vide tant que rien ne permet de le calculer. */
  provider_amount: number | null;
  currency: string;
  settled: boolean;
  settled_at: string | null;
  settlement_reference: string | null;
}

export interface PartnerReview {
  id: string;
  experience_title: string | null;
  experience_title_fr: string | null;
  experience_title_he: string | null;
  customer_first_name: string;
  customer_last_initial: string | null;
  rating: number | null;
  comment: string | null;
  lang: string | null;
  review_date: string;
  staff_reply: string | null;
}

export interface PartnerUser {
  email: string;
  last_login_at: string | null;
  is_me: boolean;
}

// ── Parcours go live (lien partenaire, aperçu de l'annonce, règles) ─────────────────────────────

export type ListingKind = "experience" | "hotel";
export type StepActor = "staymakom" | "partner";

export interface GoLiveStep {
  key: string;
  actor: StepActor;
  done: boolean;
  subtasks?: { key: string; done: boolean }[];
  waiting_commission?: boolean;
}

export interface GoLiveTarget {
  kind: ListingKind;
  id: string;
  slug: string;
  status: string;
  title: string | null;
  title_he: string | null;
  title_fr: string | null;
}

export interface GoLive {
  kind: ListingKind;
  target: GoLiveTarget | null;
  steps: GoLiveStep[];
  current_step: string | null;
  my_turn: boolean;
  target_date: string | null;
  turn_since: string | null;
  counts: { total: number; prepared_by_team: number; for_you: number };
  commission: PartnerCommission | null;
  commission_ready: boolean;
}

export type FieldState = "confirmed" | "to_confirm" | "to_fill";
export type FieldSource = "staymakom" | "partner";

export interface ListingField {
  section: string;
  key: string;
  required: boolean;
  value: unknown;
  source: FieldSource;
  state: FieldState;
  confirmed_at: string | null;
}

export interface PartnerListing {
  kind: ListingKind;
  content: Record<string, unknown>;
  fields: ListingField[];
  pending_notes: { id: string; section: string | null; type: string; created_at: string }[];
}

export interface PartnerRules {
  min_party: number;
  max_party: number;
  min_age: number | null;
  lead_time_days: number | null;
  /** Jours ouverts, 1 = lundi ... 7 = dimanche. */
  available_days: number[];
  private_groups_only: boolean;
  know_before_you_go: string;
  free_cancellation_hours: 24 | 48;
}

export interface PartnerContract {
  id: string;
  kind: TermsKind;
  version: number;
  signer_name: string;
  signer_title: string | null;
  accepted_at: string;
  has_pdf: boolean;
  commission_label: string | null;
}
