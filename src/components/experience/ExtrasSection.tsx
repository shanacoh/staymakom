import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useLanguage, getLocalizedField } from "@/hooks/useLanguage";
import {
  Wine,
  Car,
  Coffee,
  Flower,
  Sparkle,
  Gift,
  Heart,
  Camera,
  MusicNotes,
  Champagne,
  Bed,
  Cake,
  Drop,
  Leaf,
  HandHeart,
  Star,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";

// Map Lucide icon names (stored in DB) to Phosphor icons
const iconNameMapping: Record<string, PhosphorIcon> = {
  Wine: Wine,
  Champagne: Champagne,
  Car: Car,
  Coffee: Coffee,
  Flower: Flower,
  Flower2: Flower,
  Sparkles: Sparkle,
  Sparkle: Sparkle,
  Gift: Gift,
  Heart: Heart,
  Camera: Camera,
  Music: MusicNotes,
  MusicNotes: MusicNotes,
  Bed: Bed,
  Cake: Cake,
  Drop: Drop,
  Droplets: Drop,
  Leaf: Leaf,
  HandHeart: HandHeart,
  Star: Star,
};

// Keyword-based fallback mapping
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

// Get appropriate Phosphor icon for an extra
const getPhosphorIcon = (imageUrl?: string, name?: string): PhosphorIcon => {
  // Check if imageUrl is a Lucide icon name
  if (imageUrl && iconNameMapping[imageUrl]) {
    return iconNameMapping[imageUrl];
  }

  // Try keyword matching on name
  if (name) {
    const lowerName = name.toLowerCase();
    for (const { keywords, icon } of keywordMapping) {
      if (keywords.some((kw) => lowerName.includes(kw))) {
        return icon;
      }
    }
  }

  // Default fallback
  return Sparkle;
};

interface Extra {
  id: string;
  name: string;
  name_he?: string | null;
  description?: string;
  description_he?: string | null;
  price: number;
  currency: string;
  image_url?: string;
  pricing_type: string;
}

interface ExtrasSectionProps {
  extras: Extra[];
  selectedExtras: { [key: string]: number };
  onUpdateQuantity: (extraId: string, quantity: number) => void;
}

const ExtrasSection = ({ extras, selectedExtras, onUpdateQuantity }: ExtrasSectionProps) => {
  const { lang } = useLanguage();
  
  // Only show real extras, no placeholders
  if (!extras || extras.length === 0) return null;

  const getText = (key: string) => {
    const texts: { [key: string]: { en: string; fr: string; he: string } } = {
      sectionTitle: {
        en: "Make it unforgettable",
        fr: "Rendez-le inoubliable",
        he: "הפכו את זה לבלתי נשכח"
      },
      sectionSubtitle: {
        en: "Thoughtful touches to elevate your stay",
        fr: "Des attentions pour sublimer votre séjour",
        he: "נגיעות מחשבה להעלאת השהייה"
      },
      add: {
        en: "Add",
        fr: "Ajouter",
        he: "הוסף"
      },
      added: {
        en: "Added",
        fr: "Ajouté",
        he: "נוסף"
      }
    };
    return texts[key]?.[lang] || texts[key]?.en || key;
  };

  const formatPrice = (price: number, _currency: string) => {
    return `+$${price}`;
  };

  // Check if image_url is an actual image URL
  const isImageUrl = (url?: string) => url && (url.startsWith('http') || url.startsWith('/'));

  return (
    <div className="space-y-5" dir={lang === 'he' ? 'rtl' : 'ltr'}>
      {/* Compact header */}
      <div>
        <h2 className="font-serif text-xl md:text-2xl font-medium text-foreground mb-1">
          {getText('sectionTitle')}
        </h2>
        <p className="text-muted-foreground text-sm">
          {getText('sectionSubtitle')}
        </p>
      </div>
      
      {/* Grid layout - 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {extras.map((extra) => {
          const quantity = selectedExtras[extra.id] || 0;
          const isAdded = quantity > 0;
          const name = getLocalizedField(extra, 'name', lang) as string || extra.name;
          const hasImage = isImageUrl(extra.image_url);
          const IconComponent = !hasImage ? getPhosphorIcon(extra.image_url, extra.name) : null;
          
          return (
            <div
              key={extra.id}
              className={`
                group rounded-xl p-4
                transition-all duration-200 ease-out
                border flex flex-col items-center text-center
                ${isAdded 
                  ? 'border-primary/40 bg-primary/5' 
                  : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'
                }
              `}
            >
              {/* Icon - centered with gradient colors */}
              <div className={`
                w-12 h-12 rounded-xl mb-3
                flex items-center justify-center overflow-hidden
                ${hasImage ? '' : 'bg-gradient-to-br from-primary/5 via-muted/30 to-primary/10'}
              `}>
                {hasImage ? (
                  <img 
                    src={extra.image_url} 
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : IconComponent ? (
                  <IconComponent 
                    size={26} 
                    weight="duotone" 
                    className="text-primary/60"
                  />
                ) : null}
              </div>

              {/* Name - centered, 2 lines max, flex-1 to push button down */}
              <div className="flex-1 flex items-start">
                <p className="text-sm text-foreground/80 leading-snug line-clamp-2">
                  {name}
                </p>
              </div>

              {/* Button - centered, always at bottom */}
              <div className="mt-3">
                {!isAdded ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-medium rounded-full px-4 border-foreground/20 bg-background hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-200"
                    onClick={() => onUpdateQuantity(extra.id, 1)}
                  >
                    {formatPrice(extra.price, extra.currency)} {getText('add')}
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 text-xs font-medium rounded-full px-4"
                    onClick={() => onUpdateQuantity(extra.id, 0)}
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
    </div>
  );
};

export default ExtrasSection;
