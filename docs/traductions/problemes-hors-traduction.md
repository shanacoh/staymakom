# Problèmes repérés pendant le chantier traduction (hors traduction)

Consigne de Shana (19/11/2026) : pendant le chantier traduction, on ne corrige rien d'autre.
Chaque problème découvert est noté ici, puis signalé en une ligne en fin de session.

| Date | Problème | Où | État |
|------|----------|----|------|
| 18/11/2026 | Paniers d'expérience abandonnés restés « en attente » à vie (Revolut n'expire pas les commandes impayées, fonction d'abandon jamais déployée) | paiement expérience | En pause : code prêt sur la branche `paniers-abandonnes`, non déployé |
| 18/11/2026 | Setai et Inbal (et la plupart des fiches hôtel) affichent « aucune date disponible » | fiches avec hôtel | Lié aux calendriers fermés le 06/10, à vérifier |
| 19/11/2026 | 9 tests automatiques en échec sur main (taille des photos `imageUrl.test.ts`, brouillon du catalogue `catalogue/draft.test.ts`) | back-office | Non corrigé |
| 19/11/2026 | Erreurs de typage dans `src/pages/Vitrine.tsx` (colonne `experience_id` inconnue) | vitrine | Non corrigé, n'empêche pas la construction |
| 19/11/2026 | Pages légales datées (« Last updated: December 1, 2025 ») et en partie obsolètes : elles citent Stripe comme prestataire de paiement (le site utilise Revolut) et un hébergement chez Lovable. | `/terms`, `/privacy`, `/legal` | Shana met à jour l'anglais, puis traduction (19/11/2026) |
| 19/11/2026 | Le questionnaire d'accueil (après inscription) s'affichait toujours en anglais dans l'espace client, même en français ou en hébreu (la langue n'était pas transmise) | `OnboardingFlow` | Corrigé au passage car c'est de la traduction |
| 19/11/2026 | Formulaire sur-mesure : l'indicatif téléphone par défaut est +1 (États-Unis) pour les visiteurs anglophones, et donc aussi en espagnol, russe et allemand | `src/lib/tailorMade/form.ts` | Corrigé le 19/11/2026 à la demande de Shana (+972, +33 en français) |
| 19/11/2026 | Les titres d'onglet des pages Journal, Contact et Carte cadeau ne sont définis nulle part dans la page (titre générique du site) | pages publiques | Non corrigé (référencement) |
| 19/11/2026 | Fichiers en double « nom 2.ts » enregistrés dans git (ex. `src/lib/regionList/labels 2.ts`, `filter 2.ts`, `queries 2.ts`, `types 2.ts`, `regionList.test 2.ts`) | `src/lib/regionList/` | Non corrigé |
| 19/11/2026 | Aucun email « demande reçue » n'est envoyé au client pour une demande d'expérience, de bateau ou sur-mesure : seule l'équipe est prévenue (le client voit un message à l'écran et, pour le sur-mesure, un lien WhatsApp) | demandes | Non créé (nouvelle fonctionnalité, à décider) |
| 19/11/2026 | L'email de confirmation hôtel et l'accusé de réception du formulaire Contact n'ont pas l'habillage de référence (bandeau désert, rouge Staymakom) : ancien style doré | `send-booking-confirmation`, `send-contact-request` | Non corrigé (textes traduits, design inchangé) |
| 19/11/2026 | Pied de page des emails « StayMakom — The Israel most people never find. » en anglais dans toutes les langues (français et hébreu compris) | emails client | Décision de Shana (19/11/2026) : reste en anglais dans toutes les langues, signature de marque comme le titre de l'accueil |
