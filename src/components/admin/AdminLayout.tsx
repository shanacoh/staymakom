import { Outlet, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AlertBanner } from "./AlertBanner";

export function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#FAF8F5]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Alert Banner */}
          <AlertBanner />
          <header className="h-11 sm:h-14 border-b bg-white flex items-center px-2 sm:px-6 sticky top-0 z-10 shrink-0">
            <SidebarTrigger className="h-8 w-8 shrink-0" />
            <h1 className="ml-2 sm:ml-4 text-sm sm:text-xl md:text-2xl font-bold truncate">Admin</h1>
            <Link to="/" className="ml-auto flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap shrink-0">
              <span className="hidden sm:inline">← Retour au site</span>
              <span className="sm:hidden">← Site</span>
            </Link>
          </header>
          <main className="flex-1 p-2 sm:p-6 overflow-x-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}