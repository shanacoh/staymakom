import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { swipeText, type SwipeLang } from "@/lib/swipe/localization";
import heroImage from "@/assets/hero-road-desert.jpg";

interface SwipeNamePromptProps {
  lang: SwipeLang;
  nomClient: string;
  participantsExistants: { participant_id: string; prenom: string }[];
  nomsProposes?: string[] | null;
  onDemarrer: (prenom: string) => void;
  chargement: boolean;
}

export const SwipeNamePrompt = ({
  lang,
  nomClient,
  participantsExistants,
  nomsProposes,
  onDemarrer,
  chargement,
}: SwipeNamePromptProps) => {
  const [prenom, setPrenom] = useState("");
  const t = swipeText.namePrompt;
  const modeSelection = !!nomsProposes && nomsProposes.length > 0;

  return (
    <div className="relative h-full flex flex-col items-center justify-center px-6 py-6 text-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} />
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative z-10 w-full flex flex-col items-center">
        <span className="font-sans font-bold tracking-[-0.04em] uppercase text-xs text-[#AD1414] mb-2">
          STAYMAKOM
        </span>
        <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-3">{nomClient}</p>
        <h1 className="font-sans text-3xl font-bold uppercase tracking-[0.01em] leading-[1.1] text-white mb-8">
          {modeSelection ? t.selectTitle[lang] : t.title[lang]}
        </h1>

        {modeSelection ? (
          <div className="w-full max-w-xs space-y-3">
            {nomsProposes!.map((nom) => (
              <Button
                key={nom}
                className="w-full h-12 bg-[#AD1414] hover:bg-[#AD1414]/90 text-sm font-bold uppercase tracking-widest"
                disabled={chargement}
                onClick={() => onDemarrer(nom)}
              >
                {nom}
              </Button>
            ))}
          </div>
        ) : (
          <>
            {participantsExistants.length > 0 && (
              <div className="w-full max-w-xs mb-6">
                <p className="text-sm text-white/70 mb-2">{t.alreadyStarted[lang]}</p>
                <div className="flex flex-wrap justify-center gap-2 max-h-[18dvh] overflow-y-auto overscroll-contain">
                  {participantsExistants.map((p) => (
                    <button
                      key={p.participant_id}
                      onClick={() => onDemarrer(p.prenom)}
                      disabled={chargement}
                      className="px-4 py-2 rounded-full bg-white/90 border border-white text-sm text-[#1a1a1a] hover:bg-white transition-colors"
                    >
                      {p.prenom}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="w-full max-w-xs space-y-3">
              <Input
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && prenom.trim() && onDemarrer(prenom.trim())}
                placeholder={t.placeholder[lang]}
                className="text-center text-lg h-12 bg-white"
                autoFocus
              />
              <Button
                className="w-full h-12 bg-[#AD1414] hover:bg-[#AD1414]/90 text-sm font-bold uppercase tracking-widest"
                disabled={!prenom.trim() || chargement}
                onClick={() => onDemarrer(prenom.trim())}
              >
                {t.start[lang]}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
