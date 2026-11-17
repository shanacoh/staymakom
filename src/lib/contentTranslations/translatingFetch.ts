// « Traducteur » branché sur toutes les lectures de la base faites par le site.
//
// Image : le livreur (la base) apporte les fiches en anglais ; avant de les poser sur la
// page, ce traducteur remplace les textes par leur version espagnole / russe / allemande
// quand la page est dans une de ces langues. Rien ne change dans les autres langues ni
// dans le back-office. En cas de souci (réseau, réponse inattendue), la fiche s'affiche
// simplement en anglais.
//
// Dans l'autre sens (demandes, réservations envoyées depuis ces pages), les noms traduits
// repartent en anglais et la langue de la page est jointe (voir writeBack.ts).

import { isAutoLocale, resolveLocale, type AutoLocale } from "@/lib/locale";
import type { EntityType } from "../../../supabase/functions/_shared/translations/catalog";
import {
  applyTranslations,
  collectTargets,
  entityTypeForTable,
  parseEmbeds,
  type TranslationRow,
} from "./overlay";
import { rewriteWriteBody, writeTarget } from "./writeBack";

type Fetch = typeof fetch;

/** Écrans de travail (back-office, hôteliers, prestataires) : toujours le texte d'origine. */
const STAFF_PATH = /^\/(admin|hotel-admin|partner)(\/|$)/;

/** Nombre de fiches par demande de traductions (une fiche a au plus ~22 champs : on reste
 *  sous la limite de 1 000 lignes par lecture). */
const IDS_PER_REQUEST = 40;

function currentAutoLocale(): AutoLocale | null {
  if (typeof window === "undefined") return null;
  if (STAFF_PATH.test(window.location.pathname)) return null;
  const locale = resolveLocale();
  return isAutoLocale(locale) ? locale : null;
}

/** Table lue par cette demande, si c'est une simple lecture d'une table de la base. */
function tableOf(url: URL): string | null {
  const match = url.pathname.match(/\/rest\/v1\/([\w]+)$/);
  if (!match || match[1] === "rpc" || match[1] === "content_translations") return null;
  return match[1];
}

export function createTranslatingFetch(baseFetch: Fetch): Fetch {
  // Traductions déjà reçues pendant cette visite : « langue|identifiant de fiche » → lignes.
  const cache = new Map<string, TranslationRow[]>();
  // Textes posés pendant cette visite : traduction → anglais d'origine.
  const englishOf = new Map<string, string>();

  /** Envoi depuis une page traduite : noms remis en anglais, langue de la page jointe. */
  function prepareWrite(input: RequestInfo | URL, init: RequestInit | undefined, locale: AutoLocale): RequestInit | undefined {
    if (input instanceof Request || typeof init?.body !== "string") return init;
    const method = (init.method ?? "GET").toUpperCase();
    if (method === "GET" || method === "HEAD") return init;
    try {
      const body = rewriteWriteBody(init.body, writeTarget(new URL(String(input)), method), locale, englishOf);
      return body === null ? init : { ...init, body };
    } catch (error) {
      console.warn("[traductions] envoi laissé tel quel :", error);
      return init;
    }
  }

  async function loadTranslations(
    restBase: string,
    headers: Headers,
    locale: AutoLocale,
    ids: string[],
  ): Promise<void> {
    const missing = [...new Set(ids)].filter((id) => !cache.has(`${locale}|${id}`));
    for (let i = 0; i < missing.length; i += IDS_PER_REQUEST) {
      const chunk = missing.slice(i, i + IDS_PER_REQUEST);
      const query = new URLSearchParams({
        select: "entity_type,entity_id,field,text,source_hash",
        locale: `eq.${locale}`,
        entity_id: `in.(${chunk.join(",")})`,
      });
      const res = await baseFetch(`${restBase}/content_translations?${query}`, { headers });
      if (!res.ok) throw new Error(`Traductions indisponibles (${res.status})`);
      const rows = (await res.json()) as TranslationRow[];
      for (const id of chunk) cache.set(`${locale}|${id}`, []);
      for (const row of rows) cache.get(`${locale}|${row.entity_id}`)?.push(row);
    }
  }

  return async (input, init) => {
    const locale = currentAutoLocale();
    if (locale) init = prepareWrite(input, init, locale);

    const response = await baseFetch(input, init);
    if (!locale || !response.ok) return response;

    const request = input instanceof Request ? input : null;
    const method = (init?.method ?? request?.method ?? "GET").toUpperCase();
    if (method !== "GET") return response;

    const url = new URL(request ? request.url : String(input));
    const table = tableOf(url);
    if (!table) return response;

    const embeds = parseEmbeds(url.searchParams.get("select") ?? "*");
    const touchesTranslatable =
      entityTypeForTable(table) !== undefined || [...embeds.values()].some((t) => entityTypeForTable(t));
    if (!touchesTranslatable) return response;

    try {
      const data: unknown = await response.clone().json();
      const targets = collectTargets(data, table, embeds);
      if (targets.length === 0) return response;

      // Mêmes clés d'accès que la lecture d'origine (clé publique du site, ou session).
      const source = new Headers(init?.headers ?? request?.headers);
      const headers = new Headers({ Accept: "application/json" });
      for (const name of ["apikey", "authorization"]) {
        const value = source.get(name);
        if (value) headers.set(name, value);
      }
      const restBase = `${url.origin}${url.pathname.replace(/\/[\w]+$/, "")}`;
      await loadTranslations(restBase, headers, locale, targets.map((t) => t.row.id as string));

      const replaced = await applyTranslations(
        targets,
        (type: EntityType, id: string) => (cache.get(`${locale}|${id}`) ?? []).filter((r) => r.entity_type === type),
        (translated, english) => englishOf.set(translated, english),
      );
      if (replaced === 0) return response;

      const outHeaders = new Headers(response.headers);
      outHeaders.delete("content-length");
      outHeaders.delete("content-encoding");
      return new Response(JSON.stringify(data), {
        status: response.status,
        statusText: response.statusText,
        headers: outHeaders,
      });
    } catch (error) {
      console.warn("[traductions] fiche affichée en anglais :", error);
      return response;
    }
  };
}
