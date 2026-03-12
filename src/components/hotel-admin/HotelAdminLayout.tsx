import { Outlet, NavLink, useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Hotel, 
  Ticket, 
  Plus, 
  Package, 
  Calendar, 
  DollarSign,
  FileText,
  CreditCard,
  Star,
  Wallet,
  MessageSquare,
  Settings,
  ArrowLeft
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/hotel-admin", icon: LayoutDashboard, end: true },
  { name: "Property", href: "/hotel-admin/property", icon: Hotel },
  { name: "Experiences", href: "/hotel-admin/experiences", icon: Ticket },
  { name: "Bookings", href: "/hotel-admin/bookings", icon: FileText },
  { name: "Extras", href: "/hotel-admin/extras-management", icon: Plus },
  { name: "Billing", href: "/hotel-admin/billing", icon: CreditCard },
  { name: "Reviews", href: "/hotel-admin/reviews", icon: Star },
  { name: "Payment Info", href: "/hotel-admin/payment-info", icon: Wallet },
  { name: "Support", href: "/hotel-admin/contact", icon: MessageSquare },
];

export const HotelAdminLayout = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="sticky top-0 flex h-full flex-col">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="font-sans text-2xl font-bold">Hotel Admin</h2>
            <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Site
            </Link>
          </div>
          
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = item.end 
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href);
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
