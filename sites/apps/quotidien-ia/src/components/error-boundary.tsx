import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-md py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-destructive">Erreur inattendue</p>
          <h1 className="mt-2 text-2xl font-bold">Quelque chose s'est mal passé</h1>
          <p className="mt-3 text-sm text-muted-foreground">{this.state.error.message}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => this.setState({ error: null })}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Réessayer
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Accueil
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
