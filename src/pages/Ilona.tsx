import V3Header from "@/components/V3Header";
import heroImg from "@/assets/hero-road-desert.jpg";
import desertImg from "@/assets/desert-journey.jpg";
import wineImg from "@/assets/wine.png";
import safedImg from "@/assets/safed.webp";
import { WHATSAPP_NUMBER } from "@/constants/whatsapp";

type Escapade = {
  id: string;
  number: string;
  title: string;
  tagline: string;
  image: string;
  highlights: string[];
  whatsappMsg: string;
};

const ESCAPADES: Escapade[] = [
  {
    id: "neguev",
    number: "01",
    title: "Le désert du Néguev",
    tagline: "Grands espaces, silence et ciel étoilé, rien que pour vous deux",
    image: desertImg,
    highlights: [
      "Nuit au Kedma, en plein désert",
      "Une activité au choix : dégustation de vin dans un domaine du désert, séance photo à deux, balade en jeep ou sortie en buggy",
    ],
    whatsappMsg: "Bonjour, c'est Ilona ! L'escapade dans le Néguev nous inspire beaucoup 😍",
  },
  {
    id: "zichron",
    number: "02",
    title: "Zichron Yaakov et Césarée",
    tagline: "Vignes, pierres anciennes et coucher de soleil sur la Méditerranée",
    image: wineImg,
    highlights: [
      "Balade dans l'ancien port romain de Césarée",
      "Dégustation de vin dans un domaine de la région",
      "Nuit dans le charmant village de Zichron Yaakov",
    ],
    whatsappMsg: "Bonjour, c'est Ilona ! L'escapade Zichron Yaakov et Césarée nous inspire beaucoup 😍",
  },
  {
    id: "tsfat",
    number: "03",
    title: "Le grand classique : Tsfat",
    tagline: "Forêt, ruelles d'artistes et magie de la ville bleue",
    image: safedImg,
    highlights: [
      "Balade à cheval dans la forêt",
      "Visite de la vieille ville et de ses ruelles d'artistes",
      "Nuit sur place",
    ],
    whatsappMsg: "Bonjour, c'est Ilona ! L'escapade à Tsfat nous inspire beaucoup 😍",
  },
];

const waLink = (msg: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

const Ilona = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <V3Header />

      {/* ── Hero ── */}
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
            STAYMAKOM · Escapade Privée
          </p>
          <h1
            className="font-sans text-[28px] sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-[0.02em] leading-[1.1] opacity-0 animate-hero-fade-up text-white text-center drop-shadow-lg"
            style={{ animationDelay: "150ms" }}
          >
            30 ans en amoureux
          </h1>
          <p
            className="mt-4 text-sm sm:text-base text-white/85 font-sans uppercase tracking-[0.14em] opacity-0 animate-hero-fade-up"
            style={{ animationDelay: "300ms" }}
          >
            Pour Ilona · 2 nuits · Novembre 2026
          </p>
          <p
            className="mt-3 text-sm sm:text-base text-white/80 font-sans max-w-xl mx-auto leading-relaxed opacity-0 animate-hero-fade-up"
            style={{ animationDelay: "450ms" }}
          >
            Trois idées d'escapades romantiques pour fêter les 30 ans de votre mari. Tout est pensé kasher et compatible avec Shabbat.
          </p>
        </div>
      </section>

      {/* ── Escapades ── */}
      <section className="pt-12 pb-12 px-4">
        <div className="max-w-4xl mx-auto space-y-10">
          {ESCAPADES.map((esc) => (
            <div
              key={esc.id}
              className="rounded-2xl border border-border bg-muted/40 overflow-hidden"
            >
              <div
                className="aspect-[16/7] bg-cover bg-center"
                style={{ backgroundImage: `url(${esc.image})` }}
              />

              <div className="px-6 sm:px-8 pt-7 pb-5">
                <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-[#ad1414] font-bold mb-2">
                  {esc.number}
                </p>
                <h2 className="font-sans text-xl sm:text-2xl font-bold uppercase tracking-[-0.01em] text-foreground">
                  {esc.title}
                </h2>
                <p className="mt-1.5 text-sm text-foreground/70 italic font-sans">
                  {esc.tagline}
                </p>
              </div>

              <div className="px-6 sm:px-8 pb-7">
                <ul className="space-y-1.5">
                  {esc.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm text-foreground/80 font-sans leading-relaxed">
                      <span className="text-[#ad1414] mt-1 leading-none">•</span>
                      {h}
                    </li>
                  ))}
                </ul>
                <a
                  href={waLink(esc.whatsappMsg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-[#ad1414] px-6 py-2.5 text-sm font-sans font-medium text-white hover:bg-[#8f1010] transition-colors"
                >
                  Celle-ci nous inspire
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Suite ── */}
      <section className="pb-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-sans text-lg sm:text-xl font-bold uppercase tracking-[0.02em] text-foreground">
            Et ensuite ?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-foreground/75 font-sans leading-relaxed">
            Dites-nous ce qui vous inspire le plus, ou appelons-nous pour imaginer d'autres options.
            On choisit la date ensemble, on trouve l'hôtel qui rentre dans votre budget et on s'occupe de tout réserver.
          </p>
          <a
            href={waLink("Bonjour, c'est Ilona ! On peut s'appeler pour en parler ?")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center rounded-full border border-foreground/30 px-6 py-2.5 text-sm font-sans font-medium text-foreground hover:bg-muted transition-colors"
          >
            On s'appelle ?
          </a>
        </div>
      </section>

      <footer className="bg-white border-t border-border py-6 text-center">
        <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          © STAYMAKOM · The Israel most people never find
        </p>
      </footer>
    </div>
  );
};

export default Ilona;
