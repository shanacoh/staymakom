import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  Calendar,
  UserCircle,
  BookOpen,
  Settings,
  Sparkles,
  Gift,
  Brain,
  Mail,
  Heart,
  FlaskConical,
  Bug,
  ScrollText,
  Cog,
  CreditCard,
  Layers,
  FolderOpen,
  Tag,
  Sailboat,
  Inbox,
  Map,
  Library,
  Compass,
  Handshake,
  Percent,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Compte les groupes d'erreurs pas encore traités, pour le badge rouge sur "Erreurs".
function useNewErrorsCount() {
  const { data } = useQuery({
    queryKey: ["dashboard-new-errors-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("error_groups")
        .select("id", { count: "exact", head: true })
        .eq("status", "new");
      if (error) return 0;
      return count || 0;
    },
    refetchInterval: 60000,
  });
  return data || 0;
}

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  exact?: boolean;
  // Marqueur temporaire : page dont la refonte visuelle est validée par Shana (retiré une fois tout le menu refait).
  done?: boolean;
  // Marqueur temporaire : page en cours de refonte, pas encore validée (retiré une fois validée).
  inProgress?: boolean;
};

const ACTIVE_CLASS = "bg-black text-white hover:bg-neutral-800 hover:text-red-300";
const INACTIVE_CLASS = "hover:bg-muted";

// Aperçu : le tableau de bord, puis les futures vues de consultation (écrans à construire)
const apercuItems: NavItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, exact: true, inProgress: true },
  { title: "Carte", url: "/admin/carte", icon: Map },
  { title: "Catalogue", url: "/admin/catalogue", icon: Library },
];

// Opérations : la surface de travail au quotidien
const operationsItems: NavItem[] = [
  { title: "Experiences", url: "/admin/experiences2", icon: Sparkles },
  { title: "Itinéraires", url: "/admin/itineraires", icon: Compass },
  { title: "Réservations", url: "/admin/bookings", icon: Calendar },
  { title: "Partenaires · Hôtels", url: "/admin/hotels2", icon: Building2 },
  { title: "Partenaires · Expériences", url: "/admin/partenaires/experiences", icon: Handshake },
];

// Autre : tout ce qui existe déjà et n'a pas encore de place dédiée dans la nouvelle organisation
const autreItems: NavItem[] = [
  { title: "Categories", url: "/admin/categories", icon: FolderKanban },
  { title: "Comptes", url: "/admin/customers", icon: UserCircle, done: true },
  { title: "Favorites", url: "/admin/favorites", icon: Heart, done: true },
  { title: "Journal", url: "/admin/journal", icon: BookOpen },
  { title: "AI Insights", url: "/admin/ai-insights", icon: Brain },
  { title: "Mes bateaux", url: "/admin/boats", icon: Sailboat },
  { title: "Demandes bateaux", url: "/admin/boats/requests", icon: Inbox },
  { title: "Bibliothèque swipe", url: "/admin/swipe/bibliotheque", icon: Layers },
  { title: "Catégories swipe", url: "/admin/swipe/categories", icon: Tag },
];

// Croissance
const croissanceItems: NavItem[] = [
  { title: "CRM", url: "/admin/leads", icon: Mail, done: true },
  { title: "Codes promo", url: "/admin/promo", icon: Percent, done: true },
  { title: "Gift Cards", url: "/admin/gift-cards", icon: Gift, done: true },
  { title: "Dossiers swipe", url: "/admin/swipe/dossiers", icon: FolderOpen },
];

// Technique : replié par défaut, tout se déroule au clic (Erreurs, Settings, puis HyperGuest et Revolut)
const errorsItem: NavItem = { title: "Erreurs", url: "/admin/errors", icon: AlertTriangle };
const settingsItem: NavItem = { title: "Settings", url: "/admin/settings", icon: Settings };
const hyperguestItems: NavItem[] = [
  { title: "Diagnostic", url: "/admin/diagnostic", icon: FlaskConical },
  { title: "Debug API", url: "/admin/hyperguest/debug", icon: Bug },
  { title: "Logs", url: "/admin/hyperguest/logs", icon: ScrollText },
  { title: "Configuration", url: "/admin/hyperguest/config", icon: Cog },
];
const revolutItems: NavItem[] = [
  { title: "Debug API", url: "/admin/revolut/debug", icon: CreditCard },
];

// Headquarter : sections encore à construire
const headquarterItems: NavItem[] = [
  { title: "Sales", url: "/admin/headquarter/sales", icon: LayoutDashboard },
  { title: "Marketing", url: "/admin/headquarter/marketing", icon: LayoutDashboard },
  { title: "Operation", url: "/admin/headquarter/operation", icon: LayoutDashboard },
];

function NavGroup({
  label,
  items,
  collapsed,
  isActive,
  onNavClick,
}: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
  isActive: (path: string, exact?: boolean) => boolean;
  onNavClick: () => void;
}) {
  return (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                className={isActive(item.url, item.exact) ? ACTIVE_CLASS : INACTIVE_CLASS}
              >
                <Link to={item.url} onClick={onNavClick}>
                  {collapsed ? (
                    <item.icon className="h-5 w-5" />
                  ) : (
                    <span
                      className={cn(
                        "text-sm font-medium",
                        item.done && "text-green-600",
                        item.inProgress && "text-orange-500"
                      )}
                    >
                      {item.title}
                    </span>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function TechniqueNavItem({
  item,
  collapsed,
  isActive,
  onNavClick,
  badgeCount,
  accentClass,
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: (path: string) => boolean;
  onNavClick: () => void;
  badgeCount?: number;
  accentClass?: string;
}) {
  return (
    <SidebarMenuItem className={accentClass ? cn("ml-3 border-l-2 pl-1", accentClass) : undefined}>
      <SidebarMenuButton asChild className={isActive(item.url) ? ACTIVE_CLASS : INACTIVE_CLASS}>
        <Link to={item.url} onClick={onNavClick} className="flex items-center gap-2">
          {collapsed ? (
            <item.icon className="h-5 w-5" />
          ) : (
            <span className="text-sm font-medium">{item.title}</span>
          )}
          {!!badgeCount && badgeCount > 0 && (
            <Badge
              variant="destructive"
              className="ml-auto h-4 min-w-4 shrink-0 items-center justify-center rounded-full p-0 px-1 text-[10px] leading-none"
            >
              {badgeCount}
            </Badge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// Technique : replié par défaut. Au clic, tout se déroule d'un coup (pas de sous-accordéons imbriqués)
// pour qu'on voie en un coup d'œil chaque titre de bloc et les pages qui vivent en dessous.
function TechniqueGroup({
  collapsed,
  isActive,
  onNavClick,
}: {
  collapsed: boolean;
  isActive: (path: string) => boolean;
  onNavClick: () => void;
}) {
  const newErrorsCount = useNewErrorsCount();

  if (collapsed) {
    // Mode icônes réduit : les liens restent accessibles, sans le regroupement replié.
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <TechniqueNavItem item={errorsItem} collapsed={collapsed} isActive={isActive} onNavClick={onNavClick} badgeCount={newErrorsCount} />
            <TechniqueNavItem item={settingsItem} collapsed={collapsed} isActive={isActive} onNavClick={onNavClick} />
            {hyperguestItems.map((item) => (
              <TechniqueNavItem key={item.title} item={item} collapsed={collapsed} isActive={isActive} onNavClick={onNavClick} />
            ))}
            {revolutItems.map((item) => (
              <TechniqueNavItem key={item.title} item={item} collapsed={collapsed} isActive={isActive} onNavClick={onNavClick} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <Collapsible>
        <CollapsibleTrigger className="group flex w-full items-center gap-2 px-3 text-xs font-bold uppercase tracking-wider text-green-600 hover:text-green-700 transition-colors">
          <span>Technique</span>
          {newErrorsCount > 0 && (
            <Badge
              variant="destructive"
              className="h-4 min-w-4 shrink-0 items-center justify-center rounded-full p-0 px-1 text-[10px] leading-none"
            >
              {newErrorsCount}
            </Badge>
          )}
          <ChevronDown className="ml-auto h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent className="mt-1">
            <SidebarMenu>
              <TechniqueNavItem item={errorsItem} collapsed={collapsed} isActive={isActive} onNavClick={onNavClick} badgeCount={newErrorsCount} />
              <TechniqueNavItem item={settingsItem} collapsed={collapsed} isActive={isActive} onNavClick={onNavClick} />
            </SidebarMenu>

            <div className="mt-3 flex items-center gap-1.5 border-t border-border/60 px-3 pt-3">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-800" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">HyperGuest</span>
            </div>
            <SidebarMenu>
              {hyperguestItems.map((item) => (
                <TechniqueNavItem
                  key={item.title}
                  item={item}
                  collapsed={collapsed}
                  isActive={isActive}
                  onNavClick={onNavClick}
                  accentClass="border-blue-800/30"
                />
              ))}
            </SidebarMenu>

            <div className="mt-3 flex items-center gap-1.5 border-t border-border/60 px-3 pt-3">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-800" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">Revolut</span>
            </div>
            <SidebarMenu>
              {revolutItems.map((item) => (
                <TechniqueNavItem
                  key={item.title}
                  item={item}
                  collapsed={collapsed}
                  isActive={isActive}
                  onNavClick={onNavClick}
                  accentClass="border-blue-800/30"
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}

export function AdminSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-56"}>
      <SidebarContent className="bg-background pt-3">
        <div className={collapsed ? "px-2 pb-3 flex justify-center" : "px-3 pb-4 flex items-start justify-between gap-2"}>
          {!collapsed && (
            <Link to="/" className="hover:opacity-80 transition-opacity" title="Retour au site">
              <div className="text-base font-extrabold tracking-tight text-foreground">
                STAYMAKOM<span className="text-destructive">.</span>
              </div>
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Back-office
              </div>
            </Link>
          )}
          <SidebarTrigger className="h-7 w-7 shrink-0" />
        </div>

        <NavGroup
          label="Aperçu"
          items={apercuItems}
          collapsed={collapsed}
          isActive={isActive}
          onNavClick={handleNavClick}
        />
        <NavGroup
          label="Opérations"
          items={operationsItems}
          collapsed={collapsed}
          isActive={isActive}
          onNavClick={handleNavClick}
        />
        <NavGroup
          label="Croissance"
          items={croissanceItems}
          collapsed={collapsed}
          isActive={isActive}
          onNavClick={handleNavClick}
        />
        <NavGroup
          label="Autre"
          items={autreItems}
          collapsed={collapsed}
          isActive={isActive}
          onNavClick={handleNavClick}
        />

        <TechniqueGroup collapsed={collapsed} isActive={isActive} onNavClick={handleNavClick} />

        <NavGroup
          label="Headquarter"
          items={headquarterItems}
          collapsed={collapsed}
          isActive={isActive}
          onNavClick={handleNavClick}
        />
      </SidebarContent>
    </Sidebar>
  );
}
