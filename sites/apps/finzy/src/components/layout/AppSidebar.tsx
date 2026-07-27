import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, Target, BarChart3, Calculator, GraduationCap, User, TrendingUp, Compass, LineChart, BookOpen, Trophy, Landmark, Sparkles, Shield
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter
} from '@/components/ui/sidebar';
import { usePlan } from '@/hooks/usePlan';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Budget', url: '/budget', icon: Wallet },
  { title: 'Projets', url: '/projets', icon: Target },
  { title: 'Patrimoine', url: '/patrimoine', icon: BarChart3 },
  { title: 'Simulateurs', url: '/simulateurs', icon: Calculator },
  { title: 'Academy', url: '/academy', icon: GraduationCap },
];

const investItems = [
  { title: 'Immobilier locatif', url: '/investissements/immobilier', icon: Landmark },
  { title: 'Marchés financiers', url: '/investissements/marches', icon: TrendingUp },
  { title: 'Watchlist & Portefeuille', url: '/investissements/watchlist-portefeuille', icon: Wallet },
];

const extraItems = [
  { title: 'Projections', url: '/projections', icon: LineChart },
  { title: 'Classement', url: '/leaderboard', icon: Trophy },
  { title: 'Ressources', url: '/ressources', icon: Compass },
  { title: 'Bonus', url: '/bonus', icon: BookOpen },
];

export function AppSidebar() {
  const location = useLocation();
  const { isPremium, isAdmin } = usePlan();

  return (
    <Sidebar>
      <div className="flex h-14 items-center px-4 border-b">
        <span className="text-xl font-bold gradient-text">Finzy</span>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url || location.pathname.startsWith(item.url + '/')}>
                    <NavLink to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Investissements</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {investItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url || location.pathname.startsWith(item.url + '/')}>
                    <NavLink to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Pour aller plus loin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {extraItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url || location.pathname.startsWith(item.url + '/')}>
                    <NavLink to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {!isPremium && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === '/premium'}>
                <NavLink to="/premium" className="flex items-center gap-2 text-premium font-medium">
                  <Sparkles className="h-4 w-4" />
                  <span>Passer Premium</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === '/admin'}>
                <NavLink to="/admin" className="flex items-center gap-2 text-destructive">
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === '/profil'}>
              <NavLink to="/profil" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Profil</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
