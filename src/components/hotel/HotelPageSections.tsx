// Le contenu visuel d'une page hôtel (photo, infos, récit, chambres, équipements, conditions,
// galerie, carte), partagé par la page publique /hotel/:slug et l'aperçu de l'espace partenaire.
// `sidebar` : la colonne de droite de la page publique. `slot` : ce que l'aperçu partenaire insère
// après une section (boutons « Ça me va » / « Proposer une modification »).

import type { ReactNode } from "react";
import LocationMap from "@/components/experience-test/LocationMap";
import { MapPin, Star, DoorOpen, Home, Clock, Users } from "lucide-react";
import { resizedImageUrl } from "@/lib/imageUrl";
import { getLocalizedField } from "@/hooks/useLanguage";
import { tPage } from "@/lib/translations";

export type HotelSection = "story" | "rooms" | "photos" | "practical";

interface Props {
  // Une ligne de hotels2 (ou son aperçu) : la page lit de nombreuses colonnes facultatives.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hotel: any;
  lang: "en" | "he" | "fr";
  region?: string | null;
  sidebar?: ReactNode;
  slot?: (section: HotelSection) => ReactNode;
}

export default function HotelPageSections({ hotel, lang, region, sidebar, slot }: Props) {
  const h = hotel as Record<string, unknown>;
  const hotelName = getLocalizedField(hotel, 'name', lang) as string || hotel.name;
  const city = getLocalizedField(hotel, 'city', lang) as string || hotel.city;
  const story = getLocalizedField(hotel, 'story', lang) as string || hotel.story;
  const highlights = getLocalizedField(hotel, 'highlights', lang) as string[] || hotel.highlights;
  const amenities = getLocalizedField(hotel, 'amenities', lang) as string[] || hotel.amenities;
  const address = getLocalizedField(hotel, 'address', lang) as string || hotel.address;
  const descriptionRoom = lang === "he" ? h.description_room_he as string || h.description_room as string : h.description_room as string;
  const descriptionLocation = lang === "he" ? h.description_location_he as string || h.description_location as string : h.description_location as string;

  const displayPhotos = hotel.photos && hotel.photos.length > 0 ?
  hotel.photos.slice(0, 8) :
  [];

  const infoChips = [
  hotel.star_rating && { icon: Star, label: "★".repeat(hotel.star_rating) },
  hotel.property_type && { icon: Home, label: hotel.property_type },
  hotel.number_of_rooms && { icon: DoorOpen, label: tPage("hotelRoomsCount")(hotel.number_of_rooms) },
  hotel.check_in_time && { icon: Clock, label: tPage("hotelCheckInAt")(hotel.check_in_time) },
  hotel.check_out_time && { icon: Clock, label: tPage("hotelCheckOutAt")(hotel.check_out_time) },
  address && { icon: MapPin, label: address }].
  filter(Boolean) as {icon: any;label: string;}[];

  const hgFacilities = hotel.hyperguest_facilities as Array<{
    name: string;
    category?: string;
    classification?: string;
    type?: string;
  }> | null;

  const supportedCards = h.supported_cards as string[] | null;
  const roomCapacities = h.room_capacities as Array<{
    name: string;
    maxAdultsNumber?: number;
    maxChildrenNumber?: number;
    maxOccupancy?: number;
    roomSize?: number;
    beddingSummary?: string;
  }> | null;

  return (
    <>
        {/* Hero */}
        <div className="relative h-[500px]">
          <img
            src={resizedImageUrl(hotel.hero_image || displayPhotos[0], 1400, 80) || "/placeholder.svg"}
            alt={hotelName}
            className="w-full h-full object-cover" />
          
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
          <div className="absolute bottom-0 left-0 right-0 container pb-12">
            <h1 className="font-sans text-2xl md:text-[28px] font-bold uppercase tracking-[0.02em] text-white mb-2">
              {hotelName}
            </h1>
            {(city || region) &&
            <p className="text-xl text-white/90 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {city}{city && region && ', '}{region}
              </p>
            }
          </div>
        </div>

        {/* Info chips */}
        {infoChips.length > 0 &&
        <div className="container py-6">
            <div className="flex flex-wrap gap-3">
              {infoChips.map((chip, i) =>
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm font-medium">
              
                  <chip.icon className="h-4 w-4 text-primary" />
                  {chip.label}
                </span>
            )}
            </div>
          </div>
        }

        {/* Content */}
        <div className="container py-16">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Story */}
              {story &&
              <div>
                  <h2 className="font-sans text-sm sm:text-base font-bold uppercase tracking-[0.03em] mb-4">{tPage('ourStory')}</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
                    {story}
                  </p>
                </div>
              }

              {/* Highlights */}
              {highlights && highlights.length > 0 &&
              <div>
                  <h2 className="font-sans text-sm sm:text-base font-bold uppercase tracking-[0.03em] mb-4">{tPage('highlights')}</h2>
                  <ul className="space-y-3">
                    {highlights.map((highlight, index) =>
                  <li key={index} className="flex items-start gap-3">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-lg">{highlight}</span>
                      </li>
                  )}
                  </ul>
                </div>
              }
              {slot?.("story")}

              {/* About the Rooms */}
              {descriptionRoom &&
              <div>
                  <h2 className="font-sans text-sm sm:text-base font-bold uppercase tracking-[0.03em] mb-4">
                    {tPage("hotelAboutTheRooms")}
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
                    {descriptionRoom}
                  </p>
                </div>
              }

              {/* Location description */}
              {descriptionLocation &&
              <div>
                  <h2 className="font-sans text-sm sm:text-base font-bold uppercase tracking-[0.03em] mb-4">
                    {tPage("hotelLocation")}
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
                    {descriptionLocation}
                  </p>
                </div>
              }

              {/* Room Types & Capacities */}
              {roomCapacities && Array.isArray(roomCapacities) && roomCapacities.length > 0 &&
              <div>
                  <h2 className="font-sans text-sm sm:text-base font-bold uppercase tracking-[0.03em] mb-4">
                    {tPage("hotelRoomTypes")}
                  </h2>
                  <div className="grid gap-4">
                    {roomCapacities.map((room, i) =>
                  <div key={i} className="p-4 rounded-lg border flex flex-wrap items-center gap-x-6 gap-y-2">
                        <span className="font-semibold">{room.name}</span>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          {room.maxAdultsNumber != null &&
                      <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {room.maxAdultsNumber} {tPage("hotelAdults")}
                            </span>
                      }
                          {room.maxOccupancy != null &&
                      <span>{tPage("hotelMaxOccupancy")(room.maxOccupancy)}</span>
                      }
                          {room.roomSize != null &&
                      <span>{room.roomSize} m²</span>
                      }
                          {room.beddingSummary &&
                      <span>{room.beddingSummary}</span>
                      }
                        </div>
                      </div>
                  )}
                  </div>
                </div>
              }
              {slot?.("rooms")}

              {/* Facilities / Amenities */}
              {(() => {
                if (hgFacilities && hgFacilities.length > 0) {
                  const byCategory: Record<string, typeof hgFacilities> = {};
                  hgFacilities.forEach((fac) => {
                    const cat = fac.classification === "Service" ?
                    "Services" :
                    fac.category?.trim() || "Other";
                    if (!byCategory[cat]) byCategory[cat] = [];
                    byCategory[cat].push(fac);
                  });

                  return (
                    <div>
                      <h2 className="font-sans text-sm sm:text-base font-bold uppercase tracking-[0.03em] mb-4">{tPage('amenities')}</h2>
                      <div className="space-y-6">
                        {Object.entries(byCategory).map(([category, facilities]) =>
                        <div key={category}>
                            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">{category}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {facilities.map((fac, i) =>
                            <div key={i} className="flex items-center gap-2">
                                  <span className="text-primary">✓</span>
                                  <span>{fac.name}</span>
                                </div>
                            )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>);

                }

                if (amenities && amenities.length > 0) {
                  return (
                    <div>
                      <h2 className="font-sans text-sm sm:text-base font-bold uppercase tracking-[0.03em] mb-4">{tPage('amenities')}</h2>
                      <div className="grid grid-cols-2 gap-4">
                        {amenities.map((amenity, index) =>
                        <div key={index} className="flex items-center gap-2">
                            <span className="text-primary">✓</span>
                            <span>{amenity}</span>
                          </div>
                        )}
                      </div>
                    </div>);

                }

                return null;
              })()}

              {/* Cancellation Policy */}
              {(hotel.cancellation_policy || hotel.min_stay || hotel.max_stay) &&
              <div>
                  <h2 className="font-sans text-sm sm:text-base font-bold uppercase tracking-[0.03em] mb-4">
                    {tPage("hotelCancellationPolicy")}
                  </h2>
                  <div className="space-y-4">
                    {hotel.cancellation_policy &&
                  <div className="p-4 rounded-lg border bg-muted/30">
                        <p className="text-muted-foreground whitespace-pre-line">{hotel.cancellation_policy}</p>
                      </div>
                  }
                    {(hotel.min_stay || hotel.max_stay) &&
                  <div className="p-4 rounded-lg border bg-muted/30">
                        <h3 className="font-semibold mb-2">
                          {tPage("hotelLengthOfStay")}
                        </h3>
                        <div className="flex gap-4 text-muted-foreground">
                          {hotel.min_stay &&
                      <span>
                              {tPage("hotelMinStay")(hotel.min_stay)}
                            </span>
                      }
                          {hotel.max_stay &&
                      <span>
                              {tPage("hotelMaxStay")(hotel.max_stay)}
                            </span>
                      }
                        </div>
                      </div>
                  }
                  </div>
                </div>
              }

              {/* General Conditions / Remarks */}
              {hotel.extra_conditions &&
              <div>
                  <h2 className="font-sans text-sm sm:text-base font-bold uppercase tracking-[0.03em] mb-4">
                    {tPage("hotelGeneralConditionsRemarks")}
                  </h2>
                  <div className="p-4 rounded-lg border bg-amber-50 border-amber-200">
                    <p className="text-amber-700 whitespace-pre-line text-sm">{hotel.extra_conditions}</p>
                  </div>
                </div>
              }

              {/* Photo Gallery */}
              {displayPhotos.length > 0 &&
              <div>
                  <h2 className="font-sans text-sm sm:text-base font-bold uppercase tracking-[0.03em] mb-4">{tPage('gallery')}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {displayPhotos.map((photo, index) =>
                  <div key={index} className="aspect-square rounded-lg overflow-hidden">
                        <img
                      src={resizedImageUrl(photo, 500) || photo}
                      alt={`${hotelName} - ${index + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    
                      </div>
                  )}
                  </div>
                </div>
              }
              {slot?.("photos")}

              {/* Location Map */}
              {hotel.latitude && hotel.longitude &&
              <LocationMap
                latitude={hotel.latitude}
                longitude={hotel.longitude}
                hotelName={hotelName}
                lang={lang} />

              }
              {slot?.("practical")}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              {sidebar}
            </div>
          </div>
        </div>
    </>
  );
}
