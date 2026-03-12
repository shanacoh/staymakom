# StayMakom

Boutique travel platform connecting travelers with curated hotel experiences in Israel. Full-stack booking solution with real-time hotel availability via HyperGuest, transactional emails, multi-language support, and three admin surfaces.

**Live:** [staymakom.com](https://staymakom.com)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui (Radix) |
| Backend | Supabase (Auth, PostgreSQL, Edge Functions, Storage) |
| Booking | HyperGuest API (search, pre-book, book, cancel) |
| Emails | Resend (via Edge Functions) |
| Analytics | Amplitude + Session Replay |
| Maps | Leaflet + OpenStreetMap |
| i18n | English, Hebrew (RTL), French |

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Setup

```sh
git clone https://github.com/danou294/Staymakom.git
cd Staymakom
npm install --legacy-peer-deps
```

Create a `.env` file from the template:

```sh
cp .env.example .env
```

Fill in the `VITE_*` variables (see `.env.example` for the full list).

### Development

```sh
npm run dev
```

App runs at **http://localhost:8080**

### Build

```sh
npm run build
```

## Project Structure

```
src/
├── components/        # UI components (170+)
│   ├── ui/            # shadcn/ui primitives
│   ├── admin/         # Super admin components
│   ├── hotel-admin/   # Hotel partner components
│   ├── experience/    # Booking & experience components
│   ├── experience-test/ # Experience page sections
│   └── forms/         # Complex admin forms
├── pages/             # Route pages (70+)
│   ├── admin/         # /admin/* (super admin)
│   └── hotel-admin/   # /hotel-admin/* (hotel partners)
├── hooks/             # Custom React hooks
├── contexts/          # AuthContext (RBAC), CurrencyContext
├── services/          # HyperGuest API service layer
├── models/            # HyperGuest data models
├── integrations/      # Supabase client + types
├── lib/               # Analytics, translations, utils
└── utils/             # Pure utility functions

supabase/
├── functions/         # 17 Edge Functions (Deno)
└── migrations/        # 88 SQL migrations
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full architecture documentation.

## Three Admin Surfaces

| Surface | URL | Role | Purpose |
|---------|-----|------|---------|
| **Public site** | `/` | Everyone | Browse & book experiences |
| **Super admin** | `/admin` | `admin` | Full platform management |
| **Hotel admin** | `/hotel-admin` | `hotel_admin` | Hotel partner self-service |

## Key Features

- **Experience discovery** — Browse curated experiences by category, location, or hotel
- **Real-time availability** — HyperGuest integration for live room/rate search
- **Booking flow** — Date selection, room choice, pre-book, checkout, confirmation
- **Multi-currency** — ILS/USD with live conversion (Frankfurter API)
- **Multilingual** — EN, HE (RTL), FR with per-field translations
- **Journal/Blog** — Rich text editor (TipTap) with full CMS
- **Gift cards** — Purchase and send via email
- **Analytics** — 70+ Amplitude events, session replay, UTM tracking
- **RBAC** — Three roles with route protection + Supabase RLS (219+ policies)
- **SEO** — Dynamic meta tags, OG tags, language-aware

## Environment Variables

### Client-side (`VITE_*` — safe for browser)
```
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_URL
VITE_AMPLITUDE_API_KEY
```

### Server-side (Supabase Secrets only — never in `.env`)
```
HYPERGUEST_BEARER_TOKEN
HYPERGUEST_CERT_TOKEN
API_KEY_SECRET
HYPERGUEST_SEARCH_DOMAIN
HYPERGUEST_BOOKING_DOMAIN
HYPERGUEST_STATIC_DOMAIN
RESEND_API_KEY
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 8080) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint check |

## License

Private — All rights reserved.
