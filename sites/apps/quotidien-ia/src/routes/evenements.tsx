import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays, Plus, Trash2, Pencil, X, Paperclip, Download,
  ChevronLeft, ChevronRight, MapPin, Target, Sparkles, Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { LS_KEYS, readLS, writeLS } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { callAgent } from "@/lib/api";
import { useToast } from "@/components/toast";

export const Route = createFileRoute("/evenements")({
  head: () => ({
    meta: [
      { title: "Événements & calendrier — Quotidien IA" },
      {
        name: "description",
        content:
          "Calendrier fluide pour organiser réunions, conférences et rendez-vous. Notes, pièces jointes et édition en un clic.",
      },
      { property: "og:title", content: "Événements & calendrier — Quotidien IA" },
      {
        property: "og:description",
        content: "Calendrier pratique, notes et pièces jointes pour vos événements du quotidien.",
      },
    ],
  }),
  component: EventsPage,
});

type Attachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string; // base64
};

type EventItem = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DDTHH:mm
  location: string;
  type: string;
  goal: string;
  notes?: string;
  attachments?: Attachment[];
};

const TYPES = ["Réunion", "Conférence", "Formation", "Rendez-vous", "Anniversaire", "Personnel", "Autre"];
const TYPE_COLOR: Record<string, string> = {
  Réunion: "#3b82f6",
  Conférence: "#a855f7",
  Formation: "#10b981",
  "Rendez-vous": "#f59e0b",
  Anniversaire: "#ec4899",
  Personnel: "#14b8a6",
  Autre: "#64748b",
};

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MAX_FILE_MB = 3;

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string>(() => ymd(new Date()));
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setEvents(readLS<EventItem[]>(LS_KEYS.events, []));
  }, []);

  function persist(next: EventItem[]) {
    setEvents(next);
    writeLS(LS_KEYS.events, next);
  }

  function upsert(item: EventItem) {
    const exists = events.some((e) => e.id === item.id);
    persist(exists ? events.map((e) => (e.id === item.id ? item : e)) : [item, ...events]);
  }

  function remove(id: string) {
    if (!window.confirm("Supprimer cet événement ?")) return;
    persist(events.filter((e) => e.id !== id));
  }

  function openNew(forDay?: string) {
    const d = forDay ?? selectedDay;
    setEditing({
      id: crypto.randomUUID(),
      title: "",
      date: `${d}T09:00`,
      location: "",
      type: "Réunion",
      goal: "",
      notes: "",
      attachments: [],
    });
    setShowForm(true);
  }

  function openEdit(item: EventItem) {
    setEditing(item);
    setShowForm(true);
  }

  // Calendar grid (Mon-first)
  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < startOffset; i++) {
      const d = new Date(cursor.getFullYear(), cursor.getMonth(), -startOffset + i + 1);
      cells.push({ date: d, inMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), i), inMonth: true });
    }
    while (cells.length % 7 !== 0 || cells.length < 42) {
      const last = cells[cells.length - 1].date;
      cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
      if (cells.length >= 42) break;
    }
    return cells;
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    events.forEach((e) => {
      const k = (e.date || "").slice(0, 10);
      if (!k) return;
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    });
    map.forEach((arr) => arr.sort((a, b) => a.date.localeCompare(b.date)));
    return map;
  }, [events]);

  const todayKey = ymd(new Date());
  const dayEvents = eventsByDay.get(selectedDay) ?? [];
  const upcoming = useMemo(
    () =>
      [...events]
        .filter((e) => e.date && e.date >= new Date().toISOString().slice(0, 16))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5),
    [events],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarDays}
        eyebrow="Module"
        title="Événements & calendrier"
        description="Un calendrier fluide pour vos rendez-vous : notes, pièces jointes, édition simple. Tout reste local."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Calendrier */}
        <div className="rounded-2xl border bg-card shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                className="rounded-md border p-1.5 hover:bg-muted"
                aria-label="Mois précédent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="font-display text-lg font-bold capitalize">
                {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
              </h2>
              <button
                type="button"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                className="rounded-md border p-1.5 hover:bg-muted"
                aria-label="Mois suivant"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                  setSelectedDay(ymd(d));
                }}
                className="ml-2 rounded-md border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
              >
                Aujourd'hui
              </button>
            </div>
            <button
              type="button"
              onClick={() => openNew()}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-card"
            >
              <Plus className="h-3.5 w-3.5" /> Nouvel événement
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px border-b bg-muted text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {DAYS.map((d) => (
              <div key={d} className="bg-card px-1 py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-border">
            {grid.map((c, i) => {
              const key = ymd(c.date);
              const evs = eventsByDay.get(key) ?? [];
              const isToday = key === todayKey;
              const isSelected = key === selectedDay;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedDay(key)}
                  onDoubleClick={() => openNew(key)}
                  className={cn(
                    "flex min-h-[88px] flex-col items-stretch gap-1 bg-card p-1.5 text-left transition-colors hover:bg-muted/50",
                    !c.inMonth && "bg-muted/30 text-muted-foreground/50",
                    isSelected && "ring-2 ring-primary ring-inset",
                  )}
                >
                  <div
                    className={cn(
                      "self-start rounded-full px-1.5 text-[11px] font-semibold",
                      isToday && "bg-primary text-primary-foreground",
                    )}
                  >
                    {c.date.getDate()}
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                    {evs.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className="truncate rounded px-1 py-0.5 text-left text-[10px] font-medium text-white"
                        style={{ backgroundColor: TYPE_COLOR[e.type] ?? "#64748b" }}
                        title={e.title}
                      >
                        {e.date.slice(11, 16)} {e.title || "(sans titre)"}
                      </span>
                    ))}
                    {evs.length > 3 && (
                      <span className="text-[9px] text-muted-foreground">+{evs.length - 3} autre(s)</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Side panel: selected day + upcoming */}
        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Jour sélectionné
                </div>
                <div className="font-display text-base font-bold">
                  {new Date(selectedDay).toLocaleDateString("fr-FR", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => openNew(selectedDay)}
                className="rounded-md border p-1.5 hover:bg-muted"
                aria-label="Ajouter"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {dayEvents.length === 0 ? (
              <p className="rounded-md border border-dashed bg-muted/30 p-3 text-center text-xs text-muted-foreground">
                Aucun événement ce jour. Double-cliquez sur une case du calendrier pour en créer un.
              </p>
            ) : (
              <ul className="space-y-2">
                {dayEvents.map((e) => (
                  <EventRow key={e.id} item={e} onEdit={() => openEdit(e)} onDelete={() => remove(e.id)} />
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-card">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              À venir
            </div>
            {upcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground">Rien de prévu pour le moment.</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => {
                        const k = e.date.slice(0, 10);
                        setSelectedDay(k);
                        const [y, m] = k.split("-").map(Number);
                        setCursor(new Date(y, m - 1, 1));
                      }}
                      className="w-full rounded-md border bg-background px-2.5 py-2 text-left text-xs hover:bg-muted"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TYPE_COLOR[e.type] ?? "#64748b" }} />
                        <span className="font-semibold">{e.title || "(sans titre)"}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {new Date(e.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                        {e.location && ` · ${e.location}`}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {showForm && editing && (
        <EventForm
          item={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={(it) => { upsert(it); setShowForm(false); setEditing(null); setSelectedDay(it.date.slice(0, 10)); }}
        />
      )}
    </div>
  );
}

function EventRow({ item, onEdit, onDelete }: { item: EventItem; onEdit: () => void; onDelete: () => void }) {
  const color = TYPE_COLOR[item.type] ?? "#64748b";
  return (
    <li className="group rounded-lg border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span className="truncate text-sm font-semibold">{item.title || "(sans titre)"}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {item.date.slice(11, 16)} · {item.type}
            {item.location && (
              <span className="inline-flex items-center gap-0.5"> · <MapPin className="h-2.5 w-2.5" />{item.location}</span>
            )}
          </div>
          {item.goal && (
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Target className="h-3 w-3" /> {item.goal}
            </div>
          )}
          {item.attachments && item.attachments.length > 0 && (
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Paperclip className="h-3 w-3" /> {item.attachments.length} PJ
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-1 opacity-70 group-hover:opacity-100">
          <button type="button" onClick={onEdit} className="rounded-md p-1 hover:bg-muted" aria-label="Modifier">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onDelete} className="rounded-md p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30" aria-label="Supprimer">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </li>
  );
}

function EventForm({
  item, onClose, onSave,
}: {
  item: EventItem;
  onClose: () => void;
  onSave: (it: EventItem) => void;
}) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<EventItem>(item);
  const fileRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const set = <K extends keyof EventItem>(k: K, v: EventItem[K]) => setDraft((d) => ({ ...d, [k]: v }));

  async function generateChecklist() {
    if (!draft.title.trim()) { setErr("Renseignez au moins le titre avant de générer la checklist."); return; }
    setAiLoading(true);
    try {
      const ctx = [
        `Titre : ${draft.title}`,
        `Type : ${draft.type}`,
        draft.date ? `Date : ${new Date(draft.date).toLocaleString("fr-FR")}` : null,
        draft.location ? `Lieu : ${draft.location}` : null,
        draft.goal ? `Objectif : ${draft.goal}` : null,
      ].filter(Boolean).join("\n");
      const text = await callAgent("W2", ctx);
      set("notes", text);
      toast("Checklist générée et insérée dans les notes.", "success");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setErr(null);
    const next: Attachment[] = [...(draft.attachments ?? [])];
    for (const f of Array.from(files)) {
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        setErr(`"${f.name}" dépasse ${MAX_FILE_MB} Mo`);
        continue;
      }
      const dataUrl: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(f);
      });
      next.push({ id: crypto.randomUUID(), name: f.name, type: f.type, size: f.size, dataUrl });
    }
    set("attachments", next);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeAttachment(id: string) {
    set("attachments", (draft.attachments ?? []).filter((a) => a.id !== id));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) { setErr("Le titre est requis"); return; }
    if (!draft.date) { setErr("La date est requise"); return; }
    onSave(draft);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-t-2xl bg-card shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="font-display text-base font-bold">
            {item.title ? "Modifier l'événement" : "Nouvel événement"}
          </h3>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-muted" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="max-h-[80vh] space-y-3 overflow-y-auto p-5">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Titre *</label>
            <input
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date / heure *</label>
              <input
                type="datetime-local"
                value={draft.date}
                onChange={(e) => set("date", e.target.value)}
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</label>
              <select
                value={draft.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Lieu</label>
              <input
                value={draft.location}
                onChange={(e) => set("location", e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Objectif</label>
              <input
                value={draft.goal}
                onChange={(e) => set("goal", e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</label>
              <button
                type="button"
                onClick={generateChecklist}
                disabled={aiLoading}
                className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2.5 py-1 text-[11px] font-medium hover:bg-muted disabled:opacity-50"
              >
                {aiLoading
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <Sparkles className="h-3 w-3 text-primary" />}
                Générer checklist IA
              </button>
            </div>
            <textarea
              value={draft.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              rows={6}
              className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Préparation, ordre du jour, points à aborder… ou cliquez sur « Générer checklist IA »"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Pièces jointes (max {MAX_FILE_MB} Mo / fichier)
            </label>
            <input
              ref={fileRef}
              type="file"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
            {draft.attachments && draft.attachments.length > 0 && (
              <ul className="mt-2 space-y-1">
                {draft.attachments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 rounded-md border bg-background px-2.5 py-1.5 text-xs">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{a.name}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        ({Math.round(a.size / 1024)} Ko)
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <a
                        href={a.dataUrl}
                        download={a.name}
                        className="rounded-md p-1 hover:bg-muted"
                        aria-label={`Télécharger ${a.name}`}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.id)}
                        className="rounded-md p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                        aria-label={`Supprimer ${a.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {err && <p className="text-xs text-rose-600">{err}</p>}
          <div className="flex justify-end gap-2 border-t pt-3">
            <button type="button" onClick={onClose} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
              Annuler
            </button>
            <button type="submit" className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-card">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
