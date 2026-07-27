import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="font-brand text-2xl font-black tracking-tight">
            VitrineFlash
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-sm font-medium hover:text-accent" activeOptions={{ exact: true }} activeProps={{ className: "text-accent" }}>Accueil</Link>
          <Link to="/tarifs" className="text-sm font-medium hover:text-accent" activeProps={{ className: "text-accent" }}>Tarifs</Link>
          <a href="/#process" className="text-sm font-medium hover:text-accent">Comment ça marche</a>
          <a href="/#faq" className="text-sm font-medium hover:text-accent">FAQ</a>
        </nav>

        <div className="hidden md:block">
          <Link to="/brief" className="btn-amber rounded-md px-4 py-2 text-sm">
            Demander ma refonte
          </Link>
        </div>

        <button
          className="md:hidden rounded-md p-2 hover:bg-muted"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            <Link to="/" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-sm hover:bg-muted">Accueil</Link>
            <Link to="/tarifs" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-sm hover:bg-muted">Tarifs</Link>
            <a href="/#process" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-sm hover:bg-muted">Comment ça marche</a>
            <a href="/#faq" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-sm hover:bg-muted">FAQ</a>
            <Link to="/brief" onClick={() => setOpen(false)} className="mt-2 btn-amber rounded-md px-4 py-2 text-center text-sm">
              Demander ma refonte
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
