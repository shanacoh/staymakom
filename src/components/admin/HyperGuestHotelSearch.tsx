/**
 * HyperGuestHotelSearch — Select avec liste préchargée (Israël) + recherche
 * Liste chargée au montage, filtre par nom / ville / région dans le popover
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getAllHotels,
  getPropertyDetails,
  extractHotelImages,
  getHotelMainImage,
  type HyperGuestHotel,
} from "@/services/hyperguest";
import { Hotel } from "@/models/hyperguest";
import { Loader2, Search, Building2, MapPin, Star, Check, ChevronDown, Image } from "lucide-react";
import { cn } from "@/lib/utils";

/** Résumé capacité d'une chambre (property-static) */
export interface RoomCapacitySummary {
  name: string;
  maxAdultsNumber?: number;
  maxChildrenNumber?: number;
  maxOccupancy?: number;
  roomSize?: number | null;
  numberOfBeds?: number;
  numberOfBedrooms?: number;
  beddingSummary?: string;
}

/** Règle d'annulation (percent ou montant) */
export interface CancellationRule {
  daysBefore?: number;
  penaltyType?: string;
  amount?: number;
  description?: string;
}

/** Équipement ou service proposé par l'hôtel (HyperGuest facilities) – sans prix */
export interface FacilityItem {
  name: string;
  category?: string;
  type?: "hotel" | "room";
  classification?: string;
}

/** Extra / taxe / frais proposé par l'hôtel (HyperGuest taxesFees) */
export interface TaxFeeExtra {
  id?: number;
  title: string;
  category?: "tax" | "fee";
  chargeType?: "percent" | "currency";
  chargeValue?: number;
  /** Devise (ex. ILS, USD) pour chargeType === "currency" */
  currency?: string;
  scope?: string;
  frequency?: string;
  /** Description lisible ex. "18% par nuit" ou "50 ILS / séjour" */
  chargeDisplay?: string;
}

export interface HyperGuestHotelWithDetails extends HyperGuestHotel {
  hotelModel?: Hotel;
  images?: string[];
  heroImage?: string | null;
  description?: string;
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  facilities?: string[];
  checkIn?: string;
  checkOut?: string;
  /** Nombre d'étoiles (liste ou property-static rating) */
  starRating?: number;
  /** Type de propriété (Hotel, Apartment, etc.) */
  propertyTypeName?: string;
  /** Capacités par chambre (max adultes, enfants, occupancy, surface, lits) */
  roomsSummary?: RoomCapacitySummary[];
  /** Politique d'annulation formatée (texte lisible) */
  cancellationPolicyText?: string;
  /** Règles d'annulation brutes pour affichage détaillé */
  cancellationPolicies?: CancellationRule[];
  /** Conditions générales / remarques (ex: animaux, âge min, taxes) */
  remarks?: string[];
  /** Séjour min/max (nombre de nuits) */
  minStay?: number | null;
  maxStay?: number | null;
  /** Nombre total de chambres (property-static settings) */
  numberOfRooms?: number | null;
  /** Texte des politiques générales (hors annulation) */
  policiesGeneral?: string[];
  /** Taxes & frais (titres depuis taxesFees, pour info) */
  taxesFeesSummary?: string[];
  /** Extras / taxes / frais détaillés (property-static taxesFees) */
  taxesFeesExtras?: TaxFeeExtra[];
  /** Équipements & services (WiFi, piscine, etc.) – property-static facilities, sans prix */
  facilitiesDetail?: FacilityItem[];
}

export interface HyperGuestHotelSearchProps {
  onSelect: (hotel: HyperGuestHotelWithDetails) => void;
  disabled?: boolean;
  fetchFullDetails?: boolean;
  placeholder?: string;
  className?: string;
}

export function HyperGuestHotelSearch({
  onSelect,
  disabled,
  fetchFullDetails = true,
  placeholder = "Search HyperGuest hotels (Israel)...",
  className,
}: HyperGuestHotelSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // for city search
  const [hotelSearchTerm, setHotelSearchTerm] = useState(""); // for hotel search
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedHotel, setSelectedHotel] = useState<HyperGuestHotel | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    data: hotels,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["hyperguest-hotels-il"],
    queryFn: () => getAllHotels("IL"),
    staleTime: 1000 * 60 * 30,
    retry: 2,
  });

  const uniqueCities = useMemo(() => {
    if (!hotels) return [];
    const cities = hotels
      .map((hotel) => hotel.cityName || hotel.city)
      .filter((city): city is string => Boolean(city));
    return Array.from(new Set(cities)).sort();
  }, [hotels]);

  const filteredHotels = useMemo(() => {
    if (!hotels) return [];
    return hotels.filter((hotel) => {
      const matchesHotelSearch = !hotelSearchTerm.trim() || (() => {
        const term = hotelSearchTerm.toLowerCase();
        return (
          hotel.name?.toLowerCase().includes(term) ||
          hotel.cityName?.toLowerCase().includes(term) ||
          hotel.city?.toLowerCase().includes(term) ||
          hotel.regionName?.toLowerCase().includes(term) ||
          hotel.countryCode?.toLowerCase().includes(term)
        );
      })();
      const matchesCity = !selectedCity ||
        hotel.cityName === selectedCity ||
        hotel.city === selectedCity;
      return matchesHotelSearch && matchesCity;
    });
  }, [hotels, hotelSearchTerm, selectedCity]);

  useEffect(() => {
    if (open) {
      setHotelSearchTerm("");
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = async (hotel: HyperGuestHotel) => {
    const hotelId = hotel.id ?? hotel.hotel_id;
    setSelectedHotel(hotel);
    setOpen(false);

    if (fetchFullDetails && hotelId) {
      setIsLoadingDetails(true);
      try {
        const hotelModel = await getPropertyDetails(hotelId);
        const raw = (hotelModel as any)?.raw ?? hotelModel;
        const images = extractHotelImages(hotelModel);
        const heroImage = getHotelMainImage(hotelModel);

        let city = hotelModel?.location?.city?.name ?? raw?.location?.city?.name ?? "";
        let region = hotelModel?.location?.region ?? raw?.location?.region ?? "";
        if (city && region && city.toLowerCase() === region.toLowerCase()) {
          region = "";
        }
        if (!city) city = hotel.cityName || hotel.city || "";
        if (!region) {
          region = hotel.regionName || hotel.region || "";
          if (region.toLowerCase() === city.toLowerCase()) region = "";
        }

        const fullAddress =
          hotelModel?.location?.fullAddress ??
          hotelModel?.location?.address ??
          raw?.location?.fullAddress ??
          raw?.location?.address ??
          hotel.address ??
          "";

        const rooms = raw?.rooms ?? hotelModel?.rooms ?? [];
        const roomsSummary: HyperGuestHotelWithDetails["roomsSummary"] = Array.isArray(rooms)
          ? rooms.map((room: any) => {
              const s = room.settings ?? room;
              const beds = room.beds ?? s?.beddingConfigurations ?? [];
              const beddingSummary = Array.isArray(beds)
                ? beds.map((b: any) => `${b.quantity ?? 1}× ${b.type ?? b.size ?? "Bed"}`).join(", ")
                : undefined;
              return {
                name: room.name ?? s?.name ?? "",
                maxAdultsNumber: s?.maxAdultsNumber ?? s?.adultsNumber ?? room.maxAdultsNumber,
                maxChildrenNumber: s?.maxChildrenNumber ?? s?.childrenNumber ?? room.maxChildrenNumber,
                maxOccupancy: s?.maxOccupancy ?? room.maxOccupancy,
                roomSize: s?.roomSize ?? room.roomSize ?? undefined,
                numberOfBeds: s?.numberOfBeds ?? room.numberOfBeds,
                numberOfBedrooms: s?.numberOfBedrooms ?? room.numberOfBedrooms,
                beddingSummary,
              };
            })
          : undefined;

        const policies = raw?.policies ?? hotelModel?.policies;
        const policiesArr = Array.isArray(policies) ? policies : (policies?.all ?? []);
        const cancellationPolicy = !Array.isArray(policies)
          ? policies?.cancellation
          : policiesArr.find((p: any) => p.type === "cancellation" || p.type === "Cancellation");
        const cancellationPolicies: CancellationRule[] = [];
        let cancellationPolicyText: string | undefined;
        if (cancellationPolicy) {
          const rules =
            cancellationPolicy.rules ??
            cancellationPolicy.rule ??
            (cancellationPolicy.daysBefore != null ? [cancellationPolicy] : []);
          const ruleList = Array.isArray(rules) ? rules : [rules];
          ruleList.forEach((r: any) => {
            cancellationPolicies.push({
              daysBefore: r.daysBefore ?? r.days,
              penaltyType: r.penaltyType ?? r.type,
              amount: r.amount ?? r.value,
              description:
                r.description ??
                (r.penaltyType === "percent" && r.amount != null
                  ? `${r.amount}%`
                  : r.amount != null
                    ? `${r.amount}`
                    : undefined),
            });
          });
          cancellationPolicyText = cancellationPolicies
            .map(
              (r) =>
                `${r.daysBefore != null ? `J-${r.daysBefore}` : "À tout moment"}: ${r.penaltyType === "percent" ? `${r.amount}%` : `${r.amount}`}`,
            )
            .join(" • ");
        }

        const generalPolicies = Array.isArray(policies)
          ? policies.filter((p: any) => p.type !== "cancellation" && p.type !== "Cancellation")
          : (policies?.general ?? []);
        const policiesGeneral: string[] = [];
        if (Array.isArray(generalPolicies)) {
          generalPolicies.forEach((p: any) => {
            const text = p.description ?? p.text ?? p.content ?? (typeof p === "string" ? p : undefined);
            if (text) policiesGeneral.push(text);
          });
        }

        const settings = raw?.settings ?? hotelModel?.settings ?? {};
        const taxesFees = raw?.taxesFees ?? hotelModel?.taxesFees;
        const taxesFeesAll = taxesFees?.all ?? taxesFees?.taxes ?? [];
        const taxesFeesSummary = Array.isArray(taxesFeesAll)
          ? (taxesFeesAll as any[]).slice(0, 15).map((t: any) => t.title ?? t.name ?? "")
          : undefined;
        const propertyCurrency = (raw?.settings?.currency as string) ?? (settings?.currency as string) ?? "ILS";
        const taxesFeesExtras: TaxFeeExtra[] = Array.isArray(taxesFeesAll)
          ? (taxesFeesAll as any[]).slice(0, 30).map((t: any) => {
              const charge = t.charge ?? {};
              const type = charge.type ?? t.chargeType;
              const value = charge.value ?? t.chargeValue ?? t.value;
              const currency = (charge.currency ?? t.currency ?? propertyCurrency) as string;
              const parts: string[] = [];
              if (type === "percent" && value != null) parts.push(`${value}%`);
              else if (type === "currency" && value != null) parts.push(`${value} ${currency}`);
              if (t.scope) parts.push(t.scope);
              if (t.frequency) parts.push(t.frequency);
              const chargeDisplay = parts.length ? parts.join(" · ") : undefined;
              return {
                id: t.id,
                title: t.title ?? t.name ?? "",
                category: t.category === "fee" ? "fee" : "tax",
                chargeType: type,
                chargeValue: value,
                currency: type === "currency" ? currency : undefined,
                scope: t.scope,
                frequency: t.frequency,
                chargeDisplay: chargeDisplay || undefined,
              };
            })
          : [];

        const enrichedHotel: HyperGuestHotelWithDetails = {
          ...hotel,
          id: hotelId,
          hotelModel,
          images,
          heroImage,
          description:
            hotelModel?.descriptions?.general ??
            raw?.descriptions?.general ??
            (typeof raw?.descriptions?.byLanguage === "object"
              ? (Object.values(raw.descriptions.byLanguage)[0] as any)?.general
              : undefined),
          contact: hotelModel?.contact
            ? {
                email: hotelModel.contact.email || undefined,
                phone: hotelModel.contact.phone || undefined,
                website: hotelModel.contact.website || undefined,
              }
            : raw?.contact
              ? {
                  email: raw.contact.email || undefined,
                  phone: raw.contact.phone || undefined,
                  website: raw.contact.website || undefined,
                }
              : undefined,
          facilities:
            hotelModel?.facilities?.popular?.slice(0, 20).map((f: any) => f.name) ??
            (raw?.facilities?.popular ?? raw?.facilities?.all ?? []).slice(0, 20).map((f: any) => f.name ?? f) ??
            [],
          facilitiesDetail: (() => {
            const facAll =
              raw?.facilities?.all ??
              raw?.facilities?.popular ??
              hotelModel?.facilities?.all ??
              hotelModel?.facilities?.popular ??
              [];
            if (!Array.isArray(facAll)) return undefined;
            const list = (facAll as any[])
              .slice(0, 50)
              .map((f: any) => ({
                name: f.name ?? "",
                category: f.category,
                type: f.type === "room" ? "room" as const : f.type === "hotel" ? "hotel" as const : undefined,
                classification: f.classification,
              }))
              .filter((f) => f.name);
            return list.length ? list : undefined;
          })(),
          checkIn: hotelModel?.settings?.checkIn ?? settings?.checkIn,
          checkOut: hotelModel?.settings?.checkOut ?? settings?.checkOut,
          latitude: hotelModel?.coordinates?.latitude ?? raw?.coordinates?.latitude ?? hotel.latitude,
          longitude: hotelModel?.coordinates?.longitude ?? raw?.coordinates?.longitude ?? hotel.longitude,
          address: fullAddress,
          cityName: city,
          regionName: region,
          starRating: hotel.starRating ?? hotelModel?.rating ?? raw?.rating ?? undefined,
          propertyTypeName: hotel.propertyType ?? raw?.propertyTypeName ?? undefined,
          roomsSummary: roomsSummary?.length ? roomsSummary : undefined,
          cancellationPolicyText: cancellationPolicyText || undefined,
          cancellationPolicies: cancellationPolicies.length ? cancellationPolicies : undefined,
          remarks: Array.isArray(raw?.remarks) ? raw.remarks : undefined,
          minStay:
            policies?.minStay ??
            (Array.isArray(policiesArr)
              ? policiesArr.find((p: any) => p.type === "min-length-of-stay")?.value
              : null) ??
            null,
          maxStay:
            policies?.maxStay ??
            (Array.isArray(policiesArr)
              ? policiesArr.find((p: any) => p.type === "max-length-of-stay")?.value
              : null) ??
            null,
          numberOfRooms: settings?.numberOfRooms ?? raw?.numberOfRooms ?? null,
          policiesGeneral: policiesGeneral.length ? policiesGeneral : undefined,
          taxesFeesSummary: taxesFeesSummary?.length ? taxesFeesSummary : undefined,
          taxesFeesExtras: taxesFeesExtras.length ? taxesFeesExtras : undefined,
        };
        onSelect(enrichedHotel);
      } catch (err) {
        console.error("[HyperGuest] Failed to fetch hotel details:", err);
        onSelect({ ...hotel, id: hotelId });
      } finally {
        setIsLoadingDetails(false);
      }
    } else {
      onSelect({ ...hotel, id: hotelId });
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        Import from HyperGuest
      </Label>

      {/* ── City Select ──────────────────────────────────── */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">City</Label>
        <Select
          value={selectedCity || "all"}
          onValueChange={(v) => {
            setSelectedCity(v === "all" ? "" : v);
            // Reset hotel when city changes
            setSelectedHotel(null);
          }}
          disabled={disabled || isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent className="max-h-[340px] overflow-hidden">
            <div className="px-2 py-2 border-b bg-popover">
              <Input
                placeholder="Search city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="h-8 text-sm"
              />
            </div>
            <div className="max-h-[280px] overflow-y-auto">
              <SelectItem value="all">All cities ({hotels?.length || 0} hotels)</SelectItem>
              {uniqueCities
                .filter((city) => !searchTerm.trim() || city.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
            </div>
          </SelectContent>
        </Select>
      </div>

      {/* ── Hotel Select ─────────────────────────────────── */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Hotel</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled || isLoading || isLoadingDetails}
              className={cn(
                "w-full justify-between font-normal h-auto min-h-10",
                !selectedHotel && "text-muted-foreground",
              )}
            >
              <span className="truncate">
                {isLoading
                  ? "Loading hotels..."
                  : isLoadingDetails
                    ? "Loading details..."
                    : selectedHotel
                      ? selectedHotel.name
                      : "Select a hotel..."}
              </span>
              {isLoading || isLoadingDetails ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <div className="flex items-center border-b px-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search by name..."
                value={hotelSearchTerm}
                onChange={(e) => setHotelSearchTerm(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="h-9 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto p-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <p className="py-4 text-center text-sm text-destructive">Failed to load hotels. Please try again.</p>
              ) : filteredHotels.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {hotelSearchTerm.trim() ? `No hotel matching "${hotelSearchTerm}"` : selectedCity ? "No hotels in this city" : "No hotels available"}
                </p>
              ) : (
                filteredHotels.map((hotel, index) => {
                  const hotelId = hotel.id ?? hotel.hotel_id;
                  const isSelected = selectedHotel?.id === hotelId || selectedHotel?.hotel_id === hotelId;
                  return (
                    <button
                      key={hotelId ?? `hotel-${index}`}
                      type="button"
                      onClick={() => handleSelect(hotel)}
                      className={cn(
                        "w-full px-3 py-2 text-left rounded-md flex items-start gap-3 hover:bg-accent transition-colors",
                        isSelected && "bg-accent",
                      )}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {isSelected ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate text-sm">{hotel.name}</span>
                          {hotel.starRating && (
                            <span className="flex items-center gap-0.5 text-amber-500 text-xs">
                              <Star className="h-3 w-3 fill-current" />
                              {hotel.starRating}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {[hotel.cityName || hotel.city, hotel.regionName || hotel.region].filter(Boolean).join(", ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] text-muted-foreground">ID: {hotelId}</span>
                          {fetchFullDetails && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Image className="h-2.5 w-2.5" />+ details
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            {!isLoading && hotels && (
              <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                Showing {filteredHotels.length} of {hotels.length} hotels
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {error && <p className="text-xs text-red-500">Failed to load HyperGuest hotels. Please try again.</p>}
    </div>
  );
}

export default HyperGuestHotelSearch;
