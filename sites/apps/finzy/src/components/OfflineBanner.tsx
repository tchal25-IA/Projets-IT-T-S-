import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-24 z-40 flex items-center gap-2 rounded-lg bg-warning/90 text-warning-foreground px-4 py-2 text-sm shadow-lg"
      role="alert"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>Tu es hors ligne. Les modifications seront synchronisées à la reconnexion.</span>
    </div>
  );
}
