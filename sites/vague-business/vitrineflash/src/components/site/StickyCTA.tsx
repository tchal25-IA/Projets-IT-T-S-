import { Link, useRouterState } from "@tanstack/react-router";

export function StickyCTA() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/brief")) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 md:hidden">
      <div className="pointer-events-auto border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link
          to="/brief"
          className="btn-amber flex w-full items-center justify-center rounded-md px-4 py-3 text-sm"
        >
          Demander ma refonte 48h
        </Link>
      </div>
    </div>
  );
}
