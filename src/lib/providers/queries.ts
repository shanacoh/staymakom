import type { SupabaseClient } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BOATS_CATEGORY_ID } from "@/lib/boatsCategory";
import { providerNetOf, type ExperienceCost } from "./compute";
import {
  EMPTY_PROVIDER_LINKS,
  type Provider,
  type ProviderBooking,
  type ProviderDraft,
  type ProviderLinks,
} from "./types";

// Lecture et écriture des prestataires. Toutes les tables lues ici sont réservées aux admins par la base.

// Les nouvelles colonnes ne sont pas encore dans les types générés.
const db = supabase as unknown as SupabaseClient;

export const PROVIDERS_QUERY_KEY = ["admin-providers"] as const;
export const PROVIDER_LINKS_QUERY_KEY = ["admin-provider-links"] as const;

const PROVIDER_COLUMNS =
  "id, name, provider_type, status, region_id, address, language, contact_name, email, whatsapp, day_contact_name, day_contact_whatsapp, day_contact_language, commission_percent, booking_channel, booking_url, conditions, cancellation_weather_policy, policy_validated, legal_name, tax_id, terms_accepted_at, terms_version, crm_contact_id, internal_notes, is_active";

export async function fetchProviders(): Promise<Provider[]> {
  const { data, error } = await db.from("providers").select(PROVIDER_COLUMNS).order("name");
  if (error) throw error;
  return (data ?? []) as unknown as Provider[];
}

export function useProviders() {
  const query = useQuery({ queryKey: PROVIDERS_QUERY_KEY, queryFn: fetchProviders, staleTime: 60 * 1000 });
  return { ...query, providers: query.data ?? [] };
}

export async function createProvider(draft: ProviderDraft): Promise<Provider> {
  const { data, error } = await db.from("providers").insert([draft]).select(PROVIDER_COLUMNS).single();
  if (error) throw error;
  return data as unknown as Provider;
}

export async function updateProvider(id: string, patch: Partial<ProviderDraft>): Promise<void> {
  const { error } = await db.from("providers").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteProvider(id: string): Promise<void> {
  const { error } = await db.from("providers").delete().eq("id", id);
  if (error) throw error;
}

/** Une écriture sur les prestataires : elle recharge la liste et les liaisons une fois terminée. */
export function useProviderMutation<TArgs, TResult>(write: (args: TArgs) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: write,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PROVIDER_LINKS_QUERY_KEY });
    },
  });
}

// ── Liaisons ────────────────────────────────────────────────────────────────────────────────────

interface StandaloneRow {
  id: string;
  title: string | null;
  title_fr: string | null;
  slug: string;
  status: string;
  category_id: string | null;
}

/** Tout ce qui peut être relié à un prestataire : expériences seules, hôtels, expériences hôtel, must-haves. */
export async function fetchProviderLinks(): Promise<ProviderLinks> {
  const [standalone, standaloneInternal, suppliers, hotels, hotelInternal, hotelExperiences, hotelExperienceInternal, mustHaves] =
    await Promise.all([
      db.from("standalone_experiences").select("id, title, title_fr, slug, status, category_id").order("title"),
      db.from("standalone_experience_internal").select("experience_id, provider_id"),
      db.from("standalone_experience_suppliers").select("experience_id, provider_id").not("provider_id", "is", null),
      db.from("hotels2").select("id, name, status").order("name"),
      db.from("hotel2_internal").select("hotel_id, provider_id, commission_rate"),
      db.from("experiences2").select("id, title, status, hotel_id").order("title"),
      db.from("experience2_internal").select("experience_id, provider_id"),
      db.from("offer_must_haves").select("id, name, status, category_id, provider_id").not("provider_id", "is", null).order("name"),
    ]);
  for (const result of [standalone, standaloneInternal, suppliers, hotels, hotelInternal, hotelExperiences, hotelExperienceInternal, mustHaves]) {
    if (result.error) throw result.error;
  }

  const primaryByExperience = new Map<string, string | null>(
    (standaloneInternal.data ?? []).map((r) => [r.experience_id as string, (r.provider_id as string | null) ?? null]),
  );
  const suppliersByExperience = new Map<string, string[]>();
  for (const s of suppliers.data ?? []) {
    const list = suppliersByExperience.get(s.experience_id as string) ?? [];
    list.push(s.provider_id as string);
    suppliersByExperience.set(s.experience_id as string, list);
  }
  const hotelInternalById = new Map((hotelInternal.data ?? []).map((r) => [r.hotel_id as string, r]));
  const ownProviderByHotelExperience = new Map<string, string | null>(
    (hotelExperienceInternal.data ?? []).map((r) => [r.experience_id as string, (r.provider_id as string | null) ?? null]),
  );

  return {
    standalone: ((standalone.data ?? []) as StandaloneRow[]).map((e) => ({
      id: e.id,
      title: e.title || e.title_fr || e.slug,
      status: e.status,
      isBoat: e.category_id === BOATS_CATEGORY_ID,
      providerId: primaryByExperience.get(e.id) ?? null,
      supplierProviderIds: suppliersByExperience.get(e.id) ?? [],
    })),
    hotels: (hotels.data ?? []).map((h) => {
      const internal = hotelInternalById.get(h.id as string);
      return {
        id: h.id as string,
        name: h.name as string,
        status: h.status as string,
        providerId: (internal?.provider_id as string | null) ?? null,
        commissionRate: internal?.commission_rate == null ? null : Number(internal.commission_rate),
      };
    }),
    hotelExperiences: (hotelExperiences.data ?? []).map((e) => ({
      id: e.id as string,
      title: e.title as string,
      status: e.status as string,
      hotelId: (e.hotel_id as string | null) ?? null,
      ownProviderId: ownProviderByHotelExperience.get(e.id as string) ?? null,
    })),
    mustHaves: (mustHaves.data ?? []).map((m) => ({
      id: m.id as string,
      name: m.name as string,
      status: m.status as string,
      categoryId: m.category_id as string,
      providerId: (m.provider_id as string | null) ?? null,
    })),
  };
}

export function useProviderLinks() {
  const query = useQuery({ queryKey: PROVIDER_LINKS_QUERY_KEY, queryFn: fetchProviderLinks, staleTime: 60 * 1000 });
  return { ...query, links: query.data ?? EMPTY_PROVIDER_LINKS };
}

// ── Réservations ────────────────────────────────────────────────────────────────────────────────

const toNumber = (value: unknown): number | null => (value == null || value === "" ? null : Number(value));

interface BookingScope {
  providerId: string;
  /** Expériences seules dont il est le prestataire principal, avec leur titre. */
  experiences: { id: string; title: string }[];
  /** Ses hôtels, avec leur nom. */
  hotels: { id: string; name: string }[];
}

async function fetchExperienceBookings({ providerId, experiences }: BookingScope): Promise<ProviderBooking[]> {
  const experienceIds = experiences.map((e) => e.id);
  // Le prestataire noté sur la réservation fait foi. S'il est vide, c'est le prestataire principal de l'expérience.
  const scope =
    experienceIds.length > 0
      ? `provider_id.eq.${providerId},and(provider_id.is.null,standalone_experience_id.in.(${experienceIds.join(",")}))`
      : `provider_id.eq.${providerId}`;
  const { data, error } = await db
    .from("standalone_bookings")
    .select(
      "id, standalone_experience_id, custom_experience_title, customer_name, booking_date, party_size, adults_count, children_count, sell_price, currency, status, payment_status, is_cancelled, source, product_type, supplier_cost, rate_option, extras",
    )
    .or(scope)
    // Un paiement en ligne jamais abouti n'est pas une réservation (même règle que la page Réservations).
    .neq("status", "pending")
    .order("booking_date", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];

  const bookedExperienceIds = [...new Set(rows.map((r) => r.standalone_experience_id as string | null).filter((id): id is string => !!id))];
  const costs = new Map<string, ExperienceCost>();
  const titles = new Map(experiences.map((e) => [e.id, e.title]));
  if (bookedExperienceIds.length > 0) {
    const [internal, missingTitles] = await Promise.all([
      db
        .from("standalone_experience_internal")
        .select("experience_id, supplier_price_adult, supplier_price_child, markup_percent")
        .in("experience_id", bookedExperienceIds),
      db.from("standalone_experiences").select("id, title").in("id", bookedExperienceIds.filter((id) => !titles.has(id))),
    ]);
    if (internal.error) throw internal.error;
    if (missingTitles.error) throw missingTitles.error;
    for (const r of internal.data ?? []) {
      costs.set(r.experience_id as string, {
        supplierPriceAdult: toNumber(r.supplier_price_adult),
        supplierPriceChild: toNumber(r.supplier_price_child),
        markupPercent: toNumber(r.markup_percent),
      });
    }
    for (const r of missingTitles.data ?? []) titles.set(r.id as string, r.title as string);
  }

  return rows.map((r) => {
    const experienceId = r.standalone_experience_id as string | null;
    const sellPrice = Number(r.sell_price ?? 0);
    return {
      kind: "experience",
      id: r.id as string,
      date: r.booking_date as string,
      client: (r.customer_name as string) || "Sans nom",
      product: (r.custom_experience_title as string | null) || (experienceId && titles.get(experienceId)) || "Expérience",
      partySize: toNumber(r.party_size),
      amount: sellPrice,
      currency: (r.currency as string) || "ILS",
      paymentStatus: r.payment_status as string | null,
      cancelled: r.status === "cancelled" || !!r.is_cancelled,
      providerNet: providerNetOf(
        {
          sellPrice,
          supplierCost: toNumber(r.supplier_cost),
          source: r.source as string | null,
          productType: r.product_type as string | null,
          adults: toNumber(r.adults_count) ?? toNumber(r.party_size),
          children: toNumber(r.children_count),
          hasRateOption: r.rate_option != null,
          hasExtras: Array.isArray(r.extras) && r.extras.length > 0,
        },
        experienceId ? costs.get(experienceId) : null,
      ),
    };
  });
}

async function fetchHotelBookings({ hotels }: BookingScope): Promise<ProviderBooking[]> {
  if (hotels.length === 0) return [];
  const names = new Map(hotels.map((h) => [h.id, h.name]));
  // Lecture seule des réservations d'hôtel déjà enregistrées : rien n'est recalculé ici.
  const { data, error } = await db
    .from("bookings_hg")
    .select("id, hotel_id, customer_name, checkin, nights, party_size, sell_price, net_price, currency, status, payment_status, is_cancelled")
    .in("hotel_id", hotels.map((h) => h.id))
    .not("status", "in", "(pending,failed)")
    .order("checkin", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => {
    const nights = toNumber(r.nights);
    return {
      kind: "hotel",
      id: r.id as string,
      date: r.checkin as string,
      client: (r.customer_name as string) || "Sans nom",
      product: `${names.get(r.hotel_id as string) ?? "Hôtel"}${nights ? ` · ${nights} nuit${nights > 1 ? "s" : ""}` : ""}`,
      partySize: toNumber(r.party_size),
      amount: Number(r.sell_price ?? 0),
      currency: (r.currency as string) || "ILS",
      paymentStatus: r.payment_status as string | null,
      cancelled: r.status === "cancelled" || !!r.is_cancelled,
      providerNet: toNumber(r.net_price),
    };
  });
}

/** Les réservations d'un prestataire : celles de ses expériences et celles de ses hôtels. */
export function useProviderBookings(scope: BookingScope, enabled: boolean) {
  return useQuery({
    queryKey: ["admin-provider-bookings", scope.providerId, scope.experiences.map((e) => e.id), scope.hotels.map((h) => h.id)],
    queryFn: async () => (await Promise.all([fetchExperienceBookings(scope), fetchHotelBookings(scope)])).flat(),
    enabled,
  });
}

// ── Lien prestataire d'une fiche du Catalogue ───────────────────────────────────────────────────

const catalogueProviderKey = (itemId: string) => ["admin-catalogue-item-provider", itemId] as const;

export function useCatalogueItemProvider(itemId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: catalogueProviderKey(itemId),
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await db.from("catalogue_items").select("provider_id").eq("id", itemId).maybeSingle();
      if (error) throw error;
      return (data?.provider_id as string | null) ?? null;
    },
  });
  const save = useMutation({
    mutationFn: async (providerId: string | null) => {
      const { error } = await db.from("catalogue_items").update({ provider_id: providerId }).eq("id", itemId);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: catalogueProviderKey(itemId) }),
  });
  return { providerId: query.data ?? null, isLoading: query.isLoading, save };
}
