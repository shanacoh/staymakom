import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import MobileAppShell from "@/components/MobileAppShell";
import CookieConsent from "@/components/CookieConsent";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { initAmplitude } from "@/lib/amplitude";
import { trackPageViewed, trackUtmCaptured } from "@/lib/analytics";
import { Loader2 } from "lucide-react";

// ── Chemin critique : chargement immédiat ──────────────────────────────────
import LaunchIndex from "./pages/LaunchIndex";
import LaunchExperiences from "./pages/LaunchExperiences";
import Experience2 from "./pages/Experience2";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";

// ── Pages publiques secondaires : chargées à la demande ───────────────────
const Index              = lazy(() => import("./pages/Index"));
const ComingSoon         = lazy(() => import("./pages/ComingSoon"));
const Category           = lazy(() => import("./pages/Category"));
const Experience         = lazy(() => import("./pages/Experience"));
const HotelOld           = lazy(() => import("./pages/HotelOld"));
const Hotel              = lazy(() => import("./pages/Hotel"));
const Auth               = lazy(() => import("./pages/Auth"));
const Account            = lazy(() => import("./pages/Account"));
const GiftCard           = lazy(() => import("./pages/GiftCard"));
const GiftCardConfirmation = lazy(() => import("./pages/GiftCardConfirmation"));
const Companies          = lazy(() => import("./pages/Companies"));
const Partners           = lazy(() => import("./pages/Partners"));
const PartnerForm        = lazy(() => import("./pages/PartnerForm"));
const Journal            = lazy(() => import("./pages/Journal"));
const JournalPost        = lazy(() => import("./pages/JournalPost"));
const Contact            = lazy(() => import("./pages/Contact"));
const About              = lazy(() => import("./pages/About"));
const Consulting         = lazy(() => import("./pages/Consulting"));
const Terms              = lazy(() => import("./pages/Terms"));
const Privacy            = lazy(() => import("./pages/Privacy"));
const CancellationPolicy = lazy(() => import("./pages/CancellationPolicy"));
const Cookies            = lazy(() => import("./pages/Cookies"));
const Legal              = lazy(() => import("./pages/Legal"));
const Experiences        = lazy(() => import("./pages/Experiences"));
const Experiences2       = lazy(() => import("./pages/Experiences2"));
const MobileAuthPrompt   = lazy(() => import("./pages/MobileAuthPrompt"));
const BookingConfirmationPage = lazy(() => import("./pages/BookingConfirmationPage"));
const Cart               = lazy(() => import("./pages/Cart"));

// ── Admin (chargé uniquement si connecté admin) ───────────────────────────
const AdminLayout            = lazy(() => import("@/components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminDashboard         = lazy(() => import("./pages/admin/Dashboard"));
const AdminCategories        = lazy(() => import("./pages/admin/Categories"));
const CategoryEditor         = lazy(() => import("./pages/admin/CategoryEditor"));
const AdminHotels            = lazy(() => import("./pages/admin/Hotels"));
const AdminHotels2           = lazy(() => import("./pages/admin/Hotels2"));
const AdminExperiences       = lazy(() => import("./pages/admin/Experiences"));
const AdminExperiences2      = lazy(() => import("./pages/admin/Experiences2"));
const AdminBookings          = lazy(() => import("./pages/admin/Reservations"));
const AdminReservationDetails = lazy(() => import("./pages/admin/ReservationDetails"));
const AdminUsers             = lazy(() => import("./pages/admin/Users"));
const AdminCustomers         = lazy(() => import("./pages/admin/Customers"));
const AdminJournal           = lazy(() => import("./pages/admin/Journal"));
const JournalEditor          = lazy(() => import("./pages/admin/JournalEditor"));
const AdminGiftCards         = lazy(() => import("./pages/admin/GiftCards"));
const AdminGiftCardDetails   = lazy(() => import("./pages/admin/GiftCardDetails"));
const AdminSettings          = lazy(() => import("./pages/admin/Settings"));
const AdminAIInsights        = lazy(() => import("./pages/admin/AIInsights"));
const AdminLeads             = lazy(() => import("./pages/admin/Leads"));
const AdminFavorites         = lazy(() => import("./pages/admin/Favorites"));
const DiagnosticPage         = lazy(() => import("./pages/admin/DiagnosticPage"));
const HyperGuestDebugPage    = lazy(() => import("./pages/admin/hyperguest/DebugPage"));
const HyperGuestLogsPage     = lazy(() => import("./pages/admin/hyperguest/LogsPage"));
const HyperGuestConfigPage   = lazy(() => import("./pages/admin/hyperguest/ConfigPage"));
const RevolutDebugPage       = lazy(() => import("./pages/admin/revolut/DebugPage"));

// ── Hotel admin (chargé uniquement si connecté hotel_admin) ───────────────
const HotelAdminLayout       = lazy(() => import("@/components/hotel-admin/HotelAdminLayout").then(m => ({ default: m.HotelAdminLayout })));
const HotelAdminDashboard    = lazy(() => import("./pages/hotel-admin/Dashboard"));
const HotelProperty          = lazy(() => import("./pages/hotel-admin/Property"));
const HotelExperiences       = lazy(() => import("./pages/hotel-admin/Experiences"));
const HotelExtras            = lazy(() => import("./pages/hotel-admin/Extras"));
const HotelExtrasManagement  = lazy(() => import("./pages/hotel-admin/ExtrasManagement"));
const HotelBookings          = lazy(() => import("./pages/hotel-admin/Bookings"));
const HotelBookingDetails    = lazy(() => import("./pages/hotel-admin/BookingDetails"));
const HotelBookingEdit       = lazy(() => import("./pages/hotel-admin/BookingEdit"));
const HotelBilling           = lazy(() => import("./pages/hotel-admin/Billing"));
const HotelReviews           = lazy(() => import("./pages/hotel-admin/Reviews"));
const HotelPaymentInfo       = lazy(() => import("./pages/hotel-admin/PaymentInfo"));
const HotelContact           = lazy(() => import("./pages/hotel-admin/Contact"));

const queryClient = new QueryClient();

// Détection automatique du domaine custom vs preview Lovable
const isCustomDomain = () => !window.location.hostname.includes('lovable.app');

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const AppContent = () => {
  const location = useLocation();
  const { showBanner, acceptCookies, declineCookies } = useCookieConsent();

  useEffect(() => {
    const consent = localStorage.getItem("staymakom_cookie_consent");
    if (consent === "accepted") initAmplitude();
  }, []);

  useEffect(() => {
    trackPageViewed(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    if (sessionStorage.getItem("staymakom_utm_tracked")) return;
    const params = new URLSearchParams(window.location.search);
    const source = params.get("utm_source") || undefined;
    const medium = params.get("utm_medium") || undefined;
    const campaign = params.get("utm_campaign") || undefined;
    const content = params.get("utm_content") || undefined;
    const term = params.get("utm_term") || undefined;
    if (source || medium || campaign || content || term) {
      trackUtmCaptured({ source, medium, campaign, content, term });
      sessionStorage.setItem("staymakom_utm_tracked", "1");
    }
  }, []);

  return (
    <>
      <MobileAppShell />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Site live depuis 2026-05-07 : la racine pointe sur LaunchIndex (vrai site).
              La page Coming Soon reste accessible sur /coming-soon si besoin. */}
          <Route path="/" element={<LaunchIndex />} />
          <Route path="/coming-soon" element={<ComingSoon />} />
          <Route path="/home" element={<Index />} />
          <Route path="/launch" element={<LaunchIndex />} />
          <Route path="/launch/experiences" element={<LaunchExperiences />} />
          <Route path="/mobile-login" element={<MobileAuthPrompt />} />
          <Route path="/auth" element={<Auth />} />
          {/* /gift-card : émission de cartes cadeaux réservée aux admins (validé Shana 2026-05-07).
              Les visiteurs non-admin sont redirigés vers la home. Le destinataire d'une carte
              n'a pas besoin d'accéder à cette page : son code arrive par email. */}
          <Route
            path="/gift-card"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <GiftCard />
              </ProtectedRoute>
            }
          />
          <Route path="/gift-card/confirmation" element={<GiftCardConfirmation />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/corporate" element={<Companies />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/partner-form" element={<PartnerForm />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/journal/:slug" element={<JournalPost />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/consulting" element={<Consulting />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cancellation-policy" element={<CancellationPolicy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/experiences" element={<Experiences2 />} />
          <Route path="/experiences2" element={<Experiences2 />} />
          <Route path="/experiences-old" element={<Experiences />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/experience/:slug" element={<Experience2 />} />
          <Route path="/experience2/:slug" element={<Experience2 />} />
          <Route path="/experience-old/:slug" element={<Experience />} />
          <Route path="/hotel/:slug" element={<Hotel />} />
          <Route path="/hotels/:slug" element={<Hotel />} />
          <Route path="/hotel-old/:slug" element={<HotelOld />} />
          <Route path="/booking/confirmation/:token" element={<BookingConfirmationPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute allowedRoles={["customer", "admin", "hotel_admin"]}>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="categories/new" element={<CategoryEditor />} />
            <Route path="categories/edit/:id" element={<CategoryEditor />} />
            {/* Principal = V2 */}
            <Route path="hotels2" element={<AdminHotels2 />} />
            <Route path="hotels2/new" element={<AdminHotels2 key="new" />} />
            <Route path="hotels2/edit/:hotelId" element={<AdminHotels2 key="edit" />} />
            <Route path="experiences2" element={<AdminExperiences2 />} />
            <Route path="experiences2/new" element={<AdminExperiences2 key="new" />} />
            <Route path="experiences2/edit/:experienceId" element={<AdminExperiences2 key="edit" />} />
            {/* Backup V1 */}
            <Route path="backup/dashboard" element={<AdminDashboard />} />
            <Route path="backup/hotels" element={<AdminHotels />} />
            <Route path="backup/hotels/new" element={<AdminHotels key="new" />} />
            <Route path="backup/hotels/edit/:hotelId" element={<AdminHotels key="edit" />} />
            <Route path="backup/experiences" element={<AdminExperiences />} />
            <Route path="backup/experiences/new" element={<AdminExperiences key="new" />} />
            <Route path="backup/experiences/edit/:experienceId" element={<AdminExperiences key="edit" />} />
            {/* Legacy routes → redirigées vers V2 */}
            <Route path="hotels" element={<AdminHotels2 />} />
            <Route path="hotels/new" element={<AdminHotels2 key="new" />} />
            <Route path="hotels/edit/:hotelId" element={<AdminHotels2 key="edit" />} />
            <Route path="experiences" element={<AdminExperiences2 />} />
            <Route path="experiences/new" element={<AdminExperiences2 key="new" />} />
            <Route path="experiences/edit/:experienceId" element={<AdminExperiences2 key="edit" />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="reservations" element={<AdminBookings />} />
            <Route path="reservations/:bookingId" element={<AdminReservationDetails />} />
            <Route path="gift-cards" element={<AdminGiftCards />} />
            <Route path="gift-cards/:id" element={<AdminGiftCardDetails />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="journal" element={<AdminJournal />} />
            <Route path="journal/new" element={<JournalEditor />} />
            <Route path="journal/edit/:id" element={<JournalEditor />} />
            <Route path="ai-insights" element={<AdminAIInsights />} />
            <Route path="leads" element={<AdminLeads />} />
            <Route path="favorites" element={<AdminFavorites />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="diagnostic" element={<DiagnosticPage />} />
            <Route path="hyperguest/debug" element={<HyperGuestDebugPage />} />
            <Route path="hyperguest/logs" element={<HyperGuestLogsPage />} />
            <Route path="hyperguest/config" element={<HyperGuestConfigPage />} />
            <Route path="revolut/debug" element={<RevolutDebugPage />} />
          </Route>
          <Route
            path="/hotel-admin"
            element={
              <ProtectedRoute allowedRoles={["hotel_admin"]}>
                <HotelAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HotelAdminDashboard />} />
            <Route path="property" element={<HotelProperty />} />
            <Route path="experiences" element={<HotelExperiences />} />
            <Route path="bookings" element={<HotelBookings />} />
            <Route path="bookings/:bookingId" element={<HotelBookingDetails />} />
            <Route path="bookings/edit/:bookingId" element={<HotelBookingEdit />} />
            <Route path="extras" element={<HotelExtras />} />
            <Route path="extras-management" element={<HotelExtrasManagement />} />
            <Route path="billing" element={<HotelBilling />} />
            <Route path="reviews" element={<HotelReviews />} />
            <Route path="payment-info" element={<HotelPaymentInfo />} />
            <Route path="contact" element={<HotelContact />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {showBanner && (
        <CookieConsent onAccept={acceptCookies} onDecline={declineCookies} />
      )}
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <CurrencyProvider>
              <AppContent />
            </CurrencyProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
