/**
 * Petit badge « ES », « RU » ou « DE » : le client a fait sa demande ou sa réservation depuis
 * une page traduite automatiquement (espagnol, russe, allemand). Il lit donc mal l'anglais :
 * à garder en tête pour lui répondre. Rien n'est affiché pour l'anglais, le français et l'hébreu.
 */

import { isAutoLocale } from "@/lib/locale";
import { AUTO_LOCALE_NAMES } from "@/constants/autoLocales";
import { cn } from "@/lib/utils";

interface Props {
  locale: string | null | undefined;
  className?: string;
}

const ClientLocaleBadge = ({ locale, className }: Props) => {
  if (!isAutoLocale(locale)) return null;
  const name = AUTO_LOCALE_NAMES[locale];
  return (
    <span
      title={`Demande faite depuis le site en ${name.native} (${name.english})`}
      className={cn(
        "inline-flex shrink-0 items-center rounded border border-foreground/30 px-1 text-[10px] font-bold uppercase leading-4 tracking-wide text-foreground",
        className,
      )}
    >
      {locale}
    </span>
  );
};

export default ClientLocaleBadge;
