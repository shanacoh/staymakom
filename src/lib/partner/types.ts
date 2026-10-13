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
}

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
}

export interface PartnerSession {
  provider: PartnerProvider;
  user_email: string | null;
  terms: PartnerTerms;
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

export type ProposalType = "text" | "photos" | "price" | "practical_info" | "new_experience";
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
