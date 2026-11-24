// Sous le bandeau photo : l'équipe STAYMAKOM est joignable à tout moment, en un message WhatsApp.

import { WHATSAPP_NUMBER } from "@/constants/whatsapp";
import { usePartner } from "@/lib/partner/context";
import { teamWhatsappUrl } from "@/lib/partner/golive";
import { GOLIVE_TEXTS } from "@/lib/partner/i18n-golive";

export function TeamContactBand({ providerName }: { providerName: string }) {
  const { lang } = usePartner();
  const t = GOLIVE_TEXTS[lang].page;
  return (
    <div className="flex flex-wrap items-center gap-3.5 rounded-[14px] border border-[#E8E0D4] bg-white px-4 py-3.5 sm:px-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white" aria-hidden>
        SM
      </span>
      <div className="min-w-[180px] flex-1">
        <p className="text-[14px] font-medium text-neutral-900">{t.contactTitle}</p>
        <p className="text-[13px] text-neutral-500">{t.contactText}</p>
      </div>
      <a
        href={teamWhatsappUrl(WHATSAPP_NUMBER, providerName)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[40px] items-center rounded-full border border-neutral-900 px-4 text-[13px] font-medium text-neutral-900 hover:bg-neutral-900 hover:text-white"
      >
        {t.contactCta}
      </a>
    </div>
  );
}
