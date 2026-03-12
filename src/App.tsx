import { useEffect } from "react";
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
import Index from "./pages/Index";
import ComingSoon from "./pages/ComingSoon";
import Category from "./pages/Category";
import Experience from "./pages/Experience";
import Experience2 from "./pages/Experience2";
import HotelOld from "./pages/HotelOld";
import Hotel from "./pages/Hotel";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import GiftCard from "./pages/GiftCard";
import GiftCardConfirmation from "./pages/GiftCardConfirmation";
import Companies from "./pages/Companies";
import Partners from "./pages/Partners";
import Journal from "./pages/Journal";
import JournalPost from "./pages/JournalPost";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Consulting from "./pages/Consulting";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import CancellationPolicy from "./pages/CancellationPolicy";
import Cookies from "./pages/Cookies";
import Legal from "./pages/Legal";
import Experiences from "./pages/Experiences";
import Experiences2 from "./pages/Experiences2";
import { HotelAdminLayout } from "@/components/hotel-admin/HotelAdminLayout";
import HotelAdminDashboard from "./pages/hotel-admin/Dashboard";
import HotelProperty from "./pages/hotel-admin/Property";
import HotelExperiences from "./pages/hotel-admin/Experiences";
import HotelExtras from "./pages/hotel-admin/Extras";
import HotelExtrasManagement from "./pages/hotel-admin/ExtrasManagement";
import HotelBookings from "./pages/hotel-admin/Bookings";
import HotelBookingDetails from "./pages/hotel-admin/BookingDetails";
import HotelBookingEdit from "./pages/hotel-admin/BookingEdit";
import HotelBilling from "./pages/hotel-admin/Billing";
import HotelReviews from "./pages/hotel-admin/Reviews";
import HotelPaymentInfo from "./pages/hotel-admin/PaymentInfo";
import HotelContact from "./pages/hotel-admin/Contact";
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCategories from "./pages/admin/Categories";
import CategoryEditor from "./pages/admin/CategoryEditor";
import AdminHotels from "./pages/admin/Hotels";
import AdminHotels2 from "./pages/admin/Hotels2";
import AdminExperiences from "./pages/admin/Experiences";
import AdminExperiences2 from "./pages/admin/Experiences2";
import AdminBookings from "./pages/admin/Reservations";
import AdminReservationDetails from "./pages/admin/ReservationDetails";
import AdminUsers from "./pages/admin/Users";
import AdminCustomers from "./pages/admin/Customers";
import AdminJournal from "./pages/admin/Journal";
import JournalEditor from "./pages/admin/JournalEditor";
import AdminGiftCards from "./pages/admin/GiftCards";
import AdminGiftCardDetails from "./pages/admin/GiftCardDetails";
import AdminSettings from "./pages/admin/Settings";
import AdminAIInsights from "./pages/admin/AIInsights";
import AdminLeads from "./pages/admin/Leads";
import AdminFavorites from "./pages/admin/Favorites";
import DiagnosticPage from "./pages/admin/DiagnosticPage";
import HyperGuestDebugPage from "./pages/admin/hyperguest/DebugPage";
import HyperGuestLogsPage from "./pages/admin/hyperguest/LogsPage";
import HyperGuestConfigPage from "./pages/admin/hyperguest/ConfigPage";
import LaunchIndex from "./pages/LaunchIndex";
import LaunchExperiences from "./pages/LaunchExperiences";
import MobileAuthPrompt from "./pages/MobileAuthPrompt";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
import Checkout from "./pages/Checkout";
import Cart from "./pages/Cart";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Détection automatique du domaine custom vs preview Lovable
const isCustomDomain = () => !window.location.hostname.includes('lovable.app');

const AppContent = () => {
  const location = useLocation();
  const { showBanner, acceptCookies, declineCookies } = useCookieConsent();

  // Init Amplitude if already consented (returning user)
  useEffect(() => {
    const consent = localStorage.getItem("staymakom_cookie_consent");
    if (consent === "accepted") {
      initAmplitude();
    }
  }, []);

  // Track page views
  useEffect(() => {
    trackPageViewed(location.pathname);
  }, [location.pathname]);

  // UTM capture — once per session
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
      <Routes>
        {/* Coming Soon en page d'accueil (temporaire) */}
        <Route path="/" element={<ComingSoon />} />
        <Route path="/home" element={<Index />} />
        <Route path="/launch" element={<LaunchIndex />} />
        <Route path="/launch/experiences" element={<LaunchExperiences />} />
        <Route path="/mobile-login" element={<MobileAuthPrompt />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/gift-card" element={<GiftCard />} />
        <Route path="/gift-card/confirmation" element={<GiftCardConfirmation />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/corporate" element={<Companies />} />
        <Route path="/partners" element={<Partners />} />
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
          {/* Legacy routes kept */}
          <Route path="hotels" element={<AdminHotels />} />
          <Route path="hotels/new" element={<AdminHotels key="new" />} />
          <Route path="hotels/edit/:hotelId" element={<AdminHotels key="edit" />} />
          <Route path="experiences" element={<AdminExperiences />} />
          <Route path="experiences/new" element={<AdminExperiences key="new" />} />
          <Route path="experiences/edit/:experienceId" element={<AdminExperiences key="edit" />} />
          <Route path="bookings" element={<AdminBookings />} />
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