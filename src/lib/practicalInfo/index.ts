// Infos pratiques « après la réservation », côté back-office.
// Le contenu et sa mise en mots sont définis une seule fois, dans le fichier partagé avec les
// fonctions serveur (email de confirmation, rappel de la veille) : ici on ne fait que le relayer.
export {
  buildClientWhatsAppMessage,
  buildPracticalInfo,
  normalizeLang,
  PRACTICAL_INFO_COLUMNS,
  type DayContactSource,
  type PracticalInfo,
  type PracticalInfoSource,
  type PracticalLang,
} from "../../../supabase/functions/_shared/practical-info/content";
