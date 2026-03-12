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
| `/admin/customers` | AdminCustomers |
| `/admin/users` | AdminUsers |
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
| `/admin/backup/*` | Legacy V1 admin pages |

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
   User fills guest info → creates booking
   → Edge Function: hyperguest?action=create-booking (JWT required)
   → HyperGuest Booking API
   → Insert into bookings_hg table (Supabase)
   → Edge Function: send-booking-confirmation (Resend email)

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
