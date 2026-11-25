// Back-office du Journal : libellés et appels partagés par les onglets Articles, File de sujets,
// Réglages et la fiche article.
import { supabase } from "@/integrations/supabase/client";

export const LANG_LABELS: Record<string, string> = { en: "EN", he: "HE", fr: "FR" };

export const PIPELINE_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-muted text-foreground" },
  scheduled: { label: "Programmé", className: "bg-blue-100 text-blue-800" },
  published: { label: "Publié", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Rejeté", className: "bg-gray-200 text-gray-600" },
  blocked: { label: "Bloqué", className: "bg-red-100 text-red-800" },
};

export const TOPIC_STATUS_LABELS: Record<string, string> = {
  a_faire: "À faire",
  genere: "Généré",
  publie: "Publié",
  ecarte: "Écarté",
};

export const TOPIC_TYPES = ["pilier", "guide", "saisonnier", "cluster"] as const;

/** Lance la rédaction d'un article (sujet choisi, article à régénérer, ou sujet du jour). */
export async function startGeneration(params: { topic_id?: string; post_id?: string }): Promise<string> {
  const { data, error } = await supabase.functions.invoke("generate-journal-article", { body: params });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (data?.skipped) throw new Error(`Rien lancé : ${data.skipped}`);
  return data.run_id as string;
}

/** Attend la fin d'une génération (environ 1 à 3 minutes). */
export async function waitForRun(runId: string, timeoutMs = 360_000): Promise<{ status: string; post_id: string | null; error: string | null }> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 5000));
    const { data } = await supabase
      .from("journal_generation_runs" as any)
      .select("status,post_id,error")
      .eq("id", runId)
      .maybeSingle();
    const run = data as any;
    if (run && run.status !== "running") return run;
  }
  throw new Error("La génération prend plus de temps que prévu : regarde la liste dans quelques minutes.");
}

export function formatIsrael(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Asia/Jerusalem",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
