import { forwardRef, useState } from 'react';
import { X } from 'lucide-react';

export const BetaBanner = forwardRef<HTMLDivElement>(function BetaBanner(_props, ref) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div ref={ref} className="relative flex items-center justify-center gap-2 bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
      <span>🚀 Beta — Tous les modules accessibles gratuitement</span>
      <button onClick={() => setVisible(false)} className="absolute right-2 rounded p-0.5 hover:bg-primary-foreground/20">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
});
