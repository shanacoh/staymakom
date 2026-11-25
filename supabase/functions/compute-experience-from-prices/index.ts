// Prix « à partir de » des expériences avec hôtel, recalculé chaque nuit pour Google.
//
// Pourquoi : sur la fiche, ce prix est calculé EN DIRECT dans le navigateur du visiteur
// (src/hooks/useExperience2Price.ts → useFromPrice, src/hooks/useQuickDateAvailability.ts) en
// interrogeant HyperGuest sur les prochaines dates. La version préparée pour Google ne peut
// pas faire ces dizaines d'appels à chaque passage d'un robot : elle lit le résultat de cette
// tâche (experiences2.from_price_ils), calculé avec EXACTEMENT la même méthode
// (option 2 validée par Shana le 25/11/2026). Écart possible seulement dans la journée.
//
// Méthode (copie fidèle du site, à garder alignée) :
//  - hôtel = le premier hôtel du parcours (experience2_hotels, par position), sinon hotel_id ;
//  - 1 nuit, adultes = min_party || 2, nationalité FR (celle d'un visiteur non connecté), ILS ;
//  - dates : les dates fixes des règles s'il y en a, sinon les 90 prochains jours à partir de
//    demain, par paquets de 10, arrêt dès 30 dates disponibles ;
//  - par date : plan tarifaire le moins cher en « sell » (pension préférée seulement si elle
//    est définie, jamais un sell inférieur au BAR), et le « net » le plus bas de la date ;
//  - date retenue : la moins chère en « sell » parmi celles permises par les règles ;
//  - prix = (net de cette date, sinon room_net_rate enregistré) + marge chambre
//           + prix vendu de l'expérience fixe + prix par personne × min_party.
// Ne touche ni aux réservations, ni aux paiements : écrit seulement 3 colonnes d'affichage.
//
// Appelée par la tâche planifiée de la base (secret x-cron-secret) ou par un admin.
// Corps : { "limit": 3 } (fiches traitées par appel) ou { "slug": "..." } (une fiche).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import { getAdminEmail, isInternalCron } from "../_shared/internal-auth.ts";

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

const DATES_TO_SCAN = 90;
const MAX_RESULTS = 30;
const BATCH_SIZE = 10;
const DEFAULT_NATIONALITY = "FR";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Date du jour en Israël (AAAA-MM-JJ) décalée de n jours, comme le calendrier d'un visiteur israélien. */
function israelDate(offsetDays: number): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function num(v: unknown): number | null {
  return typeof v === "number" ? v : null;
}

interface DatePrice { date: string; sell: number; net: number | null }

/** Même lecture des plans tarifaires que useQuickDateAvailability.scanAvailability. */
function cheapestOfDate(date: string, result: Row | null, boardType: string | null): DatePrice | null {
  const rooms = result?.results?.[0]?.rooms || [];
  if (rooms.length === 0) return null;
  let sell: number | null = null;
  let net: number | null = null;
  for (const room of rooms) {
    for (const rp of room.ratePlans || []) {
      if (boardType) {
        const board = typeof rp.board === "string" ? rp.board.toUpperCase() : null;
        if (board !== boardType) continue;
      }
      const sellPrice = num(rp.prices?.sell?.searchCurrency) ?? num(rp.prices?.sell?.price);
      const barPrice = num(rp.prices?.bar?.searchCurrency) ?? num(rp.prices?.bar?.price);
      const netPrice = num(rp.prices?.net?.searchCurrency) ?? num(rp.prices?.net?.price);
      if (sellPrice == null) continue;
      if (barPrice != null && sellPrice < barPrice) continue;
      if (sell === null || sellPrice < sell) sell = sellPrice;
      if (netPrice != null && (net === null || netPrice < net)) net = netPrice;
    }
  }
  // Date sans plan retenu : comptée comme « disponible sans prix » par le site, jamais la moins chère.
  return sell === null ? { date, sell: Number.POSITIVE_INFINITY, net: null } : { date, sell, net };
}

async function searchOneNight(propertyId: number, date: string, adults: number): Promise<Row | null> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/hyperguest?action=search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      checkIn: date,
      nights: 1,
      guests: String(adults),
      hotelIds: [propertyId],
      customerNationality: DEFAULT_NATIONALITY,
      currency: "ILS",
    }),
  });
  if (!res.ok) throw new Error(`HyperGuest ${res.status}`);
  const body = await res.json();
  if (!body.success) throw new Error(body.error || "HyperGuest error");
  return body.data;
}

/** Copie de src/lib/availabilityUtils.ts → isCheckinDisabled (dates en AAAA-MM-JJ). */
function isCheckinDisabled(date: string, rules: Row[]): boolean {
  const day = new Date(`${date}T12:00:00Z`);
  for (const r of rules.filter((x) => x.rule_type === "blackout")) {
    if (r.date_from && r.date_to && date >= String(r.date_from).slice(0, 10) && date <= String(r.date_to).slice(0, 10)) return true;
  }
  const inclusion = rules.filter((x) => x.rule_type !== "blackout");
  if (inclusion.length === 0) return false;
  for (const r of inclusion) {
    if (r.rule_type === "specific_dates" && Array.isArray(r.specific_dates) && r.specific_dates.some((s: string) => String(s).slice(0, 10) === date)) return false;
    if (r.rule_type === "date_range" && r.date_from && r.date_to && date >= String(r.date_from).slice(0, 10) && date <= String(r.date_to).slice(0, 10)) return false;
    if (r.rule_type === "days_of_week" && Array.isArray(r.days_of_week) && r.days_of_week.includes(day.getUTCDay())) return false;
  }
  return true;
}

async function cheapestDate(propertyId: number, adults: number, boardType: string | null, rules: Row[]): Promise<DatePrice | null> {
  const specific = rules
    .filter((r) => r.rule_type === "specific_dates" && Array.isArray(r.specific_dates))
    .flatMap((r) => r.specific_dates.map((s: string) => String(s).slice(0, 10)));

  const found: DatePrice[] = [];
  if (specific.length > 0) {
    // Dates fixes : même logique que useSpecificDatePrices (seules ces dates, la moins chère).
    const results = await Promise.all(
      specific.map((date) => searchOneNight(propertyId, date, adults).then((r) => cheapestOfDate(date, r, boardType)).catch(() => null))
    );
    for (const r of results) if (r && Number.isFinite(r.sell)) found.push(r);
  } else {
    for (let start = 0; start < DATES_TO_SCAN; start += BATCH_SIZE) {
      if (found.length >= MAX_RESULTS) break;
      if (start > 0) await delay(200);
      const dates = Array.from({ length: Math.min(BATCH_SIZE, DATES_TO_SCAN - start) }, (_, i) => israelDate(1 + start + i));
      const batch = await Promise.all(
        dates.map((date) => searchOneNight(propertyId, date, adults).then((r) => cheapestOfDate(date, r, boardType)).catch(() => null))
      );
      for (const r of batch) if (r) found.push(r);
    }
    found.splice(MAX_RESULTS);
  }
  const allowed = rules.length > 0 && specific.length === 0 ? found.filter((d) => !isCheckinDisabled(d.date, rules)) : found;
  let best: DatePrice | null = null;
  for (const d of allowed) if (Number.isFinite(d.sell) && (!best || d.sell < best.sell)) best = d;
  return best;
}

function fromPrice(exp: Row, liveNet: number | null): number | null {
  const net = liveNet ?? (Number(exp.room_net_rate) || 0);
  if (net <= 0) return null;
  const markup = Number(exp.bar_rate_markup_value) || 0;
  const isPct = exp.bar_rate_markup_is_pct ?? true;
  const room = net + (isPct ? (net * markup) / 100 : markup);
  const total = room + (Number(exp.experience_sell_fixed) || 0) + (Number(exp.experience_sell_per_person) || 0) * (Number(exp.min_party) || 1);
  return total > 0 ? Math.round(total * 100) / 100 : null;
}

async function processExperience(db: Row, exp: Row): Promise<Row> {
  const { data: links } = await db
    .from("experience2_hotels")
    .select("position, hotels2(hyperguest_property_id)")
    .eq("experience_id", exp.id)
    .order("position");
  const primary = links?.[0]?.hotels2 ?? exp.hotels2;
  const propertyId = primary?.hyperguest_property_id ? parseInt(primary.hyperguest_property_id, 10) : null;

  const { data: rules } = await db
    .from("experience2_availability_rules")
    .select("rule_type, days_of_week, date_from, date_to, specific_dates")
    .eq("experience_id", exp.id)
    .eq("is_active", true);

  const board = typeof exp.preferred_board_type === "string" && exp.preferred_board_type.trim() ? exp.preferred_board_type.trim().toUpperCase() : null;
  const best = propertyId ? await cheapestDate(propertyId, exp.min_party || 2, board, rules ?? []) : null;
  const price = fromPrice(exp, best?.net ?? null);

  await db
    .from("experiences2")
    .update({ from_price_ils: price, from_price_checkin: best?.date ?? null, from_price_computed_at: new Date().toISOString() })
    .eq("id", exp.id);
  return { slug: exp.slug, price, date: best?.date ?? null, live: best?.net != null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const db = createClient(SUPABASE_URL, SERVICE_KEY);
  if (!(await isInternalCron(req, db)) && !(await getAdminEmail(req, db))) return json({ error: "Non autorisé" }, 401);

  const body = await req.json().catch(() => ({}));
  const columns =
    "id, slug, pricing_model, min_party, preferred_board_type, room_net_rate, bar_rate_markup_value, bar_rate_markup_is_pct, experience_sell_fixed, experience_sell_per_person, hotels2(hyperguest_property_id)";
  let query = db.from("experiences2").select(columns).eq("status", "published").eq("pricing_model", "bar_rate");
  if (typeof body.slug === "string") {
    query = query.eq("slug", body.slug);
  } else {
    // Les fiches pas encore recalculées aujourd'hui (heure d'Israël), les plus anciennes d'abord.
    query = query
      .or(`from_price_computed_at.is.null,from_price_computed_at.lt.${israelDate(0)}T00:00:00+02:00`)
      .order("from_price_computed_at", { ascending: true, nullsFirst: true })
      .limit(Math.min(Math.max(Number(body.limit) || 3, 1), 6));
  }
  const { data: experiences, error } = await query;
  if (error) return json({ error: error.message }, 500);

  const done: Row[] = [];
  for (const exp of experiences ?? []) {
    try {
      done.push(await processExperience(db, exp));
    } catch (e) {
      done.push({ slug: exp.slug, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return json({ processed: done.length, results: done });
});
