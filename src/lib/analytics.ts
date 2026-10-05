import { safeTrack, safeIdentify, safeSetUserProperty, safeIdentifySetOnce } from "./amplitude";

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

export function trackHeroCtaClicked(cta: "find" | "plan" | "see_dates", slug?: string) {
  safeTrack("hero_cta_clicked", slug ? { cta, slug } : { cta });
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

export function trackNoAvailabilityShown(slug: string, checkIn: string, nights: number) {
  safeTrack("no_availability_shown", { slug, check_in: checkIn, nights });
}

export function trackPhotoIndexViewed(slug: string, photoIndex: number, totalPhotos: number) {
  safeTrack("photo_index_viewed", { slug, photo_index: photoIndex, total_photos: totalPhotos });
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
  const stored = parseInt(localStorage.getItem("sm_booking_count") ?? "0", 10);
  const newCount = stored + 1;
  localStorage.setItem("sm_booking_count", String(newCount));
  safeSetUserProperty("has_booked_count", newCount);
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

export function trackAiBookingConversion(
  experienceId: string,
  bookingId: string,
  searchId: string | null,
  slug: string
) {
  safeTrack("ai_booking_conversion", {
    experience_id: experienceId,
    booking_id: bookingId,
    search_id: searchId,
    slug,
  });
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

// ============================================
// I. SPRINT 1 — PARCOURS STANDALONE & WHATSAPP
// ============================================

export type ProductType = "standalone" | "hotel_experience" | "hotel" | "boat";

// Forme volontairement large : couvre standalone_experiences, experiences2, hotels2 et bateaux.
export interface ProductLike {
  slug?: string | null;
  title?: string | null;
  name?: string | null;
  category?: { slug?: string | null; name?: string | null } | null;
  city?: string | null;
  region?: string | null;
  base_price?: number | null;
  base_price_type?: string | null;
  currency?: string | null;
  is_bookable?: boolean | null;
}

function amountProps(amount?: number | null, currency?: string | null) {
  if (amount === undefined || amount === null) return {};
  return {
    amount_ils: currency === "ILS" ? amount : undefined,
  };
}

export function productProps(product: ProductLike | null | undefined, productType: ProductType) {
  if (!product) return { product_type: productType };
  return {
    product_type: productType,
    slug: product.slug ?? undefined,
    title_en: product.title ?? product.name ?? undefined,
    category: product.category?.slug ?? product.category?.name ?? undefined,
    city: product.city ?? undefined,
    region: product.region ?? undefined,
    price_from: product.base_price ?? undefined,
    price_type: product.base_price_type ?? undefined,
    is_bookable: product.is_bookable ?? undefined,
    currency: product.currency ?? undefined,
    ...amountProps(product.base_price, product.currency),
  };
}

export function computeEntrySource(utmSource: string | undefined, referrer: string): string {
  if (utmSource) return utmSource;
  const ref = (referrer || "").toLowerCase();
  if (!ref) return "direct";
  if (ref.includes("instagram.com")) return "instagram";
  if (ref.includes("tiktok.com")) return "tiktok";
  if (ref.includes("facebook.com")) return "facebook";
  if (ref.includes("google.")) return "google";
  try {
    return new URL(referrer).hostname;
  } catch {
    return "direct";
  }
}

export function identifySessionLanded(props: {
  firstTouchSource?: string;
  firstTouchMedium?: string;
  firstTouchCampaign?: string;
  firstLandingPage: string;
  lastTouchSource?: string;
}) {
  safeIdentifySetOnce({
    first_touch_source: props.firstTouchSource,
    first_touch_medium: props.firstTouchMedium,
    first_touch_campaign: props.firstTouchCampaign,
    first_landing_page: props.firstLandingPage,
  });
  if (props.lastTouchSource) {
    safeSetUserProperty("last_touch_source", props.lastTouchSource);
  }
}

export function identifyLead(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  safeIdentify(normalized, { is_lead: true });
}

export function trackListingViewed(listing: string) {
  safeTrack("listing_viewed", { listing });
}

export function trackFilterApplied(listing: string, filterName: string, filterValue: string | null) {
  safeTrack("filter_applied", { listing, filter_name: filterName, filter_value: filterValue });
}

export function trackSessionLanded(props: {
  landingPage: string;
  referrer: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}) {
  safeTrack("session_landed", {
    landing_page: props.landingPage,
    referrer: props.referrer,
    utm_source: props.utmSource,
    utm_medium: props.utmMedium,
    utm_campaign: props.utmCampaign,
    utm_content: props.utmContent,
    utm_term: props.utmTerm,
  });
}

export function trackExperienceViewed(product: ProductLike, productType: ProductType) {
  safeTrack("experience_viewed", productProps(product, productType));
}

export function trackExperienceEngaged(
  product: ProductLike,
  productType: ProductType,
  seconds: 15 | 30 | 60 | 120,
  maxScrollPercent: number
) {
  safeTrack("experience_engaged", {
    ...productProps(product, productType),
    seconds,
    max_scroll_percent: maxScrollPercent,
  });
}

export function trackSectionViewed(
  section: "included" | "extras" | "map" | "reviews" | "essentials" | "other_experiences",
  slug?: string
) {
  safeTrack("section_viewed", { section, slug });
}

export function trackEssentialsExpanded(slug?: string) {
  safeTrack("essentials_expanded", { slug });
}

export function trackGalleryOpened(slug?: string) {
  safeTrack("gallery_opened", { slug });
}

// index = position de la photo (0 = couverture). surface = où la photo a été vue :
// dans le carrousel du haut de fiche ou dans la galerie plein écran.
export function trackGalleryPhotoViewed(
  slug: string | undefined,
  index: number,
  totalPhotos: number,
  surface: "carousel" | "fullscreen",
) {
  safeTrack("gallery_photo_viewed", { slug, index, total_photos: totalPhotos, surface });
}

export function trackParticipantsChanged(slug: string, adults: number, children?: number) {
  safeTrack("participants_changed", { slug, adults, children });
}

export function trackStandaloneDateSelected(slug: string, date: string, daysAhead: number) {
  safeTrack("date_selected", { slug, date, days_ahead: daysAhead });
}

export function trackSlotSelected(slug: string, slot: string) {
  safeTrack("slot_selected", { slug, slot });
}

export function trackRateOptionSelected(slug: string, rateName: string, price?: number, currency?: string) {
  safeTrack("rate_option_selected", {
    slug,
    rate_name: rateName,
    price,
    currency,
    ...amountProps(price, currency),
  });
}

export function trackExtraToggled(slug: string, extraName: string, enabled: boolean, price?: number) {
  safeTrack("extra_toggled", { slug, extra_name: extraName, enabled, price });
}

export function trackBookClicked(product: ProductLike, productType: ProductType, placement: string) {
  safeTrack("book_clicked", { ...productProps(product, productType), placement });
}

export function trackRequestClicked(product: ProductLike, productType: ProductType, placement: string) {
  safeTrack("request_clicked", { ...productProps(product, productType), placement });
}

export function trackBookingPanelOpened(slug?: string) {
  safeTrack("booking_panel_opened", { slug });
}

export function trackVitrineBlockedShown(slug?: string) {
  safeTrack("vitrine_blocked_shown", { slug });
}

export function trackCheckoutViewed(step: string, slug?: string, totalPrice?: number, currency?: string) {
  safeTrack("checkout_viewed", {
    step,
    slug,
    total_price: totalPrice,
    currency,
    ...amountProps(totalPrice, currency),
  });
}

export function trackGuestFormStarted(slug?: string) {
  safeTrack("guest_form_started", { slug });
}

export function trackFormErrorShown(fieldName: string, slug?: string) {
  safeTrack("form_error_shown", { field: fieldName, slug });
}

export function trackPromoCodeApplied(code: string, discountAmount?: number) {
  safeTrack("promo_code_applied", { code, discount_amount: discountAmount });
}

export function trackPromoCodeFailed(code: string, reason?: string) {
  safeTrack("promo_code_failed", { code, reason });
}

export function trackGiftCardApplied(amount?: number, currency?: string) {
  safeTrack("gift_card_applied", { amount, currency, ...amountProps(amount, currency) });
}

export function trackGiftCardFailed(reason?: string) {
  safeTrack("gift_card_failed", { reason });
}

export function trackCheckoutStepCompleted(step: string, slug?: string) {
  safeTrack("checkout_step_completed", { step, slug });
}

export function trackPaymentWidgetOpened(slug?: string, totalPrice?: number, currency?: string) {
  safeTrack("payment_widget_opened", {
    slug,
    total_price: totalPrice,
    currency,
    ...amountProps(totalPrice, currency),
  });
}

export function trackPaymentFailedClient(errorMessage: string, slug?: string) {
  safeTrack("payment_failed_client", { error_message: errorMessage, slug });
}

export function trackCheckoutAbandoned(slug: string, step: string, secondsElapsed: number) {
  safeTrack("checkout_abandoned", { slug, step, seconds_elapsed: Math.round(secondsElapsed) });
}

export function trackConfirmationViewed(bookingRef: string, totalPrice?: number, currency?: string) {
  safeTrack("confirmation_viewed", {
    booking_ref: bookingRef,
    total_price: totalPrice,
    currency,
    ...amountProps(totalPrice, currency),
  });
}

export function trackWhatsappClicked(
  placement: string,
  messageVariant: "site" | "ig" | "tiktok" | "google" | "facebook",
  entrySource?: string,
  product?: ProductLike | null,
  productType?: ProductType
) {
  safeTrack("whatsapp_clicked", {
    placement,
    message_variant: messageVariant,
    entry_source: entrySource,
    ...(product && productType ? productProps(product, productType) : {}),
  });
}

export function trackNewsletterPopupShown() {
  safeTrack("newsletter_popup_shown");
}

export function trackNewsletterPopupClosed(method: "close_button" | "backdrop" | "submitted") {
  safeTrack("newsletter_popup_closed", { method });
}

export function trackNewsletterSubscribed(emailDomain: string) {
  safeTrack("newsletter_subscribed", { email_domain: emailDomain });
}

export function trackContactFormSubmitted(subject?: string) {
  safeTrack("contact_form_submitted", { subject });
}

export function trackAuthPromptShown(context?: string) {
  safeTrack("auth_prompt_shown", { context });
}

export function identifyWhatsappClicked() {
  safeSetUserProperty("has_clicked_whatsapp", true);
  const stored = parseInt(localStorage.getItem("sm_whatsapp_clicks_count") ?? "0", 10);
  const newCount = stored + 1;
  try {
    localStorage.setItem("sm_whatsapp_clicks_count", String(newCount));
  } catch {}
  safeSetUserProperty("whatsapp_clicks_count", newCount);
}

// ============================================
// J. AVIS CLIENTS (5 events)
// ============================================

export function trackReviewRequestSent(bookingType: "standalone_bookings" | "bookings_hg", channel: "email" | "whatsapp", lang: string) {
  safeTrack("review_request_sent", { booking_type: bookingType, channel, lang });
}

export function trackReviewLinkOpened(status: "opened" | "already_submitted") {
  safeTrack("review_link_opened", { status });
}

export function trackReviewSubmitted(rating: number | null, scope: string) {
  safeTrack("review_submitted", { rating, scope });
}

export function trackReviewPublished(scope: string) {
  safeTrack("review_published", { scope });
}

export function trackReviewsBlockScrolled(scope: string, entityId?: string) {
  safeTrack("reviews_block_scrolled", { scope, entity_id: entityId });
}
