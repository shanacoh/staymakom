/**
 * Make it unforgettable – User-facing interactive extras section
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useRef, useEffect, useCallback } from "react";
import { trackAddonViewed, trackAddonClicked } from "@/lib/analytics";
import {
  Wine, Car, Coffee, Flower, Sparkle, Gift, Heart, Camera, MusicNotes,
  Champagne, Bed, Cake, Drop, Leaf, HandHeart, Star,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";

const iconNameMapping: Record<string, PhosphorIcon> = {
  Wine, Champagne, Car, Coffee, Flower, Flower2: Flower, Sparkles: Sparkle, Sparkle, Gift, Heart, Camera, Music: MusicNotes, MusicNotes, Bed, Cake, Drop, Droplets: Drop, Leaf, HandHeart, Star,
};

const keywordMapping: Array<{ keywords: string[]; icon: PhosphorIcon }> = [
  { keywords: ['wine', 'vin', 'יין'], icon: Wine },
  { keywords: ['champagne', 'שמפניה'], icon: Champagne },
  { keywords: ['car', 'transport', 'taxi', 'ride', 'הסעה', 'רכב'], icon: Car },
  { keywords: ['coffee', 'breakfast', 'café', 'ארוחת בוקר', 'קפה'], icon: Coffee },
  { keywords: ['flower', 'fleur', 'פרח', 'bouquet', 'זר'], icon: Flower },
  { keywords: ['spa', 'massage', 'wellness', 'ספא', 'עיסוי'], icon: Drop },
  { keywords: ['gift', 'cadeau', 'surprise', 'מתנה', 'הפתעה'], icon: Gift },
  { keywords: ['romance', 'romantic', 'love', 'רומנטי', 'אהבה'], icon: Heart },
  { keywords: ['photo', 'camera', 'צילום', 'מצלמה'], icon: Camera },
  { keywords: ['music', 'dj', 'מוזיקה'], icon: MusicNotes },
  { keywords: ['cake', 'birthday', 'anniversary', 'עוגה', 'יום הולדת'], icon: Cake },
  { keywords: ['room', 'upgrade', 'suite', 'חדר', 'שדרוג'], icon: Bed },
  { keywords: ['nature', 'eco', 'green', 'טבע'], icon: Leaf },
];

const getPhosphorIcon = (imageUrl?: string | null, name?: string): PhosphorIcon => {
  if (imageUrl && iconNameMapping[imageUrl]) return iconNameMapping[imageUrl];
  if (name) {
    const lowerName = name.toLowerCase();
    for (const { keywords, icon } of keywordMapping) {
      if (keywords.some((kw) => lowerName.includes(kw))) return icon;
    }
  }
  return Sparkle;
};

export interface SelectedExtra {
  id: string;
  name: string;
  name_he: string | null;
  price: number;
  currency: string;
  pricing_type: string;
}

interface ExtrasSection2Props {
  experienceId: string;
  lang?: string;
  currency?: string;
  selectedExtras: SelectedExtra[];
  onToggleExtra: (extra: SelectedExtra) => void;
}

const ExtrasSection2 = ({
  experienceId,
  lang = "en",
  currency = "ILS",
  selectedExtras,
  onToggleExtra,
}: ExtrasSection2Props) => {
  const { symbol: currencySymbol, convert } = useCurrency();
  const viewedAddonsRef = useRef(new Set<string>());

  const addonObserverCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const addonId = entry.target.getAttribute('data-addon-id');
        const addonName = entry.target.getAttribute('data-addon-name');
        if (addonId && addonName && !viewedAddonsRef.current.has(addonId)) {
          viewedAddonsRef.current.add(addonId);
          trackAddonViewed(experienceId, addonName);
        }
      }
    });
  }, [experienceId]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    observerRef.current = new IntersectionObserver(addonObserverCallback, { threshold: 0.5 });
    return () => observerRef.current?.disconnect();
  }, [addonObserverCallback]);

  const addonCardRef = useCallback((node: HTMLDivElement | null) => {
    if (node && observerRef.current) observerRef.current.observe(node);
  }, []);

  const { data: extras } = useQuery({
    queryKey: ["experience2-public-extras", experienceId],
    queryFn: async () => {
      const { data: links, error: linksError } = await (supabase as any)
        .from("experience2_extras")
        .select("extra_id")
        .eq("experience_id", experienceId);
      if (linksError) throw linksError;
      if (!links || links.length === 0) return [];

      const extraIds = links.map((l: any) => l.extra_id);
      const { data, error } = await supabase
        .from("hotel2_extras")
        .select("*")
        .in("id", extraIds)
        .eq("is_available", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  if (!extras || extras.length === 0) return null;

  const getText = (key: string) => {
    const texts: Record<string, Record<string, string>> = {
      sectionTitle: { en: "Make it unforgettable", fr: "Rendez-le inoubliable", he: "הפכו את זה לבלתי נשכח" },
      sectionIntro: { en: "Every escape can go a little further.", fr: "Chaque escapade peut aller plus loin.", he: "כל בריחה יכולה ללכת קצת יותר רחוק." },
      add: { en: "Add", fr: "Ajouter", he: "הוסף" },
      added: { en: "Added", fr: "Ajouté", he: "נוסף" },
    };
    return texts[key]?.[lang] || texts[key]?.en || key;
  };

  const displaySymbol = currencySymbol;

  const formatPrice = (price: number) => {
    // Extra prices are in ILS, convert to display currency
    return `+${displaySymbol}${Math.round(convert(price))}`;
  };

  const isImageUrl = (url?: string | null) => url && (url.startsWith('http') || url.startsWith('/'));

  return (
    <section className="py-6 border-b border-border" dir={lang === 'he' ? 'rtl' : 'ltr'}>
      <div className="mb-5">
        <h2 className="font-serif text-xl md:text-2xl font-medium text-foreground mb-1">
          {getText('sectionTitle')}
        </h2>
        <p className="italic text-muted-foreground text-sm">
          {getText('sectionIntro')}
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {extras.map((extra) => {
          const isSelected = selectedExtras.some((se) => se.id === extra.id);
          const name = lang === "he" ? extra.name_he || extra.name : extra.name;
          const hasImage = isImageUrl(extra.image_url);
          const IconComponent = !hasImage ? getPhosphorIcon(extra.image_url, extra.name) : null;

          const extraData: SelectedExtra = {
            id: extra.id,
            name: extra.name,
            name_he: extra.name_he,
            price: extra.price,
            currency: currency, // Use experience currency consistently
            pricing_type: extra.pricing_type,
          };
          
          return (
            <div
              key={extra.id}
              ref={addonCardRef}
              data-addon-id={extra.id}
              data-addon-name={name}
              className={`
                group rounded-xl p-4
                transition-all duration-200 ease-out
                border flex flex-col items-center text-center
                ${isSelected 
                  ? 'border-foreground/30 bg-foreground/5' 
                  : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'
                }
              `}
            >
              <div className={`
                w-12 h-12 rounded-xl mb-3
                flex items-center justify-center overflow-hidden
                ${hasImage ? '' : 'bg-gradient-to-br from-primary/5 via-muted/30 to-primary/10'}
              `}>
                {hasImage ? (
                  <img src={extra.image_url!} alt={name} className="w-full h-full object-cover" />
                ) : IconComponent ? (
                  <IconComponent size={26} weight="duotone" className="text-primary/60" />
                ) : null}
              </div>

              <div className="flex-1 flex items-start">
                <p className="text-sm text-foreground/80 leading-snug line-clamp-2">{name}</p>
              </div>

              <div className="mt-3">
                {!isSelected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-medium rounded-full px-4 border-foreground/20 bg-transparent hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-200"
                    onClick={() => { trackAddonClicked(experienceId, name, extra.price); onToggleExtra(extraData); }}
                  >
                    {formatPrice(extra.price)} · {getText('add')}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-medium rounded-full px-4 border-foreground bg-foreground text-background"
                    onClick={() => onToggleExtra(extraData)}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    {getText('added')}
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

export default ExtrasSection2;
