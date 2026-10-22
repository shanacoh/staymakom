# StayMakom Experiences — Architecture Documentation

## Overview

StayMakom is a boutique travel platform connecting travelers with curated hotel experiences in Israel. The platform handles the full lifecycle: discovery, booking (via HyperGuest), payment, and post-booking management.

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Supabase + HyperGuest API

**Live domain:** https://staymakom.com
**Dev server:** http://localhost:8080

---

## Project Stats

| Metric | Count |
|--------|-------|
| Total .tsx files | ~245 |
| Pages | 70 |
| Components | 170 |
| Hooks | 15 |
| Edge Functions | 17 |
| Supabase Migrations | 88 |
| Main dependencies | 65+ |
| Supported languages | 3 (EN, HE, FR) |

---

## Directory Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/               # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── admin/            # Super admin components (sidebar, forms, managers)
│   ├── hotel-admin/      # Hotel partner admin components
│   ├── experience/       # Experience detail page components (V1 + V2)
│   ├── experience-test/  # Experience section components (Hero, Map, Reviews, etc.)
│   ├── forms/            # Complex forms (UnifiedExperience2Form, etc.)
│   │   ├── shared/       # Briques communes aux formulaires expérience seule et hôtel + expérience :
│   │   │                 #   en-tête collant (langue, Traduire tout, Brouillon, Publier), section repliable,
│   │   │                 #   sommaire, aperçu + checklist, annulation par modèles, SEO, encadré « Interne »
│   │   ├── styled/       # Habillage commun (index.tsx : champs du formulaire ; managers.tsx : éditeurs de listes)
│   │   └── ai/           # AiDraftPanel : « Générer avec l'IA » (types "standalone" et "hotel") ;
│   │                     #   AiMark : marqueur violet « IA » posé sur un champ rempli par l'IA
│   ├── account/          # User account components (MyStaymakomSection)
│   ├── auth/             # Auth dialogs and prompts
│   ├── category/         # Category page components
│   ├── ErrorBoundary.tsx # Global error boundary
│   ├── Header.tsx        # Main site header (scroll-aware, transparent mode)
│   ├── Footer.tsx        # Site footer (newsletter, categories, legal)
│   ├── ProtectedRoute.tsx # Role-based route guard
│   ├── SEOHead.tsx       # Dynamic meta tags (i18n-aware)
│   └── ...
├── pages/                # Route-level page components
│   ├── admin/            # Super admin pages (/admin/*)
│   │   ├── hyperguest/   # HyperGuest debug/config/logs pages
│   │   ├── Dashboard.tsx
│   │   ├── Hotels2.tsx   # Hotel management (V2)
│   │   ├── HotelEditor2.tsx # Hotel editor (1426 lines — god component)
│   │   ├── Experiences2.tsx # Experience management (V2)
│   │   ├── Reservations.tsx
│   │   ├── Customers.tsx
│   │   ├── Journal.tsx / JournalEditor.tsx
│   │   ├── Settings.tsx
│   │   └── ...
│   ├── hotel-admin/      # Hotel partner pages (/hotel-admin/*)
│   │   ├── Dashboard.tsx
│   │   ├── Property.tsx
│   │   ├── Bookings.tsx
│   │   └── ...
│   ├── Index.tsx         # Homepage (/home)
│   ├── ComingSoon.tsx    # Landing page (/)
│   ├── Experience2.tsx   # Experience detail (V2, active)
│   ├── Experience.tsx    # Experience detail (V1, legacy)
│   ├── Experiences2.tsx  # Experience listing (V2, active)
│   ├── Hotel.tsx         # Hotel detail page
│   ├── Checkout.tsx      # Booking checkout (975 lines — god component)
│   ├── BookingConfirmationPage.tsx # Post-booking confirmation
│   └── ...
├── hooks/                # Custom React hooks
│   ├── admin/            # Admin-specific hooks
│   │   ├── useDiagnostic.ts
│   │   ├── useHyperGuestDebug.ts
│   │   └── useHyperGuestLogs.ts
│   ├── useLanguage.tsx   # i18n (EN/HE/FR) + RTL support
│   ├── useCart.ts        # Shopping cart (localStorage)
│   ├── useExperience2.ts # Experience data fetching
│   ├── useExperience2Price.ts # Price calculation
│   ├── useHyperGuestAvailability.ts # Hotel availability
│   ├── useQuickDateAvailability.ts  # Quick date check
│   ├── useCookieConsent.ts # GDPR cookie banner
│   └── ...
├── contexts/             # React Context providers
│   ├── AuthContext.tsx   # Auth + RBAC (admin, hotel_admin, customer)
│   └── CurrencyContext.tsx # ILS/USD conversion (Frankfurter API)
├── services/             # External API service layers
│   └── hyperguest.ts     # HyperGuest API (search, booking, cancel)
├── models/               # Data models
│   └── hyperguest/       # HyperGuest Hotel, SearchResult models
├── integrations/
│   ├── supabase/
│   │   ├── client.ts     # Supabase client initialization
│   │   └── types.ts      # Auto-generated database types
│   └── lovable/
│       └── index.ts      # Lovable OAuth integration
├── lib/                  # Utility libraries
│   ├── analytics.ts      # Amplitude event tracking (100+ events)
│   ├── amplitude.ts      # Single @amplitude/unified instance (init lives in main.tsx)
│   ├── aiTracking.ts     # AI assistant tracking
│   ├── translations.ts   # i18n translation strings
│   └── utils.ts          # cn() classname utility
├── utils/                # Pure utility functions
│   ├── cancellationPolicy.ts # Cancellation policy parsing
│   └── taxesDisplay.ts   # Tax display formatting
└── main.tsx              # App entry point

supabase/
├── config.toml           # Supabase local config (JWT, functions)
├── migrations/           # 88 SQL migration files
└── functions/            # 17 Edge Functions (Deno runtime)
    ├── hyperguest/       # HyperGuest API proxy (main)
    ├── hyperguest-health/
    ├── hyperguest-certification/
    ├── test-hyperguest/
    ├── send-booking-confirmation/  # Resend email
    ├── send-booking-status-update/
    ├── send-cart-reminder/
    ├── send-contact-request/
    ├── send-corporate-request/
    ├── send-gift-card/
    ├── send-partner-request/
    ├── collect-lead/
    ├── geocode-hotel/    # OpenStreetMap Nominatim
    ├── catalogue-lookup/ # Recherche d'un lieu pour le catalogue (site, TikTok, Instagram, nom)
    ├── capture-catalogue-link/ # Capture d'un lien partagé depuis l'iPhone (clé secrète)
    ├── _shared/lookup/   # Briques communes de la recherche de lieux (modules purs testés)
    ├── download-image/   # Image proxy/storage
    ├── manage-users/     # User CRUD (admin)
    ├── recommend-experiences/
    └── translate-text/

public/
├── favicon.ico, favicon-light.png, favicon-dark.png
├── og-coming-soon.jpg
├── robots.txt            # Allow all
├── _redirects            # SPA fallback (Netlify)
└── placeholder.svg
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      BROWSER                            │
│                                                         │
│  React 18 + React Router + React Query + Tailwind       │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐            │
│  │ Public   │ │ Admin    │ │ Hotel Admin  │            │
│  │ Site     │ │ /admin/* │ │ /hotel-admin │            │
│  └────┬─────┘ └────┬─────┘ └──────┬───────┘            │
│       │             │              │                    │
│  ┌────┴─────────────┴──────────────┴───────┐            │
│  │           AuthContext (RBAC)            │            │
│  │     CurrencyContext (ILS ↔ USD)         │            │
│  └────────────────┬────────────────────────┘            │
└───────────────────┼─────────────────────────────────────┘
                    │
          ┌─────────┴─────────┐
          │   Supabase SDK    │
          │   (anon key)      │
          └─────────┬─────────┘
                    │
┌───────────────────┼─────────────────────────────────────┐
│              SUPABASE CLOUD                             │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐   │
│  │ PostgreSQL  │  │   Auth      │  │   Storage     │   │
│  │ (43+ tables)│  │ (JWT+OAuth) │  │ (images)      │   │
│  │ RLS: 219+   │  │             │  │               │   │
│  │ policies    │  │ 3 roles:    │  │ 4 buckets:    │   │
│  │             │  │ admin       │  │ experience-   │   │
│  │ V1 tables:  │  │ hotel_admin │  │ category-     │   │
│  │ experiences │  │ customer    │  │ journal-      │   │
│  │ hotels      │  │             │  │ hotel-images  │   │
│  │             │  │             │  │               │   │
│  │ V2 tables:  │  │             │  │               │   │
│  │ experiences2│  │             │  │               │   │
│  │ hotels2     │  │             │  │               │   │
│  │             │  │             │  │               │   │
│  │ Shared:     │  │             │  │               │   │
│  │ bookings_hg │  │             │  │               │   │
│  │ categories  │  │             │  │               │   │
│  │ extras      │  │             │  │               │   │
│  │ user_*      │  │             │  │               │   │
│  │ leads       │  │             │  │               │   │
│  │ gift_cards  │  │             │  │               │   │
│  │ journal_*   │  │             │  │               │   │
│  └─────────────┘  └─────────────┘  └───────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              EDGE FUNCTIONS (Deno)               │   │
│  │                                                  │   │
│  │  hyperguest ──────────┐                          │   │
│  │  hyperguest-health    ├──→ HyperGuest APIs       │   │
│  │  hyperguest-cert      │   (search, book, cancel) │   │
│  │  test-hyperguest ─────┘                          │   │
│  │                                                  │   │
│  │  send-booking-confirmation ─┐                    │   │
│  │  send-cart-reminder         │                    │   │
│  │  send-gift-card             ├──→ Resend API      │   │
│  │  send-contact-request       │   (emails)         │   │
│  │  send-corporate-request     │                    │   │
│  │  send-partner-request ──────┘                    │   │
│  │                                                  │   │
│  │  geocode-hotel ──────────────→ OpenStreetMap     │   │
│  │  download-image ─────────────→ HyperGuest CDN   │   │
│  │  translate-text ─────────────→ Lovable AI        │   │
│  │  recommend-experiences ──────→ Lovable AI        │   │
│  │  manage-users ───────────────→ Supabase Auth     │   │
│  │  collect-lead ───────────────→ Supabase DB       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                 EXTERNAL SERVICES                       │
│                                                         │
│  HyperGuest ──── Hotel search, availability, booking    │
│  Resend ──────── Transactional emails                   │
│  Amplitude ───── Analytics + session replay (30%)       │
│  Frankfurter ─── Currency conversion (ILS ↔ USD)        │
│  OpenStreetMap ─ Geocoding + map tiles (Leaflet)        │
│  Google Fonts ── Inter, Playfair Display, Cormorant     │
└─────────────────────────────────────────────────────────┘
```

---

## Route Map

### Public Routes (no auth)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | IndexV3 (ou WinterPause) | Home. Pendant la pause « offre d'hiver » (`src/config/sitePause.ts`, jusqu'au 13/10/2026), affiche la page d'attente WinterPause |
| `/v3` | IndexV3 | Vraie home, visible pendant la pause. Hors pause, redirige vers `/` |
| `/home` | Index | Full homepage |
| `/experiences` | Experiences2 | Browse all experiences |
| `/category/:slug` | Category | Category filter page |
| `/experience/:slug` | Experience2 | Experience detail + booking |
| `/hotel/:slug` | Hotel | Hotel detail page |
| `/checkout` | Checkout | Booking checkout flow |
| `/cart` | Cart | Shopping cart |
| `/booking/confirmation/:token` | BookingConfirmationPage | Post-booking (token-secured) |
| `/auth` | Auth | Login / Sign up |
| `/journal` | Journal | Blog listing |
| `/journal/:slug` | JournalPost | Blog article |
| `/gift-card` | GiftCard | Gift card purchase |
| `/companies` | Companies | Corporate page |
| `/partners` | Partners | Hotel partner signup |
| `/contact` | Contact | Contact form |
| `/about` | About | About page |
| `/consulting` | Consulting | Consulting services |
| `/terms` | Terms | Terms of Service |
| `/privacy` | Privacy | Privacy Policy |
| `/cancellation-policy` | CancellationPolicy | Cancellation rules |
| `/launch` | LaunchIndex | Launch variant homepage |
| `/launch/experiences` | LaunchExperiences | Launch variant listing |

### Protected Routes (auth required)

| Path | Component | Role(s) |
|------|-----------|---------|
| `/account` | Account | customer, admin, hotel_admin |

### Admin Routes (`/admin/*` — role: admin)

| Path | Component |
|------|-----------|
| `/admin` | AdminDashboard |
| `/admin/categories` | AdminCategories |
| `/admin/categories/new` | CategoryEditor |
| `/admin/categories/edit/:id` | CategoryEditor |
| `/admin/hotels2` | AdminHotels2 (V2) |
| `/admin/hotels2/edit/:hotelId` | AdminHotels2 |
| `/admin/offre` | AdminOfferPlan (Plan de l'offre) |
| `/admin/experiences2` | AdminExperiences2 (V2) |
| `/admin/experiences2/edit/:experienceId` | AdminExperiences2 |
| `/admin/bookings` | AdminBookings |
| `/admin/reservations/:bookingId` | AdminReservationDetails |
| `/admin/customers` | AdminAccounts ("Comptes" — onglets Clients / Partenaires / Équipe, remplace l'ancien AdminCustomers + AdminUsers) |
| `/admin/journal` | AdminJournal |
| `/admin/journal/new` | JournalEditor |
| `/admin/journal/edit/:id` | JournalEditor |
| `/admin/gift-cards` | AdminGiftCards |
| `/admin/gift-cards/:id` | AdminGiftCardDetails |
| `/admin/leads` | AdminLeads |
| `/admin/favorites` | AdminFavorites |
| `/admin/settings` | AdminSettings |
| `/admin/diagnostic` | DiagnosticPage |
| `/admin/hyperguest/debug` | HyperGuestDebugPage |
| `/admin/hyperguest/logs` | HyperGuestLogsPage |
| `/admin/hyperguest/config` | HyperGuestConfigPage |
| `/admin/revolut/debug` | RevolutDebugPage |
| `/admin/standalone-bookings/grid` | AdminStandaloneBookingsGrid |
| `/admin/boats/new`, `/admin/boats/edit/:experienceId` | AdminBoatExperiences (formulaire bateau). `/admin/boats` et `/admin/boats/requests` sont redirigées vers Expériences (onglet Bateaux) et Réservations (filtre Bateaux). |
| `/admin/swipe/dossiers`, `/admin/swipe/bibliotheque`, `/admin/swipe/categories` | Module Swipe Itinéraire |
| `/admin/partenaires` | AdminProviders : liste des prestataires, filtrable par type, statut et région (voir « Prestataires : une seule entité »). L'ancienne adresse `/admin/partenaires/experiences` y redirige. |
| `/admin/partenaires/:providerId` | AdminProviderDetails : fiche d'un prestataire (infos, liaisons, réservations, chiffres par mois). Origine : fiche prestataire unique (contact, langue, conditions, politique annulation/météo, badge rouge si non validée). Voir note Bateaux v2 (2026-10-01). |
| `/admin/partenaires/propositions` | AdminPartnerProposals : propositions des prestataires à valider (avant / après, Accepter / Refuser avec commentaire) et édition des conditions partenaires. Voir « Espace partenaire ». |
| `/admin/rentabilite/bateaux` | AdminBoatsProfitability — tableau bateaux × durées, prix/marge/marge-par-heure par case, filtrable capacité et port. |
| `/admin/catalogue` | AdminCatalogue (carnet unique de tous les lieux, voir la note Catalogue ci-dessous) |
| `/admin/carte` | AdminCarte (carte de tous les lieux du catalogue, voir la note Catalogue) |
| `/admin/itineraires`, `/admin/promo`, `/admin/headquarter/sales`, `/admin/headquarter/marketing`, `/admin/headquarter/operation` | ComingSoonAdmin ("bientôt disponible") |

> Note (2026-09-17) : les anciennes pages de secours `/admin/backup/*` (Hotels V1, Experiences V1) ont été supprimées — plus utilisées depuis le passage aux pages V2. Le menu de gauche (`AdminSidebar.tsx`) est organisé en 4 groupes (Aperçu, Opérations, Croissance, Headquarter) plus un groupe Technique (HyperGuest, Revolut), repris de la maquette IA de Shana ; plusieurs entrées pointent encore vers des écrans "bientôt disponible" en attendant leur construction section par section.

> Note (2026-09-20) — Bateaux : ce sont des expériences "Experience Only" (`standalone_experiences`) rangées dans la catégorie `bateaux`, toujours "sur demande" (`is_bookable = false`, jamais de paiement en ligne). Trois vues d'une même donnée :
> - **Vitrine `/boat`** (page `Boats`) : toute l'année, indépendante de la catégorie (identifiant codé en dur dans `src/lib/boatsCategory.ts`), avec pop-up de détail (`BoatDetailModal`).
> - **Catégorie Bateaux** (puce de l'accueil qui filtre la grille sur place, comme les autres catégories ; page directe `/category/bateaux`) : saisonnière. Publiée = puce visible et page accessible ; non publiée (draft) = puce et page disparaissent. Les bateaux sont absents de la grille par défaut de l'accueil. Piloté à la main depuis la page Catégories du back-office.
> - **Back-office** : liste/prix/marges dans Expériences (onglet Bateaux), demandes et réservations dans Réservations (bouton filtre Bateaux). Les demandes sont écrites dans `standalone_experience_requests` puis converties à la main en `standalone_bookings`.
> Sur l'accueil et la page catégorie, une puce n'apparaît que si sa catégorie est publiée en base.

> Note (2026-10-01) — Bateaux v2 : refonte prestataires, prix, parcours /boat et paiement.
> - **Prestataires** (`providers`, table) : fiche unique (nom, WhatsApp, email, langue, conditions, politique annulation/météo, `policy_validated`). Remplace les 3 endroits où le prestataire était stocké en texte libre (`standalone_experiences.supplier_*`, `standalone_experience_suppliers.supplier_name`, `standalone_bookings.supplier_name`) — ces anciens champs sont encore en base (lecture seule, migration inverse non faite) mais `standalone_experiences.provider_id` / `standalone_experience_suppliers.provider_id` / `standalone_bookings.provider_id` pointent maintenant vers `providers.id`. Écran : `AdminProviders` (`/admin/partenaires/experiences`). Badge rouge "Politique non validée" via `ProviderPolicyBadge`.
> - **Variantes de prix par durée** (`standalone_experience_price_variants`) : une ligne par durée proposée pour une expérience (1h/1h30/2h/3h/4h), avec capacité max, prix d'achat (peut être NULL = "coût manquant") et prix de vente (prix de groupe, pas par personne). Gérées depuis le formulaire bateau (`BoatPriceVariantsManager`). Le prix d'achat est rangé dans `standalone_price_variant_internal` (réservé aux admins). Les anciens champs `supplier_price_adult`/`markup_percent` sont dans `standalone_experience_internal` et ne sont plus la source utilisée par `/boat` ni par la rentabilité.
> - **Rentabilité bateaux** (`/admin/rentabilite/bateaux`, `AdminBoatsProfitability`) : lit `standalone_experience_price_variants`, regroupe par bateau, colonnes = durées standards, cellule = prix de vente + marge ₪/% + marge/heure (ou "Coût manquant" si `purchase_price` est NULL).
> - **Parcours public `/boat`** (`Boats.tsx`) : colonne de gauche `BoatSentenceFilter` (personnes, port, durée, date par tranche ou précise via petit calendrier si "plus tard", moment de la journée) fixe sous le header en desktop, résultats à droite mis à jour en direct (pas de synchronisation vers l'URL — un seul jeu de critères, pas de filtre dupliqué entre écrans). Chaque carte a un bouton WhatsApp direct (pas de formulaire, trace silencieuse côté back-office, `source = 'card_whatsapp'`) et ouvre `BoatDetailModal` au clic (photos, inclus, extras avec total, point de RDV + Maps). Dans la fiche détail, "Envoyer ma demande" ouvre `BoatAvailabilityPopup` (même composant, avec ou sans bateau présélectionné) : personnes exact, durée (prix affiché par durée = upsell "+1h"), date, heure souhaitée, prénom, WhatsApp obligatoire, email facultatif. Plus aucun free-text "notes/extras" côté client sur aucun des deux chemins. L'ancien formulaire à fourchettes de personnes (`usePartyRanges` dans `StandaloneRequestPanel`) a été supprimé (mort depuis ce changement).
> - **Suivi des demandes** (depuis le 06/10/2026 : lignes « Demande » de la page Réservations, voir la note de refonte ci-dessous ; l'ancien `StandaloneRequestsTable` est supprimé) : statuts Nouvelle → Envoyée au prestataire → Dispo OK → Convertie / Refusée (`sent_to_provider_at`, `provider_responded_at` pour les alertes 15 min / 1 h). Bouton "Envoyer au prestataire" (message WhatsApp en anglais, utilise `supplier_boat_name` — le nom du bateau chez le prestataire, pas le nom client STAYMAKOM). "Dispo confirmée" ouvre directement `CreateManualStandaloneBookingDialog` pour fixer le prix avant de créer la réservation.
> - **Paiement acompte/solde réel** (`standalone_booking_payments`, une ligne par paiement Revolut) : règle d'acompte par expérience (`standalone_experiences.deposit_type` none/fixed/percentage + `deposit_amount`, réglable via `DepositRuleEditor` ; bateaux = fixed 500). Bouton "Générer lien d'acompte/solde" sur `StandaloneBookingDetails` appelle la fonction `create-booking-payment-link` (admin only, crée un vrai ordre Revolut) puis propose l'envoi WhatsApp du lien. `revolut-webhook` a un 3ᵉ cas de correspondance (après `bookings_hg` et `standalone_bookings`) : marque le paiement payé, recalcule le total payé pour la réservation, passe `payment_status` à `deposit_paid` ou `paid` selon que le total atteint `sell_price`. Les fonctions `confirm-standalone-payment` et `reconcile-standalone-bookings` (code présent depuis juillet) ont été déployées pour la première fois ce jour-là — elles étaient absentes de la liste des fonctions actives.
> - **Code** : `src/lib/boatAvailability.ts` (disponibilité partagée, points de RDV fixes Herzliya/Tel Aviv), `src/components/boats/*`, `src/components/admin/{BoatPriceVariantsManager,FeaturedBadgeToggle,DepositRuleEditor,ProviderPolicyBadge}.tsx`, `src/pages/admin/{Providers,BoatsProfitability}.tsx`, `supabase/functions/create-booking-payment-link/`.

> Note (2026-10-07) — Demandes de voyage sur mesure. Le formulaire « Tailor-made request » (fenêtre « Design my stay », 3 étapes, `src/components/tailorMade/`) appelle la fonction serveur `submit-tailor-made-request`, qui enregistre la demande en une seule opération (fonction SQL `create_tailor_made_request`) : un dossier de voyage (`dossiers_voyage`) au statut `demande_sur_mesure`, avec les réponses dans `demande_formulaire`, plus un lead si un email est donné. Il n'y a pas de table de demandes séparée : la vue `admin_reservations` montre ces dossiers dans la page Réservations (onglet Itinéraire, statut « Demande sur-mesure »), et ils n'entrent dans l'espace Dossiers qu'une fois le dossier créé depuis leur fiche (bouton « Dossier swipe » ou « Itinéraire », qui passe le statut à `brief` avec le brief pré-rempli). `itinerary_requests`, l'ancien questionnaire par email et la réponse automatique au formulaire ne sont plus utilisés.

> Note (2026-10-06) — Refonte de la page Réservations (`/admin/bookings`), lot 1 sur 5. Une seule page, onglets Tous / Hôtel / Expérience / Itinéraire, deux affichages des mêmes données : « Vue » (résumé groupé Demandes / À traiter / Soldées, chiffres clés, bouton de prochaine action) et « Saisie » (grille). Les données passent par `src/lib/reservations/` : `queries.ts` lit la vue SQL `admin_reservations` (migration `20261006120000`, lecture seule, `security_invoker`), qui réunit `standalone_bookings` (hors statut `pending`), `standalone_experience_requests` (hors converties et fermées), `bookings_hg` et les `dossiers_voyage` payés et calcule statut, type et encaissé, puis l'habille en `ReservationRow` (`types.ts`). Une seconde vue, `admin_unfinished_payments`, regroupe les paiements en ligne non aboutis par client et par expérience ; `rules.ts` contient les règles pures (prochaine action, groupes, filtres, chiffres clés), testées dans `rules.test.ts`. Une demande est une ligne au statut « Demande » ou « Dispo OK », plus un objet séparé. Les demandes de voyage du site (`itinerary_requests`) sont affichées à part, en haut de l'onglet Itinéraire (`ItineraryRequestsSection`), sans entrer dans les totaux ; l'ancienne table `dossiers` n'est plus lue par cette page. Depuis la migration `20261006110000`, `standalone_bookings.product_type` (`experience` / `boat`, rempli par un déclencheur à la création, modifiable dans la grille) porte le type, et `standalone_bookings.request_id` relie une réservation à sa demande d'origine (écrit par la fonction `link_request_to_booking`, qui passe aussi la demande en « convertie »). Lot 2 : les boutons de prochaine action ouvrent `ReservationActionDialogs` (une fenêtre par action), dont les écritures sont dans `src/lib/reservations/actions.ts` (mises à jour conditionnelles) et les messages WhatsApp dans `whatsapp.ts`. Lot 3 : l'affichage « Saisie » est `ReservationsEntryGrid` (une grille pour tous les onglets), dont les règles d'édition par origine de ligne sont dans `src/lib/reservations/entryGrid.ts` (`cellMode`, `buildCellUpdate`, `computeTotals`). Lot 4 : la puce rouge « Paiements non aboutis » affiche `UnfinishedPaymentsTable`, alimentée par la vue `admin_unfinished_payments`. Lot 5 : onglet Itinéraire. « Lier un dossier payé » (`LinkPaidDossierDialog`) pose `paye_at`, `montant_vente_final` et `montant_encaisse` sur `dossiers_voyage` ; les lignes de réservation d'un dossier viennent de la vue `admin_reservation_dossier_lines` et portent `cout_reel` et `paiement_fournisseur` (migration `20261006130000`). Les anciens composants (`ExperienceBookingsGrid`, `HotelBookingsGrid`, `ItineraryRequestsTable`, `StandaloneRequestsTable`, `BookingsGridTable`) sont supprimés.

> Note (2026-10-22) — Réservations v2, lot 1 : archives des demandes. Une demande (`standalone_experience_requests`) sort du flux sans être supprimée : « Convertie » (réservation liée par `link_request_to_booking`) ou « Archivée » (`status = closed`, motif `lost_reason` parmi prix / pas_de_dispo / client_ne_repond_plus / a_reserve_ailleurs / date_passee / autre, note `lost_note`). Rien n'expire automatiquement : l'archivage est manuel (menu « … » de la ligne, `RequestRowMenu`, fenêtre `ArchiveRequestDialog` dans `ReservationActionDialogs`), sauf la réponse « pas dispo » du prestataire qui archive avec `pas_de_dispo`. Le déclencheur `standalone_request_track_closing` pose `closed_at` à la sortie et efface `closed_at` / motif / note quand la demande revient active (« Réouvrir », `reopenRequest`, interdit sur une convertie). Le déclencheur `standalone_request_link_lead` rattache chaque nouvelle demande au lead existant de même email (`lead_id`, sans en créer). La puce « Archives » affiche `RequestArchivesTable`, alimentée par la vue `admin_request_archives` (migration `20261022140000`), avec filtre Bateaux et export CSV (`src/lib/reservations/archives.ts`, séparateur point-virgule pour Excel). La fenêtre « Modifier la demande » ne change plus le statut. La vue `admin_reservations` est inchangée (elle ne montrait déjà que les demandes actives).

> Note (2026-10-22) — Réservations v2, lot 2 : hôtels saisis à la main. « + Réservation hôtel » (`CreateManualHotelBookingDialog`) appelle la fonction `create-hotel-manual-booking`, qui crée une ligne `bookings_hg` (`source = manual_admin`) avec un hôtel du catalogue (`hotel_id`) ou en clair (`hotel_name`, contrainte `bookings_hg_manual_hotel_named`), un email facultatif, un coût `net_price` facultatif, le paiement client (`payment_status` unpaid / deposit_paid / paid + `paid_amount`) et le paiement de l'hôtel (`supplier_payment_status` pending / paid, `supplier_paid_at`, migration `20261022180000`). Dans `admin_reservations`, une saisie à la main suit coût et paiement de l'hôtel comme une réservation d'expérience ; une réservation synchronisée garde `supplier_payment = none`. Les actions de la Vue (coût, encaissement, solde, hôtel payé) passent par `markHotelClientPaid`, `saveHotelSupplierCost`, `markHotelSupplierPaid` ; un hôtel avec acompte n'a pas de lien de paiement, son solde se confirme à la main.

> Note (2026-10-22) — Réservations v2, lot 3 : onglet Itinéraire. En affichage « Vue », l'onglet montre `ItinerariesView`, alimentée par la vue `admin_itineraries` (migration `20261022200000`) : tous les `dossiers_voyage` (archivés, modèles et demandes sur-mesure compris) avec un groupe calculé dans cet ordre : payé (`paye_at`) = converti, `est_modele` = modèle, `objectif = collab` = collab, archivé ou statut `termine` / `perdu` = non converti, sinon en cours. Règles pures dans `src/lib/reservations/itineraries.ts`. « Classer non converti » archive avec `perdu_motif` / `perdu_note`. Les pages-itinéraire écrites dans le code (`src/pages/Celine30.tsx`, `HappyBirthdayMom.tsx`...) sont représentées par un dossier repère dont `page_sur_mesure` donne le chemin : le lien client y mène, et `useDossiersVoyage` les exclut de l'espace Itinéraires. Toute nouvelle page de ce type doit recevoir son dossier repère (insertion dans `dossiers_voyage` avec `page_sur_mesure`) pour apparaître dans l'onglet. L'affichage « Saisie » de l'onglet reste celui des lignes de `admin_reservations` (dossiers payés et demandes sur-mesure).

> Note (2026-10-22) — Réservations v2, lot 4 : annulations. Une réservation d'expérience ou d'hôtel s'annule par le menu « … » (`ReservationRowMenu`) et le panneau `CancellationDialog`, qui écrit en une seule modification (`saveCancellation`) le contenu calculé par `buildCancellationPatch` (`src/lib/reservations/cancellation.ts`) : `status = cancelled`, `is_cancelled`, `cancelled_at`, remboursement client (`refund_amount`, `refund_method`, `payment_status` `refund_pending` ou `refunded`, `refunded_at`), montant gardé (`deposit_kept`) et côté prestataire (`supplier_refund_status`, `supplier_refund_amount`), migration `20261022220000`. Le panneau ne remet jamais `payment_status` à `paid` / `deposit_paid` (déclencheur des emails de confirmation). Pour une réservation d'expérience, l'email d'annulation au prestataire (déclencheur `partner_notify_booking_cancelled`) est évité en posant `provider_cancel_notified_at` quand la case « Envoyer au prestataire » est décochée. Une ligne annulée ou remboursée suit `isCancellation` : pas d'encaissement ni de paiement fournisseur attendu, marge d'annulation dans la marge connue, chiffres « Remboursements à faire » et « À récupérer / avoirs ouverts ». Un avoir (`supplier_refund_status = avoir`, `supplier_credit_used_on` vide) apparaît dans la vue `admin_supplier_credits`, sur la fiche prestataire (`ProviderCreditsSection`) et à la création d'une réservation chez lui ; `use_supplier_credit` le ferme.

> Note (2026-10-06) — Suppression et corbeille de la page Réservations. En affichage « Saisie », toutes les lignes (réservation manuelle ou payée en ligne, demande, hôtel, dossier) se suppriment de la même façon : corbeille en bout de ligne, ou cases à cocher puis « Supprimer » pour plusieurs lignes, avec une seule fenêtre de confirmation (`DeleteReservationDialog`). La suppression passe par la fonction SQL `delete_reservations` (migration `20261006150000`) : elle copie la ligne et ses lignes rattachées (paiements d'une réservation ; versions, lignes, retours, propositions, participants et swipes d'un dossier) dans la table `deleted_reservations`, puis supprime, en une seule opération. La puce « Corbeille » affiche `DeletedReservationsTable` ; « Restaurer » appelle `restore_deleted_reservation`, qui remet tout à l'identique et retire l'entrée de la corbeille. Les deux fonctions s'exécutent avec les droits de l'appelant (admins). Rien n'est purgé automatiquement.
>
> Note (2026-09-30) — Canal d'acquisition : `standalone_bookings` et `bookings_hg` ont chacune une colonne `channel` (whatsapp, instagram_dm, tiktok, phone, email, partner, referral, walk_in, other) et `channel_detail` (texte libre), nullable. Saisi via un select dans les deux dialogs de réservation manuelle (`CreateManualStandaloneBookingDialog`, `CreateManualHotelBookingDialog`), modifiable après coup depuis la grille (`AdminStandaloneBookingsGrid`, grille hôtel de Réservations). Le dashboard (`AdminDashboard`) affiche un bloc "CA par canal" (`RevenueByChannelCard`) : somme de `sell_price` des réservations confirmées, groupée par canal et par devise, mois en cours vs mois précédent.

> Note (2026-09-20) — Catalogue (`/admin/catalogue`, lot 1) : carnet unique de tous les lieux (ceux du site, partenaires en cours, idées vues sur TikTok/Instagram, lieux non commerciaux pour les itinéraires). Strictement interne (rôle admin), chargé à part (lazy) : aucun impact sur le site public.
> - **Principe : on relie, on ne recopie pas.** Une ligne par lieu dans `catalogue_items` ; pour un lieu publié sur le site, elle pointe vers sa fiche (`hotel_id`, `experience_id` ou `standalone_experience_id`, un seul des trois, unique). La vue `catalogue_overview` (`security_invoker`, à répéter à chaque `create or replace view` sinon Postgres l'efface et la vue devient lisible sans connexion) relit en direct nom, photo, ville, région, position et catégories depuis `hotels2` / `experiences2` (position via l'hôtel) / `standalone_experiences`. Si des champs des formulaires du site changent, c'est la seule vue à ajuster (elle fige `ci.*` à sa création : toute nouvelle colonne de `catalogue_items` demande de la recréer).
> - **Suivi** (jamais dans les tables du site) : nature (`partenaire` / `hors_reseau` / `inspiration`), type, statut commercial (`a_trier` … `refuse`), dates de contact et de relance, cases contenu envoyé / visité / vidéo faite, catégories Staymakom, étiquettes. `catalogue_links` : plusieurs liens ou vidéos par lieu (lien, plateforme, légende et vignette copiées) ; le même lien ne peut exister qu'une fois (clé `url_key` normalisée : paramètres de partage TikTok/Instagram ignorés).
> - **Fonctions** : `sync_catalogue_with_site()` (appelée à l'ouverture de la page ; crée une ligne pour chaque fiche publiée sans lieu ; volontairement pas un déclencheur sur les tables du site, pour ne jamais bloquer une publication) ; `catalogue_create_item(p_item, p_link)` (lieu + premier lien en une seule opération, refuse un lien déjà présent ; réutilisée au lot 2 par la capture iPhone). Toutes deux non privilégiées : les règles d'accès (admin uniquement) s'appliquent.
> - **Code** : `src/pages/admin/Catalogue.tsx`, `src/components/admin/catalogue/*`, `src/lib/catalogue/*` (types et libellés, filtres et compteurs, brouillon de fiche, lecteurs vidéo TikTok/Instagram/YouTube reconstruits à partir de l'identifiant, requêtes). Logique pure testée (`npm test`).
> - **Recherche d'un lieu** (`catalogue-lookup`, réservée aux admins, `verify_jwt = false` avec contrôle `has_role` dans la fonction) : un lien de site (lecture de la page : balises meta, données structurées JSON-LD, liens tel/mailto/Instagram, texte), un lien TikTok (service oEmbed public) ou Instagram (balises og, au mieux), un lien Google Maps (nom et position exacte lus dans l'adresse, adresse retrouvée par OpenStreetMap), ou un nom (Nominatim/OpenStreetMap, plusieurs essais plus courts si rien). Les liens courts (vm.tiktok.com, maps.app.goo.gl) sont d'abord suivis en sécurité, y compris derrière la page de consentement de Google. Garde-fous : adresses internes refusées (avant et après redirection), 8 s et 1,5 Mo max par page, une requête par seconde vers Nominatim. Une position n'est déduite que d'une vraie adresse ou d'un lien Maps, jamais d'un simple nom (risque d'homonyme).
> - **IA (facultative)** : `_shared/lookup/runtime.ts` utilise Claude (SDK `npm:@anthropic-ai/sdk`, modèle `claude-haiku-4-5`, modifiable par le secret `CATALOGUE_AI_MODEL`) si le secret `ANTHROPIC_API_KEY` existe, sinon l'ancienne passerelle Lovable si `LOVABLE_API_KEY` existe (elle n'est PAS configurée sur le projet au 2026-09-20, ce qui veut aussi dire que `translate-text` et `recommend-experiences` n'ont pas leur IA), sinon la recherche marche sans IA (ce qui est lisible directement). L'IA ne fait que ranger le texte fourni en JSON (nom, type, ville, région, adresse, contact, description en français) ; elle est utile surtout pour repérer le lieu cité dans une légende TikTok.
> - **Code partagé** : `supabase/functions/_shared/lookup/` (modules purs testés `parse`, `osm`, `ai`, `safe-url`, `resolve`, `capture`, l'enchaînement `lookup` dont les appels réseau sont injectés, et `runtime.ts` pour l'environnement Supabase). Les fonctions `catalogue-lookup` et `capture-catalogue-link` ne font que l'identification et la réponse web. Déploiement : `supabase functions deploy <nom> --project-ref uqeipzfdhyjkjzvqbkeu --no-verify-jwt --use-api` (redéployer les deux si un fichier partagé change). Côté application : `lookup.ts` / `lookupForm.ts` (logique pure), `lookupApi.ts` (appel), `LookupBox.tsx` (écran).
> - **Capture depuis l'iPhone** (`capture-catalogue-link`) : le raccourci « Partager » envoie le lien (formulaire, JSON ou texte brut) avec la clé secrète `CATALOGUE_CAPTURE_TOKEN` (en-tête `x-capture-token` ou champ `token`, comparée en temps constant). La fonction extrait le premier lien du texte, refuse les doublons avant toute recherche, plafonne à 40 ajouts par 10 minutes, lance la recherche (20 s max), puis crée le lieu au statut « À trier » et son lien via `catalogue_create_item` (compte de service, en une seule opération). Si la recherche échoue, le lien est gardé seul : un partage n'est jamais perdu. Un lieu de la carte n'est retenu que si son nom correspond à celui repéré dans la légende. La réponse est un court texte affiché tel quel dans la notification de l'iPhone.
> - **Boîte « À trier »** (`InboxList.tsx`, onglet « À trier » de la page) : une carte par lien, avec vignette, légende, proposition de la recherche, lecteur vidéo au clic ; Valider (nom, nature, type, statut), Modifier (ouvre la fiche), Écarter (statut « Refusé ou abandonné », retrouvable dans « Tous »).
> - **Carte** (`/admin/carte`, `Carte.tsx`) : Leaflet + tuiles OpenStreetMap (déjà utilisés ailleurs sur le site, gratuit, aucune nouvelle dépendance). Les épingles viennent de la vue `catalogue_overview` (position de la fiche du site si elle existe, sinon celle du catalogue), colorées par statut commercial, avec les mêmes onglets et filtres que le catalogue (composants partagés `CatalogueTabs` et `CatalogueFilters`). Les lieux « À trier » et « Refusé ou abandonné » n'y figurent pas (sauf filtre explicite). Le regroupement des épingles proches est fait maison (`lib/catalogue/map.ts`, `clusterPoints` : grille en pixels au zoom courant, testée) pour ne pas ajouter de bibliothèque (le projet a trois fichiers de versions, npm et bun, dont un seul peut être mis à jour ici). La fenêtre d'une épingle est construite en éléments DOM avec `textContent` (jamais de HTML brut : les noms viennent de sites et de légendes). Piège évité : ne jamais faire varier la classe CSS du conteneur Leaflet depuis React (elle efface les classes que Leaflet y pose) ; le curseur passe par le style.
> - **Recherche et filtres** (`lib/catalogue/filters.ts`, `CatalogueToolbar.tsx`, même barre sur le Catalogue et la Carte) : une grande barre de recherche (plusieurs mots cumulés, sans accents ni majuscules, dans nom, ville, région, adresse, notes, contact, Instagram et étiquettes ; « / » place le curseur, « Échap » efface ; les mots trouvés sont surlignés dans la liste), les statuts en puces, « ce qu'il reste à faire » en puces (À relancer, À visiter, Vidéo à faire, Contenu à envoyer ; les trois derniers ne concernent que les partenaires et discussions en cours ; les puces se cumulent), et un bouton Filtres (type, catégorie Staymakom, région, ville, origine, en cases à cocher). Tous les critères acceptent plusieurs valeurs. Chaque puce ou case affiche le nombre de lieux qu'elle donnerait compte tenu des AUTRES critères (`facetCounts`, `todoCounts`) ; les choix du panneau restent visibles sous la barre avec leur croix. Sur la Carte : liste liée à la carte (`MapSidePanel.tsx`), survol = cercle de mise en évidence, clic = zoom niveau rue et fenêtre du lieu ; « À localiser » et « À corriger » sont des onglets de cette liste. Les lieux « Refusé ou abandonné » n'apparaissent plus sur la carte.
> - **Alerte « hors d'Israël »** (`lib/catalogue/geo.ts`, `PositionAlerts.tsx`) : tous les lieux sont en Israël, donc une position hors du rectangle (lat 29,4 à 33,4 ; lng 34,2 à 35,9) est une erreur de données. Un lieu de ce genre n'est pas dessiné sur la carte (il la ferait dézoomer sur le monde) mais listé dans une alerte rouge avec sa position et les outils pour la corriger ; un bandeau d'alerte apparaît aussi sur la page Catalogue ; la fiche d'un lieu et la saisie de latitude/longitude avertissent ; la confirmation d'une position hors d'Israël est bloquée sur la carte. Une seconde alerte (orange) signale les fiches du SITE dont la propre position est aberrante (colonnes `live_latitude` / `live_longitude` de la vue), car la page publique affiche alors une carte et un lien d'itinéraire au mauvais endroit, même si le catalogue a été corrigé. Côté serveur (`_shared/lookup/geo.ts`, même règle écrite dans les deux environnements), la recherche prévient quand un résultat n'est pas en Israël et la capture iPhone n'adopte jamais un homonyme situé à l'étranger.
> - **Position affichée = correction du catalogue d'abord** : dans la vue `catalogue_overview`, `display_latitude/longitude` prennent la position du catalogue si latitude ET longitude y sont renseignées, sinon celle de la fiche du site. Une correction faite depuis la carte prime donc sur une valeur aberrante de la fiche, sans modifier la fiche du site.
> - **À localiser** (`LocateList.tsx`) : les lieux affichés sans position. Trois façons de les placer : « Chercher » (fonction `catalogue-lookup`, adresse puis nom avec ville puis nom, le plus précis d'abord), « Cliquer sur la carte », ou « Lien Maps » (position exacte lue dans un lien Google Maps, court ou long). La position n'est enregistrée qu'après confirmation sur la carte (repère provisoire rouge), dans `catalogue_items.latitude/longitude` : pour une fiche du site sans position, elle sert de secours dans la vue et ne modifie pas la fiche du site.
> - **À venir** : lot 4 (sélecteur dans les itinéraires). La Bibliothèque swipe reste séparée en attendant la réflexion sur les itinéraires.

### Espace partenaire (`/partner/*` — rôle : partner)

| Path | Écran |
|------|-------|
| `/partner/login` | Connexion par lien reçu par email (pas de mot de passe) |
| `/partner` | Accueil : prochaines réservations, actions en attente, état des propositions |
| `/partner/experiences`, `/partner/experiences/:id` | Ses expériences ; pour chacune : questionnaire pratique, disponibilités, proposer une modification |
| `/partner/new` | Proposer une nouvelle expérience |
| `/partner/bookings`, `/partner/revenue`, `/partner/reviews`, `/partner/profile` | Réservations payées, revenus et règlements, avis publiés, profil et conditions acceptées |

Tant que les conditions en vigueur ne sont pas acceptées, toutes ces adresses n'affichent que l'écran des conditions. Voir la section « Espace partenaire ».

### Hotel Admin Routes (`/hotel-admin/*` — role: hotel_admin)

| Path | Component |
|------|-----------|
| `/hotel-admin` | HotelAdminDashboard |
| `/hotel-admin/property` | HotelProperty |
| `/hotel-admin/experiences` | HotelExperiences |
| `/hotel-admin/bookings` | HotelBookings |
| `/hotel-admin/bookings/:bookingId` | HotelBookingDetails |
| `/hotel-admin/bookings/edit/:bookingId` | HotelBookingEdit |
| `/hotel-admin/extras-management` | HotelExtrasManagement |
| `/hotel-admin/billing` | HotelBilling |
| `/hotel-admin/reviews` | HotelReviews |
| `/hotel-admin/payment-info` | HotelPaymentInfo |
| `/hotel-admin/contact` | HotelContact |

---

## Authentication & Authorization

### Auth Flow
1. User signs in via Supabase Auth (email/password or OAuth via Lovable)
2. `AuthContext` provisions user: creates `user_profiles` + `customers` records
3. Role fetched from `user_roles` table (admin, hotel_admin, customer, partner)
4. `ProtectedRoute` component checks role before rendering

### RBAC Matrix

| Feature | Public | Customer | Hotel Admin | Admin |
|---------|--------|----------|-------------|-------|
| Browse experiences | ✅ | ✅ | ✅ | ✅ |
| Book experience | ✅ | ✅ | ✅ | ✅ |
| View own bookings | ❌ | ✅ | ✅ | ✅ |
| Manage own hotel | ❌ | ❌ | ✅ | ✅ |
| Full admin panel | ❌ | ❌ | ❌ | ✅ |

---

## Data Flow: Booking Lifecycle

```
1. DISCOVERY
   User browses /experiences → Supabase query on experiences2 table

2. AVAILABILITY CHECK
   User selects dates on Experience2 page
   → useHyperGuestAvailability hook
   → Edge Function: hyperguest?action=search
   → HyperGuest Search API
   → Returns rooms, rates, cancellation policies

3. PRE-BOOK
   User selects room + rate plan
   → Edge Function: hyperguest?action=pre-book (JWT required)
   → HyperGuest Pre-Book API
   → Returns final price + payment options

4. CHECKOUT (/checkout)
   User fills guest info + BILLING ADDRESS (country + postcode — Revolut minimum)
   → Country + postcode are REQUIRED before payment can open, and are passed to the
     Revolut widget (billingAddress). Without them the bank rejects the card and the
     payment crashes. Street/city are intentionally not collected (minimal friction).
     Validation is shared via isLeadGuestComplete() in LeadGuestForm.
   → Revolut embedded checkout collects the card and processes the payment
   → Edge Function: process-booking (create HyperGuest booking + insert bookings_hg)
   → HyperGuest Booking API
   → Insert into bookings_hg table (Supabase)
   → Edge Function: send-booking-confirmation (Resend email)

   NOTE: the same LeadGuestForm + billing address requirement applies to the
   standalone ("only") experiences checkout (/standalone-checkout → process-standalone-payment).

5. CONFIRMATION (/booking/confirmation/:token)
   Public page secured by UUID token
   → Supabase query on bookings_hg by confirmation_token

6. CANCELLATION (from /account)
   → Edge Function: hyperguest?action=cancel-booking (JWT required)
   → Update bookings_hg status
   → Edge Function: send-booking-status-update
```

---

## External Services

| Service | Purpose | Auth | Edge Function |
|---------|---------|------|---------------|
| **HyperGuest** | Hotel search, booking, cancellation | Bearer token (Supabase secret) | `hyperguest` |
| **Resend** | Transactional emails | API key (Supabase secret) | `send-*` functions |
| **Amplitude** | Analytics + session replay (30% sample) | Client API key | N/A (client-side) |
| **Frankfurter** | Currency ILS ↔ USD | None (public API) | N/A (client-side) |
| **OpenStreetMap** | Geocoding + Leaflet map tiles | None (public) | `geocode-hotel` |
| **Lovable** | OAuth, AI translation, recommendations | Platform-managed | `translate-text`, `recommend-experiences` |

---

## Internationalization (i18n)

- **Languages:** English (en), Hebrew (he), French (fr)
- **RTL:** Automatic for Hebrew via `useLanguage` hook
- **Implementation:** URL query param `?lang=he`
- **DB pattern:** Fields stored as `title` (en), `title_he`, `title_fr`
- **Helper:** `getLocalizedField(obj, 'title', lang)` returns the right field
- **Translations:** Static strings in `src/lib/translations.ts`

---

## Design System

### Typography
- **Inter** partout sur les pages client (les classes `font-serif` et `font-display` retombent sur Inter depuis la session DA d'octobre 2026).
- **Cormorant Garamond** : uniquement les titres du journal, où elle est nommée explicitement.

### Règles de la DA client (session d'octobre 2026)
- Référence visuelle : `docs/claude/maquettes/maquette-da-home-panier-paiement.html`, brief dans `docs/claude/brief-session-da-visuel.md`.
- Une seule couleur de marque : `primary` = rouge `#ad1414`. Dans le back-office (admin et espace hôtelier), la classe `.backoffice` posée sur `<html>` par `useBackofficeTheme` fait de `primary` le noir de marque `#1a1814` (liens, menu et onglets actifs, interrupteurs). Le rouge y reste réservé à l'action via la couleur `action` (boutons pleins, compteurs), commune au site client.
- Titres en majuscules mais petits (16 pour une section, 28 pour la photo d'accueil). Arrondis : complet pour les boutons, 14 pour cartes et blocs, 10 pour les champs.
- Traits de feutre rouges : conservés là où ils existent (catégorie choisie, liens d'action soulignés), sans en ajouter.

### Régions : liste de référence et filtre de la home
- Tables `region_zones` (5 zones, dans l'ordre Tel Aviv-Jaffa, Jérusalem, Nord, Côte & Centre, Sud ; migration `20261012100000_five_zones_and_creative_mood.sql`) et `regions` (21 régions, `slug` stable, nom FR / EN / HE, actif ou non). Les fiches pointent dessus par `region_id` (`standalone_experiences`, `hotels2`, `propositions`) ; une expérience hôtel prend la région de son hôtel. Les anciens textes `region`, `region_fr`, `region_he` restent en base.
- Règle de lecture, partout : `regionLabel` (`src/lib/regionList/labels.ts`) donne le nom de la liste dans la langue du site si la fiche est reliée, sinon l'ancien texte. Les pages passent par `useRegionLabel` (`queries.ts`), le back-office choisit une région avec `RegionSelect` (`src/components/forms/shared/`).
- `src/lib/regionList/filter.ts` filtre la home par zone ou par région. Une fiche sans région reliée est rangée dans une zone d'après sa position sur la carte, sinon d'après son ancien texte (`src/lib/regions.ts`, qui porte aussi les 6 grandes régions du formulaire sur mesure et les distances de « Autour de moi », rayon de 80 km).
- Tel Aviv-Jaffa est une zone à part qui ne contient que la région `tel-aviv` : le filtre du site n'affiche alors qu'une ligne, sans répéter la région en dessous. Une fiche non reliée n'y est rangée que si sa position (ou, à défaut, sa ville) est bien Tel Aviv ou Jaffa ; « Autour de Tel Aviv » reste en Côte & Centre.
- Exception : `BoatDetailModal` lit toujours l'ancien texte de région, qui lui sert de libellé « Sortie en mer » / « Sport nautique ».
- `src/components/RegionFilter.tsx` : le lien « Partout en Israël » et sa liste (fenêtre sur ordinateur, panneau du bas sur téléphone). `src/hooks/useNearMe.ts` : demande la position au clic uniquement, sans la stocker.
- `src/pages/IndexV3.tsx` applique le filtre après la catégorie, dans les deux modes (expérience seule : position de la fiche ; avec hôtel : position de l'hôtel principal).
- Suivi Amplitude : `region_filter_opened`, `region_filter_selected`, `near_me_result`.

### Site public : la version du mood (chantier Offre, étape 5)
- Règles dans `src/lib/moodDisplay/moodDisplay.ts` (aucun accès à la base) : `inMood(fiche, version)` rend la fiche avec la photo de couverture, le titre, l'accroche et la description du mood. Pour chaque texte : la langue du site, sinon l'anglais du mood, sinon le texte principal. Une version ne s'applique que si le mood est un mood secondaire de la fiche (`category_ids`, hors `category_id`). Sans version, la fiche est rendue telle quelle.
- Lecture dans `src/lib/moodDisplay/queries.ts` : `useMoodCards(liste, mood)` pour une liste affichée dans un mood (une seule lecture par mood), `useArrivalMood(fiche, slug)` pour la fiche.
- **Cartes dans un mood** (version du mood + lien `?mood=<slug>`) : onglets de moods de l'accueil (`IndexV3.tsx`), page d'un mood (`Category.tsx`), liste filtrée par mood de `LaunchExperiences.tsx`. La page d'un mood liste maintenant aussi les expériences dont ce mood est secondaire, comme l'accueil. Partout ailleurs (« Anywhere », recherche, favoris, cartes géographiques, suggestions, swipe, itinéraires, vitrine) : présentation principale. Les bateaux ne sont jamais concernés.
- **Fiche** (`StandaloneExperience.tsx`) : avec `?mood=<slug>`, le haut de la fiche (photo de couverture en premier, titre, accroche, description) prend la version du mood. Sans paramètre, mood inconnu, mood en brouillon ou mood qui n'est pas celui de l'expérience : présentation principale. Tout le reste est inchangé, et l'adresse canonique, le titre SEO, le partage et les données structurées restent ceux de la présentation principale.
- **Suivi** : les événements Amplitude `experience_viewed`, `book_clicked` et `request_clicked` portent la propriété `mood` (slug du mood d'arrivée, absente sans mood valide).
- **Non fait** : le mood d'arrivée n'est pas enregistré sur la réservation (il faudrait modifier la page de checkout et la fonction de paiement). Les emails gardent donc le titre principal.

### Plan de l'offre (chantier Offre, étape 7)
- Écran `/admin/offre` (`src/pages/admin/OfferPlan.tsx`, composants dans `src/components/admin/offerPlan/`), réservé aux admins. Il compare ce qu'il faut avoir (les must-haves) à ce qui est en ligne, mood par mood et région par région.
- Trois tables, admins uniquement : `offer_targets` (objectif d'une case, pas de ligne = 0), `offer_must_haves` (la liste et son avancement), `offer_must_have_regions` (régions candidates, aucune = « à chercher »).
- Règles dans `src/lib/offerPlan/compute.ts` (aucun accès à la base, testées) : une expérience publiée compte dans chaque mood où elle apparaît (`category_id` + `category_ids` pour une expérience seule, `category_id` pour une expérience hôtel), dans la case de sa région (`region_id` de la fiche, ou de l'hôtel `experiences2.hotel_id`). « Hors plan » = publiée et liée à aucun must-have.
- Le statut « en ligne » n'est jamais saisi : la base le pose quand l'expérience liée est publiée (déclencheurs de la migration `20261012120000_offer_plan.sql`).
- Lien depuis les formulaires : `MustHaveCoveredField` (`src/components/forms/shared/`) + `useMustHaveLink` (`src/lib/offerPlan/`). Le lien est posé après l'enregistrement de la fiche, par la fonction de base `set_experience_must_have`, en une seule opération.

### Formulaire expérience seule : présentation par mood, après la réservation, canal (chantier Offre, étape 2)
- **Mood principal** = `standalone_experiences.category_id` (toujours le premier de `category_ids`). Sa présentation, ce sont les colonnes de la fiche : `title*`, `subtitle*`, `long_copy*`, `hero_image`. Aucune fiche n'a été migrée.
- **Autres moods** : table `standalone_experience_mood_presentations` (une ligne par couple expérience + mood : titre, accroche, description en EN / FR / HE, `cover_image` choisie parmi les photos de la fiche). Pas de ligne = le mood affiche la présentation principale. Le site public ne lit pas encore cette table (prévu à l'étape 5).
- Règles sans affichage dans `src/lib/standaloneExperienceForm/moodPresentations.ts` (personnaliser, échanger le mood principal, calcul de ce qu'il faut écrire) ; lecture / écriture dans `moodPresentationQueries.ts`. Ordre d'écriture : versions de mood nouvelles ou modifiées, puis la fiche, puis retrait des versions inutiles (un incident en route ne fait perdre aucun texte).
- **L'IA et les moods (prompt 3, 08/10/2026).** La fonction serveur `generate-experience-draft` a quatre actions : `draft` (brouillon complet), `translate`, `seo` et `mood`. Pour une expérience seule, le brouillon propose en plus 1 à 3 moods (« On the Water » jamais en premier : une fiche dont c'est le mood principal est une fiche bateau, dans le formulaire comme sur le site), une région de la table `regions`, des badges existants de `highlight_tags`, l'après-réservation et, si la fiche n'a pas de couverture, une photo de la galerie. L'action `mood` écrit titre, accroche et description pour un ou plusieurs moods à partir du contenu déjà dans la fiche : elle sert au bouton « ✦ Réécrire pour ce mood » et, après un brouillon, à écrire la version des autres moods proposés (deuxième appel lancé par le formulaire). Consignes de marque : `supabase/functions/_shared/prompts/mood-writing.ts`, ajoutées à la suite de `standalone-experience.ts` sans le modifier. Préférences de Shana (ce qu'elle aime ou non dans les textes) : `shana-preferences.ts`, lu après les consignes de marque et prioritaire ; on y ajoute une ligne à sa demande, puis on redéploie.
- **Ce que l'IA ne peut pas remplir.** `supabase/functions/_shared/experience-draft/parse.ts` est la seule porte de sortie : il recopie une liste fermée de champs éditoriaux et ignore tout le reste (prix, marge, disponibilités, créneaux, prestataire, canal, contact jour J, statut, mise en avant). Testé par `parse.test.ts`. Côté formulaire, `src/lib/standaloneExperienceForm/moodAi.ts` prépare ce qui est montré à l'IA (jamais ces mêmes champs) et range sa réponse. Rien n'est enregistré : l'IA remplit l'écran. Sur une fiche déjà en base, les inclus, extras et badges (qui s'enregistrent dès qu'on les ajoute) restent en attente dans « À vérifier » jusqu'au clic sur « Ajouter à la fiche ».
- **Marqueurs « IA ».** Le formulaire garde en mémoire (jamais en base) les champs que l'IA vient de remplir dans Rangement, Présentation par mood et Après la réservation. Le marqueur d'un champ disparaît quand Shana le modifie, tous disparaissent sur « Tout valider ».
- **Enregistrement par écarts** (`payloadDiff.ts`) : à l'ouverture d'une fiche, le formulaire photographie ce qu'il enverrait ; à l'enregistrement, seuls les champs qui diffèrent de cette photo partent en base. Ouvrir puis enregistrer sans rien toucher n'écrit donc rien (ni reformatage, ni prix réarrondi). Conséquence : le prix en ligne n'est réécrit que si un champ de prix a été modifié.
- **Après la réservation** : colonnes `meeting_point*`, `arrive_minutes_before`, `know_before_you_go*`, `day_contact_name / _phone / _language`, `contingency_note*` sur `standalone_experiences`. Le contact jour J vit dans la table interne `standalone_experience_internal` (admins et serveur uniquement).

- **Les infos pratiques arrivent chez le client (prompt 4, 08/10/2026).** Un seul fichier décide du contenu et de sa mise en mots : `supabase/functions/_shared/practical-info/content.ts` (sans dépendance, testé par `content.test.ts`). Il est lu par trois endroits : l'email de confirmation (`send-standalone-booking-confirmation`), le rappel de la veille (`send-standalone-day-before-reminder`) et le back-office (`src/lib/practicalInfo`, pour le message WhatsApp). Règles : un champ vide n'apparaît pas ; une fiche sans aucune info pratique ne produit aucun bloc et l'email de confirmation reste, au caractère près, celui d'avant ; l'adresse complète est donnée une fois réservé même si `hide_exact_address` est coché ; les bateaux et les réservations non confirmées ou annulées ne reçoivent jamais le bloc. Le contact jour J est lu côté serveur avec la clé de service (`_shared/practical-info/load.ts`).
  - **Confirmation.** Toujours déclenchée comme avant (par la page de paiement après un paiement réussi, ou par le bouton du back-office). Tout l'email est écrit dans la langue de la réservation (`preferred_lang` : anglais, français, hébreu de droite à gauche ; anglais si la langue est inconnue). La version anglaise est restée identique à l'originale. Anti-doublon : un envoi automatique pose d'abord `confirmation_email_sent_at` seulement si elle était vide, et ne part que s'il l'obtient ; seul un admin connecté renvoie.
  - **Rappel de la veille.** `pg_cron` appelle la fonction à 7 h, 8 h et 9 h UTC (migration `20261008160000_practical_info_reminder.sql`). La fonction n'agit qu'à 10 h (envoi) et 11 h (rattrapage) heure d'Israël. Elle prend les réservations d'expérience confirmées, non annulées, non remboursées, datées de demain, sans `reminder_email_sent_at`, et écarte celles faites la veille ou le jour même. Même anti-doublon que la confirmation, sur `reminder_email_sent_at`. La tâche se présente avec un secret tiré au hasard et rangé dans le coffre de la base (Vault) ; la fonction le fait vérifier par `check_internal_cron_secret` (`_shared/internal-auth.ts`).
  - **Back-office.** Détail d'une réservation : carte `PracticalInfoWhatsAppCard` (copier le message, ouvrir WhatsApp ; rien ne part seul). Liste des réservations : signal « Infos pratiques incomplètes » sur les réservations des 7 prochains jours dont la fiche n'a ni point de rendez-vous ni contact jour J (`src/lib/reservations/practicalInfoAlerts.ts`). Formulaire expérience : bouton « M'envoyer un aperçu » (email de confirmation avec une réservation fictive, envoyé à l'admin connecté, rien n'est écrit en base).
  - **Aperçus de la page Automatisations.** Tout aperçu qui lit de vraies données (réservation, demande, dossier) exige un admin connecté, vérifié par `getAdminEmail` (`_shared/internal-auth.ts`). Un nouvel email avec aperçu doit reprendre cette vérification.
- **Canal de réservation** : `booking_channel` (`provider_request`, `provider_website`, `provider_portal` à venir), liste dans `src/constants/bookingChannels.ts`. Interne.
- Page en 8 sections (`StandaloneExperienceForm.tsx`, mode standard) : IA, Rangement, Présentation par mood, Ce qui est commun, Galerie, Après la réservation, Prix canal & dispos, Conditions & publication. Composants propres à ce formulaire dans `src/components/forms/standalone/`. Les briques partagées avec le formulaire hôtel (`forms/shared/`) ont reçu des options facultatives (`mono`, `wide`, `verboseMissing`) : sans elles, le rendu du formulaire hôtel est inchangé. Le mode Bateaux garde ses deux onglets.
- Attention : comme tout `standalone_experiences`, ces nouvelles colonnes sont lisibles par l'API publique pour une fiche publiée (c'est déjà le cas des champs fournisseur). À traiter si le téléphone du contact jour J doit rester strictement privé.

### Informations internes : tables réservées aux admins (chantier Offre, étape 2 bis)
- **Principe** : la base sait cacher des lignes à un visiteur, pas des colonnes. Tout ce qui est interne (prix fournisseur, marge, prestataire, contact) vit donc dans une table voisine de la table publique, une ligne par fiche, lisible et modifiable par les admins uniquement. Les fonctions serveur (clé de service) y ont accès : c'est par là que la confirmation de réservation lira le contact du jour J.
- **Les cinq tables** : `standalone_experience_internal` (prix fournisseur, marge, fournisseur, bateau, contact, moyen de paiement, lien de réservation, `provider_id`, canal, contact jour J), `standalone_rate_option_internal` (prix fournisseur d'une option), `standalone_price_variant_internal` (prix d'achat d'une variante), `experience2_internal` (coûts de l'activité), `hotel2_internal` (email, téléphone, commission).
- **Côté code** : `src/lib/internalFields.ts` est le seul module qui connaît ces tables (lire, séparer un enregistrement en partie publique et partie interne, sauvegarder). Tout nouveau champ interne s'ajoute dans la table interne et dans la liste de ce module, jamais dans la table publique.
- **Règle** : ne jamais ajouter un champ fournisseur, marge ou contact dans `standalone_experiences`, `standalone_rate_options`, `standalone_experience_price_variants`, `experiences2` ou `hotels2`.
- **Reste lisible publiquement (connu)** : sur `experiences2`, `room_net_rate`, `bar_rate_markup_value`, `commission_room_pct` et `commission_addons_pct`, parce que le prix client est calculé dans le navigateur. À traiter en déplaçant ce calcul côté serveur. Aussi `global_settings.default_commission_rate` et les anciennes tables `hotels` / `experiences`.

### Prestataires : une seule entité (chantier Partenaires, étape 1)
- **Principe** : le prestataire est celui qui réalise vraiment l'expérience, l'hôtel ou la sortie bateau. Il n'existe qu'à un endroit, la table `providers` (réservée aux admins, jamais lue par le site public), et tout le back-office pointe vers elle avec un `provider_id`. Aucune colonne prestataire sur `standalone_experiences`, `experiences2` ou `hotels2`.
- **Ce que contient `providers`** : `provider_type` (experience, hotel, boat, other), `status` (prospect, en_discussion, signe, actif, en_pause, arrete), `region_id`, `address`, `language` (he, en, fr), contact principal (`contact_name`, `email`, `whatsapp`), contact du jour J par défaut (`day_contact_name`, `day_contact_whatsapp`, `day_contact_language`), `commission_percent`, canal par défaut (`booking_channel` : hyperguest, provider_website, whatsapp, email, partner_portal ; `booking_url`), conditions (`conditions`, `cancellation_weather_policy`, `policy_validated`), facturation (`legal_name`, `tax_id`, pas de coordonnées bancaires), acceptation des conditions partenaires (`terms_accepted_at`, `terms_version`, remplies plus tard par l'espace partenaire), `crm_contact_id`, `internal_notes`. `is_active` suit le statut par un déclencheur (faux pour en_pause et arrete).
- **Où se pose le lien** :
  - expérience seule : `standalone_experience_internal.provider_id` = prestataire principal ;
  - bateaux, plusieurs prestataires : `standalone_experience_suppliers.provider_id`. Celui marqué `is_primary` fait foi : le déclencheur `standalone_suppliers_sync_primary_provider` le recopie sur la fiche à chaque écriture de la liste ;
  - hôtel : `hotel2_internal.provider_id` ;
  - expérience hôtel : `experience2_internal.provider_id` si elle a son propre prestataire, sinon celui de son hôtel (règle dans `hotelExperienceProviderId`) ;
  - fiche du Catalogue : `catalogue_items.provider_id` ; must-have du plan de l'offre : `offer_must_haves.provider_id` (le texte libre `partner` reste) ;
  - réservation : `standalone_bookings.provider_id` s'il est renseigné, sinon le prestataire principal de l'expérience, déduit à l'affichage (`bookingProviderId`) sans réécrire la réservation.
- **Priorités** : le contact du jour J et le canal de réservation de l'expérience passent avant ceux du prestataire. Pour les emails (confirmation, rappel de la veille), la règle est dans `resolveDayContact` (`supabase/functions/_shared/practical-info/content.ts`) : contact de l'expérience, sinon celui du prestataire, jamais un mélange.
- **Chiffres d'un prestataire** (`src/lib/providers/compute.ts`) : seules comptent les réservations au statut de paiement `paid` ou `deposit_paid`, non annulées, rangées par mois de prestation. Le statut est lu tel quel, rien ne le modifie ici. Revenu net du prestataire = coût fournisseur saisi sur la réservation (`supplier_cost`) ; à défaut, pour une réservation en ligne simple, prix fournisseur de la fiche, gardé seulement s'il retombe sur le montant payé avec la marge de la fiche ; sinon « à compléter ». Pour un hôtel : `bookings_hg.net_price`, en lecture seule.
- **Côté code** : `src/lib/providers/` (`types.ts`, `queries.ts`, `compute.ts`, tests), `src/components/admin/providers/` (`ProviderPicker` = champ de choix avec recherche et création, réutilisé dans tous les formulaires ; `ProviderForm` ; sections de la fiche), pages `Providers.tsx` et `ProviderDetails.tsx`.
- **Espace partenaire** : voir la section suivante. Le canal de réservation « Espace partenaire » reste affiché mais inactif.

### Espace partenaire (chantier Partenaires, étape 2, V0 : expériences seules et bateaux)
- **Ce que c'est** : un espace web sur `/partner`, pensé pour le téléphone, en hébreu (de droite à gauche), anglais et français, où un prestataire gère sa relation avec STAYMAKOM. Principe : il voit beaucoup, il propose tout, il décide seul de peu. Hôtels et expériences hôtel : pas encore branchés.
- **Le principe de sécurité, à ne jamais contourner** : un partenaire n'a AUCUN accès direct aux tables. Les cinq nouvelles tables (`provider_users`, `partner_terms_versions`, `partner_terms_acceptances`, `partner_proposals`, `partner_activity_log`) sont réservées aux admins, comme `providers` et les tables `*_internal`. Tout ce qu'il lit ou écrit passe par des fonctions de la base `partner_*` (un « guichet » : la fonction vérifie qui il est, ne renvoie que les colonnes permises et uniquement ce qui appartient à son prestataire). Marge, majoration, prix client, email et téléphone des clients ne sortent d'aucune de ces fonctions. Côté écran, `src/lib/partner/api.ts` est le seul fichier qui parle à la base, et il n'appelle que ces fonctions. Toute nouvelle donnée à montrer à un partenaire s'ajoute dans une fonction `partner_*`, jamais par une règle d'accès directe sur une table.
- **Rôle et comptes** : rôle `partner` dans `app_role` (un utilisateur a un seul rôle). `provider_users` relie un utilisateur à un prestataire (plusieurs utilisateurs possibles par prestataire). `partner_require()` est la porte d'entrée de toutes les fonctions : elle renvoie le prestataire de l'utilisateur connecté ou refuse (`not_partner`), et refuse aussi tant que la version en vigueur des conditions n'est pas acceptée (`terms_required`). Un prestataire au statut « arrêté » perd l'accès.
- **Connexion sans mot de passe** : `partner-invite` (admin connecté) crée le compte si besoin, appelle `admin_link_partner_user` (rôle + lien en une opération) et envoie le lien. `partner-login-link` (page de connexion, sans être connecté) renvoie un lien à une adresse déjà invitée, un par minute au plus, même réponse que l'adresse soit connue ou non. Le lien mène à `/partner/login?token_hash=…` ; la session n'est ouverte qu'au clic sur « Entrer dans mon espace » (`signInWithPartnerToken`), pour qu'un aperçu de lien ne consomme pas le jeton. Le message WhatsApp de la fiche pointe vers la page de connexion (lien qui n'expire pas), jamais envoyé automatiquement.
- **Conditions partenaires** : `partner_terms_versions` (texte he / en / fr). Version en vigueur = la plus haute publiée. `partner_accept_terms` enregistre la preuve dans `partner_terms_acceptances` (version, date et heure, nom saisi, utilisateur, adresse IP et navigateur lus dans la requête) et remplit `providers.terms_accepted_at` / `terms_version`. Une version déjà acceptée ne se corrige plus (déclencheur) : on publie la suivante avec `admin_publish_partner_terms`, et chacun doit l'accepter de nouveau.
- **Appliqué directement, et tracé dans `partner_activity_log`** : son profil (`partner_update_profile` : contact, WhatsApp, raison sociale, numéro fiscal, adresse, langue, contact jour J par défaut), le contact du jour J d'une expérience (`partner_set_day_contact`) et ses disponibilités (`partner_set_availability` : mêmes colonnes que le back-office, `availability_mode`, `available_days`, `blocked_dates`, `whitelisted_dates`, `has_time_slots`, `time_slots`). Les deux derniers sont réservés au prestataire principal de l'expérience.
- **Tout le reste est une proposition** (`partner_submit_proposal` → `partner_proposals`) : textes, infos pratiques, photos, prix fournisseur, nouvelle expérience. La fonction ne garde que les champs autorisés pour le type, relit elle-même la valeur actuelle, et n'accepte que des photos du dossier du prestataire (`experience-images/partner-proposals/<id du prestataire>/`, seul endroit où la règle de stockage le laisse écrire). Les textes sont proposés dans la langue du prestataire et appliqués dans cette langue seulement.
- **Validation** (`admin_review_partner_proposal`, écran `/admin/partenaires/propositions`) : accepter applique la modification dans la même opération. Un prix accepté ne change que le prix fournisseur et pose `standalone_experience_internal.supplier_price_changed_at` ; le formulaire de la fiche affiche alors « Prix fournisseur modifié, vérifier le prix client » (`SupplierPriceChangedNotice`). Une nouvelle expérience acceptée crée une fiche en brouillon reliée au prestataire, jamais publiée.
- **Réservations et revenus** (`partner_bookings`) : uniquement `payment_status` `paid` ou `deposit_paid`, non annulées, du prestataire (noté sur la réservation, sinon prestataire principal de l'expérience). Du client : prénom, initiale du nom, langue, demandes particulières (`standalone_bookings.special_requests`, pas encore remplie par le checkout). Montant = `supplier_cost` de la réservation s'il existe, sinon prix fournisseur de la fiche × participants. Le back-office lit la même liste avec `admin_provider_settlements` et y saisit le règlement (`supplier_payment_status`, `supplier_paid_at`, `supplier_payment_reference`).
- **Emails** (`supabase/functions/_shared/partner/` : `email.ts` habillage commun repris de la confirmation, `access.ts` liens de connexion, `booking-notice.ts` réservation payée ou annulée). L'email « nouvelle réservation » part de `send-standalone-booking-confirmation`, juste après la confirmation au client, une seule fois (`provider_notified_at`), seulement vers un prestataire déjà invité. Annulation, conditions acceptées et proposition envoyée : la base appelle `partner-notify` (déclencheurs `partner_notify_*`, secret du coffre, erreurs avalées pour ne jamais bloquer une écriture).
- **Côté code** : `src/pages/partner/` (`PartnerApp` décide de l'écran : connexion, pas partenaire, conditions, ou espace), `src/components/partner/`, `src/lib/partner/` (`api.ts`, `types.ts`, `i18n.ts` textes en trois langues, `logic.ts` règles testées). Back-office : `src/lib/partnerAdmin/`, `src/components/admin/partners/`, `ProviderPartnerAccess` et `ProviderSettlementsSection` sur la fiche prestataire. `ProtectedRoute` attend de connaître le rôle avant d'afficher une page réservée et renvoie un partenaire vers `/partner`.
- **Limites connues** : si la confirmation au client part avant que le paiement soit marqué payé (cas du filet de sécurité par le webhook), l'email au prestataire n'est pas envoyé à ce moment-là ; le bouton « Renvoyer » de la réservation le fait partir. Le champ « demandes particulières » du checkout n'est enregistré nulle part aujourd'hui. Les avis publiés restent lisibles par tous avec leurs colonnes `customer_email` / `customer_phone` (règle publique antérieure à ce chantier) : à traiter à part.

### Color Tokens (CSS variables)
- `primary` — Brand primary
- `secondary` — Brand secondary
- `cta` — Call-to-action (with hover, border, shadow variants)
- `destructive` — Error states
- `muted` — Subdued elements
- `accent` — Highlights
- Full dark mode support via `next-themes`

### Component Library
shadcn/ui (Radix primitives): Accordion, AlertDialog, Avatar, Button, Card, Checkbox, Collapsible, ContextMenu, Dialog, DropdownMenu, HoverCard, Label, Menubar, NavigationMenu, Popover, Progress, RadioGroup, ScrollArea, Select, Separator, Slider, Switch, Tabs, Toast, Toggle, Tooltip

### Animations
Custom keyframes: `fade-in-up`, `marquee`, `heart-pop`, `heart-float`, `hero-fade-up`, `latest-scroll`

---

## Environment Variables

### Client-side (VITE_* — exposed to browser)
```
VITE_SUPABASE_PROJECT_ID     # Supabase project identifier
VITE_SUPABASE_PUBLISHABLE_KEY # Supabase anon key (safe to expose)
VITE_SUPABASE_URL            # Supabase API URL
VITE_AMPLITUDE_API_KEY       # Amplitude analytics key
```

### Server-side (Supabase Secrets — NEVER in .env)
```
HYPERGUEST_BEARER_TOKEN      # HyperGuest API auth
HYPERGUEST_CERT_TOKEN        # HyperGuest certification
API_KEY_SECRET               # Internal API secret
HYPERGUEST_SEARCH_DOMAIN     # https://search-api.hyperguest.io/2.0/
HYPERGUEST_BOOKING_DOMAIN    # https://book-api.hyperguest.com/2.0/
HYPERGUEST_STATIC_DOMAIN     # https://hg-static.hyperguest.com/
RESEND_API_KEY               # Resend email service
```

---

## Known Issues & Technical Debt

### God Components (>500 lines)
| File | Lines | Priority |
|------|-------|----------|
| `UnifiedExperience2Form.tsx` | 1883 | HIGH |
| `HotelEditor2.tsx` | 1426 | HIGH |
| `Checkout.tsx` | 975 | HIGH |
| `BookingPanel2.tsx` | 905 | MEDIUM |
| `JournalEditor.tsx` | 859 | MEDIUM |
| `CategoryEditor.tsx` | 775 | LOW |
| `Customers.tsx` | 746 | LOW |
| `MyStaymakomSection.tsx` | 679 | LOW |

### Bateaux v2 — nettoyage final en attente
Les anciens champs prestataire/prix (`supplier_name`, `supplier_contact`, `supplier_price_adult/child`, `markup_percent`, désormais dans `standalone_experience_internal`, et `base_price` utilisé comme prix historique) et `standalone_bookings.supplier_name` restent en base, en parallèle de `providers` et `standalone_experience_price_variants` qui sont les nouvelles sources de vérité. À supprimer seulement une fois le nouveau parcours validé en usage réel (voir note "Bateaux v2", 2026-10-01).

### V1/V2 Dual Architecture
Both V1 (`experiences`, `hotels`) and V2 (`experiences2`, `hotels2`) tables and components coexist. V2 is the active version. V1 routes are kept as backups under `/admin/backup/*` and `/*-old` paths.

### No Service Layer
~36 files contain inline `supabase.from()` calls. No centralized query keys. Plan: create `src/services/` and `src/lib/queryKeys.ts`.

### TypeScript Strictness
`strict: false`, `noImplicitAny: false`, `strictNullChecks: false` — all disabled.

### Bundle Size
Single JS chunk: 3.8MB (982KB gzipped). Needs code splitting via dynamic imports.

### Missing Features
- No sitemap.xml (SEO impact)
- No PWA manifest / Service Worker
- No React Error Boundary → **FIXED** (added in this session)
- CORS blocks localhost:8080 for HyperGuest Edge Functions

---

## Security Summary

| Aspect | Status |
|--------|--------|
| Auth + JWT | ✅ Supabase Auth, role-based |
| Route protection | ✅ All admin routes guarded |
| RLS policies | ✅ 219+ policies on 43+ tables |
| CORS | ✅ Whitelist (except localhost:8080) |
| Secrets management | ✅ Fixed — removed from .env |
| Booking data exposure | ✅ Fixed — limited .select() fields |
| Error boundary | ✅ Fixed — added global ErrorBoundary |
| Edge Function JWT | ⚠️ Disabled in config, manual check in hyperguest only |
| Cookie consent | ⚠️ Amplitude session replay/autocapture only — custom event tracking (analytics.ts) fires regardless of consent since 2026-09-30 |

---

## Deployment

- **Platform:** Lovable (https://lovable.dev)
- **Custom domain:** staymakom.com (configured via Lovable Settings > Domains)
- **Build:** `npm run build` → `dist/` folder
- **SPA routing:** `public/_redirects` → `/* /index.html 200`
- **Edge Functions:** Deployed via Supabase CLI / Dashboard
- **Secrets:** Configured in Supabase Dashboard > Project Settings > Secrets
