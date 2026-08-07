"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/** Flash toast via ?saved=1 or ?error=… dans l’URL (actions serveur). */
export function FlashToast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [tone, setTone] = useState<"ok" | "err">("ok");

  useEffect(() => {
    const saved = params.get("saved");
    const error = params.get("error");
    if (saved) {
      setTone("ok");
      setMsg("Enregistré");
    } else if (error) {
      setTone("err");
      setMsg(decodeURIComponent(error));
    } else {
      setMsg(null);
      return;
    }
    const t = setTimeout(() => {
      setMsg(null);
      const next = new URLSearchParams(params.toString());
      next.delete("saved");
      next.delete("error");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 2800);
    return () => clearTimeout(t);
  }, [params, pathname, router]);

  if (!msg) return null;

  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-6 right-6 z-50 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg",
        tone === "ok" ? "bg-teal-800" : "bg-red-700"
      )}
    >
      {msg}
    </div>
  );
}
