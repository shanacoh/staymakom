import { useState } from "react";
import { Check } from "lucide-react";
import V3Header from "@/components/V3Header";
import { WHATSAPP_NUMBER } from "@/constants/whatsapp";
import { CHAPTERS, HERO_IMAGE, WHATSAPP_INTRO, type Chapter, type Choice } from "@/data/demandeMariage";

// Page one-off : propositions de demande en mariage. Le client touche les cartes qui
// lui plaisent, rien n'est enregistré sur le site : sa sélection part dans un message
// WhatsApp pré-rempli au moment de cliquer sur « Créer ma demande ».

type Selection = Record<string, string[]>;

const MOMENT = "font-sans text-[10px] uppercase tracking-[0.25em]";

// Largeur des cartes sur ordinateur selon leur nombre, pour remplir chaque ligne
// (5 cartes sur une ligne, 7 cartes en 4 + 3 avec la dernière ligne centrée).
const DESKTOP_WIDTH: Record<number, string> = {
  2: "md:w-[calc(50%-6px)]",
  3: "md:w-[calc(33.333%-8px)]",
  4: "md:w-[calc(25%-9px)]",
  5: "md:w-[calc(20%-9.6px)]",
};

function ChoiceCard({
  choice,
  selected,
  width,
  onToggle,
}: {
  choice: Choice;
  selected: boolean;
  width: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`group relative flex min-h-[19rem] w-[78%] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-xl p-4 text-left text-white outline-none transition-shadow sm:w-[46%] ${width} focus-visible:ring-2 focus-visible:ring-[#ad1414] focus-visible:ring-offset-2 ${
        selected ? "ring-[3px] ring-[#ad1414] ring-offset-2" : ""
      }`}
    >
      <img
        src={choice.photo}
        alt={choice.title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/5" />

      <span
        className={`absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full border transition-colors ${
          selected ? "border-[#ad1414] bg-[#ad1414]" : "border-white/80 bg-black/20"
        }`}
      >
        {selected && <Check className="h-4 w-4" strokeWidth={3} />}
      </span>

      <div className="relative">
        <p className="font-sans text-[15px] font-bold uppercase leading-snug tracking-[0.04em]">{choice.title}</p>
        <p className="mt-1.5 font-sans text-[12px] leading-relaxed text-white/85">{choice.description}</p>
        <p className={`${MOMENT} mt-3 text-white/70`}>{selected ? "Sélectionné" : "Touchez pour choisir"}</p>
      </div>
    </button>
  );
}

function ChapterSection({
  chapter,
  selected,
  onToggle,
}: {
  chapter: Chapter;
  selected: string[];
  onToggle: (choice: string) => void;
}) {
  const count = chapter.choices.length;
  const desktopWidth = DESKTOP_WIDTH[count > 5 ? 4 : count] ?? DESKTOP_WIDTH[4];

  return (
    <section id={chapter.id} className="scroll-mt-16 border-t border-border">
      {chapter.banner && (
        <div className="relative flex h-48 items-center justify-center sm:h-64">
          <img src={chapter.banner} alt={chapter.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative px-5 text-center text-white">
            <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-white/80">{chapter.label}</p>
            <h2 className="mt-1.5 font-sans text-2xl font-bold uppercase tracking-[0.04em] text-white sm:text-4xl">
              {chapter.title}
            </h2>
          </div>
        </div>
      )}

      <div className="py-10">
        <div className="mx-auto max-w-5xl px-5">
          <span className="inline-block rounded-full bg-[#fdf0ef] px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#ad1414]">
            {chapter.number} · {chapter.label}
          </span>
          {!chapter.banner && (
            <h2 className="mt-3 font-sans text-xl font-bold uppercase tracking-[0.02em] text-foreground sm:text-2xl">
              {chapter.title}
            </h2>
          )}
          <p className="mt-2 font-sans text-sm font-semibold text-foreground">{chapter.tagline}</p>
          <p className="mt-1 font-sans text-[13px] text-foreground/70">{chapter.intro}</p>
        </div>

        <div className="mx-auto mt-5 max-w-5xl">
          <div className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 py-1.5 md:flex-wrap md:justify-center md:overflow-visible">
            {chapter.choices.map((choice) => (
              <ChoiceCard
                key={choice.title}
                choice={choice}
                selected={selected.includes(choice.title)}
                width={desktopWidth}
                onToggle={() => onToggle(choice.title)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const DemandeMariage = () => {
  const [selection, setSelection] = useState<Selection>({});
  const [note, setNote] = useState("");

  const toggle = (chapterId: string, choice: string) =>
    setSelection((current) => {
      const list = current[chapterId] ?? [];
      return {
        ...current,
        [chapterId]: list.includes(choice) ? list.filter((c) => c !== choice) : [...list, choice],
      };
    });

  const picked = CHAPTERS.filter((chapter) => (selection[chapter.id] ?? []).length > 0);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    [
      WHATSAPP_INTRO,
      ...picked.map((chapter) => `${chapter.label}: ${selection[chapter.id].join(", ")}`),
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
            STAYMAKOM · Proposition privée
          </p>
          <h1
            className="text-center font-sans text-[34px] font-bold uppercase leading-[1.05] tracking-[0.02em] text-white opacity-0 drop-shadow-lg animate-hero-fade-up sm:text-5xl md:text-6xl"
            style={{ animationDelay: "150ms" }}
          >
            La grande question
          </h1>
          <p
            className="mt-4 font-sans text-sm uppercase tracking-[0.14em] text-white/85 opacity-0 animate-hero-fade-up sm:text-base"
            style={{ animationDelay: "300ms" }}
          >
            Une demande en Israël · Puis New York
          </p>
          <p
            className="mx-auto mt-4 max-w-md font-sans text-[15px] leading-relaxed text-white/85 opacity-0 animate-hero-fade-up sm:text-lg"
            style={{ animationDelay: "450ms" }}
          >
            Touchez tout ce qui vous plaît, autant que vous voulez. On construit votre devis à partir de vos choix.
          </p>
        </div>
      </section>

      {/* Sommaire : les quatre chapitres */}
      <nav className="border-b border-border">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-border sm:grid-cols-4 sm:divide-x">
          {CHAPTERS.map((chapter) => (
            <a key={chapter.id} href={`#${chapter.id}`} className="group px-2 py-4 text-center">
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-foreground transition-colors group-hover:text-[#ad1414] sm:text-sm">
                {chapter.title}
              </p>
              <p className="mt-0.5 font-sans text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {(selection[chapter.id] ?? []).length > 0
                  ? `${selection[chapter.id].length} choisi${selection[chapter.id].length > 1 ? "s" : ""}`
                  : chapter.label.split(" · ")[0]}
              </p>
            </a>
          ))}
        </div>
      </nav>

      {CHAPTERS.map((chapter) => (
        <ChapterSection
          key={chapter.id}
          chapter={chapter}
          selected={selection[chapter.id] ?? []}
          onToggle={(choice) => toggle(chapter.id, choice)}
        />
      ))}

      {/* Récapitulatif et envoi */}
      <section id="create" className="border-t border-border bg-muted/40 px-5 py-14">
        <div className="mx-auto max-w-md text-center">
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-[#ad1414]">05</p>
          <h2 className="mt-1.5 font-sans text-xl font-bold uppercase tracking-[0.02em] text-foreground sm:text-2xl">
            Créons votre moment
          </h2>
          <div className="mx-auto mt-4 h-px w-8 bg-[#ad1414]" />
          <p className="mt-4 font-sans text-[13px] leading-relaxed text-foreground/70">
            Voici ce que vous avez choisi. Ajoutez tout ce qu'il faut savoir, et on revient vers vous avec une proposition
            et un devis sur mesure.
          </p>
        </div>

        <div className="mx-auto mt-6 max-w-md">
          <ul className="divide-y divide-border border-y border-border text-left">
            {CHAPTERS.map((chapter) => {
              const list = selection[chapter.id] ?? [];
              return (
                <li key={chapter.id} className="py-3">
                  <p className="font-sans text-[12px] font-bold uppercase tracking-[0.08em] text-foreground">
                    {chapter.label}
                  </p>
                  {list.length > 0 ? (
                    <p className="mt-0.5 font-sans text-[13px] leading-relaxed text-foreground/80">{list.join(" · ")}</p>
                  ) : (
                    <a
                      href={`#${chapter.id}`}
                      className="mt-0.5 inline-block font-sans text-[13px] text-foreground/50 underline-offset-2 hover:underline"
                    >
                      Rien pour l'instant
                    </a>
                  )}
                </li>
              );
            })}
          </ul>

          <label htmlFor="proposal-note" className="mt-6 block font-sans text-[12px] font-bold uppercase tracking-[0.08em]">
            Autre chose ?
          </label>
          <textarea
            id="proposal-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            placeholder="Dates, nombre d'invités, une chanson, un lieu qui compte pour vous deux..."
            className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 font-sans text-[13px] leading-relaxed outline-none focus:border-[#ad1414]"
          />

          <div className="mt-7 text-center">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full bg-[#ad1414] px-8 py-3.5 font-sans text-xs font-bold uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90"
            >
              Créer ma demande
            </a>
            <p className="mt-3 font-sans text-[11px] text-muted-foreground">Votre sélection s'ouvre dans WhatsApp, prête à être envoyée.</p>
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

export default DemandeMariage;
