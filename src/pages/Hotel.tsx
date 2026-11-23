import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { trackExperienceViewed, trackExperienceEngaged, type ProductLike } from "@/lib/analytics";
import { useSetCurrentProduct } from "@/contexts/CurrentProductContext";
import { supabase } from "@/integrations/supabase/client";
import V3Header from "@/components/V3Header";
import LaunchFooter from "@/components/LaunchFooter";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ExternalLink, Star, DoorOpen, Home, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { resizedImageUrl } from "@/lib/imageUrl";
import { buildBreadcrumbJsonLd } from "@/lib/breadcrumbJsonLd";
import { useLanguage, getLocalizedField } from "@/hooks/useLanguage";
import { trackedRegionName, useRegionLabel } from "@/lib/regionList/queries";
import { t, tPage } from "@/lib/translations";
import HotelPageSections from "@/components/hotel/HotelPageSections";
import { Skeleton } from "@/components/ui/skeleton";
import { ArchivedListingRedirect } from "@/components/ArchivedListingRedirect";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function toProductLike(hotel: any): ProductLike {
  return {
    slug: hotel?.slug ?? null,
    name: hotel?.name ?? null,
    city: hotel?.city ?? null,
    region: trackedRegionName(hotel),
    base_price: null,
    base_price_type: null,
    currency: null,
    is_bookable: null,
  };
}

const Hotel = () => {
  const { slug } = useParams<{slug: string;}>();
  const { lang, locale } = useLanguage();
  const regionLabelOf = useRegionLabel(locale);

  const { data: hotel, isLoading: hotelLoading } = useQuery({
    queryKey: ["hotel2", slug],
    queryFn: async () => {
      const { data, error } = await supabase.
      from("hotels2").
      select("*").
      eq("slug", slug!).
      eq("status", "published").
      maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!slug
  });

  // Fetch V2 experiences linked to this hotel via junction table
  const { data: experiences, isLoading: experiencesLoading } = useQuery({
    queryKey: ["hotel2-experiences", hotel?.id],
    queryFn: async () => {
      const { data: links, error: linksError } = await supabase.
      from("experience2_hotels").
      select("experience_id").
      eq("hotel_id", hotel!.id);

      if (linksError) throw linksError;
      if (!links || links.length === 0) return [];

      const ids = links.map((l: any) => l.experience_id);
      const { data, error } = await supabase.
      from("experiences2").
      select("*").
      in("id", ids).
      eq("status", "published");

      if (error) throw error;
      return data || [];
    },
    enabled: !!hotel?.id
  });

  useEffect(() => {
    if (!hotel?.slug) return;
    trackExperienceViewed(toProductLike(hotel), "hotel");
  }, [hotel?.slug]);

  // experience_engaged : à 15/30/60/120s si l'onglet est visible, avec le scroll max atteint
  useEffect(() => {
    if (!hotel?.slug) return;
    let maxScrollPercent = 0;
    const updateMaxScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.round((window.scrollY / docHeight) * 100);
      if (pct > maxScrollPercent) maxScrollPercent = pct;
    };
    window.addEventListener("scroll", updateMaxScroll, { passive: true });
    updateMaxScroll();

    const thresholds = [15, 30, 60, 120] as const;
    const timers = thresholds.map((seconds) =>
      setTimeout(() => {
        if (document.visibilityState === "visible") {
          trackExperienceEngaged(toProductLike(hotel), "hotel", seconds, maxScrollPercent);
        }
      }, seconds * 1000)
    );

    return () => {
      window.removeEventListener("scroll", updateMaxScroll);
      timers.forEach(clearTimeout);
    };
  }, [hotel?.slug]);

  useSetCurrentProduct(hotel ? toProductLike(hotel) : null, "hotel");

  if (hotelLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <V3Header />
        <div className="container pt-16 pb-6">
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-[500px] w-full" />
        <div className="container py-16">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[92%]" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>);

  }

  if (!hotel) {
    // Hôtel archivé : redirection vers sa région plutôt qu'une page vide.
    return (
      <ArchivedListingRedirect kind="hotel" slug={slug}>
        <div className="min-h-screen flex flex-col">
          <V3Header />
          <main className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">{tPage('hotelNotFound')}</p>
          </main>
          <LaunchFooter />
        </div>
      </ArchivedListingRedirect>);

  }

  const hotelName = getLocalizedField(hotel, 'name', lang) as string || hotel.name;
  const city = getLocalizedField(hotel, 'city', lang) as string || hotel.city;
  const region = regionLabelOf(hotel);
  const story = getLocalizedField(hotel, 'story', lang) as string || hotel.story;
  const supportedCards = (hotel as Record<string, unknown>).supported_cards as string[] | null;

  return (
    <div className="min-h-screen flex flex-col" dir={lang === 'he' ? 'rtl' : 'ltr'}>
      <SEOHead
        titleEn={hotel.seo_title_en}
        titleHe={hotel.seo_title_he}
        descriptionEn={hotel.meta_description_en}
        descriptionHe={hotel.meta_description_he}
        ogTitleEn={hotel.og_title_en}
        ogTitleHe={hotel.og_title_he}
        ogDescriptionEn={hotel.og_description_en}
        ogDescriptionHe={hotel.og_description_he}
        ogImage={hotel.og_image || hotel.hero_image}
        fallbackTitle={`${hotelName} - ${city || ''} - Staymakom`}
        fallbackDescription={story?.substring(0, 155) || ""} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LodgingBusiness",
            "name": hotel.name,
            "image": hotel.hero_image || hotel.og_image || undefined,
            "url": `https://staymakom.com/hotel/${hotel.slug}`,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": hotel.city || undefined,
              "addressCountry": "IL"
            },
            ...(hotel.latitude && hotel.longitude && {
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": hotel.latitude,
                "longitude": hotel.longitude
              }
            })
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbJsonLd([
              { name: "Home", url: "https://staymakom.com/" },
              { name: hotelName, url: `https://staymakom.com/hotel/${hotel.slug}` },
            ])
          ),
        }}
      />

      <V3Header />

      <main className="flex-1">
        <div className="container pt-16">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">{tPage("hotelHome")}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{hotelName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <HotelPageSections
          hotel={hotel}
          lang={lang as "en" | "he" | "fr"}
          region={region}
          sidebar={
            <>
              {/* Contact Card */}
              <Card>
                

































                
              </Card>

              {/* Supported payment cards */}
              {supportedCards && Array.isArray(supportedCards) && supportedCards.length > 0 &&
              <Card>
                  <CardContent className="p-6 space-y-3">
                    <h3 className="font-sans text-sm font-bold uppercase tracking-[0.03em]">
                      {tPage("hotelAcceptedCards")}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {supportedCards.map((card, i) =>
                    <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted text-sm font-medium">
                          {card}
                        </span>
                    )}
                    </div>
                  </CardContent>
                </Card>
              }

              {/* V2 Experiences at this hotel */}
              {!experiencesLoading && experiences && experiences.length > 0 &&
              <Card>
                  <CardContent className="p-6">
                    <h3 className="font-sans text-sm font-bold uppercase tracking-[0.03em] mb-4">{tPage('experiences')}</h3>
                    <div className="space-y-3">
                      {experiences.map((exp) => {
                      const expTitle = getLocalizedField(exp, 'title', lang) as string || exp.title;
                      return (
                        <Link
                          key={exp.id}
                          to={`/experience/${exp.slug}`}
                          className="block p-3 rounded-lg hover:bg-muted transition-colors">
                          
                            <p className="font-medium">{expTitle}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {tPage('fromPrice')} ${exp.base_price}
                              {exp.base_price_type === "per_person" && ` ${tPage('perPersonLabel')}`}
                            </p>
                          </Link>);

                    })}
                    </div>
                  </CardContent>
                </Card>
              }
            </>
          }
        />
      </main>

      <LaunchFooter />
    </div>);

};

export default Hotel;