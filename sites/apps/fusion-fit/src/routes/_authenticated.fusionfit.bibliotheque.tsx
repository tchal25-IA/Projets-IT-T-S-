import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Plus, Trash2, Edit2, X, Check, Library, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PROGRAM_TEMPLATES, type Bloc } from "@/data/program-templates";

export const Route = createFileRoute("/_authenticated/fusionfit/bibliotheque")({
  component: BibliothequePage,
});

type Template = {
  id: string;
  coach_id: string;
  titre: string;
  objectif: string | null;
  blocs: Bloc[];
  created_at: string;
};

type FormState = {
  titre: string;
  objectif: string;
  blocs: Bloc[];
};

const EMPTY_FORM: FormState = { titre: "", objectif: "", blocs: [{ jour: "Lundi", titre: "", details: "" }] };

function BibliothequePage() {
  const { user, role } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("program_templates")
      .select("*")
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false });
    setTemplates(((data ?? []) as unknown) as Template[]);
    setLoading(false);
  }

  useEffect(() => { if (role === "coach") load(); else setLoading(false); }, [user, role]);

  function startCreate() {
    setForm(EMPTY_FORM);
    setEditing(null);
    setCreating(true);
  }
  function startEdit(t: Template) {
    setForm({ titre: t.titre, objectif: t.objectif ?? "", blocs: t.blocs.length ? t.blocs : EMPTY_FORM.blocs });
    setEditing(t);
    setCreating(true);
  }
  function importPreset(p: typeof PROGRAM_TEMPLATES[number]) {
    setForm({ titre: p.titre, objectif: p.objectif, blocs: p.blocs });
    setEditing(null);
    setCreating(true);
    setShowPresets(false);
  }

  async function save() {
    if (!user || !form.titre.trim()) { alert("Le titre est obligatoire."); return; }
    setSaving(true);
    const payload = {
      coach_id: user.id,
      titre: form.titre.trim(),
      objectif: form.objectif.trim() || null,
      blocs: form.blocs.filter((b) => b.titre.trim() || b.details.trim()),
    };
    const { error } = editing
      ? await supabase.from("program_templates").update(payload).eq("id", editing.id)
      : await supabase.from("program_templates").insert(payload);
    setSaving(false);
    if (error) { alert(error.message); return; }
    setCreating(false);
    setEditing(null);
    await load();
  }

  async function supprimer(id: string) {
    if (!confirm("Supprimer ce programme type ?")) return;
    await supabase.from("program_templates").delete().eq("id", id);
    await load();
  }

  function ajouterBloc() {
    setForm({ ...form, blocs: [...form.blocs, { jour: "Lundi", titre: "", details: "" }] });
  }
  function supprimerBloc(i: number) {
    setForm({ ...form, blocs: form.blocs.filter((_, k) => k !== i) });
  }
  function majBloc(i: number, patch: Partial<Bloc>) {
    setForm({ ...form, blocs: form.blocs.map((b, k) => (k === i ? { ...b, ...patch } : b)) });
  }

  if (role !== "coach") {
    return (
      <p className="text-center mt-12 text-sm" style={{ color: "var(--ff-text-muted)" }}>
        Bibliothèque réservée au coach.
      </p>
    );
  }
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--ff-cyan)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--ff-text-muted)" }}>
            Coach · Bibliothèque
          </p>
          <h1 className="text-2xl font-bold mt-1">Programmes types</h1>
        </div>
        {!creating && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowPresets((s) => !s)}
              className="px-3 py-2 rounded-lg border text-xs flex items-center gap-1"
              style={{ borderColor: "var(--ff-amber)", color: "var(--ff-amber)", background: "oklch(0.78 0.18 55 / 12%)" }}
            >
              <Library className="h-3.5 w-3.5" /> Presets
            </button>
            <button
              onClick={startCreate}
              className="px-3 py-2 rounded-lg border text-sm flex items-center gap-1"
              style={{ borderColor: "var(--ff-cyan)", color: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 12%)" }}
            >
              <Plus className="h-4 w-4" /> Créer
            </button>
          </div>
        )}
      </header>

      {showPresets && !creating && (
        <section
          className="rounded-2xl border p-3 space-y-2"
          style={{ background: "var(--ff-surface)", borderColor: "var(--ff-amber)" }}
        >
          <p className="text-[11px] font-mono uppercase" style={{ color: "var(--ff-amber)" }}>
            Importe un preset Initiative pour démarrer
          </p>
          {PROGRAM_TEMPLATES.map((p) => (
            <button
              key={p.id}
              onClick={() => importPreset(p)}
              className="w-full text-left p-2 rounded-lg border hover:opacity-90"
              style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}
            >
              <p className="text-sm font-semibold">{p.titre}</p>
              <p className="text-[11px]" style={{ color: "var(--ff-text-muted)" }}>
                {p.cible} · {p.niveau} · {p.duree}
              </p>
            </button>
          ))}
        </section>
      )}

      {creating && (
        <section
          className="rounded-2xl border p-4 space-y-3"
          style={{ background: "var(--ff-surface)", borderColor: "var(--ff-cyan)" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono uppercase" style={{ color: "var(--ff-cyan)" }}>
              {editing ? "Modifier le programme" : "Nouveau programme"}
            </p>
            <button
              onClick={() => { setCreating(false); setEditing(null); }}
              className="p-1 rounded" style={{ color: "var(--ff-text-muted)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <input
            value={form.titre}
            onChange={(e) => setForm({ ...form, titre: e.target.value })}
            placeholder="Titre du programme"
            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
            style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
          />
          <textarea
            value={form.objectif}
            onChange={(e) => setForm({ ...form, objectif: e.target.value })}
            placeholder="Objectif du programme"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none resize-none"
            style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
          />

          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase" style={{ color: "var(--ff-text-muted)" }}>
              Blocs ({form.blocs.length})
            </p>
            {form.blocs.map((b, i) => (
              <div key={i} className="rounded-lg border p-2 space-y-1.5" style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}>
                <div className="flex gap-2 items-center">
                  <input
                    value={b.jour}
                    onChange={(e) => majBloc(i, { jour: e.target.value })}
                    placeholder="Jour"
                    className="w-24 px-2 py-1.5 rounded border bg-transparent text-xs outline-none"
                    style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
                  />
                  <input
                    value={b.titre}
                    onChange={(e) => majBloc(i, { titre: e.target.value })}
                    placeholder="Titre du bloc"
                    className="flex-1 px-2 py-1.5 rounded border bg-transparent text-xs outline-none"
                    style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
                  />
                  <button
                    onClick={() => supprimerBloc(i)}
                    className="p-1.5 rounded" style={{ color: "var(--ff-text-muted)" }}
                    aria-label="Supprimer le bloc"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <textarea
                  value={b.details}
                  onChange={(e) => majBloc(i, { details: e.target.value })}
                  placeholder="Détails (exercices, séries, temps…)"
                  rows={2}
                  className="w-full px-2 py-1.5 rounded border bg-transparent text-xs outline-none resize-none"
                  style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
                />
              </div>
            ))}
            <button
              onClick={ajouterBloc}
              className="w-full py-2 rounded-lg border text-xs flex items-center justify-center gap-1"
              style={{ borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}
            >
              <Plus className="h-3.5 w-3.5" /> Ajouter un bloc
            </button>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full py-2.5 rounded-lg border text-sm font-bold flex items-center justify-center gap-2"
            style={{ borderColor: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 20%)", color: "var(--ff-cyan)" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {editing ? "Enregistrer" : "Créer le programme"}
          </button>
        </section>
      )}

      {!creating && templates.length === 0 && (
        <div
          className="rounded-2xl border p-6 text-center text-sm"
          style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}
        >
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-60" />
          Aucun programme type. Crée-en un ou importe un preset.
        </div>
      )}

      {!creating && templates.map((t) => (
        <div
          key={t.id}
          className="rounded-2xl border p-3 space-y-2"
          style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm">{t.titre}</p>
              {t.objectif && (
                <p className="text-[11px] mt-0.5" style={{ color: "var(--ff-text-muted)" }}>
                  🎯 {t.objectif}
                </p>
              )}
              <p className="text-[10px] font-mono mt-1" style={{ color: "var(--ff-cyan)" }}>
                {t.blocs.length} bloc(s)
              </p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => startEdit(t)} className="p-1.5 rounded" style={{ color: "var(--ff-cyan)" }} aria-label="Modifier">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => supprimer(t.id)} className="p-1.5 rounded" style={{ color: "var(--ff-text-muted)" }} aria-label="Supprimer">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {t.blocs.length > 0 && (
            <ul className="space-y-1 pt-1 border-t" style={{ borderColor: "var(--ff-border)" }}>
              {t.blocs.slice(0, 3).map((b, i) => (
                <li key={i} className="text-[11px]" style={{ color: "var(--ff-text-muted)" }}>
                  <span className="font-mono uppercase" style={{ color: "var(--ff-amber)" }}>{b.jour}</span> · {b.titre}
                </li>
              ))}
              {t.blocs.length > 3 && (
                <li className="text-[11px] font-mono" style={{ color: "var(--ff-text-muted)" }}>
                  +{t.blocs.length - 3} autre(s)
                </li>
              )}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
