

## Plan: Create Certification Test Hotel + Experience for Live HyperGuest Booking

### Context
The project already has a certification system for property 19912 (sandbox). Now we need a **live certification** setup with a configurable property ID that Reshma will provide. The V2 architecture uses `hotels2` and `experiences2` tables, with the `experience2_hotels` junction table for multi-hotel support.

### Approach
Create a dedicated **admin page** (`/admin/certification-setup`) that lets you:
1. Input a HyperGuest property ID
2. One-click create (or reuse) a hotel + experience
3. See the certification constraints as a reminder
4. Link directly to the created experience page

This is better than a raw script because you can change the property ID later and re-run.

---

### Step 1 — Create the Certification Setup Admin Page

**New file: `src/pages/admin/CertificationSetup.tsx`**

A single-page form with:
- **Input field**: HyperGuest Property ID (default empty, user enters the ID from Reshma)
- **"Create / Update" button** that:
  1. Checks if a `hotels2` record with that `hyperguest_property_id` already exists
  2. If yes, reuses it; if no, creates one with:
     - `name`: "HyperGuest Certification Hotel"
     - `name_he`: "מלון אישור HyperGuest"
     - `region`: "Israel"
     - `status`: "published"
     - `hyperguest_property_id`: the entered value
     - Reasonable defaults for other fields (slug auto-generated, placeholder hero image)
  3. Checks if an `experiences2` record with slug `certification-test-live` exists
  4. If yes, updates its `hotel_id` to point to the hotel; if no, creates one with:
     - `title`: "Certification Test Experience"
     - `slug`: "certification-test-live"
     - `hotel_id`: the hotel from step 2
     - `base_price`: 100, `currency`: "USD"
     - `min_nights`: 1, `max_nights`: 7
     - `min_party`: 1, `max_party`: 4
     - `status`: "published"
     - `long_copy`: "Test experience for HyperGuest live certification"
  5. Creates/updates the `experience2_hotels` junction record linking hotel to experience
- **Certification constraints reminder panel** (always visible):
  - Guest name: "Test Test"
  - Rate plan: Fully refundable only
  - Check-in: September 2026+ (6+ months in future)
  - Max amount: $500 USD
  - Cancel within 7 days after booking
- **Quick links**: Direct link to `/experience2/certification-test-live` and to the hotel editor

### Step 2 — Register the Route

**Edit: `src/App.tsx`**
- Import `CertificationSetup` and add route `/admin/certification-setup`

### Step 3 — Add Sidebar Link

**Edit: `src/components/admin/AdminSidebar.tsx`**
- Add "Live Cert Setup" entry near the existing "HG Certification" link

### No Database Changes Needed
All tables (`hotels2`, `experiences2`, `experience2_hotels`) already exist with the right columns. The page will use standard Supabase insert/upsert operations.

### What This Enables
Once the property ID is entered and the setup is run:
- `/experience2/certification-test-live` will load the experience
- The `BookingPanel2` will pick up `hyperguest_property_id` from the linked hotel
- The full flow (search → room selection → pre-book → book) will work
- You can toggle the hotel/experience status between draft/published as needed

