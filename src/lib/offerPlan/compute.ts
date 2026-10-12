import type { Region } from "@/lib/regionList/types";
import {
  formatLabel,
  type ExperienceKind,
  type MustHave,
  type MustHaveStatus,
  type OfferExperience,
  type OfferMood,
  type OfferPlanData,
  type OfferTarget,
} from "./types";

// Les calculs du Plan de l'offre. Aucune lecture ni écriture ici : uniquement des règles,
// pour pouvoir les vérifier par des tests.

export const experienceKey = (kind: ExperienceKind, id: string) => `${kind}:${id}`;
const cellKey = (moodId: string, regionId: string) => `${moodId}|${regionId}`;

/** L'expérience qui couvre un must-have, s'il y en a une. */
export function linkedExperienceKey(mustHave: Pick<MustHave, "standalone_experience_id" | "experience2_id">): string | null {
  if (mustHave.standalone_experience_id) return experienceKey("standalone", mustHave.standalone_experience_id);
  if (mustHave.experience2_id) return experienceKey("experience2", mustHave.experience2_id);
  return null;
}

/** Les moods publiés d'abord, puis les brouillons ; les moods archivés ne sont pas dans le plan. */
export function sortMoods(moods: OfferMood[]): OfferMood[] {
  const rank = (m: OfferMood) => (m.status === "published" ? 0 : 1);
  return moods
    .filter((m) => m.status !== "archived")
    .sort((a, b) => rank(a) - rank(b) || (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name));
}

/** Les expériences en ligne qui ne couvrent aucun must-have : les opportunités « hors plan ». */
export function offPlanExperiences(experiences: OfferExperience[], mustHaves: MustHave[]): OfferExperience[] {
  const linked = new Set(mustHaves.map(linkedExperienceKey).filter(Boolean));
  return experiences.filter((e) => e.published && !linked.has(experienceKey(e.kind, e.id)));
}

export interface OfferCounters {
  total: number;
  byStatus: Record<MustHaveStatus, number>;
  offPlan: number;
}

export function countMustHaves(data: Pick<OfferPlanData, "mustHaves" | "experiences">): OfferCounters {
  const byStatus: Record<MustHaveStatus, number> = { a_trouver: 0, en_prospection: 0, signe: 0, en_ligne: 0, abandonne: 0 };
  for (const m of data.mustHaves) byStatus[m.status] += 1;
  return {
    total: data.mustHaves.length,
    byStatus,
    offPlan: offPlanExperiences(data.experiences, data.mustHaves).length,
  };
}

export type CellState = "reached" | "partial" | "missing" | "none";

/** noir = objectif atteint, gris = partiel, pointillé rouge = rien en ligne, neutre = pas d'objectif. */
export function cellState(live: number, target: number): CellState {
  if (target <= 0) return "none";
  if (live >= target) return "reached";
  return live > 0 ? "partial" : "missing";
}

export interface GridCell {
  live: number;
  target: number;
}

export interface OfferGrid {
  /** La case d'un mood dans une région. */
  cell: (moodId: string, regionId: string) => GridCell;
  /** Le total d'un mood : la somme de ses cases. */
  total: (moodId: string) => GridCell;
  /** Expériences en ligne qui n'entrent dans aucune case, faute de région reliée. */
  withoutRegion: number;
}

/** Une expérience en ligne compte dans chaque mood où elle apparaît, dans la case de sa région. */
export function buildGrid(
  regions: Pick<Region, "id">[],
  targets: OfferTarget[],
  experiences: OfferExperience[]
): OfferGrid {
  const regionIds = new Set(regions.map((r) => r.id));
  const live = new Map<string, number>();
  const target = new Map<string, number>();
  const totals = new Map<string, GridCell>();
  const bump = (moodId: string, field: keyof GridCell, by: number) => {
    const row = totals.get(moodId) ?? { live: 0, target: 0 };
    row[field] += by;
    totals.set(moodId, row);
  };

  let withoutRegion = 0;
  for (const e of experiences) {
    if (!e.published) continue;
    if (!e.regionId || !regionIds.has(e.regionId)) {
      withoutRegion += 1;
      continue;
    }
    for (const moodId of new Set(e.moodIds)) {
      const key = cellKey(moodId, e.regionId);
      live.set(key, (live.get(key) ?? 0) + 1);
      bump(moodId, "live", 1);
    }
  }
  for (const t of targets) {
    if (!regionIds.has(t.region_id) || t.target <= 0) continue;
    target.set(cellKey(t.category_id, t.region_id), t.target);
    bump(t.category_id, "target", t.target);
  }

  return {
    cell: (moodId, regionId) => ({
      live: live.get(cellKey(moodId, regionId)) ?? 0,
      target: target.get(cellKey(moodId, regionId)) ?? 0,
    }),
    total: (moodId) => totals.get(moodId) ?? { live: 0, target: 0 },
    withoutRegion,
  };
}

export interface CellDetail {
  mustHaves: MustHave[];
  offPlan: OfferExperience[];
}

/** Ce que montre le panneau d'une case : ses must-haves, et ses expériences en ligne hors plan. */
export function cellDetail(moodId: string, regionId: string, data: Pick<OfferPlanData, "mustHaves" | "experiences">): CellDetail {
  return {
    mustHaves: data.mustHaves.filter((m) => m.category_id === moodId && m.region_ids.includes(regionId)),
    offPlan: offPlanExperiences(data.experiences, data.mustHaves).filter(
      (e) => e.regionId === regionId && e.moodIds.includes(moodId)
    ),
  };
}

/** `region` : un identifiant de région, ou « none » pour les must-haves « à chercher ». */
export interface MustHaveFilters {
  mood: string | null;
  status: MustHaveStatus | null;
  core: boolean | null;
  region: string | "none" | null;
}

export const NO_FILTERS: MustHaveFilters = { mood: null, status: null, core: null, region: null };

export function filterMustHaves(mustHaves: MustHave[], filters: MustHaveFilters): MustHave[] {
  return mustHaves.filter(
    (m) =>
      (!filters.mood || m.category_id === filters.mood) &&
      (!filters.status || m.status === filters.status) &&
      (filters.core === null || m.is_core === filters.core) &&
      (!filters.region || (filters.region === "none" ? m.region_ids.length === 0 : m.region_ids.includes(filters.region)))
  );
}

/** Les must-haves qu'un formulaire d'expérience peut proposer : ceux des moods cochés. */
export function mustHavesForMoods(mustHaves: MustHave[], moodIds: string[], currentId: string | null): MustHave[] {
  return mustHaves.filter((m) => m.id === currentId || (moodIds.includes(m.category_id) && m.status !== "abandonne"));
}

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

/**
 * La liste à prospecter, pour l'outil de prospection : les must-haves « à trouver » ou
 * « en prospection », une ligne chacun. Point-virgule comme séparateur, pour s'ouvrir d'un clic
 * dans un tableur français.
 */
export function prospectionCsv(mustHaves: MustHave[], moods: OfferMood[], regions: Pick<Region, "id" | "name_fr">[]): string {
  const moodName = new Map(moods.map((m) => [m.id, m.name]));
  const regionName = new Map(regions.map((r) => [r.id, r.name_fr]));
  const header = ["Mood", "Nom", "Régions", "Format", "Saison", "Socle"];
  const rows = mustHaves
    .filter((m) => m.status === "a_trouver" || m.status === "en_prospection")
    .map((m) => [
      moodName.get(m.category_id) ?? "",
      m.name,
      m.region_ids.length === 0
        ? "À chercher"
        : m.region_ids
            .map((id) => regionName.get(id))
            .filter(Boolean)
            .join(", "),
      formatLabel(m.format),
      m.season ?? "",
      m.is_core ? "Oui" : "Non",
    ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(";")).join("\n");
}
