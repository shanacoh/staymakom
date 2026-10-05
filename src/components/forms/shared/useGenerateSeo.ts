import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const CONTENT_FIELDS = [
  "title", "title_fr", "title_he",
  "subtitle", "subtitle_fr", "subtitle_he",
  "long_copy", "long_copy_fr", "long_copy_he",
] as const;

const SEO_FIELDS = [
  "seo_title_en", "seo_title_fr", "seo_title_he",
  "meta_description_en", "meta_description_fr", "meta_description_he",
] as const;

// Générer le SEO : à partir du titre/accroche/description déjà rédigés,
// demande à l'IA le titre SEO et la meta description par langue. Ne touche
// jamais au titre, à la description, au prix ni aux dates, et n'enregistre rien.
export function useGenerateSeo(
  type: "standalone" | "hotel",
  getValues: (name: string) => unknown,
  setValue: (name: string, value: string) => void,
) {
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);

  const handleGenerateSeo = async () => {
    setIsGeneratingSeo(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      const content = Object.fromEntries(CONTENT_FIELDS.map((f) => [f, getValues(f)]));
      const { data, error } = await supabase.functions.invoke("generate-experience-draft", {
        headers: { Authorization: `Bearer ${token}` },
        body: { type, mode: "seo", content },
      });
      if (error || data?.error) {
        toast.error(data?.error || "L'IA n'a pas pu générer le SEO, réessaie dans un instant.");
        return;
      }
      const seo = data.seo as Record<string, string>;
      for (const field of SEO_FIELDS) {
        if (seo[field]) setValue(field, seo[field]);
      }
      toast.success("SEO généré — relis-le avant de publier.");
    } catch {
      toast.error("L'IA n'a pas pu générer le SEO, réessaie dans un instant.");
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  return { isGeneratingSeo, handleGenerateSeo };
}
