// Le prestataire : celui qui réalise vraiment l'expérience, l'hôtel ou la sortie bateau.
// Entité unique du back-office (table `providers`, réservée aux admins), jamais visible côté client.

export type ProviderType = "experience" | "hotel" | "boat" | "other";
export type ProviderStatus = "prospect" | "en_discussion" | "signe" | "actif" | "en_pause" | "arrete";
export type ProviderLanguage = "he" | "en" | "fr";
export type ProviderBookingChannel = "hyperguest" | "provider_website" | "whatsapp" | "email" | "partner_portal";

export interface Option<T extends string> {
  value: T;
  label: string;
  /** Pas encore disponible : affiché grisé, impossible à choisir. */
  comingSoon?: boolean;
}

export const PROVIDER_TYPE_OPTIONS: Option<ProviderType>[] = [
  { value: "experience", label: "Expérience" },
  { value: "hotel", label: "Hôtel" },
  { value: "boat", label: "Bateau" },
  { value: "other", label: "Autre" },
];

export const PROVIDER_STATUS_OPTIONS: Option<ProviderStatus>[] = [
  { value: "prospect", label: "Prospect" },
  { value: "en_discussion", label: "En discussion" },
  { value: "signe", label: "Signé" },
  { value: "actif", label: "Actif" },
  { value: "en_pause", label: "En pause" },
  { value: "arrete", label: "Arrêté" },
];

export const PROVIDER_LANGUAGE_OPTIONS: Option<ProviderLanguage>[] = [
  { value: "he", label: "Hébreu" },
  { value: "en", label: "Anglais" },
  { value: "fr", label: "Français" },
];

export const PROVIDER_BOOKING_CHANNEL_OPTIONS: Option<ProviderBookingChannel>[] = [
  { value: "hyperguest", label: "HyperGuest" },
  { value: "provider_website", label: "Site du prestataire" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "partner_portal", label: "Espace partenaire", comingSoon: true },
];

const labelOf = <T extends string>(options: Option<T>[], value: string | null | undefined) =>
  options.find((o) => o.value === value)?.label ?? "";

export const providerTypeLabel = (value: string | null | undefined) => labelOf(PROVIDER_TYPE_OPTIONS, value);
export const providerStatusLabel = (value: string | null | undefined) => labelOf(PROVIDER_STATUS_OPTIONS, value);
/** Une langue saisie autrefois en texte libre est affichée telle quelle. */
export const providerLanguageLabel = (value: string | null | undefined) =>
  labelOf(PROVIDER_LANGUAGE_OPTIONS, value) || value || "";
export const providerBookingChannelLabel = (value: string | null | undefined) =>
  labelOf(PROVIDER_BOOKING_CHANNEL_OPTIONS, value);

// Pas de vert : noir = acquis, gris = en cours, barré = arrêté.
export const PROVIDER_STATUS_CLASS: Record<ProviderStatus, string> = {
  prospect: "border border-dashed border-neutral-400 text-neutral-600",
  en_discussion: "bg-neutral-200 text-neutral-800",
  signe: "border border-black text-black",
  actif: "bg-black text-white",
  en_pause: "bg-neutral-100 text-neutral-500",
  arrete: "text-muted-foreground line-through",
};

export interface Provider {
  id: string;
  name: string;
  provider_type: ProviderType;
  status: ProviderStatus;
  region_id: string | null;
  address: string | null;
  /** Langue de communication. */
  language: string | null;
  contact_name: string | null;
  email: string | null;
  whatsapp: string | null;
  /** Contact du jour J par défaut : celui de l'expérience reste prioritaire. */
  day_contact_name: string | null;
  day_contact_whatsapp: string | null;
  day_contact_language: ProviderLanguage | null;
  /** Commission en %. Vide tant qu'elle n'a pas été saisie. */
  commission_percent: number | null;
  /** Canal de réservation par défaut : celui de l'expérience reste prioritaire. */
  booking_channel: ProviderBookingChannel | null;
  booking_url: string | null;
  conditions: string | null;
  cancellation_weather_policy: string | null;
  policy_validated: boolean;
  legal_name: string | null;
  tax_id: string | null;
  /** Acceptation des conditions partenaires : remplie plus tard par l'espace partenaire. */
  terms_accepted_at: string | null;
  terms_version: string | null;
  crm_contact_id: string | null;
  internal_notes: string | null;
  /** Suit le statut : faux pour « en pause » et « arrêté ». */
  is_active: boolean;
}

/** Ce qu'on saisit à la main sur un prestataire (le reste est posé par la base ou l'espace partenaire). */
export type ProviderDraft = Omit<Provider, "id" | "is_active" | "terms_accepted_at" | "terms_version">;

export const EMPTY_PROVIDER_DRAFT: ProviderDraft = {
  name: "",
  provider_type: "experience",
  status: "prospect",
  region_id: null,
  address: null,
  language: null,
  contact_name: null,
  email: null,
  whatsapp: null,
  day_contact_name: null,
  day_contact_whatsapp: null,
  day_contact_language: null,
  commission_percent: null,
  booking_channel: null,
  booking_url: null,
  conditions: null,
  cancellation_weather_policy: null,
  policy_validated: false,
  legal_name: null,
  tax_id: null,
  crm_contact_id: null,
  internal_notes: null,
};

export const providerUrl = (id: string) => `/admin/partenaires/${id}`;

// ── Liaisons : ce qui est relié à un prestataire ────────────────────────────────────────────────

export interface LinkedStandaloneExperience {
  id: string;
  title: string;
  status: string;
  isBoat: boolean;
  /** Prestataire principal (`standalone_experience_internal.provider_id`). */
  providerId: string | null;
  /** Tous les prestataires de sa liste (cas des bateaux), principal compris. */
  supplierProviderIds: string[];
}

export interface LinkedHotel {
  id: string;
  name: string;
  status: string;
  providerId: string | null;
  /** Taux de commission de l'hôtel (table interne), montré en lecture seule. */
  commissionRate: number | null;
}

export interface LinkedHotelExperience {
  id: string;
  title: string;
  status: string;
  hotelId: string | null;
  /** Prestataire propre à l'expérience. Vide = celui de son hôtel. */
  ownProviderId: string | null;
}

export interface LinkedMustHave {
  id: string;
  name: string;
  status: string;
  categoryId: string;
  providerId: string | null;
}

export interface ProviderLinks {
  standalone: LinkedStandaloneExperience[];
  hotels: LinkedHotel[];
  hotelExperiences: LinkedHotelExperience[];
  mustHaves: LinkedMustHave[];
}

export const EMPTY_PROVIDER_LINKS: ProviderLinks = { standalone: [], hotels: [], hotelExperiences: [], mustHaves: [] };

// ── Réservations d'un prestataire ───────────────────────────────────────────────────────────────

export interface ProviderBooking {
  kind: "experience" | "hotel";
  id: string;
  /** Date de la prestation (arrivée pour un hôtel), au format AAAA-MM-JJ. */
  date: string;
  client: string;
  product: string;
  partySize: number | null;
  amount: number;
  currency: string;
  paymentStatus: string | null;
  cancelled: boolean;
  /** Ce que touche le prestataire, ou null si l'information manque. */
  providerNet: number | null;
}
