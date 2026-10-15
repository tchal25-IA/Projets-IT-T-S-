"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full bg-red-50 p-3">
              <AlertTriangle className="text-red-700" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-stone-900">
                Erreur de l&apos;application
              </h1>
              <p className="text-sm text-stone-500">
                Un problème est survenu lors du chargement
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-md bg-stone-50 p-4">
            <p className="text-sm text-stone-700">
              Cette erreur a été enregistrée. Vous pouvez essayer de recharger la
              page. Si le problème persiste, contactez le support.
            </p>
          </div>

          {process.env.NODE_ENV === "development" && (
            <details className="mb-6 rounded-md bg-red-50 p-4">
              <summary className="cursor-pointer text-sm font-medium text-red-900">
                Détails techniques (dev uniquement)
              </summary>
              <div className="mt-3">
                <p className="text-xs font-medium text-red-800">Message :</p>
                <code className="mt-1 block rounded bg-red-100 p-2 text-xs text-red-900">
                  {error.message}
                </code>
                {error.digest && (
                  <p className="mt-2 text-xs text-red-700">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            </details>
          )}

          <button
            onClick={reset}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-900"
          >
            <RefreshCw size={16} />
            Réessayer
          </button>
        </div>
      </div>
    </div>
  );
}
