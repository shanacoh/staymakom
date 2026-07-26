import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  useSwipeDossierByToken,
  useSwipeParticipantsByToken,
  useSwipeDeckByToken,
  useGetOrCreateParticipant,
  useUpsertSwipe,
  useCancelSwipe,
  useSetCoupDeCoeur,
} from "@/lib/swipe/queries";
import type { SwipeDeckCard } from "@/lib/swipe/types";
import { SwipeNamePrompt } from "@/components/swipe/SwipeNamePrompt";
import { SwipeDeck } from "@/components/swipe/SwipeDeck";
import { SwipeRecap } from "@/components/swipe/SwipeRecap";
import { SwipeThankYou } from "@/components/swipe/SwipeThankYou";

type Etape = "prenom" | "deck" | "recap" | "merci";

const SwipePublic = () => {
  const { token } = useParams<{ token: string }>();
  const { data: dossier, isLoading: dossierEnChargement, isFetched: dossierCharge } = useSwipeDossierByToken(token);
  const { data: participantsExistants } = useSwipeParticipantsByToken(token);
  const { data: deck, isLoading: deckEnChargement } = useSwipeDeckByToken(token);

  const getOrCreateParticipant = useGetOrCreateParticipant();
  const upsertSwipe = useUpsertSwipe();
  const cancelSwipe = useCancelSwipe();
  const setCoupDeCoeur = useSetCoupDeCoeur();

  const [etape, setEtape] = useState<Etape>("prenom");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Map<string, { valeur: boolean; card: SwipeDeckCard }>>(new Map());
  const [indispensables, setIndispensables] = useState<Set<string>>(new Set());

  const demarrer = async (prenom: string) => {
    if (!token) return;
    try {
      const id = await getOrCreateParticipant.mutateAsync({ token, prenom });
      setParticipantId(id);
      setEtape("deck");
    } catch {
      // L'erreur est silencieuse ici : le bouton reste actif, l'utilisateur peut réessayer
    }
  };

  const onSwipeCard = (card: SwipeDeckCard, valeur: boolean) => {
    if (!token || !participantId) return;
    setDecisions((d) => new Map(d).set(card.dossier_proposition_id, { valeur, card }));
    upsertSwipe.mutate({ token, participantId, dossierPropositionId: card.dossier_proposition_id, valeur });
  };

  const onUndoCard = (card: SwipeDeckCard) => {
    if (!token || !participantId) return;
    setDecisions((d) => {
      const copie = new Map(d);
      copie.delete(card.dossier_proposition_id);
      return copie;
    });
    cancelSwipe.mutate({ token, participantId, dossierPropositionId: card.dossier_proposition_id });
  };

  const onToggleIndispensable = (card: SwipeDeckCard, valeur: boolean) => {
    if (!token || !participantId) return;
    setIndispensables((s) => {
      const copie = new Set(s);
      if (valeur) copie.add(card.dossier_proposition_id);
      else copie.delete(card.dossier_proposition_id);
      return copie;
    });
    setCoupDeCoeur.mutate({ token, participantId, dossierPropositionId: card.dossier_proposition_id, valeur });
  };

  const likedCards = useMemo(
    () => (deck ?? []).filter((c) => decisions.get(c.dossier_proposition_id)?.valeur === true),
    [deck, decisions]
  );

  if (dossierEnChargement || !dossierCharge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F4]">
        <Loader2 className="w-8 h-8 animate-spin text-[#AD1414]" />
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F4] px-6 text-center">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">Ce lien n'est plus valide</h1>
        <p className="text-[#1a1a1a]/60">Contacte ton conseiller de voyage pour obtenir un nouveau lien.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] font-sans">
      {etape === "prenom" && (
        <SwipeNamePrompt
          nomClient={dossier.nom_client}
          participantsExistants={participantsExistants ?? []}
          onDemarrer={demarrer}
          chargement={getOrCreateParticipant.isPending}
        />
      )}

      {etape === "deck" && (
        <div className="min-h-screen flex items-center justify-center py-8">
          {deckEnChargement || !deck ? (
            <Loader2 className="w-8 h-8 animate-spin text-[#AD1414]" />
          ) : deck.length === 0 ? (
            <p className="text-[#1a1a1a]/60 px-6 text-center">
              Aucune proposition n'a encore été ajoutée à ce dossier.
            </p>
          ) : (
            <SwipeDeck
              cards={deck}
              onSwipeCard={onSwipeCard}
              onUndoCard={onUndoCard}
              onComplete={() => setEtape("recap")}
            />
          )}
        </div>
      )}

      {etape === "recap" && (
        <SwipeRecap
          likedCards={likedCards}
          indispensables={indispensables}
          onToggleIndispensable={onToggleIndispensable}
          onTerminer={() => setEtape("merci")}
        />
      )}

      {etape === "merci" && <SwipeThankYou />}
    </div>
  );
};

export default SwipePublic;
