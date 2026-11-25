// Choix du sujet du jour.
// 1. D'abord un sujet daté (saisonnier) dont la date souhaitée tombe dans les 10 prochains
//    jours (ou est passée depuis 3 jours au plus), le plus proche en premier.
// 2. Sinon, rotation sur 7 jours : 3 anglais, 2 hébreu, 2 français. La langue la plus « en
//    retard » sur les 6 derniers articles passe en premier ; si sa file est vide, on passe à
//    la suivante (et on le signale dans l'email du jour).
import type { BlogTopic, JournalLang } from "./types.ts";

export const ROTATION_TARGET: Record<JournalLang, number> = { en: 3, he: 2, fr: 2 };
const LANG_ORDER: JournalLang[] = ["en", "he", "fr"];
export const LOW_QUEUE_THRESHOLD = 10;

export interface TopicChoice {
  topic: BlogTopic | null;
  reason: "seasonal" | "rotation" | "empty";
  notes: string[];
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const byPriority = (a: BlogTopic, b: BlogTopic) =>
  a.priority - b.priority || (b.monthly_volume ?? 0) - (a.monthly_volume ?? 0) || a.primary_keyword.localeCompare(b.primary_keyword);

/**
 * @param todo       sujets au statut « à faire »
 * @param recentLangs langues des derniers articles générés, du plus récent au plus ancien
 * @param today      date du jour en Israël (AAAA-MM-JJ)
 */
export function chooseTopic(todo: BlogTopic[], recentLangs: JournalLang[], today: string): TopicChoice {
  const notes: string[] = [];
  if (todo.length < LOW_QUEUE_THRESHOLD) {
    notes.push(`La file ne contient plus que ${todo.length} sujet(s) à faire (moins de ${LOW_QUEUE_THRESHOLD}).`);
  }

  const windowStart = addDays(today, -3);
  const windowEnd = addDays(today, 10);
  const seasonal = todo
    .filter((t) => t.desired_date && t.desired_date >= windowStart && t.desired_date <= windowEnd)
    .sort((a, b) => (a.desired_date! < b.desired_date! ? -1 : a.desired_date! > b.desired_date! ? 1 : byPriority(a, b)));
  if (seasonal.length) return { topic: seasonal[0], reason: "seasonal", notes };

  // Sujets datés hors fenêtre : on ne les sort pas en avance (ni trop tard).
  const undated = todo.filter((t) => !t.desired_date);
  const last6 = recentLangs.slice(0, 6);
  const deficit = (lang: JournalLang) => ROTATION_TARGET[lang] - last6.filter((l) => l === lang).length;
  const ordered = [...LANG_ORDER].sort((a, b) => deficit(b) - deficit(a) || LANG_ORDER.indexOf(a) - LANG_ORDER.indexOf(b));

  for (const lang of ordered) {
    const queue = undated.filter((t) => t.lang === lang).sort(byPriority);
    if (queue.length) return { topic: queue[0], reason: "rotation", notes };
    notes.push(`La file ${lang.toUpperCase()} est vide : article pris dans une autre langue.`);
  }
  return { topic: null, reason: "empty", notes };
}
