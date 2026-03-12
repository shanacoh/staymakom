# LOVABLE PROJECT CONTEXT — STAYMAKOM

> Generated: 2026-02-10

---

## 1. Résumé du Projet

**Staymakom** est une plateforme de réservation d'expériences hôtelières en Israël, bilingue (anglais/hébreu, avec support français partiel). Elle associe des hôtels boutique à des expériences immersives locales dans un seul booking. Le projet comporte trois interfaces : un site public pour les voyageurs, un panneau d'administration pour la plateforme, et un panneau hotel-admin pour les partenaires hôteliers. L'intégration HyperGuest fournit les données statiques et la disponibilité en temps réel des hôtels.

---

## 2. Stack Technique

| Catégorie | Technologie | Version |
|---|---|---|
| Framework | React | 18.3 |
| Build | Vite (SWC) | 5.x |
| Langage | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| UI Library | shadcn/ui (Radix UI) | latest |
| State/Data | TanStack React Query | 5.83 |
| Routing | React Router DOM | 6.30 |
| Backend | Supabase (Lovable Cloud) | 2.80 |
| Forms | React Hook Form + Zod | 7.61 / 3.25 |
| Rich Text | TipTap | 3.11 |
| Maps | Leaflet + React Leaflet | 1.9 / 5.0 |
| Charts | Recharts | 2.15 |
| Date | date-fns | 3.6 |
| Sanitization | DOMPurify | 3.3 |
| Carousel | Embla Carousel | 8.6 |
| Icons | Lucide React + Phosphor Icons | 0.462 / 2.1 |
| Animations | tailwindcss-animate | 1.0.7 |
| Toasts | Sonner | 1.7 |
| Drawer | Vaul | 0.9 |

---

## 3. Arborescence des Fichiers

```
├── .env                          # Auto-generated: VITE_SUPABASE_URL, KEY, PROJECT_ID
├── .lovable/plan.md              # Dev plan
├── index.html                    # Entry point
├── vite.config.ts                # Vite config with SWC + lovable-tagger
├── tailwind.config.ts            # Theme: Inter/Playfair Display, HSL tokens, CTA
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── postcss.config.js
├── components.json               # shadcn/ui config
├── eslint.config.js
├── public/
│   ├── favicon.ico
│   ├── og-coming-soon.jpg
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── main.tsx                  # React root
│   ├── App.tsx                   # Routes (182 lines, 43+ routes)
│   ├── App.css
│   ├── index.css                 # Design system tokens (HSL)
│   ├── vite-env.d.ts
│   ├── assets/                   # 30+ images (heroes, categories, icons)
│   ├── components/
│   │   ├── AIExperienceAssistant.tsx    # AI search assistant
│   │   ├── CategoryCard.tsx
│   │   ├── ContactDialog.tsx
│   │   ├── ExperienceCard.tsx
│   │   ├── Footer.tsx
│   │   ├── HamburgerMenu.tsx
│   │   ├── Header.tsx
│   │   ├── HowItWorksBanner.tsx
│   │   ├── JournalSection.tsx
│   │   ├── MarqueeBanner.tsx
│   │   ├── NavLink.tsx
│   │   ├── ProtectedRoute.tsx          # Role-based route guard
│   │   ├── RotatingText.tsx
│   │   ├── SEOHead.tsx                 # Dynamic SEO meta tags
│   │   ├── ScrollToTop.tsx
│   │   ├── StickyAIButton.tsx
│   │   ├── account/                    # Customer account components
│   │   │   ├── AccountHeader.tsx
│   │   │   ├── AccountSidebar.tsx
│   │   │   ├── CompactExperienceCard.tsx
│   │   │   ├── GiftCardsSection.tsx
│   │   │   ├── MarketingOptInDialog.tsx
│   │   │   ├── MyAccountSection.tsx
│   │   │   ├── MyStaymakomSection.tsx
│   │   │   ├── PersonalizedRequestSection.tsx
│   │   │   ├── RecommendedExperiences.tsx
│   │   │   ├── RecommendedJournal.tsx
│   │   │   └── WishlistSection.tsx
│   │   ├── admin/                      # Admin panel components
│   │   │   ├── AdminLayout.tsx         # Sidebar layout for /admin
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── CountrySelect.tsx
│   │   │   ├── Experience2AddonsManager.tsx
│   │   │   ├── ExperienceExtrasSelector.tsx
│   │   │   ├── HighlightTagsSelector.tsx
│   │   │   ├── HotelExtrasManager.tsx
│   │   │   ├── HyperGuestHotelSearch.tsx  # HG hotel import (15KB)
│   │   │   ├── IncludesManager.tsx
│   │   │   ├── ReviewsManager.tsx
│   │   │   └── journal/               # Journal editor (block-based)
│   │   │       ├── ArticlePreview.tsx
│   │   │       ├── BlockEditor.tsx
│   │   │       ├── BlockItem.tsx
│   │   │       └── types.ts
│   │   ├── auth/                       # Auth UI components
│   │   │   ├── AccountBubble.tsx
│   │   │   ├── AuthPromptDialog.tsx
│   │   │   ├── OAuthButtons.tsx
│   │   │   ├── OnboardingFlow.tsx
│   │   │   └── UserDropdown.tsx
│   │   ├── category/
│   │   │   ├── CategoryFilters.tsx
│   │   │   └── ExperienceMap.tsx       # Leaflet map
│   │   ├── experience/                 # Experience v1 components
│   │   │   ├── BookingPanel.tsx / BookingPanel2.tsx
│   │   │   ├── DateRangePicker.tsx
│   │   │   ├── ExperienceAvailabilityPreview.tsx
│   │   │   ├── ExperienceDetails.tsx
│   │   │   ├── ExperienceHero.tsx
│   │   │   ├── ExtrasSection.tsx / ExtrasSelector.tsx
│   │   │   ├── GalleryModal.tsx
│   │   │   ├── GoodToKnow.tsx
│   │   │   ├── HeroActionBar.tsx
│   │   │   ├── HotelSpotlight.tsx
│   │   │   ├── ImportantInformation.tsx
│   │   │   ├── IncludesSection.tsx
│   │   │   ├── NightsRangeSelector.tsx
│   │   │   ├── OtherExperiencesFromHotel.tsx
│   │   │   ├── PartySizeSelector.tsx
│   │   │   ├── PriceBreakdown.tsx / PriceBreakdownV2.tsx
│   │   │   ├── ReviewsSection.tsx
│   │   │   ├── RoomOptions.tsx / RoomOptionsV2.tsx
│   │   │   ├── ShareDialog.tsx / ShareWithFriendsSection.tsx
│   │   │   ├── TitleBlock.tsx
│   │   │   └── WhatsIncludedPhotos.tsx
│   │   ├── experience-test/            # Experience v2 UI components
│   │   │   ├── ExperienceSearchHeader.tsx
│   │   │   ├── FeaturedReview.tsx
│   │   │   ├── HeroBookingPreview.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── HostSection.tsx
│   │   │   ├── LocationMap.tsx
│   │   │   ├── PhotoGrid.tsx
│   │   │   ├── PracticalInfo.tsx
│   │   │   ├── ProgramTimeline.tsx
│   │   │   ├── ReviewsGrid.tsx
│   │   │   ├── StickyPriceBar.tsx
│   │   │   └── YourStaySection.tsx
│   │   ├── forms/
│   │   │   ├── UnifiedExperienceForm.tsx
│   │   │   └── UnifiedExperience2Form.tsx
│   │   ├── hotel-admin/
│   │   │   └── HotelAdminLayout.tsx    # Sidebar layout for /hotel-admin
│   │   └── ui/                         # 40+ shadcn/ui components
│   │       ├── HeartBurst.tsx
│   │       ├── image-upload.tsx
│   │       ├── rich-text-editor.tsx
│   │       ├── smart-link-picker.tsx
│   │       └── [standard shadcn components...]
│   ├── contexts/
│   │   └── AuthContext.tsx              # Auth + role provisioning (213 lines)
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── useExperience2.ts           # Fetch experience2 + hotels
│   │   ├── useExperience2Addons.ts     # Addon CRUD
│   │   ├── useExperience2Price.ts      # Price calculation logic
│   │   ├── useHyperGuestAvailability.ts # Real-time HG availability
│   │   ├── useLanguage.tsx             # i18n via URL ?lang=en|he|fr
│   │   └── useLocalizedNavigation.tsx
│   ├── integrations/supabase/
│   │   ├── client.ts                   # Auto-generated Supabase client
│   │   └── types.ts                    # Auto-generated DB types (2360+ lines)
│   ├── lib/
│   │   ├── aiTracking.ts              # AI search analytics
│   │   ├── translations.ts           # Full i18n strings EN/HE (764 lines)
│   │   └── utils.ts                   # cn(), generateSlug(), etc.
│   ├── models/hyperguest/
│   │   ├── Hotel.ts                   # Hotel + Room classes (812 lines)
│   │   ├── SearchResult.ts            # SearchResult/Property/Room/RatePlan (698 lines)
│   │   ├── index.ts                   # Re-exports
│   │   └── utils.ts                   # formatPrice, getBoardTypeLabel, etc.
│   ├── pages/
│   │   ├── Index.tsx                  # Homepage
│   │   ├── ComingSoon.tsx
│   │   ├── Category.tsx               # /category/:slug
│   │   ├── Experience.tsx             # /experience/:slug (v1)
│   │   ├── Experience2.tsx            # /experience2/:slug (v2 with HG)
│   │   ├── Experiences.tsx            # /experiences (listing)
│   │   ├── Hotel.tsx                  # /hotel/:slug
│   │   ├── Auth.tsx                   # Login/signup
│   │   ├── Account.tsx                # Customer dashboard
│   │   ├── GiftCard.tsx / GiftCardConfirmation.tsx
│   │   ├── Companies.tsx              # Corporate B2B page
│   │   ├── Partners.tsx               # Hotel partnership page
│   │   ├── Journal.tsx / JournalPost.tsx
│   │   ├── Contact.tsx / About.tsx
│   │   ├── Terms.tsx / Privacy.tsx / CancellationPolicy.tsx / Cookies.tsx / Legal.tsx
│   │   ├── NotFound.tsx
│   │   ├── admin/                     # 14 admin pages
│   │   │   ├── Dashboard.tsx / Settings.tsx
│   │   │   ├── Categories.tsx / CategoryEditor.tsx
│   │   │   ├── Hotels.tsx / Hotels2.tsx / HotelEditor.tsx / HotelEditor2.tsx
│   │   │   ├── Experiences.tsx / Experiences2.tsx
│   │   │   ├── Reservations.tsx / ReservationDetails.tsx
│   │   │   ├── Users.tsx / Customers.tsx
│   │   │   ├── Journal.tsx / JournalEditor.tsx
│   │   │   ├── GiftCards.tsx / GiftCardDetails.tsx
│   │   │   ├── AIInsights.tsx / Leads.tsx / Favorites.tsx
│   │   └── hotel-admin/               # 11 hotel admin pages
│   │       ├── Dashboard.tsx / Property.tsx / Experiences.tsx
│   │       ├── Bookings.tsx / BookingDetails.tsx / BookingEdit.tsx
│   │       ├── Extras.tsx / ExtrasManagement.tsx
│   │       ├── Billing.tsx / PaymentInfo.tsx / Payments.tsx
│   │       ├── Pricing.tsx / Calendar.tsx / Packages.tsx
│   │       ├── Reviews.tsx / Contact.tsx / Settings.tsx
│   ├── schemas/
│   │   └── experience2_addon_validation.ts  # Zod schemas
│   ├── services/
│   │   └── hyperguest.ts              # HG API client (333 lines)
│   └── types/
│       └── experience2_addons.ts      # Addon types + pricing config
├── supabase/
│   ├── config.toml                    # Supabase config (auto-generated)
│   └── functions/                     # 12 Edge Functions
│       ├── collect-lead/index.ts
│       ├── download-image/index.ts
│       ├── geocode-hotel/index.ts
│       ├── hyperguest/index.ts        # HG API proxy
│       ├── manage-users/index.ts
│       ├── recommend-experiences/index.ts  # AI recommendations
│       ├── send-booking-confirmation/index.ts
│       ├── send-booking-status-update/index.ts
│       ├── send-contact-request/index.ts
│       ├── send-corporate-request/index.ts
│       ├── send-gift-card/index.ts
│       ├── send-partner-request/index.ts
│       └── translate-text/index.ts
```

---

## 4. Pages & Routes

### Public Routes (22)

| Route | Component | Description |
|---|---|---|
| `/` | Index | Homepage avec categories, hero, journal |
| `/coming-soon` | ComingSoon | Page temporaire |
| `/auth` | Auth | Login / signup |
| `/experiences` | Experiences | Listing toutes expériences |
| `/category/:slug` | Category | Expériences filtrées par catégorie |
| `/experience/:slug` | Experience | Détail expérience v1 |
| `/experience2/:slug` | Experience2 | Détail expérience v2 (HyperGuest) |
| `/hotel/:slug` | Hotel | Page hôtel public |
| `/hotels/:slug` | Hotel | Alias /hotel |
| `/gift-card` | GiftCard | Achat carte cadeau |
| `/gift-card/confirmation` | GiftCardConfirmation | Confirmation cadeau |
| `/companies` | Companies | Page B2B corporate |
| `/corporate` | Companies | Alias /companies |
| `/partners` | Partners | Page partenariat hôtel |
| `/journal` | Journal | Blog listing |
| `/journal/:slug` | JournalPost | Article blog |
| `/contact` | Contact | Formulaire contact |
| `/about` | About | Page à propos |
| `/terms` | Terms | CGV |
| `/privacy` | Privacy | Politique vie privée |
| `/cancellation-policy` | CancellationPolicy | Politique annulation |
| `/cookies` | Cookies | Politique cookies |
| `/legal` | Legal | Mentions légales |

### Protected Routes — Customer (1)

| Route | Component | Role |
|---|---|---|
| `/account` | Account | customer |

### Protected Routes — Admin (14+)

| Route | Component | Role |
|---|---|---|
| `/admin` | AdminDashboard | admin |
| `/admin/categories` | AdminCategories | admin |
| `/admin/categories/new` | CategoryEditor | admin |
| `/admin/categories/edit/:id` | CategoryEditor | admin |
| `/admin/hotels` | AdminHotels | admin |
| `/admin/hotels2` | AdminHotels2 | admin |
| `/admin/experiences` | AdminExperiences | admin |
| `/admin/experiences2` | AdminExperiences2 | admin |
| `/admin/bookings` | AdminBookings | admin |
| `/admin/reservations` | AdminBookings | admin |
| `/admin/reservations/:bookingId` | AdminReservationDetails | admin |
| `/admin/gift-cards` | AdminGiftCards | admin |
| `/admin/users` | AdminUsers | admin |
| `/admin/customers` | AdminCustomers | admin |
| `/admin/journal` | AdminJournal | admin |
| `/admin/journal/new` | JournalEditor | admin |
| `/admin/ai-insights` | AdminAIInsights | admin |
| `/admin/leads` | AdminLeads | admin |
| `/admin/favorites` | AdminFavorites | admin |
| `/admin/settings` | AdminSettings | admin |

### Protected Routes — Hotel Admin (11)

| Route | Component | Role |
|---|---|---|
| `/hotel-admin` | HotelAdminDashboard | hotel_admin |
| `/hotel-admin/property` | HotelProperty | hotel_admin |
| `/hotel-admin/experiences` | HotelExperiences | hotel_admin |
| `/hotel-admin/bookings` | HotelBookings | hotel_admin |
| `/hotel-admin/bookings/:bookingId` | HotelBookingDetails | hotel_admin |
| `/hotel-admin/bookings/edit/:bookingId` | HotelBookingEdit | hotel_admin |
| `/hotel-admin/extras` | HotelExtras | hotel_admin |
| `/hotel-admin/extras-management` | HotelExtrasManagement | hotel_admin |
| `/hotel-admin/billing` | HotelBilling | hotel_admin |
| `/hotel-admin/reviews` | HotelReviews | hotel_admin |
| `/hotel-admin/payment-info` | HotelPaymentInfo | hotel_admin |
| `/hotel-admin/contact` | HotelContact | hotel_admin |

---

## 5. Composants Clés

### Root-level Components
- **Header** — Navigation principale, language toggle, auth bubble
- **Footer** — Links, newsletter signup (leads), marquee banner
- **ProtectedRoute** — Garde de route basée sur `allowedRoles`
- **SEOHead** — Meta tags dynamiques (title, description, OG)
- **AIExperienceAssistant** — Chatbot IA pour recommandations
- **StickyAIButton** — Bouton flottant pour ouvrir l'assistant IA
- **ScrollToTop** — Auto-scroll on navigation

### Experience Components (v2 — `experience-test/`)
- **HeroSection** — Hero image + titre
- **PhotoGrid** — Galerie photos
- **YourStaySection** — Infos hôtel (étoiles, check-in/out, facilities)
- **ProgramTimeline** — Timeline de l'expérience
- **StickyPriceBar** — Barre de prix fixe en scroll
- **HeroBookingPreview** — Preview booking dans hero
- **ReviewsGrid** — Grille d'avis
- **LocationMap** — Carte Leaflet

### Booking Components
- **BookingPanel / BookingPanel2** — Panneau de réservation
- **DateRangePicker** — Sélection de dates
- **PriceBreakdown / PriceBreakdownV2** — Détail des prix
- **RoomOptions / RoomOptionsV2** — Choix de chambre (HyperGuest)
- **ExperienceAvailabilityPreview** — Aperçu dispo temps réel

### Admin Components
- **HyperGuestHotelSearch** — Import hôtel depuis HyperGuest (15KB)
- **Experience2AddonsManager** — Gestion des addons de prix
- **HotelExtrasManager** — Gestion extras hôtel
- **UnifiedExperience2Form** — Formulaire expérience v2

---

## 6. Services & API

### Supabase (Lovable Cloud)
- **Client** : `src/integrations/supabase/client.ts` (auto-generated)
- **Types** : `src/integrations/supabase/types.ts` (auto-generated, 2360+ lines)
- Toutes les requêtes passent par `@supabase/supabase-js` via TanStack Query

### HyperGuest API
- **Proxy** : Edge Function `supabase/functions/hyperguest/index.ts`
- **Client** : `src/services/hyperguest.ts`
- **Models** : `src/models/hyperguest/` (Hotel, Room, SearchResult, SearchProperty, SearchRoom, SearchRatePlan)
- **Actions** :
  - `searchHotels(params)` → SearchResult
  - `getPropertyDetails(id)` → Hotel model
  - `getPropertyAvailability(id, params)` → raw availability
  - `getAllHotels(countryCode?)` → hotel list
  - `preBook(data)` / `createBooking(data)` → booking
  - `getBookingDetails(id)` / `listBookings()` / `cancelBooking(id)`

### Edge Functions (12)
| Function | Description |
|---|---|
| `hyperguest` | Proxy vers l'API HyperGuest |
| `recommend-experiences` | Recommandations IA |
| `translate-text` | Traduction auto EN→HE |
| `geocode-hotel` | Géocodage adresse → lat/lng |
| `download-image` | Download + upload image vers Storage |
| `collect-lead` | Collecte de leads |
| `send-booking-confirmation` | Email confirmation réservation |
| `send-booking-status-update` | Email mise à jour statut |
| `send-contact-request` | Email formulaire contact |
| `send-corporate-request` | Email demande corporate |
| `send-gift-card` | Email carte cadeau |
| `send-partner-request` | Email demande partenariat |
| `manage-users` | Gestion utilisateurs admin |

---

## 7. Modèle de Données

### Tables Principales (28 + 1 vue)

| Table | Description | RLS |
|---|---|---|
| `hotels` | Hôtels v1 | Admin + hotel_admin + public(published) |
| `hotels2` | Hôtels v2 (+ HyperGuest) — 57 colonnes | Admin + public(published) |
| `experiences` | Expériences v1 | Admin + hotel_admin + public(published) |
| `experiences2` | Expériences v2 (multi-hôtel) | Admin + public(published) |
| `experience2_hotels` | Junction exp2 ↔ hotels2 | Public read + auth write |
| `experience2_addons` | Addons de prix (commission, tax, per_night, per_person) | Admin + hotel_admin + public(active) |
| `categories` | Catégories d'expériences | Admin + public(published) |
| `bookings` | Réservations | Admin + hotel_admin(own) + customer(own) |
| `booking_extras` | Extras réservation | Via bookings FK |
| `customers` | Profils clients (nom, tél, pays) | Admin + customer(own) |
| `user_profiles` | Profils utilisateurs (display_name, interests, loyalty) | Admin + user(own) |
| `user_roles` | Rôles (admin, hotel_admin, customer) | Admin + user(own read) |
| `hotel_admins` | Lien user ↔ hotel | Admin + hotel_admin(own) |
| `extras` | Extras disponibles par hôtel | Admin + hotel_admin(own) + public |
| `experience_extras` | Junction exp ↔ extras | Admin + hotel_admin |
| `experience_includes` | Inclus dans l'expérience | Admin + hotel_admin + public |
| `experience_reviews` | Avis clients | Admin + public(published) |
| `experience_highlight_tags` | Tags de mise en avant | Admin + hotel_admin + public |
| `highlight_tags` | Référentiel de tags | Admin + public |
| `packages` | Packages promotionnels | Admin + hotel_admin + public(active) |
| `gift_cards` | Cartes cadeaux | Admin + anyone(insert) |
| `journal_posts` | Articles de blog | Admin + public(published) |
| `leads` | Leads (contact, corporate, partner) | Admin + anyone(insert) |
| `global_settings` | Config globale (SEO, emails, Stripe key) | Admin + public(read) |
| `ai_search_queries` | Requêtes IA | Admin + anyone(insert) |
| `ai_search_events` | Événements IA (click, bounce, booking) | Admin + anyone(insert) |
| `loyalty_points` | Points fidélité | — |
| `audit_logs` | Journal d'audit | Admin(read only) |
| `bookings_safe` | Vue sécurisée (sans PII) | — |

### Enums
- `app_role`: admin, hotel_admin, customer
- `hotel_status`: draft, published, pending, archived
- `booking_status`: pending, confirmed, cancelled, completed, no_show
- `booking_extra_status`: pending, confirmed, cancelled
- `base_price_type`: per_person, per_booking, per_night
- `pricing_type`: per_booking, per_night, per_person, per_stay
- `addon_type`: commission, per_night, tax, per_person
- `journal_category`: travel, food, culture, wellness, adventure
- `locale`: en, he, fr

### SQL Functions
- `has_role(user_id, role)` → boolean
- `get_user_hotel_id(user_id)` → uuid
- `get_user_role(user_id)` → app_role
- `get_customers_with_emails()` → customer + auth email
- `get_wishlist_users_with_emails()` → wishlist users
- `log_audit_event(action, entity_type, entity_id, metadata)`

---

## 8. État de l'Application

### AuthContext (`src/contexts/AuthContext.tsx`)
```typescript
interface AuthContextType {
  user: User | null;        // Supabase Auth user
  session: Session | null;  // Supabase session
  role: AppRole | null;     // Primary role
  roles: AppRole[];         // All roles (currently single)
  loading: boolean;
  signIn(email, password): Promise<{ error }>
  signUp(email, password, displayName?): Promise<{ error, data }>
  signOut(): Promise<void>
}
```
- **Provisioning** : `provisionUser()` crée automatiquement `user_profiles`, `user_roles`, et `customers` au premier login
- **Role detection** : lit `user_roles` table après auth

### Data Fetching
- **TanStack Query** pour toutes les requêtes Supabase et HyperGuest
- Hooks custom : `useExperience2`, `useExperience2Addons`, `useExperience2Price`, `useHyperGuestAvailability`
- Pattern : `useQuery` pour reads, `useMutation` pour writes

### Internationalization
- **URL-based** : `?lang=en|he|fr`
- **Hook** : `useLanguage()` → `{ lang, setLanguage, toggleLanguage }`
- **Helper** : `getLocalizedField(obj, field, lang)` → checks `field_he`, `field_fr`, `field`, `field_en`
- **Strings** : `src/lib/translations.ts` (764 lines, EN + HE complet)
- **DB pattern** : chaque champ texte a un suffixe `_he` (et parfois `_fr`)

---

## 9. Configuration

### Design System (index.css + tailwind.config.ts)

**Color Tokens (HSL):**
```
--background: 40 33% 93%     (warm cream)
--foreground: 23 10% 15%     (dark brown)
--primary: 207 62% 15%       (deep blue)
--primary-glow: 208 61% 20%
--secondary: 36 38% 78%      (warm beige)
--accent: 29 48% 55%         (amber)
--cta: 15 45% 52%            (terracotta)
--destructive: 0 84.2% 60.2%
```

**Fonts:**
- Sans: Inter
- Serif: Playfair Display

**Custom utilities:** `gradient-primary`, `gradient-warm`, `gradient-hero`, `shadow-soft/medium/strong`, `hebrew-input`, `scrollbar-hide`

**Animations:** `fade-in-up`, `marquee`, `marquee-rtl`, `heart-pop`, `heart-float`

### Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key
- `VITE_SUPABASE_PROJECT_ID` — Project ID

### Build Config (vite.config.ts)
```typescript
defineConfig({
  server: { host: "::", port: 8080 },
  plugins: [react(), lovable-tagger (dev only)],
  resolve: { alias: { "@": "./src" }, dedupe: ["react", "react-dom"] }
})
```

---

## 10. Points d'Attention

### Système Dual v1/v2
- **Hotels** : `hotels` (v1, 36 cols) et `hotels2` (v2, 57 cols avec HyperGuest)
- **Experiences** : `experiences` (v1) et `experiences2` (v2, multi-hôtel, addons)
- Les deux systèmes coexistent → risque de confusion et maintenance double
- Routes distinctes : `/experience/:slug` vs `/experience2/:slug`

### Route Dupliquée
- `/admin/bookings` est déclaré deux fois (lignes 136-137 de App.tsx)

### TypeScript `as any` Workarounds
- `useExperience2.ts` et `UnifiedExperience2Form.tsx` utilisent `as any` pour les requêtes `experience2_hotels` car la table manque parfois dans les types auto-générés

### TipTap Extension Dupliquée
- Warning console : `Duplicate extension names found: ['link']`
- L'extension Link est probablement importée deux fois dans un éditeur riche

### i18n Incomplet
- Français partiellement supporté (DB fields existent, mais translations.ts n'a que EN/HE)
- Pas de détection automatique de langue (basé sur URL param)

### Absence de Tests
- Aucun fichier de test détecté (pas de `.test.ts`, `.spec.ts`, ni dossier `__tests__`)

### Debug Logging en Production
- `HotelEditor2.tsx` contient 20+ `console.log("[DEBUG SAVE]...")` à nettoyer
- `hyperguest.ts` contient des `console.log("[HyperGuest Service]...")`

### SEO
- `SEOHead.tsx` gère les meta tags dynamiquement
- OG images configurées par entité
- `robots.txt` présent mais contenu non vérifié

---

## 11. Suggestions d'Amélioration

1. **Unifier v1/v2** — Migrer toutes les expériences/hôtels vers le système v2 et supprimer les tables/routes v1 pour réduire la dette technique

2. **Tests** — Ajouter Vitest + Testing Library pour les hooks critiques (`useExperience2Price`, `useAuth`) et les composants de booking

3. **Nettoyage debug** — Supprimer tous les `console.log("[DEBUG")` et `console.log("[HyperGuest")` avant production

4. **i18n Framework** — Remplacer le système maison par `react-i18next` pour supporter proprement FR et d'autres langues

5. **Error Boundaries** — Ajouter des React Error Boundaries autour des sections critiques (booking, HyperGuest)

6. **Optimistic Updates** — Implémenter des mises à jour optimistes dans les mutations TanStack Query pour une meilleure UX

7. **Fix TipTap duplicate** — Trouver et supprimer le double import de l'extension Link

8. **Centraliser les types** — Créer des interfaces TypeScript partagées pour les objets fréquents (Hotel, Experience) au lieu de dépendre uniquement des types auto-générés

9. **Rate Limiting** — Ajouter du rate limiting sur les Edge Functions publiques (collect-lead, recommend-experiences)

10. **Lazy Loading** — Implémenter `React.lazy()` pour les sections admin et hotel-admin (code splitting)

11. **Supprimer la route dupliquée** — Ligne 137 de App.tsx (`/admin/bookings` déclaré deux fois)

12. **Storage Management** — Vérifier les policies RLS sur les buckets Storage (hotel-images) et ajouter des limites de taille
