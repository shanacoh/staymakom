/**
 * Global mobile shell — wraps any page with:
 * - MobileStickyHeader (top)
 * - MobileBottomNav (bottom)
 * Hidden on admin/hotel-admin routes.
 * On /account pages with ?tab=, the sub-page provides its own header.
 */
import { useLocation } from "react-router-dom";
import MobileStickyHeader from "@/components/MobileStickyHeader";
import MobileBottomNav from "@/components/MobileBottomNav";

const MobileAppShell = () => {
  const location = useLocation();
  
  const isAdmin = location.pathname.startsWith("/admin") || location.pathname.startsWith("/hotel-admin");
  if (isAdmin) return null;

  // On account sub-pages (with ?tab=), the sub-page renders its own header
  const isAccountSubPage = location.pathname === "/account" && location.search.includes("tab=");

  return (
    <>
      {!isAccountSubPage && <MobileStickyHeader />}
      <MobileBottomNav />
    </>
  );
};

export default MobileAppShell;
