// Billets d'entrée, côté site : la façon de reconnaître un fichier billet et les textes client
// (EN / FR / HE) sont définis une seule fois, dans le fichier partagé avec les fonctions serveur.
export {
  detectTicketFile,
  formatShortDate,
  TICKET_ACCEPT,
  TICKET_TEXTS,
  ticketPageUrl,
  ticketSummaryLine,
  TICKETS_BUCKET,
  type TicketFileType,
} from "../../../supabase/functions/_shared/tickets/content";
