import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarClock, Plus, Check, X, Repeat, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { notify, getMyPrenom } from "@/hooks/use-notifications";
import { useMyAbonnement, useTrainingSlots } from "@/hooks/use-creneaux";
import { canAccessFeature, CRENEAUX_FREE_MONTHLY_LIMIT } from "@/lib/plan-gates";
import { PageSkeleton } from "@/components/ui-skeleton";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/fusionfit/creneaux")({
  component: CreneauxPage,
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

function CreneauxPage() {
  const { user, role } = useAuth();
  const { data: rqSlots, isLoading: slotsLoading, refetch: refetchSlots } = useTrainingSlots();
  const { data: abo } = useMyAbonnement();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [counterFor, setCounterFor] = useState<string | null>(null);
  const [counterForm, setCounterForm] = useState({ date: "", heure: "18:00" });
  const [form, setForm] = useState({
    partnerId: "",
    date: "",
    heure: "18:00",
    duree: 60,
    lieu: "",
    note: "",
  });

  useEffect(() => {
    if (rqSlots) setSlots(rqSlots as Slot[]);
  }, [rqSlots]);

  async function loadPartners() {
    if (!user) return;
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
  }

  useEffect(() => {
    void loadPartners();
  }, [user, role]);

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
    if (error) {
      alert(error.message);
      return;
    }
    const quand = dt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
    const prenomProposant = await getMyPrenom(user.id);
    await notify(payload.abonne_id, "creneau", `${prenomProposant} te propose un créneau`,
      `Séance le ${quand}${form.lieu ? ` · ${form.lieu}` : ""}.`, "/fusionfit/creneaux");
    await supabase.rpc("enqueue_email_for_user", {
      p_user_id: payload.abonne_id,
      p_subject: `${prenomProposant} te propose un créneau`,
      p_body: `Séance le ${quand}${form.lieu ? ` · ${form.lieu}` : ""}.`,
      p_kind: "creneau",
    });
    setShowForm(false);
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
        `Séance du ${quand}${slot.lieu ? ` · ${slot.lieu}` : ""}.`, "/fusionfit/creneaux");
    }
    await refetchSlots();
  }

  async function envoyerContre(slot: Slot) {
    if (!user || !counterForm.date) { alert("Choisis une date."); return; }
    const dt = new Date(`${counterForm.date}T${counterForm.heure}:00`);
    const { error } = await supabase
      .from("training_slots")
      .update({
        date_slot: dt.toISOString(),
        proposed_by: user.id,
        status: "propose",
      })
      .eq("id", slot.id);
    if (error) { alert(error.message); return; }
    // Notifie l'autre partie (celui qui avait proposé initialement).
    const dest = slot.proposed_by !== user.id ? slot.proposed_by
      : (user.id === slot.coach_id ? slot.abonne_id : slot.coach_id);
    {
      const prenom = await getMyPrenom(user.id);
      const quand = dt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
      await notify(dest, "creneau", `${prenom} propose une autre date`,
        `Nouvelle proposition : le ${quand}.`, "/fusionfit/creneaux");
    }
    setCounterFor(null);
    setCounterForm({ date: "", heure: "18:00" });
    await refetchSlots();
  }

  // Demande d'annulation : envoie automatiquement un message dans la conversation
  // coach/abonné pour tracer la demande + notification. Le statut passe à
  // "annulation_demandee" pour que l'autre partie sache qu'elle doit trancher.
  async function demanderAnnulation(slot: Slot) {
    if (!user) return;
    if (!confirm("Demander l'annulation de ce créneau ?")) return;
    const dt = new Date(slot.date_slot);
    const quand = dt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const dest = user.id === slot.coach_id ? slot.abonne_id : slot.coach_id;

    // 1) MAJ statut
    await supabase.from("training_slots").update({ status: "annulation_demandee" }).eq("id", slot.id);

    // 2) Message dans la conversation coach/abonné (get-or-create).
    try {
      const coach_id = user.id === slot.coach_id ? user.id : dest;
      const abonne_id = user.id === slot.coach_id ? dest : user.id;
      let convId: string | null = null;
      const { data: existing } = await supabase
        .from("conversations").select("id")
        .eq("coach_id", coach_id).eq("abonne_id", abonne_id).maybeSingle();
      if (existing) {
        convId = existing.id;
      } else {
        const { data: created } = await supabase
          .from("conversations").insert({ coach_id, abonne_id }).select("id").single();
        convId = created?.id ?? null;
      }
      if (convId) {
        await supabase.from("messages").insert({
          conversation_id: convId,
          from_user_id: user.id,
          texte: `Demande d'annulation du créneau du ${quand}${slot.lieu ? ` (${slot.lieu})` : ""}.`,
          type: "notification",
        });
        await supabase.from("conversations")
          .update({ last_message_at: new Date().toISOString() }).eq("id", convId);
      }
    } catch { /* la notif reste envoyée même en cas de souci de messagerie */ }

    // 3) Notification poussée
    {
      const prenom = await getMyPrenom(user.id);
      await notify(dest, "creneau", `${prenom} demande une annulation`,
        `Créneau du ${quand}${slot.lieu ? ` · ${slot.lieu}` : ""}.`,
        `/fusionfit/messagerie?with=${user.id}`);
    }

    await refetchSlots();
  }

  const statusInfo: Record<string, { label: string; color: string }> = {
    propose: { label: "En attente", color: "var(--ff-amber)" },
    valide: { label: "Validé", color: "var(--ff-green)" },
    refuse: { label: "Refusé", color: "var(--ff-text-muted)" },
    contre_propose: { label: "Contre-proposé", color: "var(--ff-cyan)" },
    annulation_demandee: { label: "Annulation demandée", color: "var(--ff-amber)" },
    annule: { label: "Annulé", color: "var(--ff-text-muted)" },
  };

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--ff-text-muted)" }}>
            {role === "coach" ? "Coach" : "Agent"} · Créneaux
          </p>
          <h1 className="text-2xl font-bold mt-1">Entraînements</h1>
        </div>
        {role === "coach" && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 12%)", color: "var(--ff-cyan)" }}
          >
            <Plus className="h-4 w-4" /> Proposer
          </button>
        )}
      </header>

      {showForm && (
        <section
          className="rounded-2xl border p-4 space-y-2"
          style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
        >
          <select
            value={form.partnerId}
            onChange={(e) => setForm({ ...form, partnerId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
            style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
          >
            <option value="" style={{ background: "var(--ff-bg)" }}>
              Avec qui…
            </option>
            {partners.map((p) => (
              <option key={p.user_id} value={p.user_id} style={{ background: "var(--ff-bg)" }}>
                {p.prenom}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
              style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)", colorScheme: "dark" }}
            />
            <input
              type="time"
              value={form.heure}
              onChange={(e) => setForm({ ...form, heure: e.target.value })}
              className="px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
              style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)", colorScheme: "dark" }}
            />
          </div>
          <input
            placeholder="Lieu"
            value={form.lieu}
            onChange={(e) => setForm({ ...form, lieu: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
            style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
          />
          <textarea
            placeholder="Note (objectifs, contenu…)"
            rows={2}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none resize-none"
            style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
          />
          <button
            onClick={proposer}
            className="w-full py-2 rounded-lg border text-sm font-bold"
            style={{ borderColor: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 20%)", color: "var(--ff-cyan)" }}
          >
            Envoyer la proposition
          </button>
        </section>
      )}

      {(loading || slotsLoading) && <PageSkeleton rows={3} />}
      {!canAccessFeature("creneaux_illimites", abo?.plan, abo?.statut) && role === "abonne" && (
        <p className="text-[11px] font-mono" style={{ color: "var(--ff-amber)" }}>
          Plan Découverte · max {CRENEAUX_FREE_MONTHLY_LIMIT} créneaux/mois ·{" "}
          <Link to="/fusionfit/abonnement" style={{ color: "var(--ff-cyan)" }}>Upgrade</Link>
        </p>
      )}

      {!loading && slots.length === 0 && (
        <div
          className="rounded-2xl border p-6 text-center text-sm"
          style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}
        >
          <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-60" />
          Aucun créneau. {role === "abonne" ? "Ton coach n'a pas encore proposé de séance." : "En attente de demandes."}
        </div>
      )}

      <section className="space-y-2">
        {slots.map((s) => {
          const date = new Date(s.date_slot);
          const isPast = date.getTime() < Date.now();
          // Une fois passé, un créneau "validé" devient "Terminé".
          const displayInfo = isPast && s.status === "valide"
            ? { label: "Terminé", color: "var(--ff-text-muted)" }
            : (statusInfo[s.status] ?? statusInfo.propose);
          const fromMe = s.proposed_by === user?.id;
          const canRespond = !fromMe && s.status === "propose" && !isPast;
          // Demande d'annulation possible pour un créneau futur, validé ou
          // en attente (le statut "annulation_demandee" en est déjà exclu).
          const canRequestCancel = !isPast
            && (s.status === "valide" || s.status === "propose");
          return (
            <div
              key={s.id}
              className="rounded-2xl border p-3 space-y-2"
              style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)", opacity: isPast ? 0.75 : 1 }}
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm">
                  {date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} ·{" "}
                  {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <span
                  className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border"
                  style={{ color: displayInfo.color, borderColor: displayInfo.color }}
                >
                  {displayInfo.label}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>
                {s.duree_min} min {s.lieu ? `· ${s.lieu}` : ""}
              </p>
              {s.note && <p className="text-xs">{s.note}</p>}
              <p className="text-[10px] font-mono" style={{ color: "var(--ff-text-muted)" }}>
                {fromMe ? "Proposé par toi" : role === "abonne" ? "Proposé par votre coach" : "Proposé par l'athlète"}
              </p>
              {canRespond && counterFor !== s.id && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => maj(s.id, "valide")}
                    className="flex-1 py-1.5 rounded-lg border text-xs flex items-center justify-center gap-1"
                    style={{ borderColor: "var(--ff-green)", color: "var(--ff-green)" }}
                  >
                    <Check className="h-3.5 w-3.5" /> Valider
                  </button>
                  <button
                    onClick={() => maj(s.id, "refuse")}
                    className="flex-1 py-1.5 rounded-lg border text-xs flex items-center justify-center gap-1"
                    style={{ borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}
                  >
                    <X className="h-3.5 w-3.5" /> Refuser
                  </button>
                  <button
                    onClick={() => {
                      setCounterFor(s.id);
                      const d = new Date(s.date_slot);
                      setCounterForm({
                        date: d.toISOString().slice(0, 10),
                        heure: d.toTimeString().slice(0, 5),
                      });
                    }}
                    className="flex-1 py-1.5 rounded-lg border text-xs flex items-center justify-center gap-1"
                    style={{ borderColor: "var(--ff-cyan)", color: "var(--ff-cyan)" }}
                  >
                    <Repeat className="h-3.5 w-3.5" /> Autre
                  </button>
                </div>
              )}
              {canRequestCancel && counterFor !== s.id && (
                <button
                  onClick={() => demanderAnnulation(s)}
                  className="w-full mt-1 py-1.5 rounded-lg border text-xs flex items-center justify-center gap-1"
                  style={{ borderColor: "var(--ff-amber)", color: "var(--ff-amber)" }}
                >
                  <Ban className="h-3.5 w-3.5" /> Demander l'annulation
                </button>
              )}
              {counterFor === s.id && (
                <div
                  className="pt-2 mt-2 border-t space-y-2"
                  style={{ borderColor: "var(--ff-border)" }}
                >
                  <p className="text-[10px] font-mono uppercase" style={{ color: "var(--ff-cyan)" }}>
                    Contre-proposer une nouvelle date
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={counterForm.date}
                      onChange={(e) => setCounterForm({ ...counterForm, date: e.target.value })}
                      className="px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
                      style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)", colorScheme: "dark" }}
                    />
                    <input
                      type="time"
                      value={counterForm.heure}
                      onChange={(e) => setCounterForm({ ...counterForm, heure: e.target.value })}
                      className="px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
                      style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)", colorScheme: "dark" }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => envoyerContre(s)}
                      className="flex-1 py-1.5 rounded-lg border text-xs font-bold"
                      style={{ borderColor: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 20%)", color: "var(--ff-cyan)" }}
                    >
                      Envoyer
                    </button>
                    <button
                      onClick={() => setCounterFor(null)}
                      className="px-3 py-1.5 rounded-lg border text-xs"
                      style={{ borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
