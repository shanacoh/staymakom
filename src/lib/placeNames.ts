// Noms de villes, régions et zones en espagnol, russe et allemand, appliqués SEULEMENT à
// l'affichage. Les données gardent le nom anglais : filtres, regroupement par région,
// suivi statistique et back-office continuent de s'appuyer dessus (voir overlay.ts,
// NEVER_OVERLAID_FIELDS).
//
// Une seule orthographe par lieu et par langue (les traductions automatiques de la base
// n'étaient pas homogènes : « Herzlia » / « Herzliya »...). Un lieu absent de la liste
// s'affiche en anglais : l'ajouter ici (docs/traductions/lieux-manquants.sql liste ceux
// des fiches publiées qui manquent).

import type { AutoLocale, Locale } from "@/lib/locale";
import { pageLocale } from "@/lib/translations";

type Names = Record<AutoLocale, string>;
const n = (es: string, ru: string, de: string): Names => ({ es, ru, de });

export const PLACE_NAMES: Record<string, Names> = {
  // Villes
  "Be'er Sheva": n("Beerseba", "Беэр-Шева", "Beerscheba"),
  "Beit Oren": n("Beit Oren", "Бейт-Орен", "Beit Oren"),
  Chorazim: n("Corazín", "Хоразин", "Chorazim"),
  "Dimona area": n("Zona de Dimona", "Район Димоны", "Gegend um Dimona"),
  Eilat: n("Eilat", "Эйлат", "Eilat"),
  "Ein Vered": n("Ein Vered", "Эйн-Веред", "Ein Vered"),
  "En Gev": n("En Gev", "Эйн-Гев", "En Gev"),
  Gedera: n("Gedera", "Гедера", "Gedera"),
  Gonen: n("Gonen", "Гонен", "Gonen"),
  Habonim: n("Habonim", "Хабоним", "Habonim"),
  Haifa: n("Haifa", "Хайфа", "Haifa"),
  Herzliya: n("Herzliya", "Герцлия", "Herzlia"),
  Jaffa: n("Jaffa", "Яффо", "Jaffa"),
  Jerusalem: n("Jerusalén", "Иерусалим", "Jerusalem"),
  "Kadesh Barnea": n("Kadesh Barnea", "Кадеш-Барнеа", "Kadesch Barnea"),
  Kinneret: n("Kinneret", "Кинерет", "Kinneret"),
  "Kiryat Anavim": n("Kiryat Anavim", "Кирьят-Анавим", "Kiryat Anavim"),
  "Mitspe Ramon": n("Mitzpe Ramón", "Мицпе-Рамон", "Mitzpe Ramon"),
  "Mitzpe Ramon": n("Mitzpe Ramón", "Мицпе-Рамон", "Mitzpe Ramon"),
  "Nir Ets'yon": n("Nir Etzion", "Нир-Эцион", "Nir Etzion"),
  "Ramat Gan": n("Ramat Gan", "Рамат-Ган", "Ramat Gan"),
  "Ramat HaGolan": n("Altos del Golán", "Голанские высоты", "Golanhöhen"),
  "Tel Aviv": n("Tel Aviv", "Тель-Авив", "Tel Aviv"),
  "Tel-Aviv": n("Tel Aviv", "Тель-Авив", "Tel Aviv"),
  "Tel Aviv-Yafo": n("Tel Aviv-Jaffa", "Тель-Авив-Яффо", "Tel Aviv-Jaffa"),
  "Tel Aviv-Jaffa": n("Tel Aviv-Jaffa", "Тель-Авив-Яффо", "Tel Aviv-Jaffa"),
  Tiberias: n("Tiberíades", "Тверия", "Tiberias"),
  Tsfat: n("Safed", "Цфат", "Safed"),
  "Zichron Yaakov": n("Zijrón Yaakov", "Зихрон-Яаков", "Zichron Yaakov"),
  Zofar: n("Zofar", "Цофар", "Zofar"),

  // Régions de la liste de référence (table regions)
  "Akko & Western Galilee": n("Acre y Galilea Occidental", "Акко и Западная Галилея", "Akko & Westgaliläa"),
  Arava: n("Arava", "Арава", "Arava"),
  "Around Tel Aviv": n("Alrededores de Tel Aviv", "Окрестности Тель-Авива", "Rund um Tel Aviv"),
  "Caesarea & Carmel Coast": n("Cesarea y la costa del Carmelo", "Кесария и побережье Кармеля", "Caesarea & Karmelküste"),
  "Central Negev": n("Néguev central", "Центральный Негев", "Zentraler Negev"),
  "Dead Sea & Judean Desert": n("Mar Muerto y desierto de Judea", "Мёртвое море и Иудейская пустыня", "Totes Meer & Judäische Wüste"),
  "Eilat & Red Sea": n("Eilat y mar Rojo", "Эйлат и Красное море", "Eilat & Rotes Meer"),
  "Golan Heights": n("Altos del Golán", "Голанские высоты", "Golanhöhen"),
  "Haifa & Mount Carmel": n("Haifa y monte Carmelo", "Хайфа и гора Кармель", "Haifa & Karmel"),
  "Jezreel Valley & Beit She'an": n("Valle de Jezreel y Beit She'an", "Изреельская долина и Бейт-Шеан", "Jesreelebene & Beit She'an"),
  "Judean Hills": n("Montes de Judea", "Иудейские горы", "Judäische Berge"),
  "Lower Galilee & Nazareth": n("Baja Galilea y Nazaret", "Нижняя Галилея и Назарет", "Untergaliläa & Nazareth"),
  "Sea of Galilee": n("Mar de Galilea", "Галилейское море (Кинерет)", "See Genezareth"),
  Sharon: n("Sarón", "Шарон", "Scharon"),
  "Shfela & South Coast": n("Shfela y costa sur", "Шфела и южное побережье", "Schefela & Südküste"),
  "Tsfat & Meron": n("Safed y Merón", "Цфат и Мерон", "Safed & Meron"),
  "Upper Galilee": n("Alta Galilea", "Верхняя Галилея", "Obergaliläa"),
  "Western & Northern Negev": n("Néguev occidental y septentrional", "Западный и Северный Негев", "Westlicher & nördlicher Negev"),
  "Zichron Yaakov & Ramat HaNadiv": n("Zijrón Yaakov y Ramat HaNadiv", "Зихрон-Яаков и Рамат-ха-Надив", "Zichron Yaakov & Ramat HaNadiv"),

  // Zones de la liste de référence (table region_zones)
  North: n("Norte", "Север", "Norden"),
  "Coast & Center": n("Costa y centro", "Побережье и центр", "Küste & Zentrum"),
  South: n("Sur", "Юг", "Süden"),

  // Anciens textes libres de région encore présents sur des fiches
  Carmel: n("Carmelo", "Кармель", "Karmel"),
  "Carmel Coast": n("Costa del Carmelo", "Побережье Кармеля", "Karmelküste"),
  "Center District": n("Distrito Central", "Центральный округ", "Bezirk Zentrum"),
  "Center District Israel": n("Distrito Central", "Центральный округ", "Bezirk Zentrum"),
  Darom: n("Sur", "Юг", "Süden"),
  Negev: n("Néguev", "Негев", "Negev"),
  "North District Israel": n("Distrito Norte", "Северный округ", "Bezirk Nord"),
  "Ramat HaNegev (Western Negev, near Nitzana)": n(
    "Ramat HaNegev (Néguev occidental, cerca de Nitzana)",
    "Рамат-ха-Негев (западный Негев, рядом с Ницаной)",
    "Ramat HaNegev (westlicher Negev, nahe Nitzana)",
  ),
  "Sea outing": n("Salida en el mar", "Морская прогулка", "Ausfahrt aufs Meer"),
  "Sharon Plain": n("Llanura de Sarón", "Шаронская равнина", "Scharonebene"),
  "South District Israel": n("Distrito Sur", "Южный округ", "Bezirk Süd"),
  "Tel Aviv District": n("Distrito de Tel Aviv", "Тель-Авивский округ", "Bezirk Tel Aviv"),
  "Tel Aviv area": n("Zona de Tel Aviv", "Район Тель-Авива", "Raum Tel Aviv"),
  Tsafon: n("Norte", "Север", "Norden"),
  "Water sports": n("Deportes acuáticos", "Водные виды спорта", "Wassersport"),
};

const BY_LOWERCASE = new Map(Object.entries(PLACE_NAMES).map(([en, names]) => [en.toLowerCase(), names]));

function isAuto(locale: Locale): locale is AutoLocale {
  return locale === "es" || locale === "ru" || locale === "de";
}

/**
 * Nom d'un lieu à afficher dans la langue demandée. Anglais, français et hébreu : le texte
 * reçu est rendu tel quel (ces langues ont leurs propres colonnes). Lieu inconnu : tel quel.
 */
export function placeName<T extends string | null | undefined>(text: T, locale: Locale): T {
  if (!text || !isAuto(locale)) return text;
  const names = BY_LOWERCASE.get(text.trim().toLowerCase());
  return (names ? names[locale] : text) as T;
}

/** Même chose, dans la langue de la page en cours. */
export const tPlace = <T extends string | null | undefined>(text: T): T => placeName(text, pageLocale());
