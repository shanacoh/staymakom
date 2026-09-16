import V3Header from "@/components/V3Header";
import { MapPin, Utensils, Grape, Mountain, Sparkles, Moon, Trees } from "lucide-react";
import heroImg from "@/assets/hero-road-desert.jpg";

type Moment = {
  icon: "map" | "food" | "wine" | "nature" | "sparkle" | "moon";
  label: string;
  text: string;
};

type ChoiceOption = {
  title: string;
  text: string;
};

type Day = {
  number: string;
  title: string;
  tagline: string;
  moments: Moment[];
  choice?: {
    intro: string;
    options: ChoiceOption[];
  };
  afterChoice?: Moment[];
  highlight?: boolean;
};

const ICONS = {
  map: MapPin,
  food: Utensils,
  wine: Grape,
  nature: Mountain,
  sparkle: Sparkles,
  moon: Moon,
};

const DAYS: Day[] = [
  {
    number: "01",
    title: "Arrivée & premières découvertes",
    tagline: "De l'aéroport aux ruelles de pierre blonde",
    moments: [
      { icon: "map", label: "Route depuis Tel Aviv", text: "Départ en voiture vers les collines de Jérusalem, jusqu'à votre hébergement." },
      { icon: "map", label: "Village de charme", text: "Ein Karem, l'un des villages les plus photogéniques de la région : ruelles en pierre, points de vue sur la vallée, terrasses ombragées." },
      { icon: "wine", label: "Première dégustation", text: "Un domaine viticole familial niché en pleine nature, à quelques minutes de votre hébergement." },
      { icon: "food", label: "Dîner", text: "Une adresse au style asiatique contemporain, nichée dans les collines." },
    ],
  },
  {
    number: "02",
    title: "Village de caractère & aventure",
    tagline: "Ruelles animées le matin, pistes sauvages l'après-midi",
    moments: [
      { icon: "map", label: "Abu Gosh", text: "Un village au charme unique, une église croisée classée, et une réputation bien méritée pour ses tables généreuses." },
      { icon: "food", label: "Déjeuner", text: "L'une des meilleures tables de la région, spécialiste incontesté d'un plat culte du pays." },
      { icon: "nature", label: "Jeep hors des sentiers battus", text: "Une virée encadrée de 2h à travers forêts et collines, sur des pistes que peu de visiteurs découvrent. Comptez environ 1 500 NIS pour le groupe." },
      { icon: "food", label: "Dîner", text: "Une table réputée nichée dans un kibboutz voisin, cuisine de ferme et produits locaux." },
    ],
    highlight: true,
  },
  {
    number: "03",
    title: "Randonnée & une surprise à choisir",
    tagline: "Terrasses millénaires le matin, une expérience rien qu'à vous l'après-midi",
    moments: [
      { icon: "nature", label: "Randonnée", text: "À travers des terrasses agricoles millénaires, des sources naturelles et des vergers, pour l'un des plus beaux panoramas sur les collines de Jérusalem." },
    ],
    choice: {
      intro: "En route vers votre second hébergement, une expérience à choisir ensemble selon vos envies :",
      options: [
        { title: "Rencontre équestre", text: "Une balade à cheval dans un ranch familial, au cœur des collines." },
        { title: "Ferme caprine", text: "Visite d'une ferme familiale et dégustation de fromages artisanaux faits sur place." },
        { title: "Atelier de verre", text: "Initiation au soufflage du verre auprès d'un artisan verrier." },
        { title: "Balade à vélo", text: "Une sortie à vélo dans les Judean Hills, entre forêts et vignobles." },
      ],
    },
    afterChoice: [
      { icon: "food", label: "Dîner", text: "Une table typique de cuisine arabe locale, réputée dans un village voisin." },
    ],
  },
  {
    number: "04",
    title: "Jardin biblique & retour",
    tagline: "Une dernière matinée en douceur avant Tel Aviv",
    moments: [
      { icon: "map", label: "Jardin biblique", text: "Une promenade parmi les espèces mentionnées dans les textes sacrés, à même le domaine de votre hébergement." },
      { icon: "map", label: "Dernière halte", text: "Un café au panorama spectaculaire sur les collines, avant la route du retour." },
      { icon: "map", label: "Départ", text: "Retour vers Tel Aviv." },
    ],
  },
];

const EL = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <V3Header />

      {/* Hero */}
      <section className="relative h-[56vh] md:h-[62vh] min-h-[340px] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImg})` }}
        />
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-3xl mx-auto">
          <p
            className="text-xs uppercase tracking-[0.18em] text-white/70 font-sans mb-3 opacity-0 animate-hero-fade-up"
            style={{ animationDelay: "0ms" }}
          >
            STAYMAKOM · Séjour Sur Mesure
          </p>
          <h1
            className="font-sans text-[30px] sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-[0.02em] leading-[1.1] opacity-0 animate-hero-fade-up text-white text-center drop-shadow-lg"
            style={{ animationDelay: "150ms" }}
          >
            Collines de Jérusalem
          </h1>
          <p
            className="mt-4 text-sm sm:text-base text-white/85 font-sans uppercase tracking-[0.14em] opacity-0 animate-hero-fade-up"
            style={{ animationDelay: "300ms" }}
          >
            4 jours · 3 nuits · 4 personnes · Aller-retour Tel Aviv
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="pt-14 pb-4 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-sans text-lg sm:text-xl text-foreground/80 leading-relaxed italic">
            À moins d'une heure de Tel Aviv, les collines de Jérusalem concentrent villages de pierre millénaires,
            domaines viticoles familiaux, ateliers d'artisans et paysages de terrasses agricoles vieilles de 2000 ans.
            Un condensé d'expériences authentiques, loin des foules.
          </p>
        </div>
      </section>

      {/* Days */}
      <section className="pt-8 pb-6 px-4 scroll-mt-16">
        <div className="max-w-3xl mx-auto space-y-8">
          {DAYS.map((day) => (
            <div
              key={day.number}
              className={
                "rounded-2xl overflow-hidden border " +
                (day.highlight ? "border-[#ad1414]/25 bg-[#fdf0ef]" : "border-border bg-muted/40")
              }
            >
              <div className="px-6 sm:px-8 pt-7 pb-5 flex items-start gap-4">
                <div
                  className={
                    "shrink-0 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border font-sans text-sm font-bold " +
                    (day.highlight ? "bg-[#ad1414] border-[#ad1414] text-white" : "bg-white border-border text-foreground")
                  }
                >
                  {day.number}
                </div>
                <div>
                  <h2 className="font-sans text-xl sm:text-2xl font-bold uppercase tracking-[-0.01em] text-foreground leading-tight">
                    {day.title}
                  </h2>
                  <p className="mt-1 text-sm text-foreground/60 italic font-sans">{day.tagline}</p>
                </div>
              </div>

              <div className="px-6 sm:px-8 pb-7 pt-1 bg-white/60">
                <div className="space-y-3">
                  {day.moments.map((moment) => {
                    const Icon = ICONS[moment.icon];
                    return (
                      <div key={moment.label} className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#ad1414]/10">
                          <Icon className="h-3.5 w-3.5 text-[#ad1414]" />
                        </div>
                        <div>
                          <p className="font-sans text-sm font-bold uppercase tracking-[0.02em] text-foreground">
                            {moment.label}
                          </p>
                          <p className="text-sm text-foreground/75 leading-relaxed font-sans">{moment.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {day.choice && (
                  <div className="mt-5">
                    <p className="text-sm text-foreground/80 font-sans mb-3">{day.choice.intro}</p>
                    <div className="rounded-xl bg-[#f6ece1] px-5 py-5 space-y-4">
                      {day.choice.options.map((option) => (
                        <div key={option.title}>
                          <p className="font-sans text-sm font-bold text-foreground">{option.title}</p>
                          <p className="text-sm text-foreground/75 leading-relaxed font-sans">{option.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {day.afterChoice && (
                  <div className="space-y-3 mt-5">
                    {day.afterChoice.map((moment) => {
                      const Icon = ICONS[moment.icon];
                      return (
                        <div key={moment.label} className="flex items-start gap-3">
                          <div className="shrink-0 mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#ad1414]/10">
                            <Icon className="h-3.5 w-3.5 text-[#ad1414]" />
                          </div>
                          <div>
                            <p className="font-sans text-sm font-bold uppercase tracking-[0.02em] text-foreground">
                              {moment.label}
                            </p>
                            <p className="text-sm text-foreground/75 leading-relaxed font-sans">{moment.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hébergement */}
      <section className="pt-8 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-sans mb-2">Hébergement</p>
            <h2 className="font-sans text-2xl sm:text-3xl font-bold uppercase tracking-[-0.02em] text-foreground">
              Votre adresse pour le séjour
            </h2>
          </div>

          <div className="max-w-sm mx-auto rounded-2xl border border-border bg-muted/40 px-6 py-8 flex flex-col items-center text-center">
            <Trees className="h-6 w-6 text-[#ad1414] mb-3" />
            <p className="font-sans text-lg font-bold uppercase tracking-[-0.01em] text-foreground mb-1">
              Shoresh Green Hills
            </p>
            <p className="text-sm text-foreground/60 font-sans mb-3">3 nuits au cœur des collines de Jérusalem</p>
            <p className="font-sans text-2xl font-bold text-foreground">≈ 1 250 €</p>
          </div>

          <div className="mt-10 rounded-2xl bg-foreground text-white px-6 py-6 flex items-start gap-3">
            <Moon className="h-5 w-5 shrink-0 mt-0.5 text-white/80" />
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-white/60 font-sans mb-1">Sur-mesure</p>
              <p className="font-sans text-sm text-white/90 leading-relaxed">
                Chaque étape de ce séjour peut être ajustée selon vos envies : rythme, expériences, hébergement.
              </p>
            </div>
          </div>
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

export default EL;
