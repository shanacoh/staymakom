// Sous le go live, la présentation STAYMAKOM en style éditorial, adaptée au type de partenaire
// (hôtel ou expérience) : pourquoi STAYMAKOM (chiffres et presse), les conditions en clair (fond
// noir), comment ça marche, les questions fréquentes, puis une seule action : écrire à l'équipe.
// « Ouvrir mon espace » n'apparaît que s'il y a quelque chose à faire avec un compte.

import { Link } from "react-router-dom";
import { WHATSAPP_NUMBER } from "@/constants/whatsapp";
import { commissionLabel } from "@/components/partner/golive/GoLiveCard";
import { pitchText } from "@/content/partnerPitch";
import { usePartnerAccess } from "@/lib/partner/access";
import { usePartner } from "@/lib/partner/context";
import { teamWhatsappUrl } from "@/lib/partner/golive";
import { GOLIVE_TEXTS } from "@/lib/partner/i18n-golive";
import type { GoLive } from "@/lib/partner/types";

const PRESS = ["The Jerusalem Post", "i24NEWS", "Actualité Juive", "Jewbuzz"];
const EXPERIENCE_STEPS = ["step1", "step2", "step3", "step4"] as const;

function Eyebrow({ children, light = false }: { children: string; light?: boolean }) {
  return <p className={light ? "text-[11px] font-medium tracking-[0.16em] rtl:tracking-normal text-[#E0A3A3]" : "text-[11px] font-medium tracking-[0.16em] rtl:tracking-normal text-brand"}>{children}</p>;
}

export function PitchBlocks({
  providerName,
  golive,
  loginEmail,
  accountNeeded,
}: {
  providerName: string;
  golive: GoLive;
  loginEmail?: string | null;
  /** Vrai s'il y a quelque chose à faire avec un compte (signer, voir ses réservations). */
  accountNeeded: boolean;
}) {
  const { lang } = usePartner();
  const g = GOLIVE_TEXTS[lang];
  const t = g.page;
  const access = usePartnerAccess();
  const kind = golive.kind;
  const commission = golive.commission_ready && golive.commission ? commissionLabel(golive.commission, lang) : null;
  const how = kind === "hotel" ? t.how.hotel : EXPERIENCE_STEPS.map((key) => pitchText(key, lang));
  const faq = kind === "hotel" ? t.faq.hotel : g.faq;
  const showOpenSpace = access.mode === "link" && accountNeeded;
  const loginTo = loginEmail ? `/partner/login?email=${encodeURIComponent(loginEmail)}` : "/partner/login";

  return (
    <>
      <section className="space-y-4 pt-4">
        <Eyebrow>{t.whyEyebrow}</Eyebrow>
        <h2 className="text-[26px] font-bold leading-tight text-neutral-900 sm:text-[28px]">{t.whyTitle}</h2>
        <p className="max-w-[620px] text-[15px] leading-[1.7] text-neutral-700">{t.whyText}</p>
        <dl className="grid grid-cols-2 border-y border-[#D6D0C4] sm:grid-cols-4">
          {t.stats.map((stat, i) => (
            <div
              key={stat.label}
              className={[
                "flex flex-col gap-1 py-5 pe-4",
                i % 2 === 1 ? "ps-4 border-s border-[#D6D0C4]" : "",
                i >= 2 ? "border-t border-[#D6D0C4] sm:border-t-0" : "",
                i === 2 ? "sm:ps-4 sm:border-s" : "",
              ].join(" ")}
            >
              <dd className="text-[30px] font-bold leading-none text-brand" dir="ltr">{stat.value}</dd>
              <dt className="order-last text-[13px] text-neutral-500">{stat.label}</dt>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap items-baseline gap-x-7 gap-y-2.5 pt-1">
          <span className="text-[11px] tracking-[0.16em] rtl:tracking-normal text-neutral-500">{t.asSeenIn}</span>
          {PRESS.map((name) => (
            <span key={name} className="text-[15px] font-bold text-neutral-900" dir="ltr">
              {name}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-[18px] bg-neutral-900 p-6 text-cream sm:p-7">
        <Eyebrow light>{t.termsEyebrow}</Eyebrow>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.terms[kind].map((term) => (
            <li key={term.title} className="space-y-1">
              <p className="text-[15px] font-bold">{term.title}</p>
              <p className="text-[13px] leading-relaxed text-[#CFC8BB]">{term.text(commission)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 pt-2">
        <Eyebrow>{t.howEyebrow}</Eyebrow>
        <ol className="grid gap-4 sm:grid-cols-2">
          {how.map((line, i) => (
            <li key={line} className="flex gap-3.5">
              <span className="text-[22px] font-bold leading-none text-brand" dir="ltr">{String(i + 1).padStart(2, "0")}</span>
              <p className="text-[14px] leading-relaxed text-neutral-700">{line}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="pb-2.5">
          <Eyebrow>{t.faqEyebrow}</Eyebrow>
        </div>
        {faq.map((item) => (
          <details key={item.q} className="group border-t border-[#D6D0C4] last:border-b">
            <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium text-neutral-900 [&::-webkit-details-marker]:hidden">
              {item.q}
              <span className="text-[18px] leading-none text-neutral-500 transition-transform group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <p className="pb-4 text-[14px] leading-relaxed text-neutral-700">{item.a}</p>
          </details>
        ))}
      </section>

      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <p className="text-[22px] font-bold text-neutral-900">{t.bottomTitle}</p>
        <a
          href={teamWhatsappUrl(WHATSAPP_NUMBER, providerName)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[48px] items-center rounded-full bg-neutral-900 px-7 text-[14px] font-medium text-cream hover:bg-neutral-700"
        >
          {t.bottomCta}
        </a>
        {showOpenSpace && (
          <Link to={loginTo} className="text-[13px] font-medium text-neutral-700 underline underline-offset-4">
            {g.openSpace}
          </Link>
        )}
      </div>
    </>
  );
}
