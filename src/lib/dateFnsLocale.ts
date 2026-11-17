// Langue des calendriers et des dates écrites par date-fns (« ven. 20 nov. », « пт, 20 нояб. »),
// selon la langue de la page. Anglais : réglage par défaut de date-fns.
import type { Locale as DateFnsLocale } from "date-fns";
import { de, es, fr, he, ru } from "date-fns/locale";
import type { Locale } from "@/lib/locale";

const DATE_FNS_LOCALES: Partial<Record<Locale, DateFnsLocale>> = { fr, he, es, ru, de };

export const dateFnsLocale = (locale: Locale): DateFnsLocale | undefined => DATE_FNS_LOCALES[locale];
