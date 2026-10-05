import type { UseFormRegisterReturn } from "react-hook-form";
import { Label, Textarea } from "@/components/forms/styled";
import { CANCELLATION_TEMPLATES, type CancellationTemplateId } from "@/constants/cancellationTemplates";
import { cn } from "@/lib/utils";
import type { FormLanguage } from "./FormHeaderBar";

const PILL = "px-2 py-0.5 rounded-full text-[10px] border transition-colors";
const PILL_ON = "bg-[#1a1814] text-white border-[#1a1814]";
const PILL_OFF = "bg-white text-[#1a1814] border-[#e9e6e1] hover:border-[#1a1814]/40";

interface Props {
  template: CancellationTemplateId;
  /** Choisir un modèle remplit les 3 langues d'un coup (à la charge du formulaire). */
  onSelectTemplate: (id: CancellationTemplateId) => void;
  registerField: (name: "cancellation_policy" | "cancellation_policy_fr" | "cancellation_policy_he") => UseFormRegisterReturn;
  langHidden: (lang: FormLanguage) => boolean;
  disabled?: boolean;
}

// Politique d'annulation : pastilles de modèles + texte libre « Personnalisée ».
export function CancellationPolicyFields({ template, onSelectTemplate, registerField, langHidden, disabled }: Props) {
  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {CANCELLATION_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelectTemplate(t.id)}
            className={cn(PILL, template === t.id ? PILL_ON : PILL_OFF)}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onSelectTemplate("custom")}
          className={cn(PILL, template === "custom" ? PILL_ON : PILL_OFF)}
        >
          Personnalisée
        </button>
      </div>

      {template !== "custom" ? (
        <p className="text-xs text-muted-foreground">
          Les modèles existent déjà traduits en FR / EN / HE ; on n'écrit plus 3 fois la même chose.
        </p>
      ) : (
        <div className="space-y-4">
          <div className={cn(langHidden("en") && "hidden")}>
            <Label className="flex items-center gap-1.5 mb-1">
              <span>🇬🇧</span> Politique (EN)
            </Label>
            <Textarea rows={2} {...registerField("cancellation_policy")} disabled={disabled} />
          </div>
          <div className={cn(langHidden("fr") && "hidden")}>
            <Label className="flex items-center gap-1.5 mb-1">
              <span>🇫🇷</span> Politique (FR)
            </Label>
            <Textarea rows={2} {...registerField("cancellation_policy_fr")} disabled={disabled} />
          </div>
          <div className={cn(langHidden("he") && "hidden")}>
            <Label className="flex items-center gap-1.5 mb-1">
              <span>🇮🇱</span> Politique (HE)
            </Label>
            <Textarea rows={2} {...registerField("cancellation_policy_he")} dir="rtl" className="bg-hebrew-input" disabled={disabled} />
          </div>
        </div>
      )}
    </>
  );
}
