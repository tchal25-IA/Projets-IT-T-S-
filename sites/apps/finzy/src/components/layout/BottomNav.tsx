import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, Target, BarChart3, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'Accueil', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Budget', to: '/budget', icon: Wallet },
  { label: 'Projets', to: '/projets', icon: Target },
  { label: 'Patrimoine', to: '/patrimoine', icon: BarChart3 },
  { label: 'Academy', to: '/academy', icon: GraduationCap },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur-md safe-area-pb" role="navigation" aria-label="Navigation principale">
      <div className="flex h-16 items-center justify-around">
        {tabs.map((tab) => {
          const active = location.pathname === tab.to;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className="flex flex-col items-center gap-0.5"
              aria-current={active ? 'page' : undefined}
            >
              <tab.icon className={cn('h-5 w-5', active ? 'text-primary' : 'text-muted-foreground')} />
              <span className={cn('text-[10px]', active ? 'text-primary font-semibold' : 'text-muted-foreground')}>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
