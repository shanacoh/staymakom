// Textes d'interface en espagnol, russe et allemand (les fiches, elles, sont traduites dans la
// base : voir src/lib/contentTranslations/). Traduits à la main à partir de l'anglais de
// src/lib/translations.ts, avec les mêmes règles que les fiches : « tú » en espagnol, « вы »
// en russe, « du » en allemand, jamais de tiret long, STAYMAKOM et les noms de moods intacts.
// Une clé absente s'affiche en anglais : missingUiKeys() (translations.ts) liste ce qui reste.

import type { AutoLocale } from "@/lib/locale";
import type { UiDictionary } from "@/lib/translations";
import { es } from "./es";
import { ru } from "./ru";
import { de } from "./de";

export const AUTO_UI_TRANSLATIONS: Record<AutoLocale, UiDictionary> = { es, ru, de };
