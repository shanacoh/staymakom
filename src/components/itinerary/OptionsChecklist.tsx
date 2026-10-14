import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { WHATSAPP_NUMBER } from "@/constants/whatsapp";

export type ChecklistQuestion = {
  title: string;
  description?: string;
  choices: string[];
};

type Props = {
  questions: ChecklistQuestion[];
  /** Choix ajouté à la fin de chaque question (ex. « let's discuss »). */
  undecidedChoice: string;
  /** Première ligne du message WhatsApp, avant les réponses cochées. */
  whatsappIntro: string;
};

/**
 * Questions à cases à cocher en fin de page itinéraire.
 * Rien n'est enregistré sur le site : les réponses partent dans un message WhatsApp pré-rempli.
 */
export function OptionsChecklist({ questions, undecidedChoice, whatsappIntro }: Props) {
  const [checked, setChecked] = useState<Record<string, string[]>>({});

  const toggle = (question: string, choice: string) =>
    setChecked((current) => {
      const list = current[question] ?? [];
      return {
        ...current,
        [question]: list.includes(choice) ? list.filter((c) => c !== choice) : [...list, choice],
      };
    });

  const answers = questions
    .filter((q) => (checked[q.title] ?? []).length > 0)
    .map((q) => `${q.title}: ${checked[q.title].join(", ")}`);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    [whatsappIntro, ...answers].join("\n")
  )}`;

  return (
    <div>
      <div className="divide-y divide-border border-y border-border text-left">
        {questions.map((question) => (
          <fieldset key={question.title} className="py-5">
            <legend className="font-sans text-sm font-bold uppercase tracking-[0.06em] text-foreground">
              {question.title}
            </legend>
            {question.description && (
              <p className="mt-1 font-sans text-[13px] leading-relaxed text-foreground/70">{question.description}</p>
            )}
            <div className="mt-3 space-y-2.5">
              {[...question.choices, undecidedChoice].map((choice) => {
                const id = `${question.title}-${choice}`;
                return (
                  <label key={choice} htmlFor={id} className="flex cursor-pointer items-center gap-3">
                    <Checkbox
                      id={id}
                      checked={(checked[question.title] ?? []).includes(choice)}
                      onCheckedChange={() => toggle(question.title, choice)}
                      className="border-foreground/40 data-[state=checked]:border-[#ad1414] data-[state=checked]:bg-[#ad1414]"
                    />
                    <span
                      className={`font-sans text-[13px] ${
                        choice === undecidedChoice ? "text-foreground/55" : "text-foreground/80"
                      }`}
                    >
                      {choice}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-7 inline-flex rounded-full bg-[#ad1414] px-7 py-3 font-sans text-xs font-bold uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90"
      >
        Send my answers on WhatsApp
      </a>
    </div>
  );
}
