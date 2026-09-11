"use client";

import { Component, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

/**
 * Error Boundary pour capturer les erreurs React en production
 * Affiche une page d'erreur française cohérente avec le design de l'app
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    // Log error details for debugging (will appear in Vercel logs)
    console.error("Error Boundary caught error:", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      errorInfo: errorInfo.componentStack || null,
    });

    // TODO: Send to error monitoring service (Sentry, etc.)
    // Example:
    // if (typeof window !== "undefined") {
    //   Sentry.captureException(error, { contexts: { react: errorInfo } });
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

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
                    Une erreur est survenue
                  </h1>
                  <p className="text-sm text-stone-500">
                    L&apos;application a rencontré un problème
                  </p>
                </div>
              </div>

              <div className="mb-6 rounded-md bg-stone-50 p-4">
                <p className="text-sm text-stone-700">
                  Nous avons enregistré cette erreur et travaillons à la résoudre.
                  Vous pouvez essayer de recharger la page ou retourner à l&apos;accueil.
                </p>
              </div>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mb-6 rounded-md bg-red-50 p-4">
                  <summary className="cursor-pointer text-sm font-medium text-red-900">
                    Détails techniques (dev uniquement)
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-red-800">Message :</p>
                      <code className="mt-1 block rounded bg-red-100 p-2 text-xs text-red-900">
                        {this.state.error.message}
                      </code>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <p className="text-xs font-medium text-red-800">Stack :</p>
                        <code className="mt-1 block max-h-40 overflow-auto rounded bg-red-100 p-2 text-xs text-red-900">
                          {this.state.error.stack}
                        </code>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={this.handleReset}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-teal-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-900"
                >
                  <RefreshCw size={16} />
                  Réessayer
                </button>
                <Link
                  href="/dashboard"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
                >
                  <Home size={16} />
                  Accueil
                </Link>
              </div>

              <p className="mt-4 text-center text-xs text-stone-500">
                Si le problème persiste, contactez le support technique.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
