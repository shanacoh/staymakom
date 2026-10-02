# Sprint 1 conversion : tracking Amplitude + WhatsApp

Contexte : STAYMAKOM (React + Vite + Supabase, déployé sur Vercel). Amplitude est initialisé deux fois : `src/main.tsx` via `@amplitude/unified` `initAll(...)` (clé en dur, serverZone EU, autocapture, session replay) et `src/lib/amplitude.ts` via `@amplitude/analytics-browser` avec `VITE_AMPLITUDE_API_KEY`. En prod la seconde init ne se fait pas, donc `safeTrack` ne fait rien et aucun événement custom n'arrive depuis juillet. `src/lib/analytics.ts` contient des fonctions de tracking mais n'est utilisé que dans `pages/Checkout.tsx` (ancien flux hôtel).

Objectif : réparer l'envoi, ajouter des propriétés communes, instrumenter le flux standalone et WhatsApp, et différencier discrètement les messages WhatsApp venant d'Instagram.

Travaille étape par étape, montre-moi le diff de chaque étape avant de passer à la suivante.

## RÈGLES STRICTES (non négociables)
- Tu as UNIQUEMENT le droit d'AJOUTER des appels de tracking (fonctions de `src/lib/analytics.ts`) et de modifier le texte du message WhatsApp.
- INTERDIT de modifier la logique de réservation, de paiement, de calcul de prix, de disponibilités, de promo, de carte cadeau, d'authentification ou d'appels Supabase.
- INTERDIT de modifier, renommer ou supprimer une variable d'état, un handler existant, une requête, une Edge Function (`supabase/functions/*`), une migration ou un fichier de config (vercel.json, package.json sauf si une dépendance est strictement nécessaire, et dans ce cas demande-moi d'abord).
- Dans les handlers existants (onClick, onChange, onSubmit...), tu ajoutes l'appel de tracking en première ligne, sans rien changer au reste du handler.
- Aucun changement visuel sur le site, sauf le texte du message WhatsApp.
- Si une instruction de ce document t'oblige à enfreindre une de ces règles, arrête-toi et demande-moi au lieu de le faire.

## 1. Une seule instance Amplitude
- Dans `src/lib/amplitude.ts`, supprimer l'init `@amplitude/analytics-browser` et le plugin session replay local. Importer `* as amplitude from '@amplitude/unified'` et faire pointer `safeTrack`, `safeIdentify`, `safeSetUserProperty` sur cette instance (celle initialisée dans main.tsx). `isAmplitudeReady()` renvoie true si `window` existe.
- Retirer l'appel `initAmplitude()` dans `App.tsx`.
- Dans `safeTrack`, fusionner automatiquement ces propriétés communes : `lang` (langue courante, lue comme le fait useLanguage), `page_path` (location.pathname), `page_type` (déduit du path : `/`=home, `/experiences`=listing, `/category/*`=category, `/standalone-experience/*` et `/experience/*`=experience, `/hotel/*`=hotel, `/boat`=boat_list, `*checkout*`=checkout, `*confirmation*`=confirmation, sinon other), `device_type` (mobile < 768px, tablet < 1024px, sinon desktop), `entry_source` (valeur stockée en sessionStorage par session_landed).
- En mode dev (`import.meta.env.DEV`), `console.debug('[amp]', eventName, props)` à chaque envoi.

## 2. Événements à ajouter dans `src/lib/analytics.ts`
Garder les fonctions existantes. Ajouter des fonctions typées pour : `session_landed`, `experience_viewed`, `experience_engaged`, `section_viewed`, `gallery_opened`, `participants_changed`, `date_selected`, `slot_selected`, `rate_option_selected`, `extra_toggled`, `no_availability_shown`, `book_clicked`, `request_clicked`, `booking_panel_opened`, `vitrine_blocked_shown`, `checkout_viewed`, `guest_form_started`, `form_error_shown`, `promo_code_applied`, `promo_code_failed`, `gift_card_applied`, `gift_card_failed`, `checkout_step_completed`, `payment_widget_opened`, `payment_failed_client`, `checkout_abandoned`, `confirmation_viewed`, `whatsapp_clicked`, `newsletter_popup_shown`, `newsletter_popup_closed`, `newsletter_subscribed`, `contact_form_submitted`, `auth_prompt_shown`.
Créer un helper `productProps(experience)` qui renvoie `product_type (standalone | hotel_experience | hotel | boat), slug, title_en, category, city, region, price_from, price_type, is_bookable, currency`.
Montants : ajouter `amount_ils` quand un prix est présent. Jamais d'email, téléphone ou nom dans les propriétés.

## 3. Brancher
- `App.tsx` (ou un composant `AnalyticsBootstrap`) : au premier rendu de la session (flag sessionStorage), envoyer `session_landed` avec landing_page, document.referrer, utm_* de l'URL. Calculer et stocker en sessionStorage `entry_source` : utm_source si présent, sinon `instagram` si le referrer contient instagram.com (dont l.instagram.com), `tiktok`, `facebook`, `google` de la même façon, sinon domaine du referrer, sinon `direct`. Identify setOnce : first_touch_source, first_touch_medium, first_touch_campaign, first_landing_page ; set : last_touch_source.
- `pages/StandaloneExperience.tsx` : `experience_viewed` au chargement ; `experience_engaged` à 15/30/60/120 s si l'onglet est visible, avec max_scroll_percent ; `section_viewed` via IntersectionObserver (included, extras, map, reviews, practical_info, other_experiences), une fois par section ; `participants_changed`, `date_selected` (avec days_ahead), `slot_selected`, `rate_option_selected`, `extra_toggled` dans les handlers ; `book_clicked` / `request_clicked` au clic du bouton du panneau et de la barre mobile (propriété placement) ; `booking_panel_opened` à l'ouverture de la Sheet mobile ; `vitrine_blocked_shown` quand le dialog s'ouvre.
- `pages/Experience2.tsx` et `pages/Hotel.tsx` : `experience_viewed`, `experience_engaged`, `book_clicked`.
- `pages/Boats.tsx` et `components/boats/BoatDetailModal.tsx` : `listing_viewed` (listing = boats), `filter_applied` (city), `experience_viewed` à l'ouverture de la modale (product_type = boat), `request_clicked` au démarrage de la demande.
- `pages/StandaloneCheckout.tsx` : `checkout_viewed` par étape, `guest_form_started` au premier focus, `form_error_shown` quand showGuestErrors passe à true (un événement par champ en erreur), promo et gift card succès/échec, `checkout_step_completed`, `payment_widget_opened` quand revolutPublicId est défini, `payment_failed_client` dans le onError du widget, `checkout_abandoned` sur visibilitychange hidden si > 30 s et pas de paiement.
- `pages/StandaloneBookingConfirmation.tsx` : `confirmation_viewed`.
- `NewsletterPopup.tsx`, `MobileAuthPrompt.tsx`, `ContactDialog.tsx`, `TailoredRequestSection.tsx` : événements correspondants.
- Au moment où un email est saisi et validé (lead, checkout, compte) : `safeIdentify` avec l'email normalisé comme userId, et user property is_lead = true.

## 4. WhatsApp : message qualifiant + marqueur Instagram discret
- Mettre le numéro et les messages dans `src/constants/whatsapp.ts` pour les réutiliser plus tard (bateaux, confirmation).
- Nouveau message prérempli :
  - fr : "Bonjour ! Je voudrais organiser une expérience.\nNous serons : \nDate : \nCe qui nous tente : "
  - en : "Hi! I'd like to plan an experience.\nWe are: \nDate: \nWhat we have in mind: "
  - he : "שלום! אני רוצה לתכנן חוויה.\nכמה אנחנו: \nתאריך: \nמה מעניין אותנו: "
- Marqueur Instagram : si `entry_source` de la session vaut `instagram`, ajouter " 🌿" à la fin de la première ligne. Aucune autre différence.
- `src/components/WhatsAppButton.tsx` : au clic, `whatsapp_clicked` avec placement = floating_bubble, message_variant = site ou ig, entry_source, et productProps si on est sur une page produit (via un petit contexte `CurrentProductContext` alimenté par les pages produit, pas de refetch). Identify : has_clicked_whatsapp = true, add whatsapp_clicks_count +1.

## 5. Critères d'acceptation
- En local (`npm run dev`), la console affiche `[amp]` pour chaque événement listé en naviguant home > expérience > réserver > checkout.
- En arrivant sur le site avec `?utm_source=instagram` puis en cliquant la bulle, le message WhatsApp contient 🌿 ; sans, il ne le contient pas.
- `npm run build` passe sans erreur.
