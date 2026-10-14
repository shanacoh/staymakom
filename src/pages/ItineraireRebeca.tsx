import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import V3Header from "@/components/V3Header";
import { WHATSAPP_NUMBER } from "@/constants/whatsapp";
import {
  ARRIVAL,
  CHAPTERS,
  DEPARTURE,
  HERO_IMAGE,
  SWIPE_URL,
  type ChoiceSlot,
  type Day,
  type FixedSlot,
  type Slot,
} from "@/data/itineraireRebeca";

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi Shana! I have a question about our Israel itinerary."
)}`;

// Toutes les cartes d'une journée ont la même taille, avec ou sans photo :
// sur téléphone elles défilent au doigt, sur ordinateur elles se rangent en grille.
const CARD = "relative h-64 w-[76%] shrink-0 snap-start overflow-hidden rounded-xl sm:w-[46%] md:w-auto";

const MOMENT = "font-sans text-[10px] uppercase tracking-[0.25em]";

function FixedCard({ slot }: { slot: FixedSlot }) {
  if (slot.photo) {
    return (
      <div className={CARD}>
        <img src={slot.photo} alt={slot.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <p className={`${MOMENT} text-white/75`}>{slot.moment}</p>
          <p className="mt-1.5 font-sans text-[15px] font-bold uppercase leading-snug tracking-[0.04em]">{slot.title}</p>
          {slot.description && (
            <p className="mt-1.5 font-sans text-[12px] leading-relaxed text-white/85">{slot.description}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${CARD} flex flex-col justify-end border border-border bg-muted/40 p-4`}>
      <p className={`${MOMENT} text-muted-foreground`}>{slot.moment}</p>
      <p className="mt-1.5 font-sans text-[15px] font-bold uppercase leading-snug tracking-[0.04em] text-foreground">
        {slot.title}
      </p>
      {slot.description && (
        <p className="mt-1.5 font-sans text-[12px] leading-relaxed text-foreground/70">{slot.description}</p>
      )}
    </div>
  );
}

function ChoiceCard({ slot }: { slot: ChoiceSlot }) {
  const others = slot.count - slot.ideas.length;

  return (
    <Link
      to={SWIPE_URL}
      className={`${CARD} group flex flex-col border border-[#ad1414]/20 bg-[#fdf0ef] p-4 transition-colors hover:border-[#ad1414]/50`}
    >
      <p className={`${MOMENT} text-[#ad1414]`}>{slot.moment} · Your choice</p>
      <p className="mt-1.5 font-sans text-[15px] font-bold uppercase leading-snug tracking-[0.04em] text-foreground">
        {slot.title}
      </p>
      {slot.description && (
        <p className="mt-1 font-sans text-[12px] leading-relaxed text-foreground/70">{slot.description}</p>
      )}

      <ul className="mt-3 space-y-1">
        {slot.ideas.map((idea) => (
          <li key={idea} className="flex items-center gap-2 font-sans text-[12px] text-foreground/70">
            <span className="h-px w-3 shrink-0 bg-[#ad1414]/50" />
            {idea}
          </li>
        ))}
        {others > 0 && <li className="pl-5 font-sans text-[12px] text-foreground/45">and {others} more</li>}
      </ul>

      <span className="mt-auto inline-flex items-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[#ad1414]">
        Swipe to choose
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function SlotCard({ slot }: { slot: Slot }) {
  return slot.kind === "choice" ? <ChoiceCard slot={slot} /> : <FixedCard slot={slot} />;
}

function DayBlock({ day }: { day: Day }) {
  return (
    <div className="border-t border-border py-8">
      <div className="mx-auto max-w-5xl px-5">
        <p className="font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-[#ad1414]">Day {day.number}</p>
        <h3 className="mt-1 font-sans text-lg font-bold uppercase tracking-[0.02em] text-foreground sm:text-xl">
          {day.title}
        </h3>
      </div>

      <div className="mx-auto mt-4 max-w-5xl">
        <div className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 md:grid md:grid-cols-4 md:overflow-visible">
          {day.slots.map((slot) => (
            <SlotCard key={`${slot.moment}-${slot.title}`} slot={slot} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TransferStrip({ label, title, description }: { label: string; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 text-center">
      <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-sans text-sm font-bold uppercase tracking-[0.06em] text-foreground">{title}</p>
      {description && <p className="mt-1 font-sans text-[13px] text-foreground/70">{description}</p>}
    </div>
  );
}

const ItineraireRebeca = () => {
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
            STAYMAKOM · Private Itinerary
          </p>
          <h1
            className="text-center font-sans text-[34px] font-bold uppercase leading-[1.05] tracking-[0.02em] text-white opacity-0 drop-shadow-lg animate-hero-fade-up sm:text-5xl md:text-6xl"
            style={{ animationDelay: "150ms" }}
          >
            12 days in Israel
          </h1>
          <p
            className="mt-4 font-sans text-sm uppercase tracking-[0.14em] text-white/85 opacity-0 animate-hero-fade-up sm:text-base"
            style={{ animationDelay: "300ms" }}
          >
            Rebeca · Jerusalem, the desert, Tel Aviv
          </p>
          <p
            className="mx-auto mt-4 max-w-md font-sans text-[15px] leading-relaxed text-white/85 opacity-0 animate-hero-fade-up sm:text-lg"
            style={{ animationDelay: "450ms" }}
          >
            Your trip, day by day. Some moments are set, others are yours to choose.
          </p>
        </div>
      </section>

      {/* Sommaire : les trois grandes étapes */}
      <nav className="border-b border-border">
        <div className="mx-auto grid max-w-5xl grid-cols-3 divide-x divide-border">
          {CHAPTERS.map((chapter) => (
            <a key={chapter.id} href={`#${chapter.id}`} className="group px-2 py-4 text-center">
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-foreground transition-colors group-hover:text-[#ad1414] sm:text-sm">
                {chapter.name}
              </p>
              <p className="mt-0.5 font-sans text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {chapter.days}
              </p>
            </a>
          ))}
        </div>
      </nav>

      <TransferStrip {...ARRIVAL} />

      {CHAPTERS.map((chapter) => (
        <section key={chapter.id} id={chapter.id} className="scroll-mt-16">
          <div className="relative flex h-44 items-center justify-center sm:h-56">
            <img src={chapter.photo} alt={chapter.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/45" />
            <div className="relative text-center text-white">
              <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-white/75">{chapter.days}</p>
              <h2 className="mt-1.5 font-sans text-2xl font-bold uppercase tracking-[0.04em] text-white sm:text-4xl">
                {chapter.name}
              </h2>
            </div>
          </div>

          {chapter.list.map((day) => (
            <DayBlock key={day.number} day={day} />
          ))}
        </section>
      ))}

      <div className="border-t border-border">
        <TransferStrip {...DEPARTURE} />
      </div>

      {/* Appel à l'action : faire ses choix */}
      <section className="bg-muted/40 px-5 py-14">
        <div className="mx-auto max-w-md text-center">
          <h2 className="font-sans text-xl font-bold uppercase tracking-[0.02em] text-foreground sm:text-2xl">
            Now make it yours
          </h2>
          <div className="mx-auto mt-4 h-px w-8 bg-[#ad1414]" />
          <p className="mt-4 font-sans text-[13px] leading-relaxed text-foreground/70">
            Swipe through the ideas, keep the ones you love. Everyone in the group can play, and we build the final
            trip around your picks.
          </p>
          <Link
            to={SWIPE_URL}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ad1414] px-7 py-3 font-sans text-xs font-bold uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90"
          >
            Start swiping
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <p className="mt-5 font-sans text-[12px] text-muted-foreground">
            A question?{" "}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#ad1414]">
              Write to us on WhatsApp
            </a>
          </p>
        </div>
      </section>

      <footer className="py-8 text-center">
        <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          STAYMAKOM · The Israel most people never find
        </p>
      </footer>
    </div>
  );
};

export default ItineraireRebeca;
