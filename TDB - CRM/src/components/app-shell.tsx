"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn, ROLE_LABELS } from "@/lib/utils";
import type { Role } from "@/generated/prisma/client";
import { Button } from "@/components/ui";
import { GlobalSearch } from "@/components/global-search";

type NavItem = { href: string; label: string };

export function AppShell({
  children,
  nav,
  user,
  unreadCount,
}: {
  children: React.ReactNode;
  nav: NavItem[];
  user: { fullName: string; email: string; role: Role };
  unreadCount: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f6f5] text-stone-900">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 border-r border-stone-200 bg-[#0f2f2c] text-stone-100 transition-transform lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-16 items-center justify-between px-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-teal-200/70">T&S</p>
              <p className="text-lg font-semibold">CRM</p>
            </div>
            <button className="lg:hidden" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <nav className="space-y-1 px-3 py-4">
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm transition",
                    active
                      ? "bg-teal-700/40 text-white"
                      : "text-teal-50/80 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
            <p className="text-sm font-medium">{user.fullName}</p>
            <p className="text-xs text-teal-100/60">{ROLE_LABELS[user.role]}</p>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-3 inline-flex items-center gap-2 text-xs text-teal-100/80 hover:text-white"
            >
              <LogOut size={14} /> Déconnexion
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-stone-200 bg-white/90 px-4 backdrop-blur lg:px-8">
            <button className="lg:hidden" onClick={() => setOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="ml-4 flex flex-1 justify-center px-2 sm:px-6">
              <GlobalSearch />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <Link
                href="/notifications"
                className="relative rounded-md p-2 text-stone-600 hover:bg-stone-100"
              >
                <Bell size={18} />
                {unreadCount > 0 ? (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-700 px-1 text-[10px] text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </Link>
              <Button
                variant="secondary"
                className="hidden sm:inline-flex"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Quitter
              </Button>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
