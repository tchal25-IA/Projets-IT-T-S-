import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppSidebar } from './AppSidebar';
import { BottomNav } from './BottomNav';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { FinzyBotFAB } from '@/components/FinzyBotFAB';
import { OnboardingTutorial } from '@/components/OnboardingTutorial';
import { OfflineBanner } from '@/components/OfflineBanner';

export default function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full">
        {!isMobile && <AppSidebar />}
        <main className="flex-1 flex flex-col">
          {!isMobile && (
            <header className="sticky top-0 z-30 flex h-12 items-center border-b bg-background/80 backdrop-blur-md px-4">
              <SidebarTrigger />
            </header>
          )}
          <div className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
            <Outlet />
          </div>
          {isMobile && <BottomNav />}
        </main>
      </div>
      <FinzyBotFAB />
      <OnboardingTutorial />
      <OfflineBanner />
    </SidebarProvider>
  );
}
