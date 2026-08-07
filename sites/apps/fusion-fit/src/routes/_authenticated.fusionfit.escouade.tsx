import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { Users, Plus, Copy, Check, ChevronRight, QrCode as QrIcon, Trash2, UserPlus, Flag, CalendarClock, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAthletes } from "@/hooks/use-messages";
import { QrCode } from "@/components/qr-code";
import { AvatarUploader } from "@/components/avatar-uploader";
import { SquadSocialPanel } from "@/components/escouade/squad-social-panel";
import {
  useCreateInvitation,
  useEscouadeData,
  useSquadMutations,
} from "@/hooks/use-escouade";
import { PageSkeleton } from "@/components/ui-skeleton";
import { useTrainingSlots } from "@/hooks/use-creneaux";

export const Route = createFileRoute("/_authenticated/fusionfit/escouade")({
  component: EscouadePage,
});

function EscouadePage() {
  const { role } = useAuth();
  const loc = useLocation();
  // Sous-route active (fiche abonné) → on rend l'Outlet à la place de la liste.
  const onDetail = loc.pathname !== "/fusionfit/escouade" && loc.pathname !== "/fusionfit/escouade/";
  const { data, isLoading } = useEscouadeData();
  const abonnes = data?.abonnes ?? [];
  const invits = data?.invits ?? [];
  const squads = data?.squads ?? [];
  const members = data?.members ?? [];
  const createInv = useCreateInvitation();
  const { createSquad, deleteSquad, toggleMember } = useSquadMutations();
  const [emailInv, setEmailInv] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [qrFor, setQrFor] = useState<string | null>(null);
  const [showNewSquad, setShowNewSquad] = useState(false);
  const [squadForm, setSquadForm] = useState({ nom: "", objectif: "" });
  const [openSquad, setOpenSquad] = useState<string | null>(null);

  async function creerInvitation() {
    try {
      await createInv.mutateAsync(emailInv);
      setEmailInv("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur invitation");
    }
  }

  function lien(token: string) {
    return `${window.location.origin}/signup?token=${encodeURIComponent(token)}`;
  }
  async function copier(token: string) {
    await navigator.clipboard.writeText(lien(token));
    setCopied(token);
    setTimeout(() => setCopied(null), 1800);
  }

  async function creerSquad() {
    if (!squadForm.nom.trim()) return;
    try {
      await createSquad.mutateAsync(squadForm);
      setShowNewSquad(false);
      setSquadForm({ nom: "", objectif: "" });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  }
  async function suppSquad(id: string) {
    if (!confirm("Supprimer cette escouade ?")) return;
    await deleteSquad.mutateAsync(id);
  }
  async function onToggleMember(squadId: string, abonneId: string, inGroup: boolean) {
    try {
      await toggleMember.mutateAsync({ squadId, abonneId, inGroup });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  }

  // Fiche abonné (sous-route) : on délègue au routeur enfant.
  if (onDetail) return <Outlet />;

  if (role !== "coach") {
    return <p className="text-center mt-12 text-sm" style={{ color: "var(--ff-text-muted)" }}>Accès réservé au coach.</p>;
  }
  if (isLoading) return <PageSkeleton rows={5} />;

  return (
    <div className="space-y-5">
      <header>
        <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--ff-text-muted)" }}>
          Coach · Escouade
        </p>
        <h1 className="text-2xl font-bold mt-1">Mes abonnés</h1>
      </header>

      {/* Dashboard : agenda de la semaine + alertes fatigue */}
      <CoachDashboard nbAbonnes={abonnes.length} />

      {/* Inviter */}
      <section
        className="rounded-2xl border p-4 space-y-3"
        style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
      >
        <p className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--ff-amber)" }}>
          Inviter un abonné
        </p>
        <div className="flex gap-2">
          <input
            value={emailInv}
            onChange={(e) => setEmailInv(e.target.value)}
            placeholder="email (optionnel)"
            className="flex-1 px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
            style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
          />
          <button
            onClick={creerInvitation}
            className="px-3 py-2 rounded-lg border flex items-center gap-1 text-sm"
            style={{ borderColor: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 12%)", color: "var(--ff-cyan)" }}
          >
            <Plus className="h-4 w-4" /> Générer
          </button>
        </div>
        {invits.length > 0 && (
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: "var(--ff-border)" }}>
            {invits.map((i) => (
              <div key={i.id} className="space-y-2">
                <div
                  className="flex items-center gap-2 text-xs rounded-lg border px-2 py-1.5"
                  style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}
                >
                  <div className="flex-1 min-w-0 font-mono truncate" style={{ color: "var(--ff-text-muted)" }}>
                    {i.email ?? "—"}
                  </div>
                  <button
                    onClick={() => setQrFor(qrFor === i.token ? null : i.token)}
                    className="p-1.5 rounded"
                    style={{ color: qrFor === i.token ? "var(--ff-amber)" : "var(--ff-text-muted)" }}
                    aria-label="QR Code"
                  >
                    <QrIcon className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => copier(i.token)} className="p-1.5 rounded" style={{ color: "var(--ff-cyan)" }}>
                    {copied === i.token ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {qrFor === i.token && (
                  <div
                    className="rounded-lg border p-3 flex flex-col items-center gap-2"
                    style={{ borderColor: "var(--ff-amber)", background: "var(--ff-surface-2)" }}
                  >
                    <QrCode value={lien(i.token)} size={160} />
                    <p className="text-[10px] font-mono text-center" style={{ color: "var(--ff-text-muted)" }}>
                      Scanne ce QR pour rejoindre l'Initiative
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Escouades (groupes) */}
      <section
        className="rounded-2xl border p-4 space-y-3"
        style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--ff-green)" }}>
            <Flag className="h-3 w-3" /> Escouades (groupes)
          </p>
          <button
            onClick={() => setShowNewSquad((s) => !s)}
            className="px-2 py-1 rounded-lg border text-xs flex items-center gap-1"
            style={{ borderColor: "var(--ff-green)", color: "var(--ff-green)", background: "oklch(0.65 0.18 145 / 12%)" }}
          >
            <Plus className="h-3 w-3" /> Créer
          </button>
        </div>

        {showNewSquad && (
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: "var(--ff-border)" }}>
            <input
              value={squadForm.nom}
              onChange={(e) => setSquadForm({ ...squadForm, nom: e.target.value })}
              placeholder="Nom (ex: Team Marathon)"
              className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
              style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
            />
            <input
              value={squadForm.objectif}
              onChange={(e) => setSquadForm({ ...squadForm, objectif: e.target.value })}
              placeholder="Objectif commun (ex: Hyrox Lyon 2026)"
              className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
              style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
            />
            <button
              onClick={creerSquad}
              className="w-full py-2 rounded-lg border text-sm font-bold"
              style={{ borderColor: "var(--ff-green)", background: "oklch(0.65 0.18 145 / 20%)", color: "var(--ff-green)" }}
            >
              Créer l'escouade
            </button>
          </div>
        )}

        {squads.length === 0 && !showNewSquad && (
          <p className="text-xs text-center py-3" style={{ color: "var(--ff-text-muted)" }}>
            Aucune escouade. Crée un groupe pour fédérer des athlètes autour d'un objectif commun.
          </p>
        )}

        {squads.map((sq) => {
          const memIds = members.filter((m) => m.squad_id === sq.id).map((m) => m.abonne_id);
          const isOpen = openSquad === sq.id;
          return (
            <div
              key={sq.id}
              className="rounded-lg border p-3 space-y-2"
              style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm">{sq.nom}</p>
                  {sq.objectif && (
                    <p className="text-[11px] truncate" style={{ color: "var(--ff-text-muted)" }}>
                      🎯 {sq.objectif}
                    </p>
                  )}
                  <p className="text-[10px] font-mono mt-1" style={{ color: "var(--ff-cyan)" }}>
                    {memIds.length} membre(s)
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setOpenSquad(isOpen ? null : sq.id)}
                    className="p-1.5 rounded" style={{ color: "var(--ff-cyan)" }} aria-label="Membres"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => suppSquad(sq.id)} className="p-1.5 rounded" style={{ color: "var(--ff-text-muted)" }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="space-y-1 pt-2 border-t" style={{ borderColor: "var(--ff-border)" }}>
                  {abonnes.length === 0 && (
                    <p className="text-[11px] text-center py-2" style={{ color: "var(--ff-text-muted)" }}>
                      Aucun abonné à ajouter pour le moment.
                    </p>
                  )}
                  {abonnes.map((a) => {
                    const inGroup = memIds.includes(a.user_id);
                    return (
                      <button
                        key={a.user_id}
                        onClick={() => onToggleMember(sq.id, a.user_id, inGroup)}
                        className="w-full flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg border"
                        style={{
                          borderColor: inGroup ? "var(--ff-green)" : "var(--ff-border)",
                          background: inGroup ? "oklch(0.65 0.18 145 / 10%)" : "transparent",
                          color: inGroup ? "var(--ff-green)" : "var(--ff-text)",
                        }}
                      >
                        {inGroup ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        <span className="flex-1 text-left">{a.prenom}</span>
                      </button>
                    );
                  })}
                  <SquadSocialPanel squadId={sq.id} squadNom={sq.nom} isCoach />
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Liste abonnés */}
      <section className="space-y-2">
        <p className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--ff-text-muted)" }}>
          {abonnes.length} abonné(s)
        </p>
        {abonnes.length === 0 && (
          <div
            className="rounded-2xl border p-6 text-center text-sm"
            style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}
          >
            <Users className="h-8 w-8 mx-auto mb-2 opacity-60" />
            Aucun abonné rattaché. Génère un lien d'invitation.
          </div>
        )}
        {abonnes.map((a) => {
          const squadNames = squads
            .filter((s) => members.some((m) => m.squad_id === s.id && m.abonne_id === a.user_id))
            .map((s) => s.nom);
          return (
            <Link
              key={a.user_id}
              to="/fusionfit/escouade/$abonneId"
              params={{ abonneId: a.user_id }}
              className="flex items-center gap-3 rounded-2xl border p-3 hover:opacity-90 transition"
              style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
            >
              <AvatarUploader userId={a.user_id} avatarPath={a.avatar_url} size={40} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{a.prenom}</p>
                <p className="text-xs truncate" style={{ color: "var(--ff-text-muted)" }}>
                  {a.objectif_principal || a.email || "—"}
                </p>
                {squadNames.length > 0 && (
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--ff-green)" }}>
                    {squadNames.map((n) => `▸ ${n}`).join("  ")}
                  </p>
                )}
              </div>
              <ChevronRight className="h-4 w-4" style={{ color: "var(--ff-text-muted)" }} />
            </Link>
          );
        })}
      </section>
    </div>
  );
}

function CoachDashboard({ nbAbonnes }: { nbAbonnes: number }) {
  const { data: athletes = [] } = useAthletes();
  const { data: allSlots = [] } = useTrainingSlots();

  const now = Date.now();
  const in7d = now + 7 * 86400_000;
  const slots = allSlots.filter((s) => {
    const t = new Date(s.date_slot).getTime();
    return t >= now && t <= in7d;
  });

  const alertes = athletes.filter((a) => a.avg_energie != null && a.avg_energie <= 2.5);
  const prenomDe = (id: string) => athletes.find((a) => a.user_id === id)?.prenom ?? "Athlète";
  const valides = slots.filter((s) => s.status === "valide");
  const enAttente = slots.filter((s) => s.status === "propose");

  return (
    <section
      className="rounded-2xl border p-4 space-y-3"
      style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
    >
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border p-2" style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}>
          <p className="text-xl font-bold tabular-nums" style={{ color: "var(--ff-cyan)" }}>{nbAbonnes}</p>
          <p className="text-[9px] font-mono uppercase" style={{ color: "var(--ff-text-muted)" }}>abonnés</p>
        </div>
        <div className="rounded-lg border p-2" style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}>
          <p className="text-xl font-bold tabular-nums" style={{ color: "var(--ff-green)" }}>{valides.length}</p>
          <p className="text-[9px] font-mono uppercase" style={{ color: "var(--ff-text-muted)" }}>séances 7j</p>
        </div>
        <div className="rounded-lg border p-2" style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}>
          <p className="text-xl font-bold tabular-nums" style={{ color: alertes.length ? "var(--ff-red)" : "var(--ff-text-muted)" }}>{alertes.length}</p>
          <p className="text-[9px] font-mono uppercase" style={{ color: "var(--ff-text-muted)" }}>alertes</p>
        </div>
      </div>

      {alertes.length > 0 && (
        <div className="rounded-lg border p-2.5" style={{ borderColor: "var(--ff-red)", background: "oklch(0.65 0.20 22 / 8%)" }}>
          <p className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 mb-1" style={{ color: "var(--ff-red)" }}>
            <AlertTriangle className="h-3 w-3" /> Fatigue détectée
          </p>
          {alertes.map((a) => (
            <Link key={a.user_id} to="/fusionfit/escouade/$abonneId" params={{ abonneId: a.user_id }}
              className="flex items-center justify-between text-xs py-1">
              <span className="font-semibold">{a.prenom}</span>
              <span style={{ color: "var(--ff-red)" }}>énergie {a.avg_energie}/5 →</span>
            </Link>
          ))}
        </div>
      )}

      {(valides.length > 0 || enAttente.length > 0) && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 mb-1.5" style={{ color: "var(--ff-cyan)" }}>
            <CalendarClock className="h-3 w-3" /> Agenda de la semaine
          </p>
          <div className="space-y-1">
            {slots.slice(0, 5).map((s) => {
              const d = new Date(s.date_slot);
              return (
                <div key={s.id} className="flex items-center justify-between text-xs py-1 px-2 rounded"
                  style={{ background: "var(--ff-surface-2)" }}>
                  <span>
                    {d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })} ·{" "}
                    {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · {prenomDe(s.abonne_id)}
                  </span>
                  <span className="text-[10px] font-mono uppercase"
                    style={{ color: s.status === "valide" ? "var(--ff-green)" : "var(--ff-amber)" }}>
                    {s.status === "valide" ? "validé" : "attente"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
