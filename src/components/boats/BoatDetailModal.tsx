/**
 * Pop-up de détail d'un bateau, ouverte depuis /boat sans changement d'URL —
 * remplace l'ancienne navigation vers /boat/:slug. Toujours un flux "demande"
 * (StandaloneRequestPanel), jamais de paiement direct : les bateaux ne se
 * réservent pas en ligne, quel que soit le réglage is_bookable de la fiche.
 * Présentation façon fiche produit : photo pleine largeur, badges, encadré
 * "inclus", liste d'extras, barre de prix fixe en bas.
 */
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Check, Plus, ChevronLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/useLanguage";
import StandaloneRequestPanel from "@/components/experience-test/StandaloneRequestPanel";
import { resizedImageUrl } from "@/lib/imageUrl";

interface BoatDetailModalProps {
  boatId: string | null;
  onClose: () => void;
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const BoatDetailModal = ({ boatId, onClose }: BoatDetailModalProps) => {
  const isMobile = useIsMobile();
  const { lang } = useLanguage();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [requestStarted, setRequestStarted] = useState(false);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRequestStarted(false);
    setSelectedExtraIds([]);
    setCarouselIndex(0);
  }, [boatId]);

  // Repart du haut à chaque bascule détail <-> demande, sur mobile comme desktop.
  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0 });
  }, [requestStarted]);

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
          base_price, base_price_type, currency,
          duration, duration_fr, duration_he,
          min_party, max_party, lead_time_days,
          city, city_fr, city_he,
          region, region_fr, region_he,
          address, address_he, address_fr,
          accessibility_info, cancellation_policy, cancellation_policy_he,
          available_days, blocked_dates, availability_end_date, availability_mode, whitelisted_dates,
          standalone_experience_highlight_tags(
            tag_id, position,
            highlight_tags(id, slug, label_en, label_he, label_fr)
          )
        `)
        .eq("id", boatId!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!boatId,
  });

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
    cta: lang === "he" ? "אני מזמין את הטיול" : lang === "fr" ? "Je réserve ma sortie" : "Book my trip",
    backToDetails: lang === "he" ? "חזרה" : lang === "fr" ? "Retour" : "Back",
    extrasNoteLabel: lang === "he" ? "תוספות מבוקשות" : lang === "fr" ? "Extras souhaités" : "Requested extras",
  };

  const toggleExtra = (extraId: string) => {
    setSelectedExtraIds((prev) =>
      prev.includes(extraId) ? prev.filter((id) => id !== extraId) : [...prev, extraId]
    );
  };

  const extraNotes = (() => {
    if (!extras || selectedExtraIds.length === 0) return undefined;
    const names = extras
      .filter((e) => selectedExtraIds.includes(e.id))
      .map((e) => localized(e.title, e.title_fr, e.title_he));
    return names.length > 0 ? `${t.extrasNoteLabel} : ${names.join(", ")}` : undefined;
  })();

  const leadTimeDays = boat?.lead_time_days ?? 0;
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + leadTimeDays);
    return toLocalDateStr(d);
  })();
  const maxDate = boat?.availability_end_date ? new Date(boat.availability_end_date + "T23:59:59") : undefined;

  const isDateUnavailable = (date: Date): boolean => {
    if (!boat) return false;
    const availableDays: number[] = boat.available_days ?? [1, 2, 3, 4, 5, 6, 7];
    const blockedDateStrings: string[] = boat.blocked_dates ?? [];
    const isWhitelistMode = boat.availability_mode === "whitelist";
    const whitelistedSet = new Set<string>(isWhitelistMode ? boat.whitelisted_dates ?? [] : []);
    const minDateObj = new Date(minDate + "T00:00:00");
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (d < minDateObj) return true;
    if (isWhitelistMode) return !whitelistedSet.has(toLocalDateStr(date));
    if (maxDate && d > maxDate) return true;
    if (availableDays.length < 7) {
      const availableJsDays = availableDays.map((n) => (n === 7 ? 0 : n));
      if (!availableJsDays.includes(date.getDay())) return true;
    }
    return blockedDateStrings.includes(toLocalDateStr(date));
  };

  const handleReserveClick = () => setRequestStarted(true);

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

  // Ramène à l'écran détail sans fermer la pop-up — seul le bouton X (ci-dessus) ferme tout.
  const backButton = requestStarted && (
    <button
      type="button"
      onClick={() => setRequestStarted(false)}
      className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md hover:bg-white transition-colors"
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="sr-only">{t.backToDetails}</span>
    </button>
  );

  const body = isLoading || !boat ? (
    <div className="p-6 space-y-4">
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  ) : requestStarted ? (
    <div key="request" className="pb-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Rappel du bateau — le visiteur ne voit plus les photos/infos une fois sur cet écran */}
      <div className="flex items-center gap-3 px-4 sm:px-6 pt-14 pb-4 border-b">
        {photos[0] && (
          <img
            src={resizedImageUrl(photos[0], 100) || photos[0]}
            alt={title}
            className="h-14 w-14 rounded-xl object-cover shrink-0"
          />
        )}
        <div className="min-w-0">
          <h2 className="font-serif text-lg font-bold text-foreground truncate">{title}</h2>
          {extraNotes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{extraNotes}</p>}
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-5">
        <StandaloneRequestPanel
          experienceId={boat.id}
          lang={lang as "en" | "fr" | "he"}
          minParty={boat.min_party}
          maxParty={boat.max_party}
          minDate={minDate}
          maxDate={maxDate}
          isDateUnavailable={isDateUnavailable}
          experienceTitle={title}
          usePartyRanges
          started
          onStartedChange={setRequestStarted}
          extraNotes={extraNotes}
        />
      </div>
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

        {/* Extras — ajoutables à la demande (informatif, pas de paiement ici) */}
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
          </div>
        )}

      </div>
    </div>
  );

  const priceBar = !isLoading && boat && !requestStarted && (
    <div className="shrink-0 border-t bg-background px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
      <div>
        <p className="text-xs text-muted-foreground">{t.fromLabel}</p>
        <p className="text-lg font-bold text-foreground">
          {Math.round(boat.base_price).toLocaleString('fr-FR')} {boat.currency}
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

  if (isMobile) {
    return (
      <Sheet open={!!boatId} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" hideCloseButton className="h-[92vh] rounded-t-2xl p-0 flex flex-col overflow-hidden">
          <VisuallyHidden.Root><SheetTitle>{title || "Bateau"}</SheetTitle></VisuallyHidden.Root>
          <div ref={scrollContainerRef} className="relative flex-1 min-h-0 overflow-y-auto">
            {backButton}
            {closeButton}
            {body}
          </div>
          {priceBar}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={!!boatId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent hideCloseButton className="max-w-3xl max-h-[90vh] rounded-2xl p-0 flex flex-col overflow-hidden">
        <VisuallyHidden.Root><DialogTitle>{title || "Bateau"}</DialogTitle></VisuallyHidden.Root>
        <div ref={scrollContainerRef} className="relative flex-1 min-h-0 overflow-y-auto">
          {backButton}
          {closeButton}
          {body}
        </div>
        {priceBar}
      </DialogContent>
    </Dialog>
  );
};

export default BoatDetailModal;
