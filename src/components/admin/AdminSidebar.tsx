import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  Calendar,
  Users,
  UserCircle,
  BookOpen,
  Settings,
  Sparkles,
  Gift,
  Brain,
  Mail,
  Heart,
  ShieldCheck,
  Archive,
  FlaskConical,
  Bug,
  ScrollText,
  Cog,
  Plug,
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const mainMenuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Categories", url: "/admin/categories", icon: FolderKanban },
  { title: "Hotels", url: "/admin/hotels2", icon: Building2 },
  { title: "Experiences", url: "/admin/experiences2", icon: Sparkles },
  { title: "Bookings", url: "/admin/bookings", icon: Calendar },
  { title: "Gift Cards", url: "/admin/gift-cards", icon: Gift },
  { title: "Leads", url: "/admin/leads", icon: Mail },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Customers", url: "/admin/customers", icon: UserCircle },
  { title: "Favorites", url: "/admin/favorites", icon: Heart },
  { title: "Journal", url: "/admin/journal", icon: BookOpen },
  { title: "AI Insights", url: "/admin/ai-insights", icon: Brain },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

const hyperguestMenuItems = [
  { title: "Diagnostic", url: "/admin/diagnostic", icon: FlaskConical },
  { title: "Debug API", url: "/admin/hyperguest/debug", icon: Bug },
  { title: "Logs", url: "/admin/hyperguest/logs", icon: ScrollText },
  { title: "Configuration", url: "/admin/hyperguest/config", icon: Cog },
];

const backupMenuItems = [
  { title: "Dashboard V1", url: "/admin/backup/dashboard", icon: LayoutDashboard },
  { title: "Hotels V1", url: "/admin/backup/hotels", icon: Building2 },
  { title: "Experiences V1", url: "/admin/backup/experiences", icon: Sparkles },
];

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
    <Sidebar className={collapsed ? "w-14" : "w-64"}>
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "px-2" : "px-3"}>
            {!collapsed && (
              <span className="text-sm font-bold tracking-wide text-primary">
                STAYMAKOM
              </span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={
                      isActive(item.url, item.exact)
                        ? "bg-[#1B2A4A] text-white hover:bg-[#1B2A4A]/90"
                        : "hover:bg-muted"
                    }
                  >
                    <Link to={item.url} onClick={handleNavClick}>
                      <item.icon className={collapsed ? "h-5 w-5" : "h-5 w-5 mr-3"} />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* HyperGuest section */}
        {!collapsed && (
          <SidebarGroup>
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                <Plug className="h-4 w-4" />
                <span>HyperGuest</span>
                <ChevronDown className="ml-auto h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {hyperguestMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={
                            isActive(item.url)
                              ? "bg-[#1B2A4A] text-white hover:bg-[#1B2A4A]/90"
                              : "hover:bg-muted"
                          }
                        >
                          <Link to={item.url} onClick={handleNavClick}>
                            <item.icon className="h-4 w-4 mr-3" />
                            <span className="text-sm">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {/* Backup V1 section */}
        {!collapsed && (
          <SidebarGroup>
            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                <Archive className="h-4 w-4" />
                <span>Backup (V1)</span>
                <ChevronDown className="ml-auto h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {backupMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={
                            isActive(item.url)
                              ? "bg-muted text-foreground"
                              : "text-muted-foreground hover:bg-muted/50"
                          }
                        >
                          <Link to={item.url} onClick={handleNavClick}>
                            <item.icon className="h-4 w-4 mr-3" />
                            <span className="text-xs">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
