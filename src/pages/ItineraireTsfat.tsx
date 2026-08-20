import V3Header from "@/components/V3Header";
import { MapPin, Clock, Moon } from "lucide-react";
import heroImg from "@/assets/safed.webp";

type ItineraryItem = {
  label: string;
  mapsUrl?: string;
};

type Step = {
  number: string;
  title: string;
  mapsUrl?: string;
  duration?: string;
  description?: string;
  items?: ItineraryItem[];
  highlight?: boolean;
  optional?: boolean;
};

const STEPS: Step[] = [
  {
    number: "01",
    title: "Tel Aviv → Tsfat",
    description: "On part de Tel Aviv, direction le nord vers Tsfat.",
  },
  {
    number: "02",
    title: "Tombeau de Rabbi Yonathan Ben Ouziel",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Tomb+of+Rabbi+Yonatan+Ben+Uziel+Amuka",
    description: "Petit arrêt sur la route pour passer voir le tombeau de Rabbi Yonathan Ben Ouziel.",
    optional: true,
  },
  {
    number: "03",
    title: "Bat Yaar",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bat+Yaar+Ranch+Biriya+Forest",
    duration: "11h30",
    description: "Un ranch pur style Far West, avec balade à cheval dans la forêt de Birya pour une heure avec des vues incroyable sur toute la vallée. L'endroit est superbe, même juste pour boire un verre. On se croirait presque dans un ranch du Texas, pas en Israël. Compter 200₪ par personne, à payer sur place.",
    highlight: true,
  },
  {
    number: "04",
    title: "Tsfat, ville de charme",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Tsfat+Old+City+Israel",
    duration: "15 min",
    description: "On se perd dans les ruelles et les petites boutiques de la vieille ville.",
    items: [
      { label: "Magasin de bougies artisanales" },
      { label: "Atelier de tissage, confection de talit" },
      { label: "Atelier de soufflage de verre (sous réserve de dispo)" },
    ],
  },
  {
    number: "05",
    title: "Les 3 synagogues à voir",
    items: [
      { label: "Synagogue Abuhav", mapsUrl: "https://www.google.com/maps/search/?api=1&query=Abuhav+Synagogue+Safed" },
      { label: "Synagogue Rabbi Yosef Caro", mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rabbi+Yosef+Caro+Synagogue+Safed" },
      { label: "Synagogue Ari Zal", mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ari+Ashkenazi+Synagogue+Safed" },
    ],
  },
  {
    number: "06",
    title: "Déjeuner à Lahuh Tzfat",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Lahuh+Tzfat+Restaurant+Safed",
    description: "Pause déjeuner au restaurant yéménite Lahuh Tzfat (לחוח צפת), une adresse locale sympa pour goûter la cuisine yéménite au cœur de la ville.",
  },
  {
    number: "07",
    title: "Dégustation à la Tzfat Distillery",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Tzfat+Distillery+Safed",
    description: "Le lieu est magnifique et l'hôte hyper sympa. Pour quelques shekels, la dégustation est ouverte à tous, et devient gratuite au moindre achat. Les alcools sont atypiques et vraiment excellents. Attention, ferme avant 16h30 le vendredi.",
    highlight: true,
  },
  {
    number: "08",
    title: "Nuit & Chabbat à Setai Bayit BaGalil",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Setai+Bayit+BaGalil",
    description: "La soirée et le Chabbat se passent sur place, à Setai Bayit BaGalil.",
  },
];

const ItineraireTsfat = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <V3Header />

      {/* Hero */}
      <section className="relative h-[49vh] md:h-[54vh] min-h-[300px] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImg})` }}
        />
        <div className="absolute inset-0 bg-black/45" />

        <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-3xl mx-auto">
          <p
            className="text-xs uppercase tracking-[0.18em] text-white/70 font-sans mb-3 opacity-0 animate-hero-fade-up"
            style={{ animationDelay: "0ms" }}
          >
            STAYMAKOM · Itinéraire Privé
          </p>
          <h1
            className="font-sans text-[28px] sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-[0.02em] leading-[1.1] opacity-0 animate-hero-fade-up text-white text-center drop-shadow-lg"
            style={{ animationDelay: "150ms" }}
          >
            Itinéraire Tsfat
          </h1>
          <p
            className="mt-4 text-sm sm:text-base text-white/85 font-sans uppercase tracking-[0.14em] opacity-0 animate-hero-fade-up"
            style={{ animationDelay: "300ms" }}
          >
            Dan &amp; Susana · 21-22 Août
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="pt-12 pb-16 px-4 scroll-mt-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-sans">Tel Aviv → Tsfat</p>
            <h2 className="font-sans text-2xl sm:text-3xl font-bold uppercase tracking-[-0.02em] text-foreground">
              Escapade à Tsfat
            </h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-2 bottom-2 w-px bg-border sm:left-6" />

            <div className="space-y-6">
              {STEPS.map((step) => (
                <div key={step.number} className="relative flex gap-4 sm:gap-5">
                  {/* Number badge */}
                  <div
                    className={
                      "relative z-10 flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full border font-sans text-xs sm:text-sm font-bold " +
                      (step.highlight
                        ? "bg-[#ad1414] border-[#ad1414] text-white"
                        : "bg-white border-border text-foreground")
                    }
                  >
                    {step.number}
                  </div>

                  {/* Content card */}
                  <div
                    className={
                      "flex-1 rounded-2xl px-5 py-4 mb-1 " +
                      (step.highlight
                        ? "bg-[#fdf0ef] border border-[#ad1414]/20"
                        : "bg-muted/40 border border-border")
                    }
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {step.optional && (
                        <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-muted-foreground">
                          Optionnel
                        </span>
                      )}
                      {step.mapsUrl ? (
                        <a
                          href={step.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-1.5 font-sans text-base sm:text-lg font-bold uppercase tracking-[-0.01em] text-foreground hover:text-[#ad1414] transition-colors"
                        >
                          <MapPin className="h-4 w-4 shrink-0 text-[#ad1414] group-hover:scale-110 transition-transform" />
                          <span className="underline decoration-transparent group-hover:decoration-[#ad1414] underline-offset-4 decoration-2 transition-colors">
                            {step.title}
                          </span>
                        </a>
                      ) : (
                        <h3 className="font-sans text-base sm:text-lg font-bold uppercase tracking-[-0.01em] text-foreground">
                          {step.title}
                        </h3>
                      )}
                      {step.duration && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-sans">
                          <Clock className="h-3 w-3" />
                          {step.duration}
                        </span>
                      )}
                    </div>

                    {step.description && (
                      <p className="mt-1.5 text-sm text-foreground/80 leading-relaxed font-sans">
                        {step.description}
                      </p>
                    )}

                    {step.items && (
                      <ul className="mt-2 space-y-1">
                        {step.items.map((item) => (
                          <li key={item.label} className="flex items-start gap-1.5 text-sm text-foreground/80 font-sans">
                            <span className="text-[#ad1414] mt-1 leading-none">•</span>
                            {item.mapsUrl ? (
                              <a
                                href={item.mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-1 hover:text-[#ad1414] transition-colors"
                              >
                                <MapPin className="h-3 w-3 shrink-0 text-[#ad1414]/70 group-hover:text-[#ad1414]" />
                                <span className="underline decoration-transparent group-hover:decoration-[#ad1414] underline-offset-2 transition-colors">
                                  {item.label}
                                </span>
                              </a>
                            ) : (
                              item.label
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Closing card */}
          <div className="mt-10 rounded-2xl bg-foreground text-white px-6 py-6 flex items-start gap-3">
            <Moon className="h-5 w-5 shrink-0 mt-0.5 text-white/80" />
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-white/60 font-sans mb-1">Chabbat</p>
              <p className="font-sans text-sm text-white/90 leading-relaxed">
                Nuit et Chabbat à Setai Bayit BaGalil, en Galilée.
              </p>
            </div>
          </div>

          <a
            href="https://www.google.com/maps/search/?api=1&query=Setai+Bayit+BaGalil"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-sans hover:text-[#ad1414] transition-colors"
          >
            <MapPin className="h-3.5 w-3.5" />
            <span className="underline decoration-transparent hover:decoration-[#ad1414] underline-offset-2 transition-colors">
              Setai Bayit BaGalil
            </span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-6 text-center">
        <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          © STAYMAKOM · Expériences sur-mesure en Israël
        </p>
      </footer>
    </div>
  );
};

export default ItineraireTsfat;
