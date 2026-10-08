// Registre de toutes les automatisations du site (emails, webhooks, crons...).
// Chaque nouvelle automatisation (ajoutée ici, depuis Cursor, ou toute autre session)
// doit être ajoutée à ce fichier au moment où elle est développée — c'est la seule
// source de vérité listée dans /admin/automations.

export type AutomationCategorie = "email" | "paiement" | "avis" | "monitoring";
export type AutomationStatut = "actif" | "a_confirmer" | "desactive";

export interface Automation {
  id: string;
  nom: string;
  categorie: AutomationCategorie;
  declencheur: string;
  action: string;
  destinataire?: string;
  fonctionEdge?: string;
  /** true si on peut appeler la fonction edge avec { preview: true } pour voir le rendu sans rien envoyer */
  previewable: boolean;
  /** payload minimal à envoyer pour générer l'aperçu (ignoré si previewable = false) */
  previewPayload?: Record<string, unknown>;
  statut: AutomationStatut;
  notes?: string;
}

export const AUTOMATIONS: Automation[] = [
  {
    id: "booking-confirmation",
    nom: "Confirmation de réservation (hôtel)",
    categorie: "email",
    declencheur: "Réservation hôtel réussie (ou annulée) via process-booking",
    action: "Email de confirmation ou d'annulation, en fr/en/he",
    destinataire: "Client",
    fonctionEdge: "send-booking-confirmation",
    previewable: true,
    previewPayload: {
      preview: true, to: "preview@staymakom.com", guestName: "Shana Test",
      experienceTitle: "Expérience test", hotelName: "Hôtel test",
      checkIn: "2026-11-10", checkOut: "2026-11-12", nights: 2, partySize: 2,
      totalPrice: 1500, currency: "ILS", bookingRef: "SM-PREVIEW", lang: "fr",
    },
    statut: "actif",
  },
  {
    id: "standalone-booking-confirmation",
    nom: "Confirmation de réservation (expérience seule / bateau)",
    categorie: "email",
    declencheur: "Réservation d'une expérience standalone ou d'un bateau confirmée",
    action: "Email de confirmation au client",
    destinataire: "Client",
    fonctionEdge: "send-standalone-booking-confirmation",
    previewable: true,
    previewPayload: { preview: true },
    statut: "actif",
    notes: "Sans token fourni, l'aperçu utilise la réservation standalone la plus récente en base. Contient le bloc Infos pratiques de la fiche (expériences confirmées uniquement, pas les bateaux). Un envoi automatique ne part qu'une fois ; seul le bouton Renvoyer du back-office renvoie.",
  },
  {
    id: "standalone-day-before-reminder",
    nom: "Rappel la veille (expérience seule)",
    categorie: "email",
    declencheur: "Tâche planifiée de la base, chaque jour vers 10 h heure d'Israël : réservations d'expérience confirmées et non annulées dont la date est demain",
    action: "Email de rappel dans la langue du client, avec l'heure du créneau et le bloc Infos pratiques",
    destinataire: "Client",
    fonctionEdge: "send-standalone-day-before-reminder",
    previewable: false,
    statut: "actif",
    notes: "Planifiée dans la migration 20261008160000 (pg_cron, passages à 7 h, 8 h et 9 h UTC). Une réservation faite la veille ou le jour même ne reçoit pas de rappel. La date d'envoi (reminder_email_sent_at) empêche tout doublon. Les bateaux ne sont pas concernés.",
  },
  {
    id: "booking-payment-link-email",
    nom: "Lien de paiement acompte / solde",
    categorie: "paiement",
    declencheur: "Envoi manuel depuis le back-office d'un lien de paiement",
    action: "Email avec le lien de paiement Revolut",
    destinataire: "Client",
    fonctionEdge: "send-booking-payment-link-email",
    previewable: true,
    previewPayload: { preview: true },
    statut: "actif",
    notes: "Sans id fourni, l'aperçu utilise le lien de paiement le plus récent en base.",
  },
  {
    id: "booking-status-update",
    nom: "Mise à jour du statut d'une réservation",
    categorie: "email",
    declencheur: "Changement de statut d'une réservation hôtel",
    action: "Email informant le client du nouveau statut",
    destinataire: "Client",
    fonctionEdge: "send-booking-status-update",
    previewable: true,
    previewPayload: { preview: true },
    statut: "actif",
    notes: "Sans id fourni, l'aperçu utilise la réservation la plus récente en base.",
  },
  {
    id: "gift-card-email",
    nom: "Envoi d'une carte cadeau",
    categorie: "email",
    declencheur: "Achat d'une carte cadeau",
    action: "Email avec le code cadeau",
    destinataire: "Destinataire de la carte",
    fonctionEdge: "send-gift-card",
    previewable: true,
    previewPayload: {
      preview: true, code: "MK-PREVIEW", amount: 500, currency: "ILS",
      sender_name: "Shana", recipient_name: "Test", recipient_email: "preview@staymakom.com",
      message: "Aperçu", valid_until: "2027-01-01", language: "fr",
    },
    statut: "actif",
  },
  {
    id: "tailor-questionnaire",
    nom: "Questionnaire voyage sur-mesure",
    categorie: "email",
    declencheur: "Envoi manuel du questionnaire à un lead 'tailored_request'",
    action: "Email avec le lien vers le questionnaire",
    destinataire: "Lead",
    fonctionEdge: "send-tailor-questionnaire",
    previewable: true,
    previewPayload: { preview: true },
    statut: "desactive",
    notes: "Plus envoyé depuis le 07/10/2026 : le formulaire sur mesure en 3 étapes pose déjà ces questions. Les liens déjà envoyés restent valables.",
  },
  {
    id: "tailor-made-request",
    nom: "Nouvelle demande de voyage sur mesure",
    categorie: "email",
    declencheur: "Envoi du formulaire \"Tailor-made request\" (fenêtre Design my stay du site)",
    action: "Enregistre la demande comme réservation au statut « Demande sur-mesure », puis email interne avec toutes les réponses et un lien vers la fiche",
    destinataire: "Équipe Staymakom",
    fonctionEdge: "submit-tailor-made-request",
    previewable: false,
    statut: "actif",
    notes: "Email interne, habillage simple des notifications de demande. Le client, lui, voit un écran de confirmation avec un bouton WhatsApp : aucun email ne lui est envoyé.",
  },
  {
    id: "contact-request",
    nom: "Formulaire de contact",
    categorie: "email",
    declencheur: "Soumission du formulaire de contact du site",
    action: "Email interne (notification) + email de confirmation au visiteur",
    destinataire: "Équipe Staymakom + visiteur",
    fonctionEdge: "send-contact-request",
    previewable: true,
    previewPayload: { preview: true, name: "Shana Test", email: "preview@staymakom.com", message: "Message de test", language: "fr" },
    statut: "actif",
    notes: "L'aperçu affiche uniquement l'email de confirmation envoyé au visiteur.",
  },
  {
    id: "corporate-request",
    nom: "Formulaire B2B / entreprises",
    categorie: "email",
    declencheur: "Soumission du formulaire 'For Companies'",
    action: "Email interne de notification",
    destinataire: "Équipe Staymakom",
    fonctionEdge: "send-corporate-request",
    previewable: true,
    previewPayload: { preview: true, requestType: "general", email: "preview@staymakom.com", companyName: "Entreprise Test", message: "Message de test" },
    statut: "actif",
  },
  {
    id: "partner-request",
    nom: "Formulaire partenaires (hôtels)",
    categorie: "email",
    declencheur: "Soumission du formulaire de demande de partenariat hôtelier",
    action: "Email interne (notification) + email de confirmation au partenaire",
    destinataire: "Équipe Staymakom + hôtel",
    fonctionEdge: "send-partner-request",
    previewable: true,
    previewPayload: { preview: true, name: "Shana Test", hotel_name: "Hôtel Test", email: "preview@staymakom.com", language: "fr" },
    statut: "actif",
    notes: "L'aperçu affiche uniquement l'email de confirmation envoyé au partenaire.",
  },
  {
    id: "notify-standalone-experience-request",
    nom: "Demande sur devis (bateau / expérience à la demande)",
    categorie: "email",
    declencheur: "Clic 'Demander sur WhatsApp' ou pop-up de demande de dates",
    action: "Email interne de notification (marqué URGENT si applicable)",
    destinataire: "Équipe Staymakom",
    fonctionEdge: "notify-standalone-experience-request",
    previewable: true,
    previewPayload: { preview: true },
    statut: "actif",
    notes: "Sans id fourni, l'aperçu utilise la demande la plus récente en base.",
  },
  {
    id: "review-requests",
    nom: "Demande d'avis après expérience",
    categorie: "avis",
    declencheur: "Cron quotidien (à confirmer côté dashboard Supabase) : J+1 après l'expérience, relance à J+5 sans avis",
    action: "Email avec lien vers le formulaire d'avis",
    destinataire: "Client",
    fonctionEdge: "send-review-requests",
    previewable: false,
    statut: "a_confirmer",
    notes: "Aucun cron.schedule n'est versionné dans les migrations — à vérifier dans le dashboard Supabase que la planification tourne bien.",
  },
  {
    id: "dossier-voyage-autoreply",
    nom: "Réponse automatique au formulaire \"Créer mon voyage\"",
    categorie: "email",
    declencheur: "Appel périodique (même mécanisme externe non versionné que review-requests) : dossiers créés via le formulaire du site, quelques minutes après la demande, jamais la nuit ni pendant Shabbat",
    action: "Email dans la voix de Shana, avec jusqu'à 3 questions piochées dans la banque autoreply_question_bank selon ce qui manque au dossier",
    destinataire: "Client (prospect)",
    fonctionEdge: "send-dossier-voyage-autoreplies",
    previewable: true,
    previewPayload: { preview: true },
    statut: "desactive",
    notes: "Coupé pour le formulaire du site depuis le 07/10/2026 (décision de Shana) : le nouveau formulaire pose déjà ces questions et promet une réponse WhatsApp sous 24 h. Les demandes du formulaire ne sont plus planifiées pour cet envoi.",
  },
  {
    id: "revolut-webhook",
    nom: "Webhook de paiement Revolut",
    categorie: "paiement",
    declencheur: "Revolut appelle ce webhook à chaque événement de paiement",
    action: "Met à jour le statut de la réservation ; alerte l'équipe par email en cas d'anomalie de signature ou de traitement",
    destinataire: "Équipe Staymakom (en cas d'anomalie uniquement)",
    fonctionEdge: "revolut-webhook",
    previewable: false,
    statut: "actif",
  },
  {
    id: "reconcile-standalone-bookings",
    nom: "Filet de sécurité paiement (réconciliation)",
    categorie: "paiement",
    declencheur: "Cron (à confirmer côté dashboard Supabase) : réservations standalone en attente depuis plus de 30 min",
    action: "Revérifie le statut auprès de Revolut, corrige si besoin, alerte si bloqué plus de 120 min",
    destinataire: "Équipe Staymakom (en cas d'alerte)",
    fonctionEdge: "reconcile-standalone-bookings",
    previewable: false,
    statut: "a_confirmer",
    notes: "Aucun cron.schedule n'est versionné dans les migrations — à vérifier dans le dashboard Supabase.",
  },
  {
    id: "hyperguest-health",
    nom: "Surveillance de l'intégration HyperGuest",
    categorie: "monitoring",
    declencheur: "Cron (à confirmer côté dashboard Supabase) : vérification toutes les heures",
    action: "Vérifie que l'intégration HyperGuest répond, crée une alerte en cas de panne",
    fonctionEdge: "hyperguest-health",
    previewable: false,
    statut: "a_confirmer",
    notes: "Aucun cron.schedule n'est versionné dans les migrations — à vérifier dans le dashboard Supabase.",
  },
];

export interface AutomationAVenir {
  id: string;
  nom: string;
  description: string;
  origine: string;
}

export const AUTOMATIONS_A_VENIR: AutomationAVenir[] = [];
