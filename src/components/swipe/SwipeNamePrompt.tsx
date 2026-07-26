import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SwipeNamePromptProps {
  nomClient: string;
  participantsExistants: { participant_id: string; prenom: string }[];
  onDemarrer: (prenom: string) => void;
  chargement: boolean;
}

export const SwipeNamePrompt = ({ nomClient, participantsExistants, onDemarrer, chargement }: SwipeNamePromptProps) => {
  const [prenom, setPrenom] = useState("");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center">
      <p className="text-[#AD1414] text-sm font-semibold uppercase tracking-widest mb-2">{nomClient}</p>
      <h1 className="text-3xl font-bold text-[#1a1a1a] mb-8">Quel est ton prénom ?</h1>

      {participantsExistants.length > 0 && (
        <div className="w-full max-w-xs mb-6">
          <p className="text-sm text-[#1a1a1a]/60 mb-2">Déjà commencé ?</p>
          <div className="flex flex-wrap justify-center gap-2">
            {participantsExistants.map((p) => (
              <button
                key={p.participant_id}
                onClick={() => onDemarrer(p.prenom)}
                disabled={chargement}
                className="px-4 py-2 rounded-full border border-[#1a1a1a]/15 text-sm hover:border-[#AD1414] hover:text-[#AD1414] transition-colors"
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
          placeholder="Ton prénom"
          className="text-center text-lg h-12"
          autoFocus
        />
        <Button
          className="w-full h-12 bg-[#AD1414] hover:bg-[#AD1414]/90 text-base"
          disabled={!prenom.trim() || chargement}
          onClick={() => onDemarrer(prenom.trim())}
        >
          Commencer
        </Button>
      </div>
    </div>
  );
};
