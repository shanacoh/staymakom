import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Lang = "fr" | "en" | "he";

// Phrase réglable depuis le back-office (Réglages), affichée sous le bouton de réservation
// seulement si Shana l'a activée. Un seul réglage pour tout le site, stocké sur la ligne
// "site_config" de global_settings (table déjà utilisée par la page Réglages).
export function ReassuranceLine({ lang = "en", className }: { lang?: Lang; className?: string }) {
  const { data } = useQuery({
    queryKey: ["global-settings-reassurance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_settings")
        .select("reassurance_enabled, reassurance_text_fr, reassurance_text_en, reassurance_text_he")
        .eq("key", "site_config")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!data?.reassurance_enabled) return null;
  const textByLang: Record<Lang, string | null> = {
    fr: data.reassurance_text_fr,
    en: data.reassurance_text_en,
    he: data.reassurance_text_he,
  };
  const text = textByLang[lang] || textByLang.en;
  if (!text) return null;

  return <p className={className ?? "text-xs text-center text-muted-foreground mt-2"}>{text}</p>;
}

export default ReassuranceLine;
