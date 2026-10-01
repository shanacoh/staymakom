/**
 * Pop-up de détail d'un bateau, ouverte depuis /boat sans changement d'URL —
 * remplace l'ancienne navigation vers /boat/:slug. Toujours un flux "demande"
 * (BoatAvailabilityPopup), jamais de paiement direct : les bateaux ne se
 * réservent pas en ligne, quel que soit le réglage is_bookable de la fiche.
 * Présentation façon fiche produit : photo pleine largeur, badges, encadré
 * "inclus", liste d'extras avec total, point de RDV, barre de prix fixe en bas.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Check, Plus, MapPin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/useLanguage";
import BoatAvailabilityPopup from "@/components/boats/BoatAvailabilityPopup";
import { resizedImageUrl } from "@/lib/imageUrl";
import { trackExperienceViewed, trackRequestClicked, type ProductLike } from "@/lib/analytics";
import { useSetCurrentProduct } from "@/contexts/CurrentProductContext";
import { BOAT_MEETING_POINTS } from "@/lib/boatAvailability";

interface BoatDetailModalProps {
  boatId: string | null;
  onClose: () => void;
}

function toProductLike(boat: any): ProductLike {
  return {
    slug: boat.slug,
    title: boat.title,
    city: boat.city,
    region: boat.region,
    base_price: boat.base_price,
    base_price_type: boat.base_price_type,
    currency: boat.currency,
    is_bookable: false,
  };
}

const BoatDetailModal = ({ boatId, onClose }: BoatDetailModalProps) => {
  const isMobile = useIsMobile();
  const { lang } = useLanguage();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);

  useEffect(() => {
    setPopupOpen(false);
    setSelectedExtraIds([]);
    setCarouselIndex(0);
  }, [boatId]);

  const { data: boat, isLoading } = useQuery({
    queryKey: ["boat-detail", boatId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("standalone_experiences")
        .select(`
          id, slug, title, title_fr, title_he,
          subtitle, subtitle_fr, subtitle_he,
          long_copy, long_copy_fr, long_copy_he,
          hero_image, photos,
          base_price, base_price_type, currency, original_price,
          duration, duration_fr, duration_he,
          min_party, max_party, lead_time_days,
          city, city_fr, city_he,
          region, region_fr, region_he,
          address, address_he, address_fr,
          accessibility_info, cancellation_policy, cancellation_policy_he,
          standalone_experience_highlight_tags(
            tag_id, position,
            highlight_tags(id, slug, label_en, label_he, label_fr)
          ),
          standalone_experience_price_variants(id, duration_minutes, max_capacity, sale_price, currency)
        `)
        .eq("id", boatId!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!boatId,
  });

  useEffect(() => {
    if (!boat?.slug) return;
    trackExperienceViewed(toProductLike(boat), "boat");
  }, [boat?.slug]);

  useSetCurrentProduct(boat ? toProductLike(boat) : null, "boat");

  const { data: includes } = useQuery({
    queryKey: ["boat-includes", boatId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("standalone_experience_includes")
        .select("id, title, title_fr, title_he")
        .eq("experience_id", boatId!)
        .eq("published", true)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!boatId,
  });

  const { data: extras } = useQuery({
    queryKey: ["boat-extras", boatId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("standalone_extras")
        .select("id, title, title_fr, title_he, price, currency")
        .eq("experience_id", boatId!)
        .eq("is_available", true);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!boatId,
  });

  const localized = (base?: string | null, fr?: string | null, he?: string | null) =>
    lang === "he" ? he || base : lang === "fr" ? fr || base : base;

  const title = localized(boat?.title, boat?.title_fr, boat?.title_he);
  const subtitle = localized(boat?.subtitle, boat?.subtitle_fr, boat?.subtitle_he);
  // "Sortie en mer" / "Sport nautique" — pas une vraie catégorie DB (category_id
  // doit rester "Bateaux" pour le filtrage /admin/boats et /boat), donc on
  // réutilise le champ région, libre et inutilisé par ailleurs pour ce module.
  const regionLabel = localized(boat?.region, boat?.region_fr, boat?.region_he);
  const cityLabel = localized(boat?.city, boat?.city_fr, boat?.city_he);
  const durationLabel = localized(boat?.duration, boat?.duration_fr, boat?.duration_he);

  const photos: string[] = boat
    ? (() => {
        const hero = boat.hero_image;
        const gallery = boat.photos ?? [];
        return hero ? [hero, ...gallery.filter((p: string) => p !== hero)] : gallery;
      })()
    : [];

  const t = {
    maxParty: lang === "he" ? `עד ${boat?.max_party} אורחים` : lang === "fr" ? `${boat?.max_party} personnes max` : `Up to ${boat?.max_party} guests`,
    includedTitle: lang === "he" ? "מה כלול" : lang === "fr" ? "Inclus dans la sortie" : "What's included",
    extrasTitle: lang === "he" ? "תוספות זמינות" : lang === "fr" ? "Extras disponibles" : "Available extras",
    add: lang === "he" ? "הוסף" : lang === "fr" ? "Ajouter" : "Add",
    added: lang === "he" ? "נוסף" : lang === "fr" ? "Ajouté" : "Added",
    fromLabel: lang === "he" ? "החל מ" : lang === "fr" ? "À partir de" : "From",
    total: lang === "he" ? "סה\"כ עם התוספות" : lang === "fr" ? "Total avec options" : "Total with options",
    cta: lang === "he" ? "שליחת הבקשה" : lang === "fr" ? "Envoyer ma demande" : "Send my request",
    meetingPoint: lang === "he" ? "נקודת מפגש" : lang === "fr" ? "Point de rendez-vous" : "Meeting point",
    openMaps: lang === "he" ? "פתח ב-Maps" : lang === "fr" ? "Ouvrir dans Maps" : "Open in Maps",
  };

  const toggleExtra = (extraId: string) => {
    setSelectedExtraIds((prev) =>
      prev.includes(extraId) ? prev.filter((id) => id !== extraId) : [...prev, extraId]
    );
  };

  const extrasTotal = (extras ?? [])
    .filter((e) => selectedExtraIds.includes(e.id))
    .reduce((sum, e) => sum + (e.price || 0), 0);

  const extraNotes = (() => {
    if (!extras || selectedExtraIds.length === 0) return undefined;
    const names = extras
      .filter((e) => selectedExtraIds.includes(e.id))
      .map((e) => localized(e.title, e.title_fr, e.title_he));
    return names.length > 0 ? names.join(", ") : undefined;
  })();

  const meetingPoint = boat?.city ? BOAT_MEETING_POINTS[boat.city] : undefined;

  const handleReserveClick = () => {
    if (boat?.slug) {
      trackRequestClicked(toProductLike(boat), "boat", "price_bar");
    }
    setPopupOpen(true);
  };

  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md hover:bg-white transition-colors"
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  );

  const body = isLoading || !boat ? (
    <div className="p-6 space-y-4">
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  ) : (
    <div key="detail" className="pb-6 animate-in fade-in slide-in-from-left-4 duration-300">
      {/* Photo — pleine largeur, défile au doigt/à la souris */}
      {photos.length > 0 && (
        <div className="relative">
          <Carousel
            className="w-full"
            opts={{ loop: photos.length > 1 }}
            setApi={(api?: CarouselApi) => {
              api?.on("select", () => setCarouselIndex(api.selectedScrollSnap()));
            }}
          >
            <CarouselContent>
              {photos.filter(Boolean).map((photo, i) => (
                <CarouselItem key={i}>
                  <div className="aspect-[4/3] sm:aspect-[16/9] w-full overflow-hidden">
                    <img
                      src={resizedImageUrl(photo, 1200) || photo}
                      alt={`${title} ${i + 1}`}
                      loading={i === 0 ? undefined : "lazy"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {/* Flèches gauche/droite — souris uniquement, le doigt swipe déjà sur mobile */}
            {!isMobile && photos.length > 1 && (
              <>
                <CarouselPrevious className="left-3 right-auto top-1/2 h-9 w-9 border-none bg-white/90 shadow-md hover:bg-white" />
                <CarouselNext className="right-3 left-auto top-1/2 h-9 w-9 border-none bg-white/90 shadow-md hover:bg-white" />
              </>
            )}
          </Carousel>
          {photos.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.filter(Boolean).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === carouselIndex ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="px-4 sm:px-6 pt-4 space-y-5">
        {/* Capacité */}
        {boat.max_party && (
          <span className="inline-block rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
            {t.maxParty}
          </span>
        )}

        {/* Catégorie · ville + titre */}
        <div className="space-y-1.5">
          {(regionLabel || cityLabel) && (
            <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              {[regionLabel, cityLabel].filter(Boolean).join(" · ")}
            </p>
          )}
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">{title}</h2>
        </div>

        {/* Points forts */}
        {(boat.standalone_experience_highlight_tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2">
            {boat.standalone_experience_highlight_tags
              .sort((a: any, b: any) => a.position - b.position)
              .map((tag: any) => {
                const label = localized(tag.highlight_tags?.label_en, tag.highlight_tags?.label_fr, tag.highlight_tags?.label_he);
                return label ? (
                  <span key={tag.tag_id} className="rounded-full bg-[#F5F0E6] px-3 py-1.5 text-xs font-medium text-foreground">
                    {label}
                  </span>
                ) : null;
              })}
          </div>
        )}

        {/* Description courte */}
        {subtitle && <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}

        {/* Inclus */}
        {(includes?.length ?? 0) > 0 && (
          <div className="rounded-xl bg-[#F5F0E6] p-4 sm:p-5 space-y-2.5">
            <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">{t.includedTitle}</p>
            <ul className="space-y-2">
              {includes!.map((item) => (
                <li key={item.id} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-700" />
                  {localized(item.title, item.title_fr, item.title_he)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Extras — ajoutables à la demande, total mis à jour en direct (informatif, pas de paiement ici) */}
        {(extras?.length ?? 0) > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">{t.extrasTitle}</p>
            <div className="divide-y">
              {extras!.map((extra) => {
                const isSelected = selectedExtraIds.includes(extra.id);
                return (
                  <div key={extra.id} className="flex items-center justify-between py-2.5 gap-3">
                    <div className="text-sm">
                      <p>{localized(extra.title, extra.title_fr, extra.title_he)}</p>
                      <p className="text-muted-foreground text-xs">{extra.price} {extra.currency}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleExtra(extra.id)}
                      className={`shrink-0 flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        isSelected
                          ? "border-[#ad1414] bg-[#ad1414] text-white"
                          : "border-border hover:border-[#ad1414]/50 hover:bg-[#FDF2F2]"
                      }`}
                    >
                      {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      {isSelected ? t.added : t.add}
                    </button>
                  </div>
                );
              })}
            </div>
            {selectedExtraIds.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t text-sm font-semibold">
                <span>{t.total}</span>
                <span>{Math.round(boat.base_price + extrasTotal)} {boat.currency}</span>
              </div>
            )}
          </div>
        )}

        {/* Point de rendez-vous */}
        {meetingPoint && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {t.meetingPoint}
            </p>
            <p className="text-sm text-foreground">{meetingPoint.address}</p>
            <p className="text-xs text-muted-foreground">{meetingPoint.note}</p>
            <a
              href={meetingPoint.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs font-medium text-[#ad1414] underline underline-offset-2"
            >
              {t.openMaps}
            </a>
          </div>
        )}

      </div>
    </div>
  );

  const priceBar = !isLoading && boat && (
    <div className="shrink-0 border-t bg-background px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
      <div>
        <p className="text-xs text-muted-foreground">{t.fromLabel}</p>
        <p className="text-lg font-bold text-foreground flex items-baseline gap-1.5 flex-wrap">
          {Math.round(boat.base_price).toLocaleString('fr-FR')} {boat.currency}
          {boat.original_price && boat.original_price > boat.base_price && (
            <>
              <span className="text-sm font-normal text-muted-foreground line-through">
                {Math.round(boat.original_price).toLocaleString('fr-FR')} {boat.currency}
              </span>
              <span className="inline-block px-1.5 py-0.5 bg-accent text-accent-foreground text-[10px] font-medium rounded">
                -{Math.round((1 - boat.base_price / boat.original_price) * 100)}%
              </span>
            </>
          )}
          {durationLabel && <span className="text-sm font-normal text-muted-foreground"> / {durationLabel}</span>}
        </p>
      </div>
      <button
        type="button"
        onClick={handleReserveClick}
        className="rounded-full bg-black text-white px-6 py-3 text-sm font-semibold hover:bg-black/90 transition-colors"
      >
        {t.cta}
      </button>
    </div>
  );

  const popup = boat && (
    <BoatAvailabilityPopup
      open={popupOpen}
      onOpenChange={setPopupOpen}
      boat={{
        id: boat.id,
        title,
        city: boat.city,
        slug: boat.slug,
        price_variants: boat.standalone_experience_price_variants ?? [],
      }}
    />
  );

  if (isMobile) {
    return (
      <>
        <Sheet open={!!boatId} onOpenChange={(open) => !open && onClose()}>
          <SheetContent side="bottom" hideCloseButton className="h-[92vh] rounded-t-2xl p-0 flex flex-col overflow-hidden">
            <VisuallyHidden.Root><SheetTitle>{title || (lang === "he" ? "סירה" : lang === "fr" ? "Bateau" : "Boat")}</SheetTitle></VisuallyHidden.Root>
            <div className="relative flex-1 min-h-0 overflow-y-auto">
              {closeButton}
              {body}
            </div>
            {priceBar}
          </SheetContent>
        </Sheet>
        {popup}
      </>
    );
  }

  return (
    <>
      <Dialog open={!!boatId} onOpenChange={(open) => !open && onClose()}>
        <DialogContent hideCloseButton className="max-w-3xl max-h-[90vh] rounded-2xl p-0 flex flex-col overflow-hidden">
          <VisuallyHidden.Root><DialogTitle>{title || (lang === "he" ? "סירה" : lang === "fr" ? "Bateau" : "Boat")}</DialogTitle></VisuallyHidden.Root>
          <div className="relative flex-1 min-h-0 overflow-y-auto">
            {closeButton}
            {body}
          </div>
          {priceBar}
        </DialogContent>
      </Dialog>
      {popup}
    </>
  );
};

export default BoatDetailModal;
