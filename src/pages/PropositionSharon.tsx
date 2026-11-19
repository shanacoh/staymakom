import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import V3Header from "@/components/V3Header";
import { WHATSAPP_NUMBER } from "@/constants/whatsapp";
import {
  HERO_IMAGE,
  REGIONS,
  NEXT_STEPS,
  WHATSAPP_INTRO,
  type Hotel,
  type Photo,
  type Region,
} from "@/data/propositionSharon";

// Page one-off : proposition pour Sharon (50 ans de mariage, février, le Sud).
// Par destination : 4 hôtels à sélectionner + 1 carte d'activités douces. Elle peut retenir
// un ou plusieurs hôtels, ou rester au centre, et choisir son moyen de déplacement.
// Rien n'est enregistré sur le site : ses choix partent dans un message WhatsApp pré-rempli.

const LABEL = "font-sans text-[12px] font-bold uppercase tracking-[0.08em] text-foreground";

// Une carte = 78 % de l'écran sur téléphone (défilement au doigt), 5 cartes par ligne sur ordinateur.
const CARD_WIDTH = "w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-auto";

const formatIls = (amount: number) => `₪${amount.toLocaleString("en-US")}`;

// Taux indicatif shekel → euro (dernier taux connu, fin 2026 ≈ 3,5). À mettre à jour avant envoi si besoin.
const ILS_PER_EUR = 3.5;
const formatEur = (amountIls: number) => `≈ €${(Math.round(amountIls / ILS_PER_EUR / 10) * 10).toLocaleString("en-US")}`;

// Carrousel de photos (même principe que la page Ilona) : défilement au doigt, flèches sur ordinateur.
function PhotoCarousel({ photos, children }: { photos: Photo[]; children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => setIndex(Math.round(track.scrollLeft / track.clientWidth));
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  const go = (delta: number) => {
    const track = trackRef.current;
    if (!track) return;
    const next = (index + delta + photos.length) % photos.length;
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  };

  const arrow =
    "absolute top-[42%] -translate-y-1/2 grid h-[28px] w-[28px] place-items-center rounded-full bg-white/90 text-[15px] font-semibold text-foreground opacity-90 transition-opacity md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100";

  return (
    <div className="group relative overflow-hidden rounded-[14px] bg-muted">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((photo) => (
          <img
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            loading="lazy"
            className="aspect-[4/3] w-full shrink-0 snap-start object-cover"
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      {children}
      <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className={`${arrow} left-2`}>
        ‹
      </button>
      <button type="button" aria-label="Next photo" onClick={() => go(1)} className={`${arrow} right-2`}>
        ›
      </button>
      <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/50 px-[7px] py-0.5 text-[10px] tabular-nums text-white">
        {index + 1} / {photos.length}
      </span>
    </div>
  );
}

function HotelCard({ hotel, selected, onToggle }: { hotel: Hotel; selected: boolean; onToggle: () => void }) {
  return (
    <article className={`${CARD_WIDTH} flex min-w-0 flex-col gap-2`}>
      <PhotoCarousel photos={hotel.photos}>
        <button
          type="button"
          aria-pressed={selected}
          aria-label={selected ? `Remove ${hotel.name}` : `Select ${hotel.name}`}
          onClick={onToggle}
          className={`absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full border text-white transition-colors ${
            selected ? "border-[#ad1414] bg-[#ad1414]" : "border-white/90 bg-black/25"
          }`}
        >
          {selected && <Check className="h-4 w-4" strokeWidth={3} />}
        </button>
        <h3 className="pointer-events-none absolute bottom-3 left-3 right-14 text-[15px] font-bold leading-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]">
          {hotel.name}
        </h3>
      </PhotoCarousel>

      <div className="flex flex-wrap gap-1 px-0.5">
        {hotel.tags.map((tag) => (
          <span
            key={tag}
            className="whitespace-nowrap rounded-full border border-border/40 bg-muted/60 px-2 py-px text-[11px] text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>
      <p className="px-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{hotel.description}</p>
      <div className="mt-auto flex items-baseline gap-1.5 px-0.5">
        <span className="text-lg font-bold tabular-nums">{formatIls(hotel.priceIls)}</span>
        <span className="text-[13px] tabular-nums text-muted-foreground">{formatEur(hotel.priceIls)}</span>
      </div>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onToggle}
        className={`mt-0.5 rounded-full border px-4 py-2 font-sans text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
          selected
            ? "border-[#ad1414] bg-[#ad1414] text-white"
            : "border-foreground/70 text-foreground hover:border-[#ad1414] hover:text-[#ad1414]"
        }`}
      >
        {selected ? "Selected" : "I like this one"}
      </button>
    </article>
  );
}

function ActivitiesCard({ activities }: { activities: string[] }) {
  return (
    <div className={`${CARD_WIDTH} grid content-start gap-3.5 rounded-[20px] border border-[#ad7848]/20 bg-[#f7f1ea] p-5`}>
      <h4 className="text-[15px] font-bold">While you're there</h4>
      <p className="-mt-2 text-[12.5px] text-muted-foreground">Gentle ideas, at your own pace.</p>
      <ul className="space-y-1 text-[13px] leading-snug">
        {activities.map((activity) => (
          <li key={activity}>– {activity}</li>
        ))}
      </ul>
      <p className="text-[12.5px] text-muted-foreground">All kosher, all at an easy pace. We book everything for you.</p>
    </div>
  );
}

function RegionSection({
  region,
  liked,
  onToggleRegion,
  selectedHotels,
  onToggleHotel,
}: {
  region: Region;
  liked: boolean;
  onToggleRegion: () => void;
  selectedHotels: string[];
  onToggleHotel: (hotelId: string) => void;
}) {
  return (
    <section id={region.id} className="scroll-mt-16 border-t border-border">
      <div className="relative flex h-44 items-center justify-center sm:h-56">
        <img src={region.banner} alt={region.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative px-5 text-center text-white">
          <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-white/80">Option {region.number}</p>
          <h2 className="mt-1.5 font-sans text-2xl font-bold uppercase tracking-[0.04em] text-white sm:text-4xl">
            {region.title}
          </h2>
        </div>
      </div>

      <div className="py-10">
        <div className="mx-auto max-w-6xl px-5">
          <span className="inline-block rounded-full bg-[#fdf0ef] px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#ad1414]">
            {region.weather}
          </span>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="font-sans text-sm font-semibold text-foreground">{region.tagline}</p>
            <button
              type="button"
              aria-pressed={liked}
              onClick={onToggleRegion}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 font-sans text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                liked
                  ? "border-[#ad1414] bg-[#ad1414] text-white"
                  : "border-foreground/70 text-foreground hover:border-[#ad1414] hover:text-[#ad1414]"
              }`}
            >
              {liked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              {liked ? "Destination selected" : "I like this destination"}
            </button>
          </div>
        </div>

        <div className="mx-auto mt-5 max-w-6xl">
          <div className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 py-1.5 lg:grid lg:grid-cols-5 lg:overflow-visible">
            {region.hotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                selected={selectedHotels.includes(hotel.id)}
                onToggle={() => onToggleHotel(hotel.id)}
              />
            ))}
            <ActivitiesCard activities={region.activities} />
          </div>
          <p className="mt-4 px-5 font-sans text-[11.5px] text-muted-foreground">{PRICE_NOTE}</p>
        </div>
      </div>
    </section>
  );
}

const PRICE_NOTE =
  "VAT (18%) to be added. Euro amounts are an estimate based on the current exchange rate.";

const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);

const PropositionSharon = () => {
  const [regions, setRegions] = useState<string[]>([]);
  const [hotels, setHotels] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const toggleHotel = (id: string) => setHotels((current) => toggleIn(current, id));
  const toggleRegion = (id: string) => setRegions((current) => toggleIn(current, id));

  // Destinations et hôtels qu'elle a aimés (facultatif), envoyés dans le message pour préparer l'appel.
  const likedRegions = REGIONS.filter((region) => regions.includes(region.id));
  const picked = REGIONS.map((region) => ({
    region,
    hotels: region.hotels.filter((hotel) => hotels.includes(hotel.id)),
  })).filter((group) => group.hotels.length > 0);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    [
      WHATSAPP_INTRO,
      ...(likedRegions.length ? ["", `Destinations we like: ${likedRegions.map((region) => region.title).join(", ")}`] : []),
      ...(picked.length ? ["", "Hotels we like:"] : []),
      ...picked.map(({ region, hotels: list }) => `${region.title}: ${list.map((hotel) => hotel.name).join(", ")}`),
      ...(note.trim() ? ["", note.trim()] : []),
    ].join("\n")
  )}`;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <V3Header />

      {/* Hero */}
      <section className="relative flex h-[56vh] min-h-[360px] items-center justify-center md:h-[60vh]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
        <div className="absolute inset-0 bg-black/45" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center text-white sm:px-6">
          <p
            className="mb-4 font-sans text-xs uppercase tracking-[0.18em] text-white/75 opacity-0 animate-hero-fade-up sm:text-sm"
            style={{ animationDelay: "0ms" }}
          >
            STAYMAKOM · Private proposal
          </p>
          <h1
            className="text-center font-sans text-[34px] font-bold uppercase leading-[1.05] tracking-[0.02em] text-white opacity-0 drop-shadow-lg animate-hero-fade-up sm:text-5xl md:text-6xl"
            style={{ animationDelay: "150ms" }}
          >
            Winter sun in the South
          </h1>
          <p
            className="mt-4 font-sans text-sm uppercase tracking-[0.14em] text-white/85 opacity-0 animate-hero-fade-up sm:text-base"
            style={{ animationDelay: "300ms" }}
          >
            For Sharon · 50th anniversary · 7 to 9 February
          </p>
          <p
            className="mx-auto mt-4 max-w-md font-sans text-[15px] leading-relaxed text-white/85 opacity-0 animate-hero-fade-up sm:text-lg"
            style={{ animationDelay: "450ms" }}
          >
            Fifty years deserve a beautiful escape. Three destinations, a hand-picked choice of hotels for each: tell us
            which ones tempt you, and we shape the trip around you.
          </p>
        </div>
      </section>

      {/* Sommaire : les trois destinations */}
      <nav className="border-b border-border">
        <div className="mx-auto grid max-w-5xl grid-cols-3 divide-x divide-border">
          {REGIONS.map((region) => {
            const count =
              region.hotels.filter((hotel) => hotels.includes(hotel.id)).length + (regions.includes(region.id) ? 1 : 0);
            return (
              <a key={region.id} href={`#${region.id}`} className="group px-2 py-4 text-center">
                <p className="font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-foreground transition-colors group-hover:text-[#ad1414] sm:text-sm">
                  {region.title}
                </p>
                <p
                  className={`mt-0.5 font-sans text-[10px] uppercase tracking-[0.18em] ${
                    count ? "font-bold text-[#ad1414]" : "text-muted-foreground"
                  }`}
                >
                  {count ? "Selected" : `Option ${region.number}`}
                </p>
              </a>
            );
          })}
        </div>
      </nav>

      {REGIONS.map((region) => (
        <RegionSection
          key={region.id}
          region={region}
          liked={regions.includes(region.id)}
          onToggleRegion={() => toggleRegion(region.id)}
          selectedHotels={hotels}
          onToggleHotel={toggleHotel}
        />
      ))}

      {/* Prochaines étapes : un appel pour organiser le week-end, rien à cocher */}
      <section id="next-steps" className="border-t border-border bg-muted/40 px-5 py-14">
        <div className="mx-auto max-w-md text-center">
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-[#ad1414]">04</p>
          <h2 className="mt-1.5 font-sans text-xl font-bold uppercase tracking-[0.02em] text-foreground sm:text-2xl">
            Next steps
          </h2>
          <div className="mx-auto mt-4 h-px w-8 bg-[#ad1414]" />
          <p className="mt-4 font-sans text-[13px] leading-relaxed text-foreground/70">
            Tap "I like" on the destinations and hotels you liked most, and let's talk about them on a quick call. We
            can also organise:
          </p>
        </div>

        <div className="mx-auto mt-6 max-w-md">
          <ul className="space-y-1.5 font-sans text-[13px] leading-snug text-foreground">
            {NEXT_STEPS.map((step) => (
              <li key={step}>– {step}</li>
            ))}
          </ul>

          <label htmlFor="sharon-note" className={`${LABEL} mt-8 block`}>
            Anything you'd like to talk about?
          </label>
          <textarea
            id="sharon-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            placeholder="Your questions, a good time to call you..."
            className="mt-3 w-full rounded-xl border border-border bg-white px-4 py-3 font-sans text-[13px] leading-relaxed outline-none focus:border-[#ad1414]"
          />

          <div className="mt-7 text-center">
            {(likedRegions.length > 0 || picked.length > 0) && (
              <p className="mb-4 font-sans text-[12.5px] leading-relaxed text-foreground/70">
                You liked:{" "}
                {[
                  ...likedRegions.map((region) => region.title),
                  ...picked.flatMap(({ hotels: list }) => list.map((hotel) => hotel.name)),
                ].join(" · ")}
              </p>
            )}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full bg-[#ad1414] px-8 py-3.5 font-sans text-xs font-bold uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90"
            >
              Schedule a call
            </a>
            <p className="mt-3 font-sans text-[11px] text-muted-foreground">Your message opens in WhatsApp, ready to send.</p>
            <p className="mt-6 font-sans text-[11px] leading-relaxed text-muted-foreground">{PRICE_NOTE}</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center">
        <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          STAYMAKOM · The Israel most people never find
        </p>
      </footer>
    </div>
  );
};

export default PropositionSharon;
