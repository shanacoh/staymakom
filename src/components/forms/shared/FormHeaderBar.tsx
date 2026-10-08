import { ArrowLeft, Check, Loader2, Rocket, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/forms/styled";
import { cn } from "@/lib/utils";

export type FormLanguage = "fr" | "en" | "he";

export const LANGUAGE_PILLS: { code: FormLanguage; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "he", label: "HE" },
];

interface FormHeaderBarProps {
  onClose?: () => void;
  heading: string;
  /** Ligne sous le titre : type de fiche, statut, sauvegarde auto. */
  meta: React.ReactNode;
  activeLanguage: FormLanguage;
  onLanguageChange: (lang: FormLanguage) => void;
  /** Nombre de champs principaux manquants par langue ; omis = pas d'indicateur. */
  getLanguageMissingCount?: (lang: FormLanguage) => number;
  /** Écrit « N à compléter » en toutes lettres et un « ✓ » neutre (sans vert). Omis = rendu d'origine. */
  verboseMissing?: boolean;
  onTranslateAll: () => void;
  isTranslating: boolean;
  onSaveDraft: () => void;
  canPublish: boolean;
  /** Enregistrement ou upload en cours : tous les boutons sont grisés. */
  busy: boolean;
}

// Barre du haut, collante : titre, statut, FR | EN | HE, Traduire tout,
// Brouillon, Publier. Le bouton Publier est de type "submit" : la barre doit
// être placée à l'intérieur du <form>.
export function FormHeaderBar({
  onClose,
  heading,
  meta,
  activeLanguage,
  onLanguageChange,
  getLanguageMissingCount,
  verboseMissing,
  onTranslateAll,
  isTranslating,
  onSaveDraft,
  canPublish,
  busy,
}: FormHeaderBarProps) {
  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b -mx-6 px-6 py-3 flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-4">
        {onClose && (
          <Button type="button" variant="ghost" size="sm" className="h-8 text-[13px]" onClick={onClose}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Retour
          </Button>
        )}
        <div>
          <h1 className="text-[17px] font-bold text-[#1a1814]">{heading}</h1>
          <p className="text-xs text-[#6f6a63]">{meta}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center border border-[#e9e6e1] rounded-[10px] overflow-hidden">
          {LANGUAGE_PILLS.map((lng) => {
            const missing = getLanguageMissingCount ? getLanguageMissingCount(lng.code) : 0;
            return (
              <button
                key={lng.code}
                type="button"
                onClick={() => onLanguageChange(lng.code)}
                className={cn(
                  "px-2 py-1 text-[10px] font-medium border-r border-[#e9e6e1] last:border-r-0 flex items-center gap-1",
                  activeLanguage === lng.code ? "bg-[#1a1814] text-white" : "bg-white text-[#6f6a63] hover:text-[#1a1814]"
                )}
              >
                {lng.label}
                {getLanguageMissingCount && (
                  missing === 0 ? (
                    <Check className={cn("h-3 w-3", !verboseMissing && "text-emerald-500")} />
                  ) : (
                    <span className="text-[10px] opacity-80">{verboseMissing ? `${missing} à compléter` : missing}</span>
                  )
                )}
              </button>
            );
          })}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-[13px]"
          onClick={onTranslateAll}
          disabled={busy || isTranslating}
        >
          {isTranslating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
          Traduire tout
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-[13px]"
          onClick={onSaveDraft}
          disabled={busy}
        >
          <Save className="h-3.5 w-3.5 mr-1.5" />
          Brouillon
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!canPublish || busy}
          className="h-8 text-[13px] bg-action text-white hover:bg-action-hover"
        >
          <Rocket className="h-3.5 w-3.5 mr-1.5" />
          Publier
        </Button>
      </div>
    </div>
  );
}

// Barre du bas sur mobile : Brouillon / Publier (hors du <form>, d'où le
// onPublish explicite).
export function FormMobileSaveBar({
  onSaveDraft,
  onPublish,
  canPublish,
  busy,
}: {
  onSaveDraft: () => void;
  onPublish: () => void;
  canPublish: boolean;
  busy: boolean;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t p-3 flex gap-2">
      <Button type="button" variant="outline" className="flex-1" onClick={onSaveDraft} disabled={busy}>
        <Save className="h-4 w-4 mr-2" />
        Brouillon
      </Button>
      <Button
        type="button"
        className="flex-1 bg-action text-white hover:bg-action-hover"
        onClick={onPublish}
        disabled={!canPublish || busy}
      >
        <Rocket className="h-4 w-4 mr-2" />
        Publier
      </Button>
    </div>
  );
}
