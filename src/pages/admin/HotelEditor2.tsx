import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HyperGuestPhotoSelector, type HyperGuestPhoto } from "@/components/admin/HyperGuestPhotoSelector";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MapPin, Sparkles, Image as ImageIcon, Save, Star } from "lucide-react";
import { generateSlug } from "@/lib/utils";
import { Hotel2ExtrasManager } from "@/components/admin/Hotel2ExtrasManager";
import { Link } from "react-router-dom";
import HyperGuestHotelSearch from "@/components/admin/HyperGuestHotelSearch";
import type {
  HyperGuestHotelWithDetails,
  RoomCapacitySummary,
  TaxFeeExtra,
  FacilityItem,
} from "@/components/admin/HyperGuestHotelSearch";

interface HotelEditor2Props {
  hotelId?: string;
  onClose: () => void;
}

export const HotelEditor2 = ({ hotelId, onClose }: HotelEditor2Props) => {
  const queryClient = useQueryClient();
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isDownloadingImages, setIsDownloadingImages] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [_justSaved, setJustSaved] = useState(false);
  const [hyperguestId, setHyperguestId] = useState<number | null>(null);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [hyperguestPhotos, setHyperguestPhotos] = useState<HyperGuestPhoto[]>([]);
  const [selectedHGPhotos, setSelectedHGPhotos] = useState<string[]>([]);
  const [selectedHGHero, setSelectedHGHero] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    name_he: "",
    region: "",
    region_he: "",
    city: "",
    city_he: "",
    story: "",
    story_he: "",
    hero_image: "",
    photos: [] as string[],
    contact_email: "",
    contact_phone: "",
    status: "draft" as "draft" | "published" | "pending" | "archived",
    address: "",
    address_he: "",
    latitude: null as number | null,
    longitude: null as number | null,
    seo_title_en: "",
    seo_title_he: "",
    seo_title_fr: "",
    meta_description_en: "",
    meta_description_he: "",
    meta_description_fr: "",
    og_title_en: "",
    og_title_he: "",
    og_title_fr: "",
    og_description_en: "",
    og_description_he: "",
    og_description_fr: "",
    og_image: "",
    // Infos HyperGuest (import ou édition)
    star_rating: null as number | null,
    property_type: "",
    room_capacities: [] as RoomCapacitySummary[],
    cancellation_policy: "",
    extra_conditions: "",
    min_stay: null as number | null,
    max_stay: null as number | null,
    number_of_rooms: null as number | null,
    check_in_time: "",
    check_out_time: "",
    /** Extras / taxes / frais proposés par l'hôtel (HyperGuest taxesFees) */
    hyperguest_extras: [] as TaxFeeExtra[],
    /** Équipements & services (WiFi, piscine, etc. – HyperGuest facilities, sans prix) */
    hyperguest_facilities: [] as FacilityItem[],
    // Nouvelles colonnes HyperGuest
    country_code: "",
    timezone: "",
    utc_offset: null as number | null,
    contact_website: "",
    max_child_age: null as number | null,
    max_infant_age: null as number | null,
    supported_cards: [] as string[],
    cut_off: "",
    description_room: "",
    description_location: "",
    description_room_he: "",
    description_location_he: "",
  });

  const downloadHyperGuestImages = async (imageUrls: string[], heroUrl?: string | null) => {
    if (imageUrls.length === 0 && !heroUrl) return;
    setIsDownloadingImages(true);
    const uploadedUrls: string[] = [];
    let uploadedHeroUrl = "";

    try {
      const imagesToProcess = heroUrl ? [heroUrl, ...imageUrls] : imageUrls;
      for (let i = 0; i < imagesToProcess.length; i++) {
        const url = imagesToProcess[i];
        try {
          const fileExt = url.split(".").pop()?.split("?")[0] || "jpg";
          const fileName = `hyperguest-${Date.now()}-${i}.${fileExt}`;
          const { data, error } = await supabase.functions.invoke("download-image", {
            body: { imageUrl: url, bucket: "hotel-images", path: fileName },
          });
          if (error) continue;
          if (data?.publicUrl) {
            if (i === 0 && heroUrl) uploadedHeroUrl = data.publicUrl;
            else uploadedUrls.push(data.publicUrl);
          }
        } catch (err) {
          console.error(`Failed to download image ${i}:`, err);
        }
      }

      setFormData((prev) => ({
        ...prev,
        hero_image: uploadedHeroUrl || prev.hero_image,
        photos: [...prev.photos, ...uploadedUrls],
      }));

      if (uploadedHeroUrl || uploadedUrls.length > 0) {
        toast.success(`${uploadedUrls.length + (uploadedHeroUrl ? 1 : 0)} images imported successfully!`);
      }
    } catch (error) {
      console.error("Error downloading images:", error);
      toast.error("Failed to download some images");
    } finally {
      setIsDownloadingImages(false);
      setPendingImages([]);
    }
  };

  const handleHyperGuestSelect = async (hotel: HyperGuestHotelWithDetails) => {
    setHyperguestId(hotel.id as number);

    if (hotel.hotelModel?.images && hotel.hotelModel.images.length > 0) {
      const hgPhotos: HyperGuestPhoto[] = hotel.hotelModel.images.map((img: any) => ({
        url: img.large || img.uri,
        thumbnail: img.thumbnail || img.uri,
        caption: img.description || "",
      }));
      setHyperguestPhotos(hgPhotos);
      setSelectedHGPhotos([]);
      setSelectedHGHero(null);
    } else if (hotel.images && hotel.images.length > 0) {
      const hgPhotos: HyperGuestPhoto[] = hotel.images.map((url: string, i: number) => ({
        url,
        thumbnail: url.replace("_original", "_thumbnail"),
        caption: `Photo ${i + 1}`,
      }));
      setHyperguestPhotos(hgPhotos);
      setSelectedHGPhotos([]);
      setSelectedHGHero(null);
      setPendingImages(hotel.images);
    }

    const city = hotel.cityName || hotel.city || "";
    const region = hotel.regionName || hotel.region || "";
    const address = hotel.address || `${city}, ${region}, Israel`.replace(/^, |, $/g, "").replace(/, $/g, "");

    setFormData((prev) => ({
      ...prev,
      name: hotel.name || prev.name,
      region,
      city,
      latitude: hotel.latitude ?? prev.latitude,
      longitude: hotel.longitude ?? prev.longitude,
      address,
      story: hotel.description || prev.story,
      contact_email: hotel.contact?.email || prev.contact_email,
      contact_phone: hotel.contact?.phone || prev.contact_phone,
      seo_title_en: hotel.name ? `${hotel.name} | Staymakom` : prev.seo_title_en,
      meta_description_en: hotel.description?.slice(0, 155) || prev.meta_description_en,
      // Infos HyperGuest
      star_rating: hotel.starRating ?? null,
      property_type: hotel.propertyTypeName ?? "",
      room_capacities: hotel.roomsSummary ?? [],
      cancellation_policy: hotel.cancellationPolicyText ?? "",
      extra_conditions: [...(hotel.remarks ?? []), ...(hotel.policiesGeneral ?? [])].filter(Boolean).join("\n\n"),
      min_stay: hotel.minStay ?? null,
      max_stay: hotel.maxStay ?? null,
      number_of_rooms: hotel.numberOfRooms ?? null,
      check_in_time: hotel.checkIn ?? "",
      check_out_time: hotel.checkOut ?? "",
      hyperguest_extras: hotel.taxesFeesExtras ?? [],
      hyperguest_facilities: hotel.facilitiesDetail ?? [],
      // Nouvelles données HG
      country_code: hotel.hotelModel?.location?.countryCode || hotel.countryCode || prev.country_code,
      timezone: hotel.hotelModel?.settings?.timezone || prev.timezone,
      utc_offset: hotel.hotelModel?.settings?.utcOffset ?? prev.utc_offset,
      contact_website: hotel.hotelModel?.contact?.website || hotel.contact?.website || prev.contact_website,
      max_child_age: hotel.hotelModel?.settings?.maxChildAge ?? prev.max_child_age,
      max_infant_age: hotel.hotelModel?.settings?.maxInfantAge ?? prev.max_infant_age,
      supported_cards: hotel.hotelModel?.policies?.supportedCards?.result?.Card || prev.supported_cards,
      cut_off: hotel.hotelModel?.settings?.cutOff || prev.cut_off,
      description_room: hotel.hotelModel?.descriptions?.room || prev.description_room,
      description_location: hotel.hotelModel?.descriptions?.location || prev.description_location,
    }));

    const hotelName = hotel.name || "";
    const story = hotel.description || "";
    const roomDesc = hotel.hotelModel?.descriptions?.room || "";
    const locationDesc = hotel.hotelModel?.descriptions?.location || "";
    const textsToTranslate = [hotelName, city, region, address, story, roomDesc, locationDesc].filter(Boolean);

    if (textsToTranslate.length > 0) {
      setIsTranslating(true);
      try {
        const { data, error } = await supabase.functions.invoke("translate-text", {
          body: { texts: textsToTranslate, targetLang: "he" },
        });

        if (!error && data?.translations) {
          const translations = data.translations as string[];
          let idx = 0;
          const nameHe = hotelName ? translations[idx++] : "";
          const cityHe = city ? translations[idx++] : "";
          const regionHe = region ? translations[idx++] : "";
          const addressHe = address ? translations[idx++] : "";
          const storyHe = story ? translations[idx++] : "";
          const descRoomHe = roomDesc ? translations[idx++] : "";
          const descLocationHe = locationDesc ? translations[idx++] : "";

          setFormData((prev) => ({
            ...prev,
            name_he: nameHe || prev.name_he,
            city_he: cityHe || prev.city_he,
            region_he: regionHe || prev.region_he,
            address_he: addressHe || prev.address_he,
            story_he: storyHe || prev.story_he,
            description_room_he: descRoomHe || prev.description_room_he,
            description_location_he: descLocationHe || prev.description_location_he,
          }));
        }
      } catch (err) {
        console.error("[HotelEditor2] Translation error:", err);
        toast.error("Translation failed", { description: "Hebrew fields could not be auto-translated." });
      } finally {
        setIsTranslating(false);
      }
    }

    const imageCount = hotel.images?.length || 0;
    toast.success(`Hotel "${hotel.name}" imported from HyperGuest!`, {
      description:
        imageCount > 0
          ? `Form pre-filled with Hebrew translations. ${imageCount} images available to import.`
          : "Form pre-filled with Hebrew translations. You can edit before saving.",
    });
  };

  const { data: hotel, isLoading } = useQuery({
    queryKey: ["hotel2", hotelId],
    queryFn: async () => {
      if (!hotelId) return null;
      const { data, error } = await supabase.from("hotels2").select("*").eq("id", hotelId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!hotelId,
  });

  useEffect(() => {
    if (hotel) {
      const h = hotel as Record<string, unknown>;
      setFormData({
        name: (h.name as string) || "",
        name_he: (h.name_he as string) || "",
        region: (h.region as string) || "",
        region_he: (h.region_he as string) || "",
        city: (h.city as string) || "",
        city_he: (h.city_he as string) || "",
        story: (h.story as string) || "",
        story_he: (h.story_he as string) || "",
        hero_image: (h.hero_image as string) || "",
        photos: (h.photos as string[]) || [],
        contact_email: (h.contact_email as string) || "",
        contact_phone: (h.contact_phone as string) || "",
        status: (h.status as "draft" | "published") || "draft",
        address: (h.address as string) || "",
        address_he: (h.address_he as string) || "",
        latitude: (h.latitude as number) || null,
        longitude: (h.longitude as number) || null,
        seo_title_en: (h.seo_title_en as string) || "",
        seo_title_he: (h.seo_title_he as string) || "",
        seo_title_fr: (h.seo_title_fr as string) || "",
        meta_description_en: (h.meta_description_en as string) || "",
        meta_description_he: (h.meta_description_he as string) || "",
        meta_description_fr: (h.meta_description_fr as string) || "",
        og_title_en: (h.og_title_en as string) || "",
        og_title_he: (h.og_title_he as string) || "",
        og_title_fr: (h.og_title_fr as string) || "",
        og_description_en: (h.og_description_en as string) || "",
        og_description_he: (h.og_description_he as string) || "",
        og_description_fr: (h.og_description_fr as string) || "",
        og_image: (h.og_image as string) || "",
        star_rating: (h.star_rating as number) ?? null,
        property_type: (h.property_type as string) ?? "",
        room_capacities: Array.isArray(h.room_capacities) ? (h.room_capacities as RoomCapacitySummary[]) : [],
        cancellation_policy: (h.cancellation_policy as string) ?? "",
        extra_conditions: (h.extra_conditions as string) ?? "",
        min_stay: (h.min_stay as number) ?? null,
        max_stay: (h.max_stay as number) ?? null,
        number_of_rooms: (h.number_of_rooms as number) ?? null,
        check_in_time: (h.check_in_time as string) ?? "",
        check_out_time: (h.check_out_time as string) ?? "",
        hyperguest_extras: Array.isArray(h.hyperguest_extras) ? (h.hyperguest_extras as TaxFeeExtra[]) : [],
        hyperguest_facilities: Array.isArray(h.hyperguest_facilities)
          ? (h.hyperguest_facilities as FacilityItem[])
          : [],
        // Nouveaux champs
        country_code: (h.country_code as string) ?? "",
        timezone: (h.timezone as string) ?? "",
        utc_offset: (h.utc_offset as number) ?? null,
        contact_website: (h.contact_website as string) ?? "",
        max_child_age: (h.max_child_age as number) ?? null,
        max_infant_age: (h.max_infant_age as number) ?? null,
        supported_cards: Array.isArray(h.supported_cards) ? (h.supported_cards as string[]) : [],
        cut_off: (h.cut_off as string) ?? "",
        description_room: (h.description_room as string) ?? "",
        description_location: (h.description_location as string) ?? "",
        description_room_he: (h.description_room_he as string) ?? "",
        description_location_he: (h.description_location_he as string) ?? "",
      });

      // Restore hyperguestId from existing hotel data
      if (h.hyperguest_property_id) {
        setHyperguestId(Number(h.hyperguest_property_id));
      }
    }
  }, [hotel]);

  const handleGeocode = async () => {
    const addressToGeocode = formData.address || `${formData.name}, ${formData.city}, ${formData.region}`;
    if (!addressToGeocode.trim()) {
      toast.error("Please enter an address or hotel name/city/region first");
      return;
    }
    setIsGeocoding(true);
    try {
      const { data, error } = await supabase.functions.invoke("geocode-hotel", {
        body: { address: addressToGeocode },
      });
      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setFormData({
        ...formData,
        latitude: data.latitude,
        longitude: data.longitude,
        address: formData.address || data.displayName,
      });
      toast.success(`Location found: ${data.displayName}`);
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Failed to find location. Try a more specific address.");
    } finally {
      setIsGeocoding(false);
    }
  };

  // ==========================================================================
  // SAVE MUTATION (avec debug logging)
  // ==========================================================================
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const dataWithSlug = {
        ...data,
        slug: hotelId ? (hotel as { slug?: string })?.slug : generateSlug(data.name),
        hyperguest_property_id: hyperguestId
          ? String(hyperguestId)
          : (hotelId ? (hotel as any)?.hyperguest_property_id ?? null : null),
        hyperguest_imported_at: hyperguestId
          ? new Date().toISOString()
          : (hotelId ? (hotel as any)?.hyperguest_imported_at ?? null : null),
        star_rating: data.star_rating,
        property_type: data.property_type || null,
        room_capacities: data.room_capacities?.length ? (data.room_capacities as unknown as Json) : null,
        cancellation_policy: data.cancellation_policy || null,
        extra_conditions: data.extra_conditions || null,
        min_stay: data.min_stay,
        max_stay: data.max_stay,
        number_of_rooms: data.number_of_rooms,
        check_in_time: data.check_in_time || null,
        check_out_time: data.check_out_time || null,
        hyperguest_extras: data.hyperguest_extras?.length ? (data.hyperguest_extras as unknown as Json) : null,
        hyperguest_facilities: data.hyperguest_facilities?.length
          ? (data.hyperguest_facilities as unknown as Json)
          : null,
        // Nouveaux champs
        country_code: data.country_code || null,
        timezone: data.timezone || null,
        utc_offset: data.utc_offset,
        contact_website: data.contact_website || null,
        max_child_age: data.max_child_age,
        max_infant_age: data.max_infant_age,
        supported_cards: data.supported_cards?.length ? (data.supported_cards as unknown as Json) : null,
        cut_off: data.cut_off || null,
        description_room: data.description_room || null,
        description_location: data.description_location || null,
        description_room_he: data.description_room_he || null,
        description_location_he: data.description_location_he || null,
      };

      // ======== DEBUG START ========
      console.log("[DEBUG SAVE] hotelId:", hotelId);
      console.log("[DEBUG SAVE] isUpdate:", !!hotelId);
      console.log("[DEBUG SAVE] dataWithSlug keys:", Object.keys(dataWithSlug));
      console.log("[DEBUG SAVE] dataWithSlug keys count:", Object.keys(dataWithSlug).length);
      console.log("[DEBUG SAVE] full payload:", JSON.stringify(dataWithSlug, null, 2));
      console.log("[DEBUG SAVE] Types check:", {
        star_rating: typeof dataWithSlug.star_rating,
        star_rating_val: dataWithSlug.star_rating,
        min_stay: typeof dataWithSlug.min_stay,
        min_stay_val: dataWithSlug.min_stay,
        max_stay: typeof dataWithSlug.max_stay,
        max_stay_val: dataWithSlug.max_stay,
        number_of_rooms: typeof dataWithSlug.number_of_rooms,
        number_of_rooms_val: dataWithSlug.number_of_rooms,
        room_capacities: typeof dataWithSlug.room_capacities,
        room_capacities_isNull: dataWithSlug.room_capacities === null,
        hyperguest_extras: typeof dataWithSlug.hyperguest_extras,
        hyperguest_extras_isNull: dataWithSlug.hyperguest_extras === null,
        hyperguest_facilities: typeof dataWithSlug.hyperguest_facilities,
        hyperguest_facilities_isNull: dataWithSlug.hyperguest_facilities === null,
      });
      // ======== DEBUG END ========

      if (hotelId) {
        console.log("[DEBUG SAVE] Calling supabase.from('hotels2').update()...");
        const { error } = await supabase.from("hotels2").update(dataWithSlug).eq("id", hotelId);
        if (error) {
          console.error("[DEBUG SAVE] UPDATE error:", JSON.stringify(error, null, 2));
          throw error;
        }
        console.log("[DEBUG SAVE] UPDATE success!");
      } else {
        console.log("[DEBUG SAVE] Calling supabase.from('hotels2').insert()...");
        const { error } = await supabase.from("hotels2").insert([dataWithSlug]);
        if (error) {
          console.error("[DEBUG SAVE] INSERT error:", JSON.stringify(error, null, 2));
          throw error;
        }
        console.log("[DEBUG SAVE] INSERT success!");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hotels2"] });
      toast.success(hotelId ? "Hotel updated" : "Hotel created");
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
      if (!hotelId) onClose();
    },
    onError: (error: any) => {
      toast.error("Error saving hotel: " + (error?.message || "Unknown error"));
      console.error("[DEBUG SAVE] ===== FULL ERROR =====");
      console.error("[DEBUG SAVE] error object:", error);
      console.error("[DEBUG SAVE] error.message:", error?.message);
      console.error("[DEBUG SAVE] error.details:", error?.details);
      console.error("[DEBUG SAVE] error.hint:", error?.hint);
      console.error("[DEBUG SAVE] error.code:", error?.code);
      console.error("[DEBUG SAVE] error.statusCode:", error?.statusCode);
      console.error("[DEBUG SAVE] JSON:", JSON.stringify(error, null, 2));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[DEBUG SAVE] handleSubmit triggered, formData:", formData);
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/hotels2">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Hotels 2
            </Button>
          </Link>
          <h2 className="text-3xl font-bold">{hotelId ? "Edit Hotel" : "New Hotel"}</h2>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData(prev => ({ ...prev, status: "draft" }));
              saveMutation.mutate({ ...formData, status: "draft" });
            }}
            disabled={saveMutation.isPending || !formData.name}
          >
            {saveMutation.isPending && formData.status === "draft" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Draft
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (!hyperguestId) {
                toast.warning("This hotel has no HyperGuest connection. Experiences linked to it won't support online booking.");
              }
              setFormData(prev => ({ ...prev, status: "published" }));
              saveMutation.mutate({ ...formData, status: "published" });
            }}
            disabled={saveMutation.isPending || !formData.name}
          >
            {saveMutation.isPending && formData.status === "published" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Publish
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ══════════════════════════════════════════════════════════
            1. IMPORT RAPIDE
        ══════════════════════════════════════════════════════════ */}
        {!hotelId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Import rapide
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Recherchez et importez un hôtel depuis HyperGuest pour pré-remplir le formulaire.
              </p>
            </CardHeader>
            <CardContent>
              <HyperGuestHotelSearch onSelect={handleHyperGuestSelect} fetchFullDetails={true} />
              {hyperguestId ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full text-green-700 font-medium">
                    ✓ Connected to HyperGuest (ID: {hyperguestId})
                  </span>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 text-sm text-orange-600">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full text-orange-700 font-medium">
                    ⚠ No HyperGuest connection — online booking will be unavailable
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════
            2. IDENTITÉ DE L'HÔTEL
        ══════════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader>
            <CardTitle>Identité de l'hôtel</CardTitle>
            <p className="text-sm text-muted-foreground">Nom, région, ville et description bilingues.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Colonne EN */}
              <div className="space-y-4">
                <div className="bg-muted/30 p-2 rounded">
                  <h4 className="font-medium text-sm">English Version</h4>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Hotel Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="story">Story</Label>
                  <Textarea
                    id="story"
                    value={formData.story}
                    onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                    rows={6}
                  />
                </div>
              </div>

              {/* Colonne HE */}
              <div className="space-y-4">
                <div className="bg-muted/30 p-2 rounded">
                  <h4 className="font-medium text-sm">Hebrew Version (עברית)</h4>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_he">שם המלון</Label>
                  <div className="relative">
                    <Input
                      id="name_he"
                      value={formData.name_he}
                      onChange={(e) => setFormData({ ...formData, name_he: e.target.value })}
                      dir="rtl"
                      className="bg-hebrew-input"
                      disabled={isTranslating}
                    />
                    {isTranslating && (
                      <div className="absolute inset-0 flex items-center justify-center bg-hebrew-input/80 rounded-md">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region_he">אזור</Label>
                  <Input
                    id="region_he"
                    value={formData.region_he}
                    onChange={(e) => setFormData({ ...formData, region_he: e.target.value })}
                    dir="rtl"
                    className="bg-hebrew-input"
                    disabled={isTranslating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city_he">עיר</Label>
                  <Input
                    id="city_he"
                    value={formData.city_he}
                    onChange={(e) => setFormData({ ...formData, city_he: e.target.value })}
                    dir="rtl"
                    className="bg-hebrew-input"
                    disabled={isTranslating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="story_he">סיפור</Label>
                  <Textarea
                    id="story_he"
                    value={formData.story_he}
                    onChange={(e) => setFormData({ ...formData, story_he: e.target.value })}
                    rows={6}
                    dir="rtl"
                    className="bg-hebrew-input"
                    disabled={isTranslating}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════════════════
            3. PHOTOS
        ══════════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Photos
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Sélectionnez des photos depuis HyperGuest ou ajoutez vos propres images.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sous-section : Sélection depuis HyperGuest */}
            {hyperguestPhotos.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm border-b pb-2">
                  Sélection depuis HyperGuest ({hyperguestPhotos.length} disponibles)
                </h4>
                <HyperGuestPhotoSelector
                  photos={hyperguestPhotos}
                  selectedPhotos={selectedHGPhotos}
                  heroImage={selectedHGHero}
                  onSelectionChange={setSelectedHGPhotos}
                  onHeroChange={setSelectedHGHero}
                  isLoading={isDownloadingImages}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isDownloadingImages || selectedHGPhotos.length === 0}
                    onClick={() => {
                      const hero = selectedHGHero && selectedHGPhotos.includes(selectedHGHero) ? selectedHGHero : null;
                      const gallery = selectedHGPhotos.filter((u) => u !== hero);
                      downloadHyperGuestImages(gallery, hero);
                    }}
                  >
                    {isDownloadingImages ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Import de {selectedHGPhotos.length} photos...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Enregistrer la sélection ({selectedHGPhotos.length})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Sous-section : Photos de l'hôtel */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm border-b pb-2">Photos de l'hôtel</h4>

              <div className="space-y-2">
                <ImageUpload
                  label="Photo de couverture"
                  bucket="hotel-images"
                  value={formData.hero_image}
                  onChange={(url) => setFormData({ ...formData, hero_image: url })}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Galerie</Label>
                  <span className="text-sm text-muted-foreground">{formData.photos.length} image(s)</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative group aspect-video rounded-lg overflow-hidden border bg-muted">
                      <img src={photo} alt={`Galerie ${index + 1}`} className="w-full h-full object-cover" />
                      {formData.hero_image === photo && (
                        <div className="absolute top-2 left-2 bg-amber-500 text-white rounded-full p-1">
                          <Star className="h-3 w-3 fill-current" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {formData.hero_image !== photo && (
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="h-7 w-7"
                            title="Définir comme couverture"
                            onClick={() => setFormData({ ...formData, hero_image: photo })}
                          >
                            <Star className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            const newPhotos = formData.photos.filter((_, i) => i !== index);
                            setFormData({ ...formData, photos: newPhotos });
                          }}
                        >
                          <span className="text-xs">×</span>
                        </Button>
                      </div>
                    </div>
                  ))}

                  {formData.photos.length < 50 && (
                    <button
                      type="button"
                      className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.multiple = true;
                        input.accept = "image/*";
                        input.onchange = async (e) => {
                          const files = Array.from((e.target as HTMLInputElement).files || []);
                          toast.promise(
                            Promise.all(
                              files.map(async (file) => {
                                const fileExt = file.name.split(".").pop();
                                const fileName = `${Math.random()}.${fileExt}`;
                                const { error: uploadError } = await supabase.storage
                                  .from("hotel-images")
                                  .upload(fileName, file);
                                if (uploadError) throw uploadError;
                                const { data: { publicUrl } } = supabase.storage
                                  .from("hotel-images")
                                  .getPublicUrl(fileName);
                                return publicUrl;
                              }),
                            ).then((urls) => {
                              setFormData({ ...formData, photos: [...formData.photos, ...urls] });
                            }),
                            {
                              loading: `Upload de ${files.length} image(s)...`,
                              success: `${files.length} image(s) ajoutée(s) !`,
                              error: "Échec de l'upload",
                            },
                          );
                        };
                        input.click();
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-2xl">+</span>
                      </div>
                      <span className="text-sm font-medium">Ajouter des photos</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════════════════
            4. LOCALISATION & CONTACT
        ══════════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Localisation & contact
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Adresse, coordonnées GPS et informations de contact.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Adresse (English)</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g., 123 Hotel Street, Ayyelet HaShahar, Israel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_he">כתובת (עברית)</Label>
                <div className="relative">
                  <Input
                    id="address_he"
                    value={formData.address_he}
                    onChange={(e) => setFormData({ ...formData, address_he: e.target.value })}
                    placeholder="כתובת בעברית"
                    dir="rtl"
                    className="bg-hebrew-input"
                    disabled={isTranslating}
                  />
                  {isTranslating && (
                    <div className="absolute inset-0 flex items-center justify-center bg-hebrew-input/80 rounded-md">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : null })
                  }
                  placeholder="e.g., 33.0742"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : null })
                  }
                  placeholder="e.g., 35.5585"
                />
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeocode}
                  disabled={isGeocoding}
                  className="w-full"
                >
                  {isGeocoding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Détection...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Auto-detect coordonnées
                    </>
                  )}
                </Button>
              </div>
            </div>

            {formData.latitude && formData.longitude && (
              <p className="text-sm text-green-600">
                ✓ Coordonnées : {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email de contact</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Téléphone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════════════════
            5. CARACTÉRISTIQUES
        ══════════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader>
            <CardTitle>Caractéristiques</CardTitle>
            <p className="text-sm text-muted-foreground">
              Étoiles, type de propriété, capacité et horaires.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Étoiles</Label>
                <Select
                  value={formData.star_rating != null ? String(formData.star_rating) : ""}
                  onValueChange={(v) =>
                    setFormData({ ...formData, star_rating: v === "" ? null : parseInt(v, 10) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n === 0 ? "0 (non classé)" : "★ ".repeat(n)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type de propriété</Label>
                <Input
                  value={formData.property_type}
                  onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                  placeholder="Hotel, Apartment…"
                />
              </div>

              <div className="space-y-2">
                <Label>Nombre de chambres</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.number_of_rooms ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      number_of_rooms: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                  placeholder="—"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Check-in</Label>
                  <Input
                    value={formData.check_in_time}
                    onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                    placeholder="14:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check-out</Label>
                  <Input
                    value={formData.check_out_time}
                    onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                    placeholder="12:00"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nuits min.</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.min_stay ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, min_stay: e.target.value ? parseInt(e.target.value, 10) : null })
                  }
                  placeholder="—"
                />
              </div>
              <div className="space-y-2">
                <Label>Nuits max.</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.max_stay ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, max_stay: e.target.value ? parseInt(e.target.value, 10) : null })
                  }
                  placeholder="—"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════════════════
            6. CHAMBRES & CAPACITÉS
        ══════════════════════════════════════════════════════════ */}
        {formData.room_capacities && formData.room_capacities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Chambres & capacités</CardTitle>
              <p className="text-sm text-muted-foreground">
                Capacités par type de chambre importées depuis HyperGuest (lecture seule).
              </p>
            </CardHeader>
            <CardContent>
              <ul className="rounded-lg border divide-y text-sm">
                {formData.room_capacities.map((room, i) => (
                  <li key={i} className="p-3 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="font-medium">{room.name}</span>
                    <span className="text-muted-foreground">
                      {[
                        room.maxAdultsNumber != null && `${room.maxAdultsNumber} adultes`,
                        room.maxChildrenNumber != null && `${room.maxChildrenNumber} enfants`,
                        room.maxOccupancy != null && `max ${room.maxOccupancy} pers.`,
                        room.roomSize != null && `${room.roomSize} m²`,
                        room.beddingSummary,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════
            7. ÉQUIPEMENTS & SERVICES
        ══════════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader>
            <CardTitle>Équipements & services</CardTitle>
            <p className="text-sm text-muted-foreground">
              Tout ce que l'hôtel propose, classé par catégorie – sans prix.
            </p>
          </CardHeader>
          <CardContent>
            {formData.hyperguest_facilities && formData.hyperguest_facilities.length > 0 ? (
              (() => {
                const bySection = formData.hyperguest_facilities.reduce(
                  (acc, fac) => {
                    const section =
                      fac.classification === "Service"
                        ? "Services"
                        : (fac.category && fac.category.trim()) || "Autres";
                    if (!acc[section]) acc[section] = [];
                    acc[section].push(fac);
                    return acc;
                  },
                  {} as Record<string, FacilityItem[]>,
                );

                const sectionOrder = [
                  "Services",
                  "Pool",
                  "Spa",
                  "Food & Beverage",
                  "Internet",
                  "Reception",
                  "Wellness",
                  "Parking",
                  "Room Amenities",
                  "Autres",
                ];
                const otherSections = Object.keys(bySection)
                  .filter((s) => !sectionOrder.includes(s))
                  .sort((a, b) => a.localeCompare(b));
                const sections = [...sectionOrder.filter((s) => bySection[s]?.length), ...otherSections];

                return (
                  <div className="space-y-4">
                    {sections.map((sectionName) => (
                      <div key={sectionName} className="space-y-2">
                        <span className="text-sm font-medium text-foreground">{sectionName}</span>
                        <div className="flex flex-wrap gap-2">
                          {bySection[sectionName].map((fac, i) => (
                            <span
                              key={fac.name + String(i)}
                              className={
                                sectionName === "Services"
                                  ? "inline-flex items-center rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium"
                                  : "inline-flex items-center rounded-md border bg-muted/50 px-2.5 py-1 text-xs font-medium"
                              }
                            >
                              {fac.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            ) : (
              <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-3 bg-muted/30">
                Aucun équipement importé. Importez un hôtel depuis HyperGuest pour remplir cette liste.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════════════════
            8. CONDITIONS & TARIFICATION
        ══════════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader>
            <CardTitle>Conditions & tarification</CardTitle>
            <p className="text-sm text-muted-foreground">
              Politique d'annulation, conditions générales et taxes/frais.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Politique d&apos;annulation</Label>
              <Textarea
                value={formData.cancellation_policy}
                onChange={(e) => setFormData({ ...formData, cancellation_policy: e.target.value })}
                placeholder="Ex: J-2: 100% • À tout moment: 100%"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Conditions</Label>
              <Textarea
                value={formData.extra_conditions}
                onChange={(e) => setFormData({ ...formData, extra_conditions: e.target.value })}
                placeholder="Remarques, taxes, âge min, animaux…"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Taxes & frais</Label>
              <p className="text-xs text-muted-foreground">
                Taxes et frais avec montants – en lecture seule. Appliqués au moment du checkout.
              </p>
              {formData.hyperguest_extras && formData.hyperguest_extras.length > 0 ? (
                <ul className="rounded-lg border divide-y text-sm">
                  {formData.hyperguest_extras.map((extra, i) => (
                    <li key={extra.id ?? i} className="p-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="font-medium">{extra.title}</span>
                      <span className="capitalize text-muted-foreground">
                        {extra.category === "fee" ? "Frais" : "Taxe"}
                      </span>
                      {(extra.chargeValue != null || extra.chargeDisplay) && (
                        <span className="font-medium text-primary">
                          {extra.chargeDisplay ??
                            (extra.chargeType === "percent"
                              ? `${extra.chargeValue}%`
                              : extra.currency
                                ? `${extra.chargeValue} ${extra.currency}`
                                : String(extra.chargeValue))}
                        </span>
                      )}
                      {(extra.scope || extra.frequency) && (
                        <span className="text-xs text-muted-foreground">
                          {[extra.scope, extra.frequency].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4 bg-muted/30">
                  Aucune taxe ni frais importés. Importez un hôtel depuis HyperGuest pour remplir cette liste.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════════════════
            SEO CONFIGURATION
        ══════════════════════════════════════════════════════════ */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle>SEO Configuration</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure SEO metadata for search engines and social media sharing
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="bg-background p-2 rounded">
                  <h4 className="font-medium text-sm">English SEO</h4>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_title_en">SEO Title</Label>
                  <Input
                    id="seo_title_en"
                    value={formData.seo_title_en}
                    onChange={(e) => setFormData({ ...formData, seo_title_en: e.target.value })}
                    placeholder="Displayed in browser tab and Google results"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_description_en">Meta Description</Label>
                  <Textarea
                    id="meta_description_en"
                    value={formData.meta_description_en}
                    onChange={(e) => setFormData({ ...formData, meta_description_en: e.target.value })}
                    placeholder="Shown in Google search results"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-background p-2 rounded">
                  <h4 className="font-medium text-sm">Hebrew SEO (עברית)</h4>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_title_he">כותרת SEO</Label>
                  <Input
                    id="seo_title_he"
                    value={formData.seo_title_he}
                    onChange={(e) => setFormData({ ...formData, seo_title_he: e.target.value })}
                    placeholder="כותרת עבור גוגל וכרטיסייה"
                    dir="rtl"
                    className="bg-hebrew-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_description_he">תיאור Meta</Label>
                  <Textarea
                    id="meta_description_he"
                    value={formData.meta_description_he}
                    onChange={(e) => setFormData({ ...formData, meta_description_he: e.target.value })}
                    placeholder="תיאור עבור תוצאות גוגל"
                    rows={3}
                    dir="rtl"
                    className="bg-hebrew-input"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-background p-2 rounded">
                  <h4 className="font-medium text-sm">French SEO (Français)</h4>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_title_fr">Titre SEO</Label>
                  <Input
                    id="seo_title_fr"
                    value={formData.seo_title_fr}
                    onChange={(e) => setFormData({ ...formData, seo_title_fr: e.target.value })}
                    placeholder="Titre pour Google et l'onglet"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_description_fr">Description Meta</Label>
                  <Textarea
                    id="meta_description_fr"
                    value={formData.meta_description_fr}
                    onChange={(e) => setFormData({ ...formData, meta_description_fr: e.target.value })}
                    placeholder="Description pour les résultats Google"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="og_image">Open Graph Image</Label>
              <Input
                id="og_image"
                value={formData.og_image}
                onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                placeholder="Image URL for social media sharing"
              />
            </div>
          </CardContent>
        </Card>

        {/* Hotel Extras (edit mode only) */}
        {hotelId && (
          <Card>
            <CardHeader>
              <CardTitle>Hotel Extras</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage extras that can be added to experiences at this hotel
              </p>
            </CardHeader>
            <CardContent>
              <Hotel2ExtrasManager
                hotelId={hotelId}
                hyperguestExtras={formData.hyperguest_extras}
              />
            </CardContent>
          </Card>
        )}

        {/* Boutons Save/Publish */}
        <div className="flex gap-2 justify-end pb-8">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData(prev => ({ ...prev, status: "draft" }));
              saveMutation.mutate({ ...formData, status: "draft" });
            }}
            disabled={saveMutation.isPending || !formData.name}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Draft
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (!hyperguestId) {
                toast.warning("This hotel has no HyperGuest connection. Experiences linked to it won't support online booking.");
              }
              setFormData(prev => ({ ...prev, status: "published" }));
              saveMutation.mutate({ ...formData, status: "published" });
            }}
            disabled={saveMutation.isPending || !formData.name}
          >
            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Publish
          </Button>
        </div>
      </form>
    </div>
  );
};
