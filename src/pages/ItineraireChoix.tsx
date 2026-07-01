import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import desertBg from "@/assets/desert-hero.jpg";

// Photos destination — Option A
import imgCesarea from "@/assets/cesarea.jpg";
import imgWine from "@/assets/wine.png";
import imgKineret from "@/assets/kineret.png";
import imgSafed from "@/assets/safed.webp";
import imgBeitShean from "@/assets/Beit Shean.png";
import imgGanHashlosha from "@/assets/gan-hashlosha.jpg";

// Photos destination — Option B
import imgMasada from "@/assets/masada-sunrise.jpg";
import imgMerMorte from "@/assets/mermorte.png";
import imgBedouin from "@/assets/bedouin-tents-comfortably.jpg";
import imgChameau from "@/assets/chameau-dans-le-désert-du-néguev-51448703.webp";
import imgWellness from "@/assets/Wellness.jpg";
import imgTimna from "@/assets/timna-park-eilat-nature.webp";

// ─── Numéro WhatsApp ← à remplacer ───────────────────────────────────────────
const WHATSAPP = "972501234567";

// ─── Backgrounds ─────────────────────────────────────────────────────────────
const NORD_STYLE: CSSProperties = { backgroundColor: "rgba(173, 20, 20, 0.06)" };
// Image en fond avec transparence 26% : un dégradé blanc à 74% par-dessus l'image
const DESERT_STYLE: CSSProperties = {
  backgroundImage: `linear-gradient(rgba(255,255,255,0.74), rgba(255,255,255,0.74)), url(${desertBg})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stop {
  title: string;
  description: string;
  tags: string[];
  image: string;
}

interface OptionData {
  id: "A" | "B";
  label: string;
  title: string;
  chapeau: string;
  stops: Stop[];
  whatsappMsg: string;
}

// ─── Option A — Le Nord ───────────────────────────────────────────────────────

const OPTION_NORD: OptionData = {
  id: "A",
  label: "Option A",
  title: "Ralentir à deux",
  chapeau:
    "Du vert, de la fraîcheur, des villages en pierre et un lac pour se baigner. Vous roulez entre vignobles et villages en pierre, vous vous baignez dans le lac de Kinneret, vous vous perdez dans les ruelles bleues de Tsfat. Le soir, un verre de vin face au coucher de soleil. Ici on ralentit, on marche, on flotte, on goûte.",
  stops: [
    {
      title: "Césarée",
      description: "Cité romaine posée sur la mer. Amphithéâtre, port antique, ruines qui se baignent dans les vagues.",
      tags: ["🌊 Bord de mer", "☕ Café", "🎨 Galerie d'art"],
      image: imgCesarea,
    },
    {
      title: "Wine tasting à Zichron Yaakov",
      description: "Village de vignerons en pierre blonde, ambiance provençale. Dégustation face aux vignes, au coucher du soleil.",
      tags: ["🍷 Vin", "🌅 Coucher de soleil", "🏘 Village"],
      image: imgWine,
    },
    {
      title: "Journée baignade, Kinneret",
      description: "Le seul vrai lac où se baigner en Israël. Balade à cheval au bord de l'eau, sortie en bateau, randonnée dans les environs.",
      tags: ["🐎 Balade à cheval", "⛵ Bateau", "🥾 Randonnée"],
      image: imgKineret,
    },
    {
      title: "Ruelles bleues de Tsfat",
      description: "La ville mystique de la Kabbale. Ateliers d'artistes, galeries à ciel ouvert, une atmosphère unique dans le pays.",
      tags: ["✨ Mystique", "🎨 Art", "🔵 Kabbale"],
      image: imgSafed,
    },
    {
      title: "Balade nocturne dans les ruines, Beit She'an",
      description: "Un des sites romains les mieux conservés du pays, illuminé le soir. Colonnades à perte de vue, théâtre antique intact.",
      tags: ["🏛 Romain", "🎭 Théâtre", "🌙 Nocturne"],
      image: imgBeitShean,
    },
    {
      title: "Baignade dans les sources, Gan HaShlosha",
      description: "Piscines naturelles à température parfaite, entourées de palmiers. Un pique-nique au bord de l'eau, à l'ombre.",
      tags: ["💧 Source", "🌴 Palmiers", "🧺 Pique-nique"],
      image: imgGanHashlosha,
    },
  ],
  whatsappMsg: "Bonjour Shana ! J'ai vu la proposition et je pars vers le nord.",
};

// ─── Option B — Le Désert ─────────────────────────────────────────────────────

const OPTION_DESERT: OptionData = {
  id: "B",
  label: "Option B",
  title: "Se perdre à deux",
  chapeau:
    "Histoire, sel, sable et un ciel qu'on ne voit qu'ici. Vous grimpez à Massada avant le lever du soleil, vous flottez dans la Mer Morte, vous dormez sous tente chez les bédouins avec un ciel plein d'étoiles. Une balade à dos de chameau au petit matin, un cratère à perte de vue. Ici on se dépayse vraiment.",
  stops: [
    {
      title: "Lever de soleil sur Massada",
      description: "La forteresse du roi Hérode perchée au-dessus du désert. Vue à 360° sur la Mer Morte au petit matin.",
      tags: ["🌄 Lever de soleil", "🏰 Forteresse", "👑 Hérode"],
      image: imgMasada,
    },
    {
      title: "Flotter dans la Mer Morte",
      description: "L'eau la plus salée du monde. Un moment suspendu, loin de tout, à se laisser porter.",
      tags: ["🧖 Spa naturel", "🏊 Baignade", "🔌 Déconnexion"],
      image: imgMerMorte,
    },
    {
      title: "Nuit sous les étoiles chez les bédouins",
      description: "Feu de camp, dîner traditionnel, loin de toute lumière. Le ciel étoilé coupe le souffle.",
      tags: ["✨ Étoiles", "🔥 Feu de camp", "🍽 Dîner traditionnel"],
      image: imgBedouin,
    },
    {
      title: "Balade à dos de chameau au lever du jour",
      description: "Sur les dunes, avec petit-déjeuner bédouin à l'arrivée. Le moment qui fait vraiment sentir qu'on est ailleurs.",
      tags: ["🐪 Chameau", "🌄 Lever du jour", "☕ Petit-déj"],
      image: imgChameau,
    },
    {
      title: "Pause bien-être au cœur du désert",
      description: "Spa, soins, grands espaces pour ne rien faire. Le contrepoint calme du voyage.",
      tags: ["🧘 Yoga", "🔌 Déconnexion", "🧖 Spa"],
      image: imgWellness,
    },
    {
      title: "Timna Park",
      description: "Paysages presque martiens, formations rocheuses spectaculaires. Les piliers de Salomon au coucher du soleil.",
      tags: ["🪐 Martien", "🗿 Piliers", "🎨 Désert coloré"],
      image: imgTimna,
    },
  ],
  whatsappMsg: "Bonjour Shana ! J'ai vu la proposition et je pars vers le désert.",
};

// ─── Carte destination ─────────────────────────────────────────────────────────

function StopCard({ stop }: { stop: Stop }) {
  return (
    <div className="group flex flex-col gap-2">
      <div className="aspect-[4/3] overflow-hidden rounded-xl">
        <img
          src={stop.image}
          alt={stop.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
      </div>
      <div className="space-y-1">
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-tight text-foreground leading-tight">
          {stop.title}
        </p>
        <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
          {stop.description}
        </p>
        <div className="flex flex-wrap gap-1 pt-0.5">
          {stop.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center rounded-full px-1.5 py-px bg-muted text-[9px] text-muted-foreground font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Cellule en-tête ──────────────────────────────────────────────────────────

function OptionHeader({ option, className, style }: { option: OptionData; className?: string; style?: CSSProperties }) {
  return (
    <div className={cn("px-6 pt-8 pb-6", className)} style={style}>
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#ad1414] mb-3">
        {option.label}
      </p>
      <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-[-0.02em] text-foreground leading-tight mb-4">
        {option.title}
      </h2>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {option.chapeau}
      </p>
    </div>
  );
}

// ─── Rangée de 2 cartes ───────────────────────────────────────────────────────

function CardRow({ stops, className, style }: { stops: Stop[]; className?: string; style?: CSSProperties }) {
  return (
    <div className={cn("p-4 sm:p-6 grid grid-cols-2 gap-3 sm:gap-4", className)} style={style}>
      {stops.map((stop) => (
        <StopCard key={stop.title} stop={stop} />
      ))}
    </div>
  );
}

// ─── Cellule CTA ──────────────────────────────────────────────────────────────

function OptionCTA({ option, className, style }: { option: OptionData; className?: string; style?: CSSProperties }) {
  const waLink = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(option.whatsappMsg)}`;
  return (
    <div className={cn("p-6", className)} style={style}>
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "group inline-flex items-center justify-center gap-2 w-full",
          "px-6 py-2.5 rounded-full",
          "border border-foreground bg-transparent text-foreground",
          "text-xs font-bold uppercase tracking-widest",
          "hover:bg-foreground hover:text-background transition-colors duration-300"
        )}
      >
        Je choisis {option.id === "A" ? "le nord" : "le désert"}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </a>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ItineraireChoix() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1">

        {/* Intro */}
        <section className="text-center py-10 md:py-14 px-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-3">
            10 au 24 août
          </p>
          <h1 className="font-sans text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-[-0.03em] text-[#ad1414] leading-tight">
            Découvrir Israël à deux
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-4 max-w-md mx-auto leading-relaxed">
            Du 10 au 17 août vous êtes à Tel Aviv.
            Pour la suite, j'ai imaginé deux directions très différentes.
            Choisis celle qui vous appelle.
          </p>
        </section>

        {/*
          Layout desktop : grille 2 colonnes.
          - Option A : 5 cellules indépendantes, toutes placées en col 1 (md:col-start-1).
          - Option B : UN seul bloc en col 2 (md:col-start-2) qui s'étire sur 5 rangées
            via md:row-span-5. L'image désert couvre ce bloc du haut en bas.
            Sur desktop, md:grid avec grid-template-rows:subgrid aligne les rangées
            internes B sur les rangées de la grille parente → alignement parfait.
          Layout mobile : flex-col avec order-* pour afficher A puis B.
        */}
        <div className="border-t border-border flex flex-col md:grid md:grid-cols-2">

          {/* ── Option A : cellules col 1 ── */}
          <OptionHeader option={OPTION_NORD} style={NORD_STYLE}
            className="order-1 md:order-none md:col-start-1" />
          <CardRow stops={OPTION_NORD.stops.slice(0, 2)} style={NORD_STYLE}
            className="order-2 md:order-none md:col-start-1" />
          <CardRow stops={OPTION_NORD.stops.slice(2, 4)} style={NORD_STYLE}
            className="order-3 md:order-none md:col-start-1" />
          <CardRow stops={OPTION_NORD.stops.slice(4, 6)} style={NORD_STYLE}
            className="order-4 md:order-none md:col-start-1" />
          {/* ── Option B : UN bloc col 2, fond désert de haut en bas ── */}
          {/* gridRow/gridColumn en inline style pour forcer le placement (l'auto-placement CSS
              déplace le curseur après les 4 cellules A et placerait B en ligne 5 sinon) */}
          <div
            className="order-5 md:order-none md:grid"
            style={{
              ...DESERT_STYLE,
              gridColumn: "2",
              gridRow: "1 / 5",
              gridTemplateRows: "subgrid",
            }}
          >
            <OptionHeader option={OPTION_DESERT} />
            <CardRow stops={OPTION_DESERT.stops.slice(0, 2)} />
            <CardRow stops={OPTION_DESERT.stops.slice(2, 4)} />
            <CardRow stops={OPTION_DESERT.stops.slice(4, 6)} />
          </div>

        </div>
      </main>
    </div>
  );
}
