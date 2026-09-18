import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AlertBanner } from "./AlertBanner";

export function AdminLayout() {
  // Réduit l'échelle générale de l'affichage admin (le back-office paraissait plus "zoomé"
  // que le reste du site) : équivalent d'un Ctrl+- appliqué seulement à /admin.
  useEffect(() => {
    const root = document.documentElement;
    const previousFontSize = root.style.fontSize;
    root.style.fontSize = "78%";
    return () => {
      root.style.fontSize = previousFontSize;
    };
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Alert Banner */}
          <AlertBanner />
          <main className="flex-1 p-2 sm:p-6 overflow-x-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}