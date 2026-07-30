import type { SwipeDeckCard } from "@/lib/swipe/types";

interface SwipeCardProps {
  card: SwipeDeckCard;
}

export const SwipeCard = ({ card }: SwipeCardProps) => {
  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl bg-[#1a1a1a] select-none">
      {card.photo_url ? (
        <img
          src={card.photo_url}
          alt={card.titre}
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#AD1414]/20 to-[#1a1a1a]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      {card.categorie_nom && (
        <span className="absolute top-4 left-4 bg-[#FAF8F4] text-[#AD1414] text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full">
          {card.categorie_nom}
        </span>
      )}

      {card.prix_client != null && (
        <span className="absolute top-4 right-4 bg-black/60 text-white text-sm font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
          {card.prix_client} €
        </span>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h2 className="text-white text-2xl font-bold leading-tight mb-1">{card.titre}</h2>
        {(card.nom_hotel || card.ville) && (
          <p className="text-white/80 text-sm">
            {card.nom_hotel}
            {card.nom_hotel && card.ville && <span className="mx-1 text-white/50">·</span>}
            {card.ville}
          </p>
        )}
        {card.description && (
          <p className="text-white/70 text-sm mt-2 whitespace-pre-line">{card.description}</p>
        )}
      </div>
    </div>
  );
};
