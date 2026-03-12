import { safeTrack, safeIdentify, safeSetUserProperty } from "./amplitude";

// ============================================
// A. ACQUISITION & IDENTITÉ (5 events)
// ============================================

export function trackPageViewed(pageName: string, properties?: Record<string, any>) {
  safeTrack("page_viewed", { page: pageName, url: window.location.pathname, ...properties });
}

export function identifyUser(
  userId: string,
  properties: {
    language: string;
    country?: string;
    deviceType: "mobile" | "tablet" | "desktop";
    isReturningUser: boolean;
    acquisitionSource?: string;
  }
) {
  safeIdentify(userId, properties);
}

export function trackUtmCaptured(params: {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}) {
  safeTrack("utm_captured", params);
}

export function trackLanguageSwitched(from: string, to: string) {
  safeTrack("language_switched", { from, to });
}

export function trackCurrencySwitched(from: string, to: string) {
  safeTrack("currency_switched", { from, to });
}

// ============================================
// B. DISCOVERY — PAGE /launch (8 events)
// ============================================

export function trackFindEscapeClicked() {
  safeTrack("find_escape_clicked");
}

export function trackScrollDepth(page: string, depth: 25 | 50 | 75 | 100) {
  safeTrack("scroll_depth", { page, depth_percent: depth });
}

export function trackVibeTabClicked(vibeName: string) {
  safeTrack("vibe_tab_clicked", { vibe: vibeName });
}

export function trackExperienceCardClicked(slug: string, title: string, price: number, index: number) {
  safeTrack("experience_card_clicked", { slug, title, price, position_index: index });
}

export function trackCategoryTileClicked(categoryName: string) {
  safeTrack("category_tile_clicked", { category: categoryName });
}

export function trackWaitlistEmailSubmitted(emailDomain: string) {
  safeTrack("waitlist_email_submitted", { email_domain: emailDomain });
}

export function trackDesignMyStayClicked() {
  safeTrack("design_my_stay_clicked");
}

export function trackGiftCardClicked(source: string = "launch_page") {
  safeTrack("gift_card_clicked", { source });
}

// ============================================
// C. PAGE EXPÉRIENCE /experience/[slug] (16 events)
// ============================================

export function trackExperiencePageViewed(slug: string, title: string, price: number) {
  safeTrack("experience_page_viewed", { slug, title, price });
}

export function trackTimeOnExperiencePage(slug: string, durationSeconds: number) {
  if (durationSeconds > 5) {
    safeTrack("time_on_experience_page", { slug, duration_seconds: Math.round(durationSeconds) });
  }
}

export function trackPhotoGalleryClicked(slug: string) {
  safeTrack("photo_gallery_clicked", { slug });
}

export function trackAddonViewed(slug: string, addonName: string) {
  safeTrack("addon_viewed", { experience_slug: slug, addon: addonName });
}

export function trackAddonClicked(slug: string, addonName: string, price: number) {
  safeTrack("addon_clicked", { experience_slug: slug, addon: addonName, price });
}

export function trackShareClicked(slug: string, method: "copy_link" | "whatsapp" | "email" | "native") {
  safeTrack("share_clicked", { slug, method });
}

export function trackWishlistClicked(slug: string, action: "added" | "removed") {
  safeTrack("wishlist_clicked", { slug, action });
}

export function trackMapGetThereClicked(slug: string) {
  safeTrack("map_get_there_clicked", { slug });
}

export function trackHotelLinkClicked(slug: string, hotelName: string) {
  safeTrack("hotel_link_clicked", { slug, hotel: hotelName });
}

export function trackDurationTabClicked(slug: string, nights: number) {
  safeTrack("duration_tab_clicked", { slug, nights });
}

export function trackDateSelected(slug: string, checkIn: string, nights: number) {
  safeTrack("date_selected", { slug, check_in: checkIn, nights });
}

export function trackViewDatesClicked(slug: string) {
  safeTrack("view_dates_clicked", { slug });
}

export function trackGuestsSelected(slug: string, adults: number, children: number) {
  safeTrack("guests_selected", { slug, adults, children });
}

export function trackRoomTypeSelected(slug: string, roomName: string, price: number) {
  safeTrack("room_type_selected", { slug, room: roomName, price });
}

export function trackBookThisStayClicked(slug: string, totalPrice: number) {
  safeTrack("book_this_stay_clicked", { slug, total_price: totalPrice });
}

export function trackShareThisEscapeClicked(slug: string) {
  safeTrack("share_this_escape_clicked", { slug });
}

// ============================================
// D. CHECKOUT STEP 2 — GUEST INFO (6 events)
// ============================================

export function trackCheckoutStep2Viewed(slug: string, totalPrice: number) {
  safeTrack("checkout_step2_viewed", { slug, total_price: totalPrice });
}

export function trackFormFieldInteracted(fieldName: string) {
  safeTrack("form_field_interacted", { field: fieldName });
}

export function trackAdditionalInfoExpanded(slug: string) {
  safeTrack("additional_info_expanded", { slug });
}

export function trackSpecialRequestTyped(slug: string) {
  safeTrack("special_request_typed", { slug });
}

export function trackCheckoutContinueClicked(slug: string, totalPrice: number) {
  safeTrack("checkout_continue_clicked", { slug, total_price: totalPrice });
}

export function trackCheckoutBackClicked(slug: string, fromStep: "step2" | "step3") {
  safeTrack("checkout_back_clicked", { slug, from_step: fromStep });
}

// ============================================
// E. CHECKOUT STEP 3 — REVIEW & CONFIRM (5 events)
// ============================================

export function trackCheckoutStep3Viewed(slug: string, totalPrice: number) {
  safeTrack("checkout_step3_viewed", { slug, total_price: totalPrice });
}

export function trackPaymentInitiated(slug: string, totalPrice: number, currency: string) {
  safeTrack("payment_initiated", { slug, total_price: totalPrice, currency });
}

export function trackBookingCompleted(
  bookingRef: string,
  slug: string,
  totalPrice: number,
  currency: string,
  nights: number,
  guests: number,
  addonsTotal: number,
  experienceName: string,
  roomType: string
) {
  safeTrack("booking_completed", {
    booking_ref: bookingRef,
    slug,
    total_price: totalPrice,
    currency,
    nights,
    guests,
    addons_total: addonsTotal,
    experience_name: experienceName,
    room_type: roomType,
  });
  safeSetUserProperty("hasBooked", true);
}

export function trackBookingAbandoned(
  slug: string,
  lastStep: "step2" | "step3",
  totalPrice: number,
  timeSpentSeconds: number
) {
  if (timeSpentSeconds > 30) {
    safeTrack("booking_abandoned", {
      slug,
      last_step: lastStep,
      total_price: totalPrice,
      time_spent_seconds: Math.round(timeSpentSeconds),
    });
  }
}

export function trackPaymentFailed(slug: string, errorType: string, errorMessage: string, totalPrice: number) {
  safeTrack("payment_failed", {
    slug,
    error_type: errorType,
    error_message: errorMessage,
    total_price: totalPrice,
  });
}

// ============================================
// F. NAVIGATION GLOBALE (4 events)
// ============================================

export function trackWishlistIconClicked(itemCount: number) {
  safeTrack("wishlist_icon_clicked", { item_count: itemCount });
}

export function trackCartIconClicked(itemCount: number) {
  safeTrack("cart_icon_clicked", { item_count: itemCount });
}

export function trackFooterCategoryClicked(categoryName: string) {
  safeTrack("footer_category_clicked", { category: categoryName });
}

export function trackViewAllExperiencesClicked(source: string) {
  safeTrack("view_all_experiences_clicked", { source });
}

// ============================================
// G. PAGES SECONDAIRES (8 events)
// ============================================

export function trackCategoryPageViewed(category: string) {
  safeTrack("category_page_viewed", { category });
}

export function trackExperiencesListViewed() {
  safeTrack("experiences_list_viewed");
}

export function trackJournalArticleViewed(articleSlug: string) {
  safeTrack("journal_article_viewed", { article: articleSlug });
}

export function trackCtaClickedFromJournal(articleSlug: string, ctaType: string) {
  safeTrack("cta_clicked_from_journal", { article: articleSlug, cta_type: ctaType });
}

export function trackGiftCardPageViewed() {
  safeTrack("gift_card_page_viewed");
}

export function trackPartnersPageViewed() {
  safeTrack("partners_page_viewed");
}

export function trackPartnerFormSubmitted() {
  safeTrack("partner_form_submitted");
}

export function trackCompaniesPageViewed() {
  safeTrack("companies_page_viewed");
}

// ============================================
// H. SEARCH (2 events)
// ============================================

export function trackSearchPerformed(query: {
  destination?: string;
  checkIn?: string;
  nights?: number;
  guests?: number;
}) {
  safeTrack("search_performed", query);
}

export function trackSearchNoResults(query: {
  destination?: string;
  checkIn?: string;
  nights?: number;
  guests?: number;
}) {
  safeTrack("search_no_results", query);
}
