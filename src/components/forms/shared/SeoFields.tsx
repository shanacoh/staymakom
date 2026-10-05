import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Loader2, Sparkles } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea } from "@/components/forms/styled";
import { cn } from "@/lib/utils";
import type { FormLanguage } from "./FormHeaderBar";

type Lang = "en" | "fr" | "he";
export type SeoFieldName =
  | `seo_title_${Lang}`
  | `meta_description_${Lang}`
  | `og_title_${Lang}`
  | `og_description_${Lang}`
  | "og_image";

function CharCount({ value, max }: { value: string | undefined; max: number }) {
  return (
    <p className={cn("text-xs", (value?.length ?? 0) > max ? "text-destructive" : "text-muted-foreground")}>
      {value?.length ?? 0} / {max}
    </p>
  );
}

interface Props {
  registerField: (name: SeoFieldName) => UseFormRegisterReturn;
  /** Valeurs en cours des champs qui ont un compteur de caractères. */
  values: Partial<Record<`seo_title_${Lang}` | `meta_description_${Lang}`, string | undefined>>;
  langHidden: (lang: FormLanguage) => boolean;
  /** 3 langues côte à côte (mode Bateaux) au lieu d'une langue à la fois. */
  threeColumns?: boolean;
  onGenerateSeo: () => void;
  isGeneratingSeo: boolean;
  disabled?: boolean;
}

// Carte SEO : titre + meta description par langue, bouton « Générer le SEO »,
// et les options de partage avancées (Open Graph) repliées derrière un lien.
export function SeoFields({ registerField, values, langHidden, threeColumns, onGenerateSeo, isGeneratingSeo, disabled }: Props) {
  const [showAdvancedSharing, setShowAdvancedSharing] = useState(false);
  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle>SEO Configuration</CardTitle>
            <CardDescription>Configure SEO metadata for search engines and social media</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onGenerateSeo} disabled={isGeneratingSeo || disabled}>
            {isGeneratingSeo ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Générer le SEO
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={cn(threeColumns ? "grid grid-cols-3 gap-6" : "")}>
          {/* EN */}
          <div className={cn("space-y-4", langHidden("en") && "hidden")}>
            <div className="bg-background p-2 rounded flex items-center gap-1.5">
              <span>🇬🇧</span>
              <h4 className="font-medium text-sm">English SEO</h4>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo_title_en">SEO Title</Label>
              <Input id="seo_title_en" {...registerField("seo_title_en")} placeholder="Browser tab & Google" />
              <CharCount value={values.seo_title_en} max={60} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta_description_en">Meta Description</Label>
              <Textarea id="meta_description_en" {...registerField("meta_description_en")} placeholder="Google results" rows={3} />
              <CharCount value={values.meta_description_en} max={155} />
            </div>
          </div>

          {/* HE */}
          <div className={cn("space-y-4", langHidden("he") && "hidden")}>
            <div className="bg-background p-2 rounded flex items-center gap-1.5">
              <span>🇮🇱</span>
              <h4 className="font-medium text-sm">Hebrew SEO (עברית)</h4>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo_title_he">כותרת SEO</Label>
              <Input id="seo_title_he" {...registerField("seo_title_he")} placeholder="כותרת עבור גוגל" dir="rtl" className="bg-hebrew-input" />
              <CharCount value={values.seo_title_he} max={60} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta_description_he">תיאור Meta</Label>
              <Textarea id="meta_description_he" {...registerField("meta_description_he")} placeholder="תיאור עבור גוגל" rows={3} dir="rtl" className="bg-hebrew-input" />
              <CharCount value={values.meta_description_he} max={155} />
            </div>
          </div>

          {/* FR */}
          <div className={cn("space-y-4", langHidden("fr") && "hidden")}>
            <div className="bg-background p-2 rounded flex items-center gap-1.5">
              <span>🇫🇷</span>
              <h4 className="font-medium text-sm">French SEO</h4>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo_title_fr">Titre SEO</Label>
              <Input id="seo_title_fr" {...registerField("seo_title_fr")} placeholder="Titre pour Google" />
              <CharCount value={values.seo_title_fr} max={60} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta_description_fr">Description Meta</Label>
              <Textarea id="meta_description_fr" {...registerField("meta_description_fr")} placeholder="Description Google" rows={3} />
              <CharCount value={values.meta_description_fr} max={155} />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvancedSharing((v) => !v)}
          className="text-sm text-primary underline"
        >
          {showAdvancedSharing ? "Masquer les options de partage avancées" : "Options de partage avancées"}
        </button>

        {showAdvancedSharing && (
          <div className="space-y-6 border-t pt-6">
            <div className={cn(threeColumns ? "grid grid-cols-3 gap-6" : "space-y-4")}>
              <div className={cn("space-y-4", langHidden("en") && "hidden")}>
                <div className="space-y-2">
                  <Label htmlFor="og_title_en">OG Title (EN)</Label>
                  <Input id="og_title_en" {...registerField("og_title_en")} placeholder="Social media title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_description_en">OG Description (EN)</Label>
                  <Textarea id="og_description_en" {...registerField("og_description_en")} placeholder="Social media description" rows={3} />
                </div>
              </div>
              <div className={cn("space-y-4", langHidden("he") && "hidden")}>
                <div className="space-y-2">
                  <Label htmlFor="og_title_he">כותרת OG (HE)</Label>
                  <Input id="og_title_he" {...registerField("og_title_he")} placeholder="כותרת עבור רשתות חברתיות" dir="rtl" className="bg-hebrew-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_description_he">תיאור OG (HE)</Label>
                  <Textarea id="og_description_he" {...registerField("og_description_he")} placeholder="תיאור עבור רשתות חברתיות" rows={3} dir="rtl" className="bg-hebrew-input" />
                </div>
              </div>
              <div className={cn("space-y-4", langHidden("fr") && "hidden")}>
                <div className="space-y-2">
                  <Label htmlFor="og_title_fr">Titre OG (FR)</Label>
                  <Input id="og_title_fr" {...registerField("og_title_fr")} placeholder="Réseaux sociaux" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_description_fr">Description OG (FR)</Label>
                  <Textarea id="og_description_fr" {...registerField("og_description_fr")} placeholder="Description réseaux sociaux" rows={3} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="og_image">Open Graph Image</Label>
              <Input id="og_image" {...registerField("og_image")} placeholder="Image URL for social media sharing" />
              <p className="text-xs text-muted-foreground">Si vide, le site utilise la photo de couverture.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
