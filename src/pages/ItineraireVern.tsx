import V3Header from "@/components/V3Header";
import { OptionsChecklist } from "@/components/itinerary/OptionsChecklist";
import {
  ARRIVAL,
  CHAPTERS,
  DATES,
  DEPARTURE,
  HERO_IMAGE,
  LETS_DISCUSS,
  OPTION_QUESTIONS,
  NEXT_STEP,
  PHOTO_CREDITS,
  type Day,
  type Slot,
  type Chapter,
  TRAVELER,
  WHATSAPP_INTRO,
} from "@/data/itineraireVern";

// Toutes les cartes d'une journée ont au moins la même hauteur, avec ou sans photo :
// sur téléphone elles défilent au doigt, sur ordinateur elles se rangent en grille.
const CARD = "relative min-h-[17rem] w-[78%] shrink-0 snap-start overflow-hidden rounded-xl sm:w-[46%] md:w-auto";

const MOMENT = "font-sans text-[10px] uppercase tracking-[0.25em]";

function OptionList({ options, light }: { options: string[]; light: boolean }) {
  return (
    <ul className="mt-2.5 space-y-1">
      {options.map((option) => (
        <li
          key={option}
          className={`flex items-start gap-2 font-sans text-[12px] leading-snug ${
            light ? "text-white/85" : "text-foreground/70"
          }`}
        >
          <span className={`mt-[7px] h-px w-3 shrink-0 ${light ? "bg-white/60" : "bg-[#ad1414]/50"}`} />
          {option}
        </li>
      ))}
    </ul>
  );
}

function SlotCard({ slot }: { slot: Slot }) {
  const light = !!slot.photo;

  return (
    <div
      className={`${CARD} flex flex-col justify-end p-4 ${
        light ? "text-white" : "border border-border bg-muted/40 text-foreground"
      }`}
    >
      {slot.photo && (
        <>
          <img src={slot.photo} alt={slot.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
        </>
      )}
      <div className="relative">
        <p className={`${MOMENT} ${light ? "text-white/75" : "text-muted-foreground"}`}>{slot.moment}</p>
        <p className="mt-1.5 font-sans text-[15px] font-bold uppercase leading-snug tracking-[0.04em]">{slot.title}</p>
        {slot.description && (
          <p className={`mt-1.5 font-sans text-[12px] leading-relaxed ${light ? "text-white/85" : "text-foreground/70"}`}>
            {slot.description}
          </p>
        )}
        {slot.options && <OptionList options={slot.options} light={light} />}
      </div>
    </div>
  );
}

function DayBlock({ day }: { day: Day }) {
  return (
    <div className="border-t border-border py-8">
      <div className="mx-auto max-w-5xl px-5">
        <p className="font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-[#ad1414]">
          Day {day.number} <span className="font-normal text-muted-foreground">· {day.date}</span>
        </p>
        <h3 className="mt-1 font-sans text-lg font-bold uppercase tracking-[0.02em] text-foreground sm:text-xl">
          {day.title}
        </h3>
        {day.intro && <p className="mt-1 font-sans text-[13px] text-foreground/70">{day.intro}</p>}
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

/** Bandeau « à toi de choisir » : les options côte à côte, chacune résumée en une courte liste. */
function VariantsChoice({ chapter }: { chapter: Chapter }) {
  if (!chapter.variants || !chapter.choice) return null;

  return (
    <div className="border-t border-border bg-[#fdf0ef] px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-center font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-[#ad1414]">
          {chapter.choice.label}
        </p>
        <h3 className="mt-1.5 text-center font-sans text-xl font-bold uppercase tracking-[0.02em] text-foreground sm:text-2xl">
          {chapter.choice.title}
        </h3>
        <p className="mt-1 text-center font-sans text-[13px] text-foreground/70">{chapter.choice.intro}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {chapter.variants.map((variant, index) => (
            <div
              key={variant.label}
              className="flex items-start gap-4 rounded-xl border border-[#ad1414]/25 bg-white p-5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ad1414] font-sans text-base font-bold text-white">
                {index + 1}
              </span>
              <div>
                <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#ad1414]">
                  {variant.label}
                </p>
                <p className="mt-1 font-sans text-[15px] font-bold uppercase leading-snug tracking-[0.04em] text-foreground">
                  {variant.title}
                </p>
                <p className="mt-1 font-sans text-[12px] leading-relaxed text-foreground/70">{variant.description}</p>
                <OptionList options={variant.items} light={false} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Milestone({ label, title, description }: { label: string; title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 text-center">
      <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-sans text-sm font-bold uppercase tracking-[0.06em] text-foreground">{title}</p>
      {description && <p className="mt-1 font-sans text-[13px] text-foreground/70">{description}</p>}
    </div>
  );
}

const ItineraireVern = () => {
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
            A week across Israel
          </h1>
          <p
            className="mt-4 font-sans text-sm uppercase tracking-[0.14em] text-white/85 opacity-0 animate-hero-fade-up sm:text-base"
            style={{ animationDelay: "300ms" }}
          >
            {TRAVELER} · Jerusalem, the hills & the desert
          </p>
          <p
            className="mx-auto mt-4 max-w-md font-sans text-[15px] leading-relaxed text-white/85 opacity-0 animate-hero-fade-up sm:text-lg"
            style={{ animationDelay: "450ms" }}
          >
            {DATES}. Your trip, day by day. A first draft we'll shape together.
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

      <Milestone {...ARRIVAL} />

      {CHAPTERS.map((chapter) => (
        <section key={chapter.id} id={chapter.id} className="scroll-mt-16">
          <div className="relative flex h-48 items-center justify-center sm:h-64">
            <img src={chapter.photo} alt={chapter.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative px-5 text-center text-white">
              <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-white/80">{chapter.days}</p>
              <h2 className="mt-1.5 font-sans text-2xl font-bold uppercase tracking-[0.04em] text-white sm:text-4xl">
                {chapter.name}
              </h2>
              {chapter.intro && <p className="mt-2 font-sans text-[13px] text-white/85">{chapter.intro}</p>}
            </div>
          </div>

          {chapter.list.map((day) => (
            <DayBlock key={day.number} day={day} />
          ))}
          <VariantsChoice chapter={chapter} />
        </section>
      ))}

      <div className="border-t border-border">
        <Milestone {...DEPARTURE} />
      </div>

      {/* Les options à décider ensemble */}
      <section className="bg-muted/40 px-5 py-14">
        <div className="mx-auto max-w-md text-center">
          <h2 className="font-sans text-xl font-bold uppercase tracking-[0.02em] text-foreground sm:text-2xl">
            A few things to decide together
          </h2>
          <div className="mx-auto mt-4 h-px w-8 bg-[#ad1414]" />
          <p className="mb-6 mt-4 font-sans text-[13px] leading-relaxed text-foreground/70">
            Tick what feels right, as many boxes as you like, and send it to us. We'll take it from there.
          </p>
          <OptionsChecklist
            questions={OPTION_QUESTIONS}
            undecidedChoice={LETS_DISCUSS}
            whatsappIntro={WHATSAPP_INTRO}
            commentLabel="Your comments"
            noteBeforeButton={NEXT_STEP}
          />
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center">
        <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          STAYMAKOM · The Israel most people never find
        </p>
        <p className="mt-2 font-sans text-[9px] text-muted-foreground/70">{PHOTO_CREDITS}</p>
      </footer>
    </div>
  );
};

export default ItineraireVern;
