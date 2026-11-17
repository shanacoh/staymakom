import { WHATSAPP_NUMBER, buildWhatsappMessageForExperience, getWhatsappMessageVariant } from "@/constants/whatsapp";
import { trackWhatsappClicked, identifyWhatsappClicked } from "@/lib/analytics";
import { useCurrentProduct } from "@/contexts/CurrentProductContext";
import { cn } from "@/lib/utils";
import { uiGroup } from "@/lib/translations";

type Lang = "en" | "fr" | "he";

interface AskTeamProps {
  lang: Lang;
  placement: "ask_team_mobile" | "ask_team_panel";
  experienceTitle: string;
  className?: string;
}


// Pastille de contact, sans prénom ni photo de personne : on parle toujours au nom de l'équipe.
export default function AskTeam({ lang, placement, experienceTitle, className }: AskTeamProps) {
  const currentProduct = useCurrentProduct();

  let entrySource: string | undefined;
  try {
    entrySource = sessionStorage.getItem("staymakom_entry_source") || undefined;
  } catch {
    entrySource = undefined;
  }

  const message = encodeURIComponent(buildWhatsappMessageForExperience(lang, entrySource, experienceTitle));
  const texts = uiGroup("askTeamTEXTS");

  const handleClick = () => {
    trackWhatsappClicked(
      placement,
      getWhatsappMessageVariant(entrySource),
      entrySource,
      currentProduct?.product,
      currentProduct?.productType
    );
    identifyWhatsappClicked();
  };

  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      dir={lang === "he" ? "rtl" : "ltr"}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-[#e9e6e1] bg-[#faf8f6] p-3 transition-colors hover:bg-[#f3efe9]",
        className
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f0e4d8] text-sm font-bold text-[#ad1414]">
        S
      </span>
      {/* L'action est sur sa propre ligne avec une flèche, pour qu'on comprenne qu'il faut cliquer. */}
      <span className="flex flex-col text-sm text-foreground">
        <span>{texts.question}</span>
        <span className="font-semibold text-[#ad1414]">
          {texts.cta} {lang === "he" ? "←" : "→"}
        </span>
      </span>
    </a>
  );
}
