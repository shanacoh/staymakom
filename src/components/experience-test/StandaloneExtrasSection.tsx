import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Wine, Car, Coffee, Flower, Sparkle, Gift, Heart, Camera, MusicNotes,
  Champagne, Bed, Cake, Drop, Leaf, HandHeart, Star,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import type { SelectedExtra } from "./ExtrasSection2";

const keywordMapping: Array<{ keywords: string[]; icon: PhosphorIcon }> = [
  { keywords: ["wine", "vin", "יין"], icon: Wine },
  { keywords: ["champagne", "שמפניה"], icon: Champagne },
  { keywords: ["car", "transport", "taxi", "ride", "הסעה", "רכב"], icon: Car },
  { keywords: ["coffee", "breakfast", "café", "ארוחת בוקר", "קפה"], icon: Coffee },
  { keywords: ["flower", "fleur", "פרח", "bouquet", "זר"], icon: Flower },
  { keywords: ["spa", "massage", "wellness", "ספא", "עיסוי"], icon: Drop },
  { keywords: ["gift", "cadeau", "surprise", "מתנה", "הפתעה"], icon: Gift },
  { keywords: ["romance", "romantic", "love", "רומנטי", "אהבה"], icon: Heart },
  { keywords: ["photo", "camera", "צילום", "מצלמה"], icon: Camera },
  { keywords: ["music", "dj", "מוזיקה"], icon: MusicNotes },
  { keywords: ["cake", "birthday", "anniversary", "עוגה", "יום הולדת"], icon: Cake },
  { keywords: ["room", "upgrade", "suite", "חדר", "שדרוג"], icon: Bed },
  { keywords: ["nature", "eco", "green", "טבע"], icon: Leaf },
  { keywords: ["hand", "care", "beauty", "יופי"], icon: HandHeart },
  { keywords: ["star", "premium", "vip", "כוכב"], icon: Star },
];

function getIcon(title?: string): PhosphorIcon {
  if (!title) return Sparkle;
  const lower = title.toLowerCase();
  for (const { keywords, icon } of keywordMapping) {
    if (keywords.some((kw) => lower.includes(kw))) return icon;
  }
  return Sparkle;
}

interface Props {
  experienceId: string;
  lang?: string;
  currency?: string;
  selectedExtras: SelectedExtra[];
  onToggleExtra: (extra: SelectedExtra) => void;
}

const StandaloneExtrasSection = ({
  experienceId,
  lang = "en",
  currency = "ILS",
  selectedExtras,
  onToggleExtra,
}: Props) => {
  const { data: extras } = useQuery({
    queryKey: ["standalone-extras-public", experienceId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("standalone_extras")
        .select("id, title, title_fr, title_he, description, price, currency, is_available")
        .eq("experience_id", experienceId)
        .eq("is_available", true)
        .order("sort_order");
      if (error) throw error;
      return data as Array<{
        id: string;
        title: string;
        title_fr: string | null;
        title_he: string | null;
        description: string | null;
        price: number;
        currency: string;
        is_available: boolean;
      }>;
    },
  });

  if (!extras || extras.length === 0) return null;

  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₪";

  const texts: Record<string, Record<string, string>> = {
    sectionTitle: { en: "Make it unforgettable", fr: "Rendez-le inoubliable", he: "הפכו את זה לבלתי נשכח" },
    sectionIntro: { en: "Every escape can go a little further.", fr: "Chaque escapade peut aller plus loin.", he: "כל בריחה יכולה ללכת קצת יותר רחוק." },
    add: { en: "Add", fr: "Ajouter", he: "הוסף" },
    added: { en: "Added", fr: "Ajouté", he: "נוסף" },
  };
  const t = (key: string) => texts[key]?.[lang] || texts[key]?.en || key;

  return (
    <section className="py-6 border-b border-border" dir={lang === "he" ? "rtl" : "ltr"}>
      <div className="mb-5">
        <h2 className="font-serif text-xl md:text-2xl font-medium text-foreground mb-1">
          {t("sectionTitle")}
        </h2>
        <p className="italic text-muted-foreground text-sm">{t("sectionIntro")}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full">
        {extras.map((extra) => {
          const isSelected = selectedExtras.some((se) => se.id === extra.id);
          const name =
            lang === "he"
              ? extra.title_he || extra.title
              : lang === "fr"
              ? extra.title_fr || extra.title
              : extra.title;
          const IconComponent = getIcon(extra.title);

          const extraData: SelectedExtra = {
            id: extra.id,
            name: extra.title,
            name_he: extra.title_he,
            price: extra.price,
            currency: extra.currency || currency,
            pricing_type: "per_person",
          };

          return (
            <div
              key={extra.id}
              className={`
                group rounded-xl p-3 sm:p-4
                transition-all duration-200 ease-out
                border flex flex-col items-center text-center
                ${isSelected
                  ? "border-foreground/30 bg-foreground/5"
                  : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40"
                }
              `}
            >
              <div className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center bg-gradient-to-br from-primary/5 via-muted/30 to-primary/10">
                <IconComponent size={26} weight="duotone" className="text-primary/60" />
              </div>

              <div className="flex-1 flex items-start">
                <p className="text-sm text-foreground/80 leading-snug line-clamp-2 break-words w-full">
                  {name}
                </p>
              </div>

              <div className="mt-3">
                {!isSelected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-medium rounded-full px-3 border-foreground/20 bg-transparent hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-200 whitespace-nowrap"
                    onClick={() => onToggleExtra(extraData)}
                  >
                    +{currencySymbol}{extra.price} · {t("add")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-medium rounded-full px-4 border-foreground bg-foreground text-background"
                    onClick={() => onToggleExtra(extraData)}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    {t("added")}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default StandaloneExtrasSection;
