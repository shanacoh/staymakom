import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AUTO_LOCALES } from "@/constants/autoLocales";

const LOCALES_LABEL = AUTO_LOCALES.map((l) => l.toUpperCase()).join(" / ");

interface AutoTranslateButtonProps {
  /** Type de fiche, tel que défini dans le catalogue des traductions (ex. "standalone_experience"). */
  entityType: string;
  /** Fiche pas encore enregistrée : pas de bouton. */
  entityId: string | null | undefined;
  className?: string;
}

interface TranslateResult {
  translated?: number;
  skipped?: number;
  stale_marked?: number;
  errors?: number;
  remaining?: number;
  error?: string;
}

/**
 * Bouton discret « Mettre à jour ES / RU / DE » : lance tout de suite, pour cette fiche seulement,
 * la traduction automatique qui tourne sinon chaque nuit. Traduit la version enregistrée et publiée.
 */
export function AutoTranslateButton({ entityType, entityId, className }: AutoTranslateButtonProps) {
  const [running, setRunning] = useState(false);
  if (!entityId) return null;

  const run = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke<TranslateResult>("translate-content", {
        body: { entity_type: entityType, entity_id: entityId },
      });
      if (error || !data) throw new Error(data?.error || error?.message || "Réponse vide");
      const translated = data.translated ?? 0;
      const errors = data.errors ?? 0;
      if (translated === 0 && errors === 0 && (data.skipped ?? 0) === 0) {
        toast.info(`Rien à traduire : la fiche doit être publiée (et enregistrée) pour passer en ${LOCALES_LABEL}.`);
      } else if (translated === 0 && errors === 0) {
        toast.success(`${LOCALES_LABEL} déjà à jour.`);
      } else if (errors === 0) {
        toast.success(`${translated} texte${translated > 1 ? "s" : ""} traduit${translated > 1 ? "s" : ""} en ${LOCALES_LABEL}.`);
      } else {
        toast.warning(`${translated} texte(s) traduit(s), ${errors} en erreur. Réessaie dans un instant.`);
      }
      if ((data.stale_marked ?? 0) > 0) {
        toast.info(`${data.stale_marked} traduction(s) vérifiée(s) à revoir : l'anglais a changé.`);
      }
    } catch (err) {
      toast.error(`La traduction ${LOCALES_LABEL} n'a pas pu se faire : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className ?? "h-8 text-[13px] text-muted-foreground"}
      onClick={run}
      disabled={running}
      title={`Traduit maintenant la version publiée en ${LOCALES_LABEL} (sinon fait automatiquement chaque nuit). Compte 1 à 2 minutes.`}
    >
      {running ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Languages className="h-3.5 w-3.5 mr-1.5" />}
      {running ? "Traduction en cours…" : `Mettre à jour ${LOCALES_LABEL}`}
    </Button>
  );
}
