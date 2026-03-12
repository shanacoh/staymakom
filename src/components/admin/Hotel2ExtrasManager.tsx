import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Receipt, ChevronDown, ChevronUp, Zap, Eye, Settings2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import * as LucideIcons from "lucide-react";
import {
  Wine, Car, Coffee, Flower, Sparkle, Gift, Heart, Camera,
  MusicNotes, Champagne, Bed, Cake, Drop, Leaf, Star, Sun, Umbrella,
  BookOpen, Pen, Briefcase, ShoppingCart, type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import type { TaxFeeExtra } from "@/components/admin/HyperGuestHotelSearch";

interface Hotel2ExtrasManagerProps {
  hotelId: string;
  hyperguestExtras?: TaxFeeExtra[];
}

// ── Presets catalogue ──────────────────────────────────────────────────────
const PRESETS: { name_en: string; name_he: string; icon: string; pricing_type: string }[] = [
  // 🏨 Hôtel & Logistique
  { name_en: "Car Transfer Service (one way)",  name_he: "שירות העברה ברכב (כיוון אחד)", icon: "Car",        pricing_type: "per_booking" },
  { name_en: "Car Transfer Service (round trip)", name_he: "שירות העברה ברכב (הלוך ושוב)", icon: "Car",      pricing_type: "per_booking" },
  { name_en: "Early Check-in",                  name_he: "צ'ק אין מוקדם",                  icon: "Clock",      pricing_type: "per_booking" },
  { name_en: "Late Check-out",                  name_he: "צ'ק אאוט מאוחר",                  icon: "Clock",      pricing_type: "per_booking" },
  { name_en: "Breakfast",                        name_he: "ארוחת בוקר",                      icon: "Coffee",     pricing_type: "per_person"  },
  { name_en: "Lazy Breakfast (late / in-room)",  name_he: "ארוחת בוקר עצלה (מאוחרת / בחדר)", icon: "Coffee",   pricing_type: "per_person"  },
  { name_en: "Dinner",                           name_he: "ארוחת ערב",                        icon: "Utensils",  pricing_type: "per_person"  },
  { name_en: "Picnic Basket",                    name_he: "סל פיקניק",                        icon: "ShoppingCart", pricing_type: "per_booking" },
  { name_en: "Parking Reservation",              name_he: "הזמנת חניה",                       icon: "Car",       pricing_type: "per_booking" },
  // 🧘 Bien-être & Expérience
  { name_en: "Massage (60 min)",                 name_he: "עיסוי (60 דקות)",                  icon: "Sparkles",  pricing_type: "per_person"  },
  { name_en: "Photoshoot Session",               name_he: "סשן צילומים",                      icon: "Camera",    pricing_type: "per_booking" },
  { name_en: "Private Yoga Session",             name_he: "שיעור יוגה פרטי",                  icon: "Sun",       pricing_type: "per_booking" },
  { name_en: "Spa Access",                       name_he: "כניסה לספא",                       icon: "Waves",     pricing_type: "per_person"  },
  { name_en: "Beach Kit (STAYMAKOM towel)",      name_he: "ערכת חוף (מגבת STAYMAKOM)",        icon: "Umbrella",  pricing_type: "per_person"  },
  // 🍾 Chambre & Ambiance
  { name_en: "Champagne in Room",                name_he: "שמפניה בחדר",                      icon: "Wine",      pricing_type: "per_booking" },
  { name_en: "Wine in Room",                     name_he: "יין בחדר",                         icon: "Wine",      pricing_type: "per_booking" },
  { name_en: "Welcome Snack Basket",             name_he: "סל קבלת פנים",                    icon: "Gift",      pricing_type: "per_booking" },
  { name_en: "Flower Bouquet",                   name_he: "זר פרחים",                         icon: "Flower",    pricing_type: "per_booking" },
  { name_en: "Romantic Room Setup (candles / decoration)", name_he: "הכנת חדר רומנטי (נרות / קישוטים)", icon: "Heart", pricing_type: "per_booking" },
  // 🎞️ Souvenirs & Slow Moments
  { name_en: "Digital Camera",                   name_he: "מצלמה דיגיטלית",                   icon: "Camera",    pricing_type: "per_booking" },
  { name_en: "Letter-to-Yourself Kit",           name_he: "ערכת מכתב לעצמי",                  icon: "Pen",       pricing_type: "per_booking" },
  { name_en: "Stay Journal",                     name_he: "יומן שהייה",                       icon: "BookOpen",  pricing_type: "per_booking" },
  { name_en: "Board Game",                       name_he: "משחק קופסה",                       icon: "Briefcase", pricing_type: "per_booking" },
  { name_en: "Card Game",                        name_he: "משחק קלפים",                       icon: "Star",      pricing_type: "per_booking" },
];

// ── Phosphor icon map (same as front) ──────────────────────────────────────
const iconNameMapping: Record<string, PhosphorIcon> = {
  Wine, Car, Coffee, Flower, Flower2: Flower, Sparkles: Sparkle, Sparkle, Gift, Heart,
  Camera, Music: MusicNotes, MusicNotes, Bed, Cake, Drop, Droplets: Drop, Leaf, Star,
  Sun, Umbrella, BookOpen, Pen, Briefcase, ShoppingCart,
};
const keywordMapping: Array<{ keywords: string[]; icon: PhosphorIcon }> = [
  { keywords: ["wine", "vin", "יין"], icon: Wine },
  { keywords: ["champagne", "שמפניה"], icon: Champagne },
  { keywords: ["car", "transport", "taxi", "הסעה", "רכב"], icon: Car },
  { keywords: ["coffee", "breakfast", "café", "ארוחת בוקר", "קפה", "dinner", "ערב"], icon: Coffee },
  { keywords: ["flower", "bouquet", "פרח", "זר"], icon: Flower },
  { keywords: ["spa", "massage", "wellness", "ספא", "עיסוי"], icon: Drop },
  { keywords: ["gift", "basket", "snack", "picnic", "מתנה", "סל"], icon: Gift },
  { keywords: ["romantic", "romance", "candle", "רומנטי", "נר"], icon: Heart },
  { keywords: ["photo", "camera", "צילום", "מצלמה"], icon: Camera },
  { keywords: ["journal", "book", "pen", "letter", "יומן", "מכתב"], icon: BookOpen },
  { keywords: ["game", "board", "card", "משחק", "קלפים"], icon: Briefcase },
  { keywords: ["beach", "umbrella", "towel", "חוף", "מגבת"], icon: Umbrella },
  { keywords: ["yoga", "sun", "יוגה"], icon: Sun },
];

function getPhosphorIcon(iconName?: string, name?: string): PhosphorIcon {
  if (iconName && iconNameMapping[iconName]) return iconNameMapping[iconName];
  if (name) {
    const lower = name.toLowerCase();
    for (const { keywords, icon } of keywordMapping) {
      if (keywords.some((kw) => lower.includes(kw))) return icon;
    }
  }
  return Sparkle;
}

// ── Pricing labels ─────────────────────────────────────────────────────────
const PRICING_TYPES = [
  { value: "per_booking", label: "Par réservation" },
  { value: "per_night",   label: "Par nuit" },
  { value: "per_person",  label: "Par personne" },
];
const CURRENCIES = ["ILS", "USD", "EUR", "GBP"];
const AVAILABLE_ICONS = [
  "Gift", "Wifi", "Utensils", "Wine", "Dumbbell", "Tent", "Plane", "Car",
  "Camera", "Music", "Sparkles", "Heart", "Star", "Coffee", "Baby",
  "Flower2", "Bike", "Hotel", "Bed", "Bath", "Sun", "Moon",
  "Umbrella", "Key", "Map", "MapPin", "Phone", "Globe", "Clock", "Calendar",
  "ShoppingCart", "CreditCard", "Briefcase", "Package",
  "Mountain", "Waves", "Snowflake", "Gem", "Crown",
  "Compass", "Anchor", "Pizza", "IceCream",
  "Cake", "Beer", "GlassWater", "BookOpen", "Newspaper", "Pen", "Bell",
  "Lightbulb", "Flame", "Wind", "Leaf", "Trees", "Flower", "Bird",
];
const EMPTY_FORM = { name_en: "", name_he: "", price: "", currency: "ILS", pricing_type: "per_booking", icon: "Gift" };

// ── Front-style preview card ───────────────────────────────────────────────
function ExtraPreviewCard({ extra, onToggle, onDelete }: {
  extra: any;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const IconComponent = getPhosphorIcon(extra.image_url, extra.name);
  const pricingLabel = PRICING_TYPES.find(t => t.value === extra.pricing_type)?.label || "";

  return (
    <div className={`group rounded-xl border flex flex-col items-center text-center p-4 transition-all relative ${
      extra.is_available ? "border-border/60 bg-muted/20" : "border-dashed border-border/30 bg-muted/10 opacity-50"
    }`}>
      {/* Actions overlay */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onToggle}
          title={extra.is_available ? "Désactiver" : "Activer"}
          className="p-1 rounded-md bg-background border border-border hover:bg-muted transition-colors"
        >
          <div className={`w-2 h-2 rounded-full ${extra.is_available ? "bg-green-500" : "bg-muted-foreground"}`} />
        </button>
        <button
          onClick={onDelete}
          title="Supprimer"
          className="p-1 rounded-md bg-background border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Icon */}
      <div className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center bg-gradient-to-br from-primary/5 via-muted/30 to-primary/10">
        <IconComponent size={26} weight="duotone" className="text-primary/60" />
      </div>

      {/* Name */}
      <p className="text-sm font-medium text-foreground/80 leading-snug line-clamp-2 mb-1">{extra.name}</p>
      {extra.name_he && (
        <p className="text-xs text-muted-foreground mb-2" dir="rtl">{extra.name_he}</p>
      )}

      {/* Price pill */}
      <div className="mt-auto pt-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1 text-xs font-medium bg-background">
          +{extra.price} {extra.currency}
          <span className="text-muted-foreground">{pricingLabel ? ` · ${pricingLabel}` : ""}</span>
        </span>
      </div>
    </div>
  );
}

export function Hotel2ExtrasManager({ hotelId, hyperguestExtras = [] }: Hotel2ExtrasManagerProps) {
  const queryClient = useQueryClient();
  const [expandedHyperguest, setExpandedHyperguest] = useState(false);
  const [newExtra, setNewExtra] = useState(EMPTY_FORM);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"preview" | "manage">("preview");

  const { data: extras = [], isLoading } = useQuery({
    queryKey: ["hotel2-extras", hotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotel2_extras" as any)
        .select("*")
        .eq("hotel_id", hotelId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newExtra) => {
      const { error } = await supabase.from("hotel2_extras" as any).insert({
        hotel_id: hotelId,
        name: data.name_en,
        name_he: data.name_he || null,
        price: parseFloat(data.price),
        currency: data.currency,
        pricing_type: data.pricing_type,
        image_url: data.icon,
        is_available: true,
        sort_order: Math.max(0, ...extras.map((e: any) => e.sort_order ?? 0)) + 1,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel2-extras", hotelId] });
      toast.success("Extra ajouté ✓");
      setNewExtra(EMPTY_FORM);
      setSelectedPreset("");
    },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hotel2_extras" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel2-extras", hotelId] });
      toast.success("Extra supprimé");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { error } = await supabase.from("hotel2_extras" as any).update({ is_available: !is_available } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hotel2-extras", hotelId] }),
  });

  const handleAddExtra = () => {
    if (!newExtra.name_en.trim()) { toast.error("Nom en anglais requis"); return; }
    if (!newExtra.price || parseFloat(newExtra.price) <= 0) { toast.error("Prix valide requis"); return; }
    createMutation.mutate(newExtra);
  };

  const handlePresetSelect = (presetName: string) => {
    setSelectedPreset(presetName);
    if (presetName === "__custom__" || !presetName) { setNewExtra(EMPTY_FORM); return; }
    const preset = PRESETS.find((p) => p.name_en === presetName);
    if (preset) {
      setNewExtra({ name_en: preset.name_en, name_he: preset.name_he, price: "", currency: "ILS", pricing_type: preset.pricing_type, icon: preset.icon });
    }
  };

  const handleImport = (item: TaxFeeExtra) => {
    setSelectedPreset("__custom__");
    setActiveTab("manage");
    setNewExtra({
      name_en: item.title, name_he: "", price: (item.chargeValue ?? 0).toString(),
      currency: item.currency || "ILS", pricing_type: "per_booking",
      icon: item.category === "tax" ? "Receipt" : "Gift",
    });
    toast.success(`"${item.title}" pré-rempli.`);
  };

  const renderLucideIcon = (name: string) => {
    const Ic = (LucideIcons as any)[name];
    return Ic ? <Ic className="h-4 w-4" /> : <LucideIcons.Gift className="h-4 w-4" />;
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* HyperGuest Taxes & Fees */}
      {hyperguestExtras.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base">HyperGuest Taxes & Fees</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setExpandedHyperguest(!expandedHyperguest)}>
                {expandedHyperguest ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
            <CardDescription>Importés depuis HyperGuest — cliquez Import pour pré-remplir le formulaire</CardDescription>
          </CardHeader>
          {expandedHyperguest && (
            <CardContent className="space-y-2">
              {hyperguestExtras.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {item.category && <Badge variant="outline" className="text-[10px]">{item.category}</Badge>}
                      <span>{item.chargeType === "percent" ? `${item.chargeValue}%` : `${item.chargeValue} ${item.currency || "ILS"}`}</span>
                      {item.frequency && <span>({item.frequency})</span>}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleImport(item)}>Import</Button>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            activeTab === "preview" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          Aperçu front ({extras.length})
        </button>
        <button
          onClick={() => setActiveTab("manage")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            activeTab === "manage" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings2 className="h-3.5 w-3.5" />
          Gérer & ajouter
        </button>
      </div>

      {/* ── PREVIEW TAB ── */}
      {activeTab === "preview" && (
        <div>
          {extras.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center border-2 border-dashed border-border rounded-xl">
              <Sparkle size={32} className="text-muted-foreground/40" weight="duotone" />
              <p className="text-sm text-muted-foreground">Aucun extra créé pour cet hôtel.</p>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("manage")}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un extra
              </Button>
            </div>
          ) : (
            <>
              {/* Section title exactly like front */}
              <div className="mb-4 border-b border-border pb-4">
                <h2 className="font-serif text-xl font-medium text-foreground mb-1">Spice it up</h2>
                <p className="text-sm text-muted-foreground">Enhance your stay with optional extras</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {extras.map((extra) => (
                  <ExtraPreviewCard
                    key={extra.id}
                    extra={extra}
                    onToggle={() => toggleMutation.mutate({ id: extra.id, is_available: extra.is_available })}
                    onDelete={() => deleteMutation.mutate(extra.id)}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Survolez une carte pour afficher les actions · Les désactivés apparaissent en grisé
              </p>
            </>
          )}
        </div>
      )}

      {/* ── MANAGE TAB ── */}
      {activeTab === "manage" && (
        <div className="space-y-4">
          {/* List view */}
          {extras.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Extra</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Prix</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Type</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground text-xs">Actif</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {extras.map((extra) => {
                    const IconCmp = getPhosphorIcon(extra.image_url, extra.name);
                    return (
                      <tr key={extra.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <IconCmp size={16} weight="duotone" className="text-primary/60" />
                            </div>
                            <div>
                              <p className="font-medium">{extra.name}</p>
                              {extra.name_he && <p className="text-xs text-muted-foreground" dir="rtl">{extra.name_he}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-semibold">{extra.price} {extra.currency}</td>
                        <td className="px-3 py-2.5 text-muted-foreground text-xs">
                          {PRICING_TYPES.find(t => t.value === extra.pricing_type)?.label}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <Switch
                            checked={extra.is_available}
                            onCheckedChange={() => toggleMutation.mutate({ id: extra.id, is_available: extra.is_available })}
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Button
                            variant="ghost" size="icon"
                            className="text-destructive h-7 w-7"
                            onClick={() => deleteMutation.mutate(extra.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Add form */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <CardTitle className="text-sm">Ajouter un extra</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preset selector */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-500" />
                  Sélectionner un preset (optionnel)
                </Label>
                <Select value={selectedPreset} onValueChange={handlePresetSelect}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="— Choisir un preset pour pré-remplir —" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px]">
                    <SelectItem value="__custom__">✏️ Créer un extra personnalisé</SelectItem>
                    <SelectItem value="__h" disabled className="text-xs font-semibold text-muted-foreground">🏨 Hôtel & Logistique</SelectItem>
                    {PRESETS.slice(0, 9).map((p) => <SelectItem key={p.name_en} value={p.name_en} className="pl-4">{p.name_en}</SelectItem>)}
                    <SelectItem value="__b" disabled className="text-xs font-semibold text-muted-foreground">🧘 Bien-être & Expérience</SelectItem>
                    {PRESETS.slice(9, 14).map((p) => <SelectItem key={p.name_en} value={p.name_en} className="pl-4">{p.name_en}</SelectItem>)}
                    <SelectItem value="__c" disabled className="text-xs font-semibold text-muted-foreground">🍾 Chambre & Ambiance</SelectItem>
                    {PRESETS.slice(14, 19).map((p) => <SelectItem key={p.name_en} value={p.name_en} className="pl-4">{p.name_en}</SelectItem>)}
                    <SelectItem value="__s" disabled className="text-xs font-semibold text-muted-foreground">🎞️ Souvenirs & Slow Moments</SelectItem>
                    {PRESETS.slice(19).map((p) => <SelectItem key={p.name_en} value={p.name_en} className="pl-4">{p.name_en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Fields grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Icône</Label>
                  <Select value={newExtra.icon} onValueChange={(v) => setNewExtra({ ...newExtra, icon: v })}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {AVAILABLE_ICONS.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          <span className="flex items-center gap-2">
                            {renderLucideIcon(icon)}
                            <span className="text-xs">{icon}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Nom (EN) *</Label>
                  <Input className="h-9" value={newExtra.name_en} onChange={(e) => setNewExtra({ ...newExtra, name_en: e.target.value })} placeholder="Late Checkout" />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Nom (HE)</Label>
                  <Input className="h-9 bg-blue-50" value={newExtra.name_he} onChange={(e) => setNewExtra({ ...newExtra, name_he: e.target.value })} dir="rtl" placeholder="צ'ק אאוט מאוחר" />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Prix *</Label>
                  <Input className="h-9" type="number" value={newExtra.price} onChange={(e) => setNewExtra({ ...newExtra, price: e.target.value })} placeholder="0.00" />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Devise</Label>
                  <Select value={newExtra.currency} onValueChange={(v) => setNewExtra({ ...newExtra, currency: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Type de tarification</Label>
                  <Select value={newExtra.pricing_type} onValueChange={(v) => setNewExtra({ ...newExtra, pricing_type: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRICING_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleAddExtra} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Ajouter l'extra
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Hotel2ExtrasManager;
