import { useState } from "react";
import { Save, Plus, Trash2, Sparkles, BookOpen, X, Library, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PROGRAM_TEMPLATES, PROTOCOLES, type Bloc } from "@/data/program-templates";
import { notify } from "@/hooks/use-notifications";
import { recordProgramAssignment } from "@/lib/program-sync";
import { JOURS, type Program, type DbTemplate } from "./types";

export function ProgramEditor({
  prog,
  setProg,
  abonneId,
  coachId,
  myTemplates,
  setMyTemplates,
  athleteObjectifs,
}: {
  prog: Program;
  setProg: React.Dispatch<React.SetStateAction<Program | null>>;
  abonneId: string;
  coachId: string;
  myTemplates: DbTemplate[];
  setMyTemplates: React.Dispatch<React.SetStateAction<DbTemplate[]>>;
  /** Objectifs connus de l'abonné — aide à adapter l'objectif du programme */
  athleteObjectifs?: string[];
}) {
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [protoTargetIdx, setProtoTargetIdx] = useState<number | null>(null);
  const [savedTplMsg, setSavedTplMsg] = useState<string | null>(null);
  /** Template biblio source (pour journal program_assignments + sync auto). */
  const [sourceTemplateId, setSourceTemplateId] = useState<string | null>(null);

  async function notifierMiseAJour(progTitre: string) {
    let convId: string | null = null;
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("coach_id", coachId)
      .eq("abonne_id", abonneId)
      .maybeSingle();
    if (existing) {
      convId = existing.id;
    } else {
      const { data: created } = await supabase
        .from("conversations")
        .insert({ coach_id: coachId, abonne_id: abonneId })
        .select("id")
        .single();
      convId = created?.id ?? null;
    }
    if (!convId) return;
    await supabase.from("messages").insert({
      conversation_id: convId,
      from_user_id: coachId,
      texte: `🔔 Ton coach vient de mettre à jour ton programme « ${progTitre} ». Retrouve-le dans ta Routine.`,
      type: "notification",
    });
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", convId);
  }

  async function sauvegarder() {
    setSaving(true);
    const payload = {
      abonne_id: prog.abonne_id,
      coach_id: prog.coach_id,
      titre: prog.titre,
      objectif: prog.objectif,
      blocs: prog.blocs as unknown as any,
    };
    let res;
    if (prog.id) {
      res = await supabase.from("programs").update(payload).eq("id", prog.id).select().single();
    } else {
      res = await supabase.from("programs").insert(payload).select().single();
    }
    if (res.error) {
      alert(res.error.message);
    } else {
      const programId = res.data.id as string;
      setProg((p) => (p ? { ...p, id: programId } : p));
      setSavedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
      if (sourceTemplateId) {
        await recordProgramAssignment({
          coachId,
          templateId: sourceTemplateId,
          abonneId,
          programId,
        });
      }
      await notifierMiseAJour(prog.titre);
      await notify(abonneId, "programme", "Programme mis à jour",
        `Ton coach a mis à jour ton programme « ${prog.titre} ».`, "/fusionfit/stats");
    }
    setSaving(false);
  }

  function appliquerTemplate(tplId: string) {
    const tpl = PROGRAM_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    if (prog.blocs.length > 0 && !confirm(`Remplacer le programme actuel par « ${tpl.titre} » ?`)) return;
    setSourceTemplateId(null);
    setProg({ ...prog, titre: tpl.titre, objectif: tpl.objectif, blocs: tpl.blocs.map((b) => ({ ...b })) });
    setShowTemplates(false);
  }

  function appliquerDbTemplate(tpl: DbTemplate) {
    if (prog.blocs.length > 0 && !confirm(`Remplacer le programme actuel par « ${tpl.titre} » ?`)) return;
    setSourceTemplateId(tpl.id);
    setProg({
      ...prog,
      titre: tpl.titre,
      objectif: tpl.objectif ?? "",
      blocs: (tpl.blocs ?? []).map((b) => ({ ...b })),
    });
    setShowTemplates(false);
  }

  async function sauvegarderCommeTemplate() {
    if (!prog.titre.trim()) {
      alert("Donne un titre au programme avant de l'enregistrer comme template.");
      return;
    }
    const payload = {
      coach_id: coachId,
      titre: prog.titre.trim(),
      objectif: prog.objectif.trim() || null,
      blocs: prog.blocs.filter((b) => b.titre.trim() || b.details.trim()) as unknown as any,
    };
    const { data, error } = await supabase.from("program_templates").insert(payload).select("id, titre, objectif, blocs").single();
    if (error) { alert(error.message); return; }
    setMyTemplates((p) => [((data as unknown) as DbTemplate), ...p]);
    setSavedTplMsg("Ajouté à ta bibliothèque ✓");
    setTimeout(() => setSavedTplMsg(null), 2500);
  }

  function insererProtocole(idx: number, protoId: string) {
    const proto = PROTOCOLES.find((p) => p.id === protoId);
    if (!proto) return;
    setProg({
      ...prog,
      blocs: prog.blocs.map((b, j) =>
        j === idx
          ? {
              ...b,
              titre: b.titre || proto.titre,
              details: b.details ? `${b.details}\n— ${proto.titre}\n${proto.contenu}` : proto.contenu,
            }
          : b
      ),
    });
    setProtoTargetIdx(null);
  }

  function updBloc(i: number, patch: Partial<Bloc>) {
    setProg((p) => (p ? { ...p, blocs: p.blocs.map((b, j) => (j === i ? { ...b, ...patch } : b)) } : p));
  }
  function addBloc() {
    setProg((p) => (p ? { ...p, blocs: [...p.blocs, { jour: "Lundi", titre: "", details: "" }] } : p));
  }
  function delBloc(i: number) {
    setProg((p) => (p ? { ...p, blocs: p.blocs.filter((_, j) => j !== i) } : p));
  }

  return (
    <>
      <section
        className="rounded-2xl border p-4 space-y-3"
        style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--ff-cyan)" }}>
            Programme hebdomadaire
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs"
              style={{ borderColor: "var(--ff-amber)", color: "var(--ff-amber)", background: "oklch(0.78 0.18 55 / 12%)" }}
            >
              <Sparkles className="h-3.5 w-3.5" /> Templates
            </button>
            <button
              onClick={sauvegarderCommeTemplate}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs"
              style={{ borderColor: "var(--ff-cyan)", color: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 12%)" }}
            >
              <Library className="h-3.5 w-3.5" /> Sauver tpl
            </button>
            <button
              onClick={sauvegarder}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs"
              style={{ borderColor: "var(--ff-green)", color: "var(--ff-green)", background: "oklch(0.65 0.18 145 / 12%)" }}
            >
              <Save className="h-3.5 w-3.5" /> {saving ? "…" : "Enregistrer"}
            </button>
          </div>
        </div>
        {savedTplMsg && <p className="text-[10px]" style={{ color: "var(--ff-cyan)" }}>{savedTplMsg}</p>}
        {savedAt && <p className="text-[10px]" style={{ color: "var(--ff-green)" }}>Sauvegardé à {savedAt} · notification envoyée à l'abonné</p>}

        <input
          value={prog.titre}
          onChange={(e) => setProg({ ...prog, titre: e.target.value })}
          placeholder="Titre du programme"
          className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
          style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
        />
        <textarea
          value={prog.objectif}
          onChange={(e) => setProg({ ...prog, objectif: e.target.value })}
          placeholder="Objectif du cycle (adapter aux objectifs de l'abonné…)"
          rows={2}
          className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none resize-y min-h-[4.5rem]"
          style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
        />
        {athleteObjectifs && athleteObjectifs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[9px] font-mono uppercase w-full" style={{ color: "var(--ff-text-muted)" }}>
              Objectifs abonné — cliquer pour préremplir
            </span>
            {athleteObjectifs.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setProg({ ...prog, objectif: o })}
                className="text-[11px] px-2 py-1 rounded-md border text-left"
                style={{ borderColor: "var(--ff-amber)", color: "var(--ff-amber)", background: "oklch(0.78 0.18 55 / 8%)" }}
              >
                {o}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {prog.blocs.map((b, i) => (
            <div key={i} className="rounded-lg border p-2 space-y-1.5" style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}>
              <div className="flex gap-2">
                <select
                  value={b.jour}
                  onChange={(e) => updBloc(i, { jour: e.target.value })}
                  className="px-2 py-1 rounded border bg-transparent text-xs outline-none"
                  style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
                >
                  {JOURS.map((j) => (
                    <option key={j} value={j} style={{ background: "var(--ff-bg)" }}>{j}</option>
                  ))}
                </select>
                <input
                  value={b.titre}
                  onChange={(e) => updBloc(i, { titre: e.target.value })}
                  placeholder="Titre séance"
                  className="flex-1 px-2 py-1 rounded border bg-transparent text-xs outline-none"
                  style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
                />
                <button onClick={() => delBloc(i)} className="p-1" style={{ color: "var(--ff-text-muted)" }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <textarea
                value={b.details}
                onChange={(e) => updBloc(i, { details: e.target.value })}
                placeholder="Détails (séries, charges, intensité…)"
                rows={2}
                className="w-full px-2 py-1 rounded border bg-transparent text-xs outline-none resize-y min-h-[4rem]"
                style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
              />
              <button
                onClick={() => setProtoTargetIdx(i)}
                className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border"
                style={{ borderColor: "var(--ff-border)", color: "var(--ff-cyan)" }}
              >
                <BookOpen className="h-3 w-3" /> Insérer un protocole
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addBloc}
          className="w-full py-2 rounded-lg border border-dashed text-xs flex items-center justify-center gap-1"
          style={{ borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}
        >
          <Plus className="h-3.5 w-3.5" /> Ajouter une séance
        </button>
      </section>

      {/* Modal Templates */}
      {showTemplates && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)" }}
          onClick={() => setShowTemplates(false)}
        >
          <div
            className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border p-4 space-y-3"
            style={{ background: "var(--ff-bg)", borderColor: "var(--ff-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4" style={{ color: "var(--ff-amber)" }} />
                Templates de programme
              </h2>
              <button onClick={() => setShowTemplates(false)}>
                <X className="h-4 w-4" style={{ color: "var(--ff-text-muted)" }} />
              </button>
            </div>
            <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>
              Sélectionne un modèle prêt à l'emploi. Tu pourras le modifier ensuite.
            </p>

            {myTemplates.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1" style={{ color: "var(--ff-cyan)" }}>
                  <Library className="h-3 w-3" /> Ma bibliothèque
                </p>
                {myTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => appliquerDbTemplate(tpl)}
                    className="w-full text-left rounded-lg border p-3 space-y-1"
                    style={{ background: "var(--ff-surface)", borderColor: "var(--ff-cyan)" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" style={{ color: "var(--ff-cyan)" }} /> {tpl.titre}
                      </h3>
                      <span className="text-[10px] font-mono" style={{ color: "var(--ff-text-muted)" }}>
                        {(tpl.blocs ?? []).length} séances
                      </span>
                    </div>
                    {tpl.objectif && <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>{tpl.objectif}</p>}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--ff-amber)" }}>
                Modèles prêts à l'emploi
              </p>
              {PROGRAM_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => appliquerTemplate(tpl.id)}
                  className="w-full text-left rounded-lg border p-3 space-y-1"
                  style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold">{tpl.titre}</h3>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--ff-cyan)", color: "var(--ff-cyan)" }}>
                      {tpl.cible}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>{tpl.objectif}</p>
                  <div className="flex gap-2 text-[10px] font-mono uppercase" style={{ color: "var(--ff-text-muted)" }}>
                    <span>{tpl.niveau}</span>
                    <span>·</span>
                    <span>{tpl.duree}</span>
                    <span>·</span>
                    <span>{tpl.blocs.length} séances</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Protocole */}
      {protoTargetIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)" }}
          onClick={() => setProtoTargetIdx(null)}
        >
          <div
            className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border p-4 space-y-3"
            style={{ background: "var(--ff-bg)", borderColor: "var(--ff-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <BookOpen className="h-4 w-4" style={{ color: "var(--ff-cyan)" }} />
                Insérer un protocole
              </h2>
              <button onClick={() => setProtoTargetIdx(null)}>
                <X className="h-4 w-4" style={{ color: "var(--ff-text-muted)" }} />
              </button>
            </div>
            <div className="space-y-2">
              {PROTOCOLES.map((proto) => (
                <button
                  key={proto.id}
                  onClick={() => insererProtocole(protoTargetIdx, proto.id)}
                  className="w-full text-left rounded-lg border p-3 space-y-1"
                  style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{proto.titre}</h3>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}>
                      {proto.pilier}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>{proto.contenu}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
