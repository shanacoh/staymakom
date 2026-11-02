import V3Header from "@/components/V3Header";
import heroImg from "@/assets/hero-road-desert.jpg";
import desertImg from "@/assets/ilona-neguev.jpg";
import wineImg from "@/assets/ilona-zichron.jpg";
import safedImg from "@/assets/ilona-tsfat.jpg";
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
    title: "Le Néguev",
    tagline: "Le désert, ses grands espaces et ses nuits étoilées",
    image: desertImg,
    highlights: [
      "Nuit dans un hôtel de charme en plein désert, sous les étoiles",
      "Balade à cheval, à dos de chameau ou en jeep au coucher du soleil",
      "Dégustation de vin dans un domaine du désert ou séance photo à deux",
    ],
    whatsappMsg: "Bonjour, c'est Ilona ! L'escapade dans le Néguev nous inspire beaucoup 😍",
  },
  {
    id: "zichron",
    number: "02",
    title: "Zichron Yaakov et Césarée",
    tagline: "Vignobles, vieilles pierres et coucher de soleil sur la Méditerranée",
    image: wineImg,
    highlights: [
      "Balade dans l'ancien port romain de Césarée, au bord de la mer",
      "Dégustation dans un domaine viticole de la région",
      "Nuit et dîner dans le village de Zichron Yaakov",
    ],
    whatsappMsg: "Bonjour, c'est Ilona ! L'escapade Zichron Yaakov et Césarée nous inspire beaucoup 😍",
  },
  {
    id: "tsfat",
    number: "03",
    title: "Tsfat",
    tagline: "La ville bleue, entre forêt et ruelles d'artistes",
    image: safedImg,
    highlights: [
      "Balade à cheval dans la forêt de Biriya",
      "Visite de la vieille ville, de ses ruelles et de ses galeries d'artistes",
      "Nuit sur place, au calme dans les montagnes de Galilée",
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
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {ESCAPADES.map((esc) => (
            <div
              key={esc.id}
              className="flex flex-col rounded-2xl border border-border bg-muted/40 overflow-hidden"
            >
              <div
                className="aspect-[4/3] bg-cover bg-center"
                style={{ backgroundImage: `url(${esc.image})` }}
              />

              <div className="px-6 pt-6 pb-4">
                <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-[#ad1414] font-bold mb-2">
                  {esc.number}
                </p>
                <h2 className="font-sans text-xl font-bold uppercase tracking-[-0.01em] text-foreground">
                  {esc.title}
                </h2>
                <p className="mt-1.5 text-sm text-foreground/70 italic font-sans">
                  {esc.tagline}
                </p>
              </div>

              <div className="flex flex-col flex-1 px-6 pb-6">
                <ul className="space-y-1.5 mb-6">
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
                  className="mt-auto pt-0 self-start inline-flex items-center justify-center rounded-full bg-[#ad1414] px-6 py-2.5 text-sm font-sans font-medium text-white hover:bg-[#8f1010] transition-colors"
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
