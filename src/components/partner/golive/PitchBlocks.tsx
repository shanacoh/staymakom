// Sous le go live : STAYMAKOM en bref, la presse, comment ça marche (les 4 étapes de /partner-exp),
// les conditions en clair, 3 questions fréquentes, et deux boutons : ouvrir l'espace, écrire à l'équipe.

import { Link } from "react-router-dom";
import { Card, SectionTitle } from "@/components/partner/ui";
import { WHATSAPP_NUMBER } from "@/constants/whatsapp";
import { pitchText } from "@/content/partnerPitch";
import { usePartnerAccess } from "@/lib/partner/access";
import { usePartner } from "@/lib/partner/context";
import { GOLIVE_TEXTS } from "@/lib/partner/i18n-golive";

const PRESS = ["The Jerusalem Post", "i24NEWS", "Actualité Juive", "Jewbuzz"];
const STEPS = ["step1", "step2", "step3", "step4"] as const;

export function PitchBlocks({ providerName }: { providerName: string }) {
  const { lang } = usePartner();
  const t = GOLIVE_TEXTS[lang];
  const access = usePartnerAccess();
  const whatsapp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`STAYMAKOM · ${providerName}`)}`;

  return (
    <>
      <Card className="space-y-3">
        <SectionTitle>{t.inBriefTitle}</SectionTitle>
        <ul className="grid grid-cols-2 gap-2">
          {t.inBrief.map((fact) => (
            <li key={fact} className="rounded-[10px] bg-neutral-100 px-3 py-2.5 text-[12px] font-semibold text-neutral-900">
              {fact}
            </li>
          ))}
        </ul>
        <p className="text-[12px] leading-relaxed text-neutral-600">{pitchText("slide1Body", lang)}</p>
      </Card>

      <Card className="space-y-2">
        <SectionTitle>{t.pressTitle}</SectionTitle>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-semibold text-neutral-800">
          {PRESS.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </p>
      </Card>

      <Card className="space-y-3">
        <SectionTitle>{t.howTitle}</SectionTitle>
        <ol className="space-y-2.5">
          {STEPS.map((key, index) => (
            <li key={key} className="flex gap-3 text-[13px] leading-relaxed text-neutral-700">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-[10px] font-semibold text-neutral-600">
                {index + 1}
              </span>
              {pitchText(key, lang)}
            </li>
          ))}
        </ol>
      </Card>

      <Card className="space-y-2">
        <SectionTitle>{t.termsClearTitle}</SectionTitle>
        <ul className="space-y-1.5">
          {t.termsClear.map((line) => (
            <li key={line} className="flex gap-2 text-[13px] leading-relaxed text-neutral-700">
              <span aria-hidden className="text-neutral-400">·</span>
              {line}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-3">
        <SectionTitle>{t.faqTitle}</SectionTitle>
        {t.faq.map((item) => (
          <details key={item.q} className="group border-b border-neutral-100 pb-2 last:border-0">
            <summary className="cursor-pointer list-none text-[13px] font-semibold text-neutral-900">{item.q}</summary>
            <p className="pt-1.5 text-[13px] leading-relaxed text-neutral-600">{item.a}</p>
          </details>
        ))}
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          to={access.mode === "link" ? "/partner/login" : "/partner"}
          className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-full bg-neutral-900 px-5 text-[13px] font-semibold text-white hover:bg-neutral-700"
        >
          {t.openSpace}
        </Link>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-full border border-neutral-300 px-5 text-[13px] font-semibold text-neutral-900 hover:bg-neutral-100"
        >
          {t.whatsappTeam}
        </a>
      </div>
    </>
  );
}
