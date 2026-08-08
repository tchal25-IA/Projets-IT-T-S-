"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

type Props = {
  action: (formData: FormData) => Promise<void>;
  children?: ReactNode;
  className?: string;
  submitLabel?: string;
  /** Si false, le bouton Enregistrer n’est pas injecté (vous en mettez un dans children). */
  withSubmit?: boolean;
  submitVariant?: "primary" | "secondary" | "ghost" | "danger";
};

/**
 * Formulaire Paramètres avec feedback immédiat (pending / succès / erreur)
 * et refresh après sauvegarde.
 */
export function SettingsForm({
  action,
  children,
  className,
  submitLabel = "Enregistrer",
  withSubmit = true,
  submitVariant = "secondary",
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  return (
    <form
      className={className}
      action={(fd) => {
        setError(null);
        setOk(false);
        start(async () => {
          try {
            await action(fd);
            setOk(true);
            router.refresh();
            setTimeout(() => setOk(false), 2500);
          } catch (e) {
            const msg =
              e instanceof Error ? e.message : "Échec de l’enregistrement";
            // Next.js redirect() throws ; ignore
            if (
              typeof msg === "string" &&
              (msg.includes("NEXT_REDIRECT") || msg.includes("NEXT_HTTP_ERROR"))
            ) {
              router.refresh();
              setOk(true);
              return;
            }
            setError(msg);
          }
        });
      }}
    >
      {children}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="text-sm font-medium text-teal-800">Enregistré ✓</p>
      ) : null}
      {withSubmit ? (
        <Button type="submit" variant={submitVariant} disabled={pending}>
          {pending ? "Enregistrement…" : submitLabel}
        </Button>
      ) : null}
    </form>
  );
}
