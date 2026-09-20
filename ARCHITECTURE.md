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
│   ├── analytics.ts      # Amplitude event tracking (70+ events)
│   ├── amplitude.ts      # Amplitude SDK init + session replay
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
| `/` | ComingSoon | Landing page (temporary) |
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
| `/admin/ai-insights` | AdminAIInsights |
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
| `/admin/partenaires/experiences` | ComingSoonAdmin ("bientôt disponible") |
| `/admin/catalogue` | AdminCatalogue (carnet unique de tous les lieux, voir la note Catalogue ci-dessous) |
| `/admin/carte` | AdminCarte (carte de tous les lieux du catalogue, voir la note Catalogue) |
| `/admin/itineraires`, `/admin/promo`, `/admin/headquarter/sales`, `/admin/headquarter/marketing`, `/admin/headquarter/operation` | ComingSoonAdmin ("bientôt disponible") |

> Note (2026-09-17) : les anciennes pages de secours `/admin/backup/*` (Hotels V1, Experiences V1) ont été supprimées — plus utilisées depuis le passage aux pages V2. Le menu de gauche (`AdminSidebar.tsx`) est organisé en 4 groupes (Aperçu, Opérations, Croissance, Headquarter) plus un groupe Technique (HyperGuest, Revolut), repris de la maquette IA de Shana ; plusieurs entrées pointent encore vers des écrans "bientôt disponible" en attendant leur construction section par section.

> Note (2026-09-20) — Bateaux : ce sont des expériences "Experience Only" (`standalone_experiences`) rangées dans la catégorie `bateaux`, toujours "sur demande" (`is_bookable = false`, jamais de paiement en ligne). Trois vues d'une même donnée :
> - **Vitrine `/boat`** (page `Boats`) : toute l'année, indépendante de la catégorie (identifiant codé en dur dans `src/lib/boatsCategory.ts`), avec pop-up de détail (`BoatDetailModal`).
> - **Catégorie Bateaux** (puce de l'accueil qui filtre la grille sur place, comme les autres catégories ; page directe `/category/bateaux`) : saisonnière. Publiée = puce visible et page accessible ; non publiée (draft) = puce et page disparaissent. Les bateaux sont absents de la grille par défaut de l'accueil. Piloté à la main depuis la page Catégories du back-office.
> - **Back-office** : liste/prix/marges dans Expériences (onglet Bateaux), demandes et réservations dans Réservations (bouton filtre Bateaux). Les demandes sont écrites dans `standalone_experience_requests` puis converties à la main en `standalone_bookings`.
> Sur l'accueil et la page catégorie, une puce n'apparaît que si sa catégorie est publiée en base.

> Note (2026-09-20) — Catalogue (`/admin/catalogue`, lot 1) : carnet unique de tous les lieux (ceux du site, partenaires en cours, idées vues sur TikTok/Instagram, lieux non commerciaux pour les itinéraires). Strictement interne (rôle admin), chargé à part (lazy) : aucun impact sur le site public.
> - **Principe : on relie, on ne recopie pas.** Une ligne par lieu dans `catalogue_items` ; pour un lieu publié sur le site, elle pointe vers sa fiche (`hotel_id`, `experience_id` ou `standalone_experience_id`, un seul des trois, unique). La vue `catalogue_overview` (`security_invoker`) relit en direct nom, photo, ville, région, position et catégories depuis `hotels2` / `experiences2` (position via l'hôtel) / `standalone_experiences`. Si des champs des formulaires du site changent, c'est la seule vue à ajuster (elle fige `ci.*` à sa création : toute nouvelle colonne de `catalogue_items` demande de la recréer).
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
3. Role fetched from `user_roles` table (admin, hotel_admin, customer)
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
- **Sans:** Inter (body text)
- **Serif:** Playfair Display (headings)
- **Display:** Cormorant Garamond (decorative)

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
| `AIInsights.tsx` | 721 | LOW |
| `MyStaymakomSection.tsx` | 679 | LOW |

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
| Cookie consent | ⚠️ Only affects Amplitude |

---

## Deployment

- **Platform:** Lovable (https://lovable.dev)
- **Custom domain:** staymakom.com (configured via Lovable Settings > Domains)
- **Build:** `npm run build` → `dist/` folder
- **SPA routing:** `public/_redirects` → `/* /index.html 200`
- **Edge Functions:** Deployed via Supabase CLI / Dashboard
- **Secrets:** Configured in Supabase Dashboard > Project Settings > Secrets
