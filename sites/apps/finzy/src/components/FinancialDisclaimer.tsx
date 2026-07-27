import { forwardRef } from 'react';

export const FinancialDisclaimer = forwardRef<HTMLParagraphElement, { className?: string }>(
  function FinancialDisclaimer({ className }, ref) {
    return (
      <p ref={ref} className={`text-[11px] leading-relaxed text-muted-foreground ${className ?? ''}`}>
        💡 Les informations présentées ne constituent pas un conseil financier réglementé. Pour toute décision majeure, consultez un conseiller en gestion de patrimoine (CGP) agréé.
      </p>
    );
  }
);
