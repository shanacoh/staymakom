import { useEffect, useMemo, useState } from "react";
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
import { localizeSwipeDeckCard, localizeText, swipeText } from "@/lib/swipe/localization";
import { useLanguage } from "@/hooks/useLanguage";
import { SwipeLanguageToggle } from "@/components/swipe/SwipeLanguageToggle";
import { SwipeDossierIntro } from "@/components/swipe/SwipeDossierIntro";
import { SwipeNamePrompt } from "@/components/swipe/SwipeNamePrompt";
import { SwipeIntro } from "@/components/swipe/SwipeIntro";
import { SwipeDeck } from "@/components/swipe/SwipeDeck";
import { SwipeDeckParCategorie } from "@/components/swipe/SwipeDeckParCategorie";
import { SwipeRecap } from "@/components/swipe/SwipeRecap";
import { SwipeThankYou } from "@/components/swipe/SwipeThankYou";

type Etape = "message" | "prenom" | "intro" | "deck" | "recap" | "merci";

const SwipePublic = () => {
  const { token } = useParams<{ token: string }>();
  const { data: dossier, isLoading: dossierEnChargement, isFetched: dossierCharge } = useSwipeDossierByToken(token);
  const { data: participantsExistants } = useSwipeParticipantsByToken(token);
  const { data: deckBrut, isLoading: deckEnChargement } = useSwipeDeckByToken(token);

  const getOrCreateParticipant = useGetOrCreateParticipant();
  const upsertSwipe = useUpsertSwipe();
  const cancelSwipe = useCancelSwipe();
  const setCoupDeCoeur = useSetCoupDeCoeur();

  // Même hook et même mécanisme (?lang= dans l'URL, préférence mémorisée) que le reste du site :
  // un client qui a déjà choisi sa langue sur staymakom.com la retrouve directement ici.
  const { lang, setLanguage } = useLanguage();

  const [etape, setEtape] = useState<Etape>("message");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Map<string, { valeur: boolean; card: SwipeDeckCard }>>(new Map());
  const [indispensables, setIndispensables] = useState<Set<string>>(new Set());

  const deck = useMemo(
    () => deckBrut?.map((carte) => localizeSwipeDeckCard(carte, lang)),
    [deckBrut, lang]
  );

  const messageIntro = dossier
    ? localizeText(dossier.message_intro, dossier.message_intro_en, dossier.message_intro_he, lang)
    : null;

  // Le message d'accueil est facultatif : s'il n'a pas été rempli par l'admin pour ce dossier,
  // on passe directement à l'écran du prénom dès que le dossier est chargé.
  useEffect(() => {
    if (dossier && !messageIntro && etape === "message") setEtape("prenom");
  }, [dossier, messageIntro, etape]);

  // Verrouille le défilement de la page entière (façon appli plein écran) : sans ça, iOS
  // Safari autorise un léger rebond élastique en haut/bas même quand tout tient à l'écran.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const precedent = {
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
      bodyPosition: body.style.position,
      bodyWidth: body.style.width,
      bodyHeight: body.style.height,
    };
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    body.style.position = "fixed";
    body.style.width = "100%";
    body.style.height = "100%";
    return () => {
      html.style.overflow = precedent.htmlOverflow;
      html.style.overscrollBehavior = precedent.htmlOverscroll;
      body.style.overflow = precedent.bodyOverflow;
      body.style.overscrollBehavior = precedent.bodyOverscroll;
      body.style.position = precedent.bodyPosition;
      body.style.width = precedent.bodyWidth;
      body.style.height = precedent.bodyHeight;
    };
  }, []);

  const demarrer = async (prenom: string) => {
    if (!token) return;
    try {
      const id = await getOrCreateParticipant.mutateAsync({ token, prenom });
      setParticipantId(id);
      setEtape("intro");
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
      <div className="relative h-dvh w-full overflow-hidden flex items-center justify-center bg-[#FAF8F4]">
        <SwipeLanguageToggle lang={lang} onChange={setLanguage} />
        <Loader2 className="w-8 h-8 animate-spin text-[#AD1414]" />
      </div>
    );
  }

  if (!dossier) {
    return (
      <div
        dir={lang === "he" ? "rtl" : "ltr"}
        className="relative h-dvh w-full overflow-hidden flex flex-col items-center justify-center bg-[#FAF8F4] px-6 text-center"
      >
        <SwipeLanguageToggle lang={lang} onChange={setLanguage} />
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">{swipeText.swipePublic.invalidLinkTitle[lang]}</h1>
        <p className="text-[#1a1a1a]/60">{swipeText.swipePublic.invalidLinkSubtitle[lang]}</p>
      </div>
    );
  }

  return (
    <div dir={lang === "he" ? "rtl" : "ltr"} className="relative h-dvh w-full overflow-hidden bg-[#FAF8F4] font-sans">
      <SwipeLanguageToggle lang={lang} onChange={setLanguage} />

      {etape === "message" && messageIntro && (
        <SwipeDossierIntro lang={lang} message={messageIntro} onContinuer={() => setEtape("prenom")} />
      )}

      {etape === "prenom" && (
        <SwipeNamePrompt
          lang={lang}
          nomClient={dossier.nom_client}
          participantsExistants={participantsExistants ?? []}
          nomsProposes={dossier.noms_participants}
          onDemarrer={demarrer}
          chargement={getOrCreateParticipant.isPending}
        />
      )}

      {etape === "intro" && <SwipeIntro lang={lang} onCommencer={() => setEtape("deck")} />}

      {etape === "deck" && (
        <div className="h-full flex flex-col">
          {deckEnChargement || !deck ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#AD1414]" />
            </div>
          ) : deck.length === 0 ? (
            <p className="flex-1 flex items-center justify-center text-[#1a1a1a]/60 px-6 text-center">
              {swipeText.swipePublic.emptyDeck[lang]}
            </p>
          ) : dossier.trier_par_categorie ? (
            <SwipeDeckParCategorie
              lang={lang}
              cards={deck}
              onSwipeCard={onSwipeCard}
              onUndoCard={onUndoCard}
              onComplete={() => setEtape("recap")}
            />
          ) : (
            <SwipeDeck
              lang={lang}
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
          lang={lang}
          likedCards={likedCards}
          indispensables={indispensables}
          onToggleIndispensable={onToggleIndispensable}
          onTerminer={() => setEtape("merci")}
        />
      )}

      {etape === "merci" && <SwipeThankYou lang={lang} />}
    </div>
  );
};

export default SwipePublic;
