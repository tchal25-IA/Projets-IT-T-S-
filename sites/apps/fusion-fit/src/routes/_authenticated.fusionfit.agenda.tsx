import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, Check, X, Repeat, Ban,
  Users, MapPin, Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { notify, getMyPrenom } from "@/hooks/use-notifications";
import { useMyAbonnement, useTrainingSlots } from "@/hooks/use-creneaux";
import { useMyProgram } from "@/hooks/use-program";
import { canAccessFeature, CRENEAUX_FREE_MONTHLY_LIMIT } from "@/lib/plan-gates";
import { PageSkeleton } from "@/components/ui-skeleton";
import { JOURS } from "@/components/escouade/types";
import {
  useCoachEvents,
  useCreateCoachEvent,
  useMyEventRegistrations,
  useEventRegistrationCounts,
  useRespondEvent,
} from "@/hooks/use-events";
import { useEscouadeData } from "@/hooks/use-escouade";

export const Route = createFileRoute("/_authenticated/fusionfit/agenda")({
  component: AgendaPage,
});

type Slot = {
  id: string;
  abonne_id: string;
  coach_id: string;
  date_slot: string;
  duree_min: number;
  lieu: string | null;
  note: string | null;
  status: string;
  proposed_by: string;
};
type Partner = { user_id: string; prenom: string };

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function AgendaPage() {
  const { user, role } = useAuth();
  const { data: rqSlots, isLoading: slotsLoading, refetch: refetchSlots } = useTrainingSlots();
  const { data: abo } = useMyAbonnement();
  const { data: program } = useMyProgram();
  const { data: escouade } = useEscouadeData();

  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date()));
  const [selected, setSelected] = useState(() => new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [counterFor, setCounterFor] = useState<string | null>(null);
  const [counterForm, setCounterForm] = useState({ date: "", heure: "18:00" });
  const [form, setForm] = useState({
    partnerId: "", date: "", heure: "18:00", duree: 60, lieu: "", note: "",
  });
  const [eventForm, setEventForm] = useState({
    titre: "", objectif: "", lieu: "", date: "", heure: "18:00",
    capacity: 10, audience: "libre" as "escouade" | "libre", squad_id: "",
  });

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekAnchor, i)), [weekAnchor]);
  const rangeStart = weekDays[0];
  const rangeEnd = addDays(weekDays[6], 1);

  const { data: events = [], refetch: refetchEvents } = useCoachEvents(rangeStart, rangeEnd);
  const eventIds = events.map((e) => e.id);
  const { data: myRegs = [] } = useMyEventRegistrations(eventIds);
  const { data: regCounts = {} } = useEventRegistrationCounts(eventIds);
  const { mutateAsync: createEvent, isPending: creatingEvent } = useCreateCoachEvent();
  const { mutateAsync: respondEvent, isPending: responding } = useRespondEvent();

  const regByEvent = useMemo(() => {
    const m: Record<string, string> = {};
    for (const r of myRegs) m[r.event_id] = r.status;
    return m;
  }, [myRegs]);

  useEffect(() => {
    if (rqSlots) setSlots(rqSlots as Slot[]);
  }, [rqSlots]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (role === "coach") {
        const { data: a } = await supabase.from("coach_assignments").select("abonne_id").eq("coach_id", user.id);
        const ids = a?.map((x) => x.abonne_id) ?? [];
        if (ids.length) {
          const { data: p } = await supabase.from("profiles").select("user_id, prenom").in("user_id", ids);
          setPartners((p as Partner[]) ?? []);
        }
      } else {
        const { data: a } = await supabase.from("coach_assignments").select("coach_id").eq("abonne_id", user.id);
        const ids = a?.map((x) => x.coach_id) ?? [];
        if (ids.length) {
          const { data: p } = await supabase.from("profiles").select("user_id, prenom").in("user_id", ids);
          setPartners((p as Partner[]) ?? []);
        }
      }
      setLoading(false);
    })();
  }, [user, role]);

  const selectedJour = JOURS[(selected.getDay() + 6) % 7];
  const programBlocs = (program?.blocs ?? []).filter((b) =>
    b.jour.toLowerCase().startsWith(selectedJour.slice(0, 3).toLowerCase()) || b.jour === selectedJour,
  );
  const daySlots = slots.filter((s) => sameDay(new Date(s.date_slot), selected));
  const dayEvents = events.filter((e) => sameDay(new Date(e.starts_at), selected));

  function dotsForDay(d: Date) {
    const hasSlot = slots.some((s) => sameDay(new Date(s.date_slot), d) && s.status !== "refuse" && s.status !== "annule");
    const hasEvent = events.some((e) => sameDay(new Date(e.starts_at), d));
    const jour = JOURS[(d.getDay() + 6) % 7];
    const hasProg = (program?.blocs ?? []).some(
      (b) => b.jour === jour || b.jour.toLowerCase().startsWith(jour.slice(0, 3).toLowerCase()),
    );
    return { hasSlot, hasEvent, hasProg };
  }

  async function proposer() {
    if (!user || !form.partnerId || !form.date) {
      alert("Renseigne partenaire et date.");
      return;
    }
    const unlimited = canAccessFeature("creneaux_illimites", abo?.plan, abo?.statut);
    if (!unlimited && role === "abonne") {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const count = slots.filter(
        (s) => s.abonne_id === user.id && new Date(s.date_slot) >= monthStart && s.status !== "refuse",
      ).length;
      if (count >= CRENEAUX_FREE_MONTHLY_LIMIT) {
        alert(`Limite de ${CRENEAUX_FREE_MONTHLY_LIMIT} créneaux/mois. Passe en Initiative pour l'illimité.`);
        return;
      }
    }
    const dt = new Date(`${form.date}T${form.heure}:00`);
    const payload = {
      coach_id: role === "coach" ? user.id : form.partnerId,
      abonne_id: role === "coach" ? form.partnerId : user.id,
      date_slot: dt.toISOString(),
      duree_min: form.duree,
      lieu: form.lieu,
      note: form.note,
      proposed_by: user.id,
      status: "propose",
    };
    const { error } = await supabase.from("training_slots").insert(payload);
    if (error) { alert(error.message); return; }
    const quand = dt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
    const prenomProposant = await getMyPrenom(user.id);
    await notify(payload.abonne_id === user.id ? payload.coach_id : payload.abonne_id, "creneau",
      `${prenomProposant} te propose un créneau`,
      `Séance le ${quand}${form.lieu ? ` · ${form.lieu}` : ""}.`, "/fusionfit/agenda");
    setShowSlotForm(false);
    setForm({ ...form, date: "", lieu: "", note: "" });
    await refetchSlots();
  }

  async function maj(id: string, status: string) {
    await supabase.from("training_slots").update({ status }).eq("id", id);
    const slot = slots.find((s) => s.id === id);
    if (slot && slot.proposed_by !== user?.id && user) {
      const label = status === "valide" ? "accepté" : status === "refuse" ? "refusé" : "contre-proposé";
      const prenom = await getMyPrenom(user.id);
      const quand = new Date(slot.date_slot).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
      await notify(slot.proposed_by, "creneau", `${prenom} a ${label} le créneau`,
        `Séance du ${quand}${slot.lieu ? ` · ${slot.lieu}` : ""}.`, "/fusionfit/agenda");
    }
    await refetchSlots();
  }

  async function envoyerContre(slot: Slot) {
    if (!user || !counterForm.date) { alert("Choisis une date."); return; }
    const dt = new Date(`${counterForm.date}T${counterForm.heure}:00`);
    const { error } = await supabase.from("training_slots").update({
      date_slot: dt.toISOString(), proposed_by: user.id, status: "propose",
    }).eq("id", slot.id);
    if (error) { alert(error.message); return; }
    const dest = slot.proposed_by !== user.id ? slot.proposed_by
      : (user.id === slot.coach_id ? slot.abonne_id : slot.coach_id);
    const prenom = await getMyPrenom(user.id);
    const quand = dt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
    await notify(dest, "creneau", `${prenom} propose une autre date`,
      `Nouvelle proposition : le ${quand}.`, "/fusionfit/agenda");
    setCounterFor(null);
    setCounterForm({ date: "", heure: "18:00" });
    await refetchSlots();
  }

  async function demanderAnnulation(slot: Slot) {
    if (!user) return;
    if (!confirm("Demander l'annulation de ce créneau ?")) return;
    const dt = new Date(slot.date_slot);
    const quand = dt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const dest = user.id === slot.coach_id ? slot.abonne_id : slot.coach_id;
    await supabase.from("training_slots").update({ status: "annulation_demandee" }).eq("id", slot.id);
    const prenom = await getMyPrenom(user.id);
    await notify(dest, "creneau", `${prenom} demande une annulation`,
      `Créneau du ${quand}${slot.lieu ? ` · ${slot.lieu}` : ""}.`,
      `/fusionfit/messagerie?with=${user.id}`);
    await refetchSlots();
  }

  async function submitEvent() {
    if (!eventForm.titre.trim() || !eventForm.date) {
      alert("Titre et date obligatoires.");
      return;
    }
    try {
      await createEvent({
        titre: eventForm.titre.trim(),
        objectif: eventForm.objectif.trim() || undefined,
        lieu: eventForm.lieu.trim() || undefined,
        starts_at: new Date(`${eventForm.date}T${eventForm.heure}:00`).toISOString(),
        capacity: eventForm.capacity,
        audience: eventForm.audience,
        squad_id: eventForm.audience === "escouade" ? (eventForm.squad_id || null) : null,
      });
      setShowEventForm(false);
      setEventForm({
        titre: "", objectif: "", lieu: "", date: "", heure: "18:00",
        capacity: 10, audience: "libre", squad_id: "",
      });
      await refetchEvents();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  }

  const statusInfo: Record<string, { label: string; color: string }> = {
    propose: { label: "En attente", color: "var(--ff-amber)" },
    valide: { label: "Validé", color: "var(--ff-green)" },
    refuse: { label: "Refusé", color: "var(--ff-text-muted)" },
    contre_propose: { label: "Contre-proposé", color: "var(--ff-cyan)" },
    annulation_demandee: { label: "Annulation demandée", color: "var(--ff-amber)" },
    annule: { label: "Annulé", color: "var(--ff-text-muted)" },
  };

  const today = new Date();

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--ff-text-muted)" }}>
            {role === "coach" ? "Coach" : "Agent"} · Agenda
          </p>
          <h1 className="text-2xl font-bold mt-1">Agenda</h1>
          <p className="text-xs mt-1" style={{ color: "var(--ff-text-muted)" }}>
            Programme · créneaux 1:1 · événements groupe
          </p>
        </div>
        {role === "coach" && (
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => { setShowSlotForm((s) => !s); setShowEventForm(false); }}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border text-xs"
              style={{ borderColor: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 12%)", color: "var(--ff-cyan)" }}
            >
              <Plus className="h-3.5 w-3.5" /> Créneau
            </button>
            <button
              onClick={() => {
                setShowEventForm((s) => !s);
                setShowSlotForm(false);
                setEventForm((f) => ({ ...f, date: dayKey(selected) }));
              }}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border text-xs"
              style={{ borderColor: "var(--ff-amber)", background: "oklch(0.78 0.18 55 / 12%)", color: "var(--ff-amber)" }}
            >
              <Users className="h-3.5 w-3.5" /> Événement
            </button>
          </div>
        )}
      </header>

      {/* Semaine */}
      <section
        className="rounded-2xl border p-3 space-y-3"
        style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => { const n = addDays(weekAnchor, -7); setWeekAnchor(n); }}
            className="p-1.5 rounded-lg border"
            style={{ borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}
            aria-label="Semaine précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--ff-cyan)" }}>
            <CalendarDays className="h-3.5 w-3.5" />
            {weekDays[0].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            {" – "}
            {weekDays[6].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </p>
          <button
            type="button"
            onClick={() => { const n = addDays(weekAnchor, 7); setWeekAnchor(n); }}
            className="p-1.5 rounded-lg border"
            style={{ borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}
            aria-label="Semaine suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d) => {
            const isSel = sameDay(d, selected);
            const isToday = sameDay(d, today);
            const dots = dotsForDay(d);
            return (
              <button
                key={dayKey(d)}
                type="button"
                onClick={() => setSelected(d)}
                className="rounded-xl border py-2 px-0.5 text-center transition"
                style={{
                  borderColor: isSel ? "var(--ff-cyan)" : "var(--ff-border)",
                  background: isSel ? "oklch(0.78 0.16 198 / 15%)" : "var(--ff-surface-2)",
                  boxShadow: isToday && !isSel ? "inset 0 0 0 1px var(--ff-amber)" : undefined,
                }}
              >
                <p className="text-[9px] font-mono uppercase" style={{ color: "var(--ff-text-muted)" }}>
                  {JOURS[(d.getDay() + 6) % 7].slice(0, 3)}
                </p>
                <p className="text-sm font-bold tabular-nums" style={{ color: isSel ? "var(--ff-cyan)" : "var(--ff-text)" }}>
                  {d.getDate()}
                </p>
                <div className="flex justify-center gap-0.5 mt-1 min-h-[6px]">
                  {dots.hasProg && <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--ff-cyan)" }} />}
                  {dots.hasSlot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--ff-green)" }} />}
                  {dots.hasEvent && <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--ff-amber)" }} />}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 text-[9px] font-mono uppercase" style={{ color: "var(--ff-text-muted)" }}>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--ff-cyan)" }} /> Programme</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--ff-green)" }} /> Créneau</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--ff-amber)" }} /> Événement</span>
        </div>
      </section>

      {/* Form créneau */}
      {showSlotForm && role === "coach" && (
        <section className="rounded-2xl border p-4 space-y-2" style={{ background: "var(--ff-surface)", borderColor: "var(--ff-cyan)" }}>
          <p className="text-[10px] font-mono uppercase" style={{ color: "var(--ff-cyan)" }}>Proposer un créneau 1:1</p>
          <select value={form.partnerId} onChange={(e) => setForm({ ...form, partnerId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
            style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}>
            <option value="" style={{ background: "var(--ff-bg)" }}>Avec qui…</option>
            {partners.map((p) => (
              <option key={p.user_id} value={p.user_id} style={{ background: "var(--ff-bg)" }}>{p.prenom}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
              style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)", colorScheme: "dark" }} />
            <input type="time" value={form.heure} onChange={(e) => setForm({ ...form, heure: e.target.value })}
              className="px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
              style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)", colorScheme: "dark" }} />
          </div>
          <input placeholder="Lieu" value={form.lieu} onChange={(e) => setForm({ ...form, lieu: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
            style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }} />
          <textarea placeholder="Note" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none resize-y min-h-[3.5rem]"
            style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }} />
          <button onClick={proposer} className="w-full py-2 rounded-lg border text-sm font-bold"
            style={{ borderColor: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 20%)", color: "var(--ff-cyan)" }}>
            Envoyer la proposition
          </button>
        </section>
      )}

      {/* Form événement */}
      {showEventForm && role === "coach" && (
        <section className="rounded-2xl border p-4 space-y-2" style={{ background: "var(--ff-surface)", borderColor: "var(--ff-amber)" }}>
          <p className="text-[10px] font-mono uppercase" style={{ color: "var(--ff-amber)" }}>Créer un événement</p>
          <input placeholder="Thème / titre" value={eventForm.titre}
            onChange={(e) => setEventForm({ ...eventForm, titre: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
            style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }} />
          <textarea placeholder="Objectif" rows={2} value={eventForm.objectif}
            onChange={(e) => setEventForm({ ...eventForm, objectif: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none resize-y min-h-[3.5rem]"
            style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }} />
          <input placeholder="Lieu" value={eventForm.lieu}
            onChange={(e) => setEventForm({ ...eventForm, lieu: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
            style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }} />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
              className="px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
              style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)", colorScheme: "dark" }} />
            <input type="time" value={eventForm.heure} onChange={(e) => setEventForm({ ...eventForm, heure: e.target.value })}
              className="px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
              style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)", colorScheme: "dark" }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" min={1} value={eventForm.capacity}
              onChange={(e) => setEventForm({ ...eventForm, capacity: Math.max(1, Number(e.target.value) || 1) })}
              className="px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
              style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
              placeholder="Places" />
            <select value={eventForm.audience}
              onChange={(e) => setEventForm({ ...eventForm, audience: e.target.value as "escouade" | "libre" })}
              className="px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
              style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}>
              <option value="libre" style={{ background: "var(--ff-bg)" }}>Inscription libre</option>
              <option value="escouade" style={{ background: "var(--ff-bg)" }}>Escouade</option>
            </select>
          </div>
          {eventForm.audience === "escouade" && (
            <select value={eventForm.squad_id}
              onChange={(e) => setEventForm({ ...eventForm, squad_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
              style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}>
              <option value="" style={{ background: "var(--ff-bg)" }}>Choisir l&apos;escouade…</option>
              {(escouade?.squads ?? []).map((s) => (
                <option key={s.id} value={s.id} style={{ background: "var(--ff-bg)" }}>{s.nom}</option>
              ))}
            </select>
          )}
          <button onClick={submitEvent} disabled={creatingEvent}
            className="w-full py-2 rounded-lg border text-sm font-bold"
            style={{ borderColor: "var(--ff-amber)", background: "oklch(0.78 0.18 55 / 20%)", color: "var(--ff-amber)" }}>
            {creatingEvent ? "…" : "Publier l'événement"}
          </button>
        </section>
      )}

      {(loading || slotsLoading) && <PageSkeleton rows={2} />}
      {!canAccessFeature("creneaux_illimites", abo?.plan, abo?.statut) && role === "abonne" && (
        <p className="text-[11px] font-mono" style={{ color: "var(--ff-amber)" }}>
          Plan Découverte · max {CRENEAUX_FREE_MONTHLY_LIMIT} créneaux/mois ·{" "}
          <Link to="/fusionfit/abonnement" style={{ color: "var(--ff-cyan)" }}>Upgrade</Link>
        </p>
      )}

      {/* Détail du jour */}
      <section className="space-y-3">
        <p className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--ff-text-muted)" }}>
          {selected.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>

        {/* Programme du jour */}
        {role !== "coach" && (
          <div className="rounded-2xl border p-3 space-y-2" style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}>
            <p className="text-[10px] font-mono uppercase" style={{ color: "var(--ff-cyan)" }}>Programme hebdo</p>
            {programBlocs.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>Aucun bloc prévu ce jour.</p>
            ) : (
              programBlocs.map((b, i) => (
                <div key={i} className="rounded-lg border p-2" style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}>
                  <p className="text-sm font-semibold">{b.titre || "Bloc"}</p>
                  {b.details && <p className="text-[11px] mt-0.5 whitespace-pre-line" style={{ color: "var(--ff-text-muted)" }}>{b.details}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {/* Événements du jour */}
        {dayEvents.map((ev) => {
          const inscrits = regCounts[ev.id] ?? 0;
          const myStatus = regByEvent[ev.id];
          const full = inscrits >= ev.capacity;
          return (
            <div key={ev.id} className="rounded-2xl border p-3 space-y-2"
              style={{ background: "var(--ff-surface)", borderColor: "var(--ff-amber)" }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-mono uppercase" style={{ color: "var(--ff-amber)" }}>
                    Événement · {ev.audience === "escouade" ? "Escouade" : "Libre"}
                  </p>
                  <p className="font-bold text-sm">{ev.titre}</p>
                </div>
                <span className="text-[10px] font-mono" style={{ color: "var(--ff-text-muted)" }}>
                  {inscrits}/{ev.capacity}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-[11px]" style={{ color: "var(--ff-text-muted)" }}>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(ev.starts_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {ev.lieu && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.lieu}</span>}
              </div>
              {ev.objectif && <p className="text-xs">{ev.objectif}</p>}
              {role !== "coach" && myStatus !== "inscrit" && myStatus !== "refuse" && (
                <div className="flex gap-2 pt-1">
                  <button
                    disabled={responding || full}
                    onClick={() => respondEvent({ eventId: ev.id, status: "inscrit", coachId: ev.coach_id, titre: ev.titre })}
                    className="flex-1 py-1.5 rounded-lg border text-xs font-bold disabled:opacity-50"
                    style={{ borderColor: "var(--ff-green)", color: "var(--ff-green)" }}
                  >
                    <span className="inline-flex items-center gap-1 justify-center w-full"><Check className="h-3.5 w-3.5" /> S&apos;inscrire</span>
                  </button>
                  <button
                    disabled={responding}
                    onClick={() => respondEvent({ eventId: ev.id, status: "refuse", coachId: ev.coach_id, titre: ev.titre })}
                    className="flex-1 py-1.5 rounded-lg border text-xs disabled:opacity-50"
                    style={{ borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}
                  >
                    <span className="inline-flex items-center gap-1 justify-center w-full"><X className="h-3.5 w-3.5" /> Refuser</span>
                  </button>
                </div>
              )}
              {role !== "coach" && myStatus === "inscrit" && (
                <p className="text-[11px] font-semibold" style={{ color: "var(--ff-green)" }}>✓ Tu es inscrit</p>
              )}
              {role !== "coach" && myStatus === "refuse" && (
                <p className="text-[11px]" style={{ color: "var(--ff-text-muted)" }}>Tu as refusé cet événement</p>
              )}
            </div>
          );
        })}

        {/* Créneaux du jour */}
        {daySlots.map((s) => {
          const date = new Date(s.date_slot);
          const isPast = date.getTime() < Date.now();
          const displayInfo = isPast && s.status === "valide"
            ? { label: "Terminé", color: "var(--ff-text-muted)" }
            : (statusInfo[s.status] ?? statusInfo.propose);
          const fromMe = s.proposed_by === user?.id;
          const canRespond = !fromMe && s.status === "propose" && !isPast;
          const canRequestCancel = !isPast && (s.status === "valide" || s.status === "propose");
          const partnerName = partners.find((p) =>
            p.user_id === (role === "coach" ? s.abonne_id : s.coach_id),
          )?.prenom;
          return (
            <div key={s.id} className="rounded-2xl border p-3 space-y-2"
              style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)", opacity: isPast ? 0.75 : 1 }}>
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm">
                  Créneau · {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  {partnerName ? ` · ${partnerName}` : ""}
                </p>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border"
                  style={{ color: displayInfo.color, borderColor: displayInfo.color }}>
                  {displayInfo.label}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>
                {s.duree_min} min {s.lieu ? `· ${s.lieu}` : ""}
              </p>
              {s.note && <p className="text-xs">{s.note}</p>}
              {canRespond && counterFor !== s.id && (
                <div className="flex gap-2 pt-1">
                  <button onClick={() => maj(s.id, "valide")}
                    className="flex-1 py-1.5 rounded-lg border text-xs flex items-center justify-center gap-1"
                    style={{ borderColor: "var(--ff-green)", color: "var(--ff-green)" }}>
                    <Check className="h-3.5 w-3.5" /> Valider
                  </button>
                  <button onClick={() => maj(s.id, "refuse")}
                    className="flex-1 py-1.5 rounded-lg border text-xs flex items-center justify-center gap-1"
                    style={{ borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}>
                    <X className="h-3.5 w-3.5" /> Refuser
                  </button>
                  <button
                    onClick={() => {
                      setCounterFor(s.id);
                      const d = new Date(s.date_slot);
                      setCounterForm({ date: d.toISOString().slice(0, 10), heure: d.toTimeString().slice(0, 5) });
                    }}
                    className="flex-1 py-1.5 rounded-lg border text-xs flex items-center justify-center gap-1"
                    style={{ borderColor: "var(--ff-cyan)", color: "var(--ff-cyan)" }}>
                    <Repeat className="h-3.5 w-3.5" /> Autre
                  </button>
                </div>
              )}
              {canRequestCancel && counterFor !== s.id && (
                <button onClick={() => demanderAnnulation(s)}
                  className="w-full mt-1 py-1.5 rounded-lg border text-xs flex items-center justify-center gap-1"
                  style={{ borderColor: "var(--ff-amber)", color: "var(--ff-amber)" }}>
                  <Ban className="h-3.5 w-3.5" /> Demander l&apos;annulation
                </button>
              )}
              {counterFor === s.id && (
                <div className="pt-2 mt-2 border-t space-y-2" style={{ borderColor: "var(--ff-border)" }}>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={counterForm.date}
                      onChange={(e) => setCounterForm({ ...counterForm, date: e.target.value })}
                      className="px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
                      style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)", colorScheme: "dark" }} />
                    <input type="time" value={counterForm.heure}
                      onChange={(e) => setCounterForm({ ...counterForm, heure: e.target.value })}
                      className="px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
                      style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)", colorScheme: "dark" }} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => envoyerContre(s)} className="flex-1 py-1.5 rounded-lg border text-xs font-bold"
                      style={{ borderColor: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 20%)", color: "var(--ff-cyan)" }}>
                      Envoyer
                    </button>
                    <button onClick={() => setCounterFor(null)} className="px-3 py-1.5 rounded-lg border text-xs"
                      style={{ borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}>
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!loading && daySlots.length === 0 && dayEvents.length === 0 && programBlocs.length === 0 && (
          <div className="rounded-2xl border p-6 text-center text-sm"
            style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}>
            Rien de prévu ce jour.
          </div>
        )}
      </section>
    </div>
  );
}
