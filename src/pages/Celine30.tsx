import LaunchHeader from "@/components/LaunchHeader";
import tasteImg from "@/assets/option1.jpg";
import poolImg from "@/assets/option2.jpg";
import desertImg from "@/assets/option3.png";
import activeImg from "@/assets/option4.png";
import heroImg from "@/assets/hero-road-desert.jpg";

const OPTIONS = [
  {
    id: "wine",
    number: "01",
    title: "Wine Tasting",
    location: "Zikhron Yaakov ou Galilée",
    highlights: [
      "Dégustation de vins avec option accords fromages ou chocolats artisanaux",
      "Domaine viticole privatisé pouvant accueillir l'ensemble du groupe",
      "Expérience idéale pour une escapade d'une demi-journée ou une journée complète",
    ],
    img: tasteImg,
  },
  {
    id: "villa",
    number: "02",
    title: "Villa Privée & Chef à Domicile",
    location: "Proche de Tel Aviv ou dans un cadre plus exclusif",
    highlights: [
      "Villa privatisée avec piscine pour tout le groupe",
      "Chef privé, repas sur mesure et organisation entièrement prise en charge",
      "À quelques minutes de Tel Aviv ou dans une villa d'exception au cœur d'un décor unique",
    ],
    img: poolImg,
  },
  {
    id: "desert",
    number: "03",
    title: "Aventure dans le Désert",
    location: "Néguev",
    highlights: [
      "Excursion en Jeep à travers les paysages spectaculaires du désert",
      "Feu de camp, dîner convivial et soirée sous les étoiles",
      "Nuit en glamping premium",
    ],
    img: desertImg,
  },
  {
    id: "boat",
    number: "04",
    title: "Journée en Bateau",
    location: "Côte Méditerranéenne",
    highlights: [
      "Bateau privatisé pour l'ensemble du groupe",
      "Boissons, apéritif et musique à bord",
      "Plusieurs escales pour se baigner et profiter de la mer",
    ],
    img: activeImg,
  },
];

const Celine30 = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <LaunchHeader forceScrolled={true} />

      {/* ── Hero ── */}
      <section className="relative h-[49vh] md:h-[54vh] min-h-[300px] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImg})` }}
        />
        <div className="absolute inset-0 bg-black/15" />

        <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-3xl mx-auto">
          <p
            className="text-xs uppercase tracking-[0.18em] text-white/70 font-sans mb-3 opacity-0 animate-hero-fade-up"
            style={{ animationDelay: "0ms" }}
          >
            STAYMAKOM · Proposition Privée
          </p>
          <h1
            className="font-sans text-[28px] sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-[0.02em] leading-[1.1] opacity-0 animate-hero-fade-up text-white text-center drop-shadow-lg"
            style={{ animationDelay: "150ms" }}
          >
            Céline<br />Turning 30
          </h1>
        </div>
      </section>

      {/* ── Intro callout ── */}
      <section className="bg-white py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="border-l-4 border-[#ad1414] bg-white/60 backdrop-blur-sm rounded-r-xl px-5 py-4">
            <p className="font-sans text-sm text-foreground leading-relaxed italic">
              Voici 4 idées de pistes à explorer. Si l'une te plaît, je peux t'aider à regarder les dates, le budget et les détails, dis-moi juste laquelle t'attire.
            </p>
          </div>
        </div>
      </section>

      {/* ── Options ── */}
      <section id="options" className="pb-16 px-4 scroll-mt-16">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="text-center mb-8 space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-sans">UNE SÉLECTION POUR VOUS</p>
            <h2 className="font-sans text-2xl sm:text-3xl font-bold uppercase tracking-[-0.02em] text-foreground">
              4 Pistes à Explorer
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {OPTIONS.map((opt) => (
              <div
                key={opt.id}
                className="group relative rounded-2xl overflow-hidden aspect-[4/3] cursor-default"
              >
                {/* Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                  style={{ backgroundImage: `url(${opt.img})` }}
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* Badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-white/10 border border-white/25 backdrop-blur-sm text-white text-[10px] uppercase tracking-[0.14em] font-medium">
                    Option {opt.number}
                  </span>
                </div>

                {/* Contenu */}
                <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/60 font-sans">
                    {opt.location}
                  </p>
                  <h3 className="font-sans text-xl font-bold uppercase tracking-[-0.01em] text-white leading-tight">
                    {opt.title}
                  </h3>
                  <ul className="space-y-1 pt-1">
                    {opt.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-1.5 text-xs text-white/80">
                        <span className="text-[#ad1414] mt-0.5 leading-none">•</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-border py-6 text-center">
        <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          © STAYMAKOM · Expériences sur-mesure en Israël
        </p>
      </footer>
    </div>
  );
};

export default Celine30;
