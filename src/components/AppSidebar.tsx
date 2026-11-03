import { User, Store, Leaf, Tractor, Dog, BookOpen, Info, LogOut, ShieldCheck } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

const siteLinks = [
  { title: "Plant Help", url: "/site/plant-help", icon: Leaf, externalUrl: "https://planthelp.netlify.app/" },
  { title: "NIMALUNDA Ani", url: "/site/fbms-ani", icon: Dog, externalUrl: "https://fbmsani.netlify.app/" },
  { title: "Farm Tracker", url: "/site/farm-tracker", icon: Tractor, externalUrl: "https://fbmsfarmtracker.netlify.app/" },
  { title: "Farm Market", url: "/site/fbms-store", icon: Store, externalUrl: "https://fbmsstore.netlify.app/" },
  { title: "NIMALUNDA Blog", url: "/site/fbms-blog", icon: BookOpen, externalUrl: "https://fbmsblog.netlify.app/" },
];

export function AppSidebar() {
  const { setOpen, setOpenMobile } = useSidebar();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      handleNavClick();
      navigate('/auth', { replace: true });
    } catch {
      toast.error(t.auth.unexpectedError);
    } finally {
      setSigningOut(false);
    }
  };

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t.sidebar.sites}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {siteLinks.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} onClick={handleNavClick} className={({ isActive }) => isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}>
                      <item.icon className="h-4 w-4" />
                      <span translate="no" className="notranslate">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="About Us">
                  <NavLink to="/site/about-us" onClick={handleNavClick} className={({ isActive }) => isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}>
                    <Info className="h-4 w-4" />
                    <span>About Us</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Terms & Policies">
                  <NavLink to="/policies" onClick={handleNavClick}>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Terms & Policies</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t.sidebar.account}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" onClick={handleNavClick} className={({ isActive }) => isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}>
                    <User className="h-4 w-4" />
                    <span>{t.sidebar.dashboard}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} disabled={signingOut} tooltip={t.profile.signOut}>
                  <LogOut className="h-4 w-4" />
                  <span>{t.profile.signOut}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  );
}
