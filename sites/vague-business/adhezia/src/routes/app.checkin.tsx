import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { useStore, store } from "@/lib/adhezia-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, QrCode, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/checkin")({
  head: () => ({
    meta: [
      { title: "Check-in — Adhezia" },
      { name: "description", content: "Pointez la présence de vos membres avec un simple code ou QR code." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckinPage,
});

function CheckinPage() {
  const { members, attendance } = useStore((s) => ({ members: s.members, attendance: s.attendance }));
  const [code, setCode] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = members.find((m) => m.id === selectedId) ?? members[0];
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && selected) {
      QRCode.toCanvas(canvasRef.current, `ADHEZIA:${selected.code}`, { width: 220, margin: 1, color: { dark: "#1a2733", light: "#00000000" } }).catch(() => {});
    }
  }, [selected]);

  const presentIds = useMemo(() => new Set(attendance.map((a) => a.memberId)), [attendance]);

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return;
    const m = members.find((x) => x.code === c);
    if (!m) return toast.error("Code inconnu");
    if (presentIds.has(m.id)) return toast.info(`${m.name} est déjà pointé·e`);
    store.markPresent(m.id);
    toast.success(`${m.name} — présent·e ✓`);
    setCode("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl">Check-in</h1>
          <p className="text-sm text-muted-foreground mt-1">Pointez vos membres à l'entrée d'un entraînement ou d'un événement.</p>
        </div>
        {attendance.length > 0 && (
          <Button variant="outline" onClick={() => { store.clearAttendance(); toast.success("Liste vidée"); }}>
            <RotateCcw className="mr-2 size-4" /> Vider la liste
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Search className="size-4" /> Pointer par code</h2>
          <form onSubmit={submitCode} className="flex gap-2">
            <Input placeholder="Ex. AB12CD" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={12} className="uppercase tracking-widest" />
            <Button type="submit"><Check className="mr-1 size-4" /> Valider</Button>
          </form>
          <p className="text-xs text-muted-foreground mt-3">Chaque membre a un code unique visible dans sa fiche ou via son QR.</p>

          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Présents ({attendance.length})</h3>
            {attendance.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun pointage pour l'instant.</p>
            ) : (
              <ul className="space-y-2">
                {attendance.slice().reverse().map((a, i) => {
                  const m = members.find((x) => x.id === a.memberId);
                  if (!m) return null;
                  return (
                    <li key={i} className="flex items-center justify-between text-sm rounded-md bg-secondary/60 px-3 py-2">
                      <span>{m.name}</span>
                      <span className="text-xs text-muted-foreground">{new Date(a.at).toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" })}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><QrCode className="size-4" /> QR code du membre</h2>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-center">
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={
                    "w-full text-left flex items-center justify-between rounded-md px-3 py-2 text-sm transition " +
                    (selected?.id === m.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary")
                  }
                >
                  <span className="truncate">{m.name}</span>
                  {presentIds.has(m.id) && <Badge variant="secondary" className="ml-2 bg-[color:color-mix(in_oklab,var(--success)_15%,transparent)] text-[color:var(--success)] border-0">✓</Badge>}
                </button>
              ))}
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary/40">
              <canvas ref={canvasRef} />
              <p className="font-mono text-lg tracking-widest">{selected?.code}</p>
              <p className="text-xs text-muted-foreground">{selected?.name}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
