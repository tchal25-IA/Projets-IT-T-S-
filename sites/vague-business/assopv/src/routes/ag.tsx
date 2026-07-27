import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Printer, Trash2 } from "lucide-react";

import { AGProvider, useAG, uid, CANTONS, type AgendaItem, type Attendee, type Lang } from "@/lib/ag-store";
import {
  convocationFR, convocationDE, agendaFR, agendaDE,
  presenceFR, presenceDE, pvFR, pvDE,
} from "@/lib/ag-templates";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/ag")({
  head: () => ({
    meta: [
      { title: "Préparer une AG — AssoPV" },
      { name: "description", content: "Assistant pour rédiger convocation, ordre du jour, liste de présence et procès-verbal d'assemblée générale." },
      { property: "og:title", content: "Préparer une AG — AssoPV" },
      { property: "og:description", content: "Assistant guidé pour produire les documents d'AG." },
    ],
  }),
  component: () => (
    <AGProvider>
      <Wizard />
    </AGProvider>
  ),
});

const STEPS = [
  { id: 1, label: "Association" },
  { id: 2, label: "Convocation" },
  { id: 3, label: "Ordre du jour" },
  { id: 4, label: "Présence & votes" },
  { id: 5, label: "Procès-verbal" },
  { id: 6, label: "Aperçu & export" },
];

function Wizard() {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-serif text-2xl font-semibold">
            Asso<span className="text-accent">PV</span>
          </Link>
          <p className="hidden text-sm text-muted-foreground md:block">
            Étape {step} sur {STEPS.length} — {STEPS[step - 1].label}
          </p>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-4">
          <div className="flex items-center gap-1">
            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s.id <= step ? "bg-accent" : "bg-border"
                }`}
                aria-label={`Aller à l'étape ${s.id}`}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 no-print">
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
        {step === 4 && <Step4 />}
        {step === 5 && <Step5 />}
        {step === 6 && <Step6 />}

        <div className="mt-12 flex items-center justify-between">
          <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
            ← Précédent
          </Button>
          {step < STEPS.length ? (
            <Button onClick={() => setStep((s) => s + 1)}>Continuer →</Button>
          ) : (
            <span className="text-sm text-muted-foreground">Dernière étape</span>
          )}
        </div>
      </main>

      <PrintablePack />
    </div>
  );
}

/* ---------------- Step 1 ---------------- */
function Step1() {
  const { data, update } = useAG();
  return (
    <StepShell title="Votre association" subtitle="Les informations qui apparaîtront en en-tête de chaque document.">
      <Field label="Nom de l'association">
        <Input value={data.assoName} onChange={(e) => update({ assoName: e.target.value })} placeholder="p.ex. FC Lausanne-Ouchy" />
      </Field>
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Field label="Siège (commune)">
          <Input value={data.siege} onChange={(e) => update({ siege: e.target.value })} placeholder="Lausanne" />
        </Field>
        <Field label="Canton">
          <Select value={data.canton} onValueChange={(v) => update({ canton: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CANTONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Date de l'AG">
          <Input type="date" value={data.agDate} onChange={(e) => update({ agDate: e.target.value })} />
        </Field>
        <Field label="Heure">
          <Input type="time" value={data.agTime} onChange={(e) => update({ agTime: e.target.value })} />
        </Field>
      </div>
      <Field label="Lieu de l'AG">
        <Input value={data.agLieu} onChange={(e) => update({ agLieu: e.target.value })} placeholder="Salle communale, Rue de..." />
      </Field>
      <Field label="Type d'assemblée">
        <RadioGroup value={data.agType} onValueChange={(v) => update({ agType: v as any })} className="flex gap-6">
          <label className="flex items-center gap-2"><RadioGroupItem value="ordinaire" /> Ordinaire</label>
          <label className="flex items-center gap-2"><RadioGroupItem value="extraordinaire" /> Extraordinaire</label>
        </RadioGroup>
      </Field>
      <Field label="Langue des documents générés">
        <RadioGroup value={data.lang} onValueChange={(v) => update({ lang: v as Lang })} className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2"><RadioGroupItem value="fr" /> Français</label>
          <label className="flex items-center gap-2"><RadioGroupItem value="de" /> Deutsch</label>
          <label className="flex items-center gap-2"><RadioGroupItem value="bilingual" /> Bilingue FR / DE côte à côte</label>
        </RadioGroup>
      </Field>
    </StepShell>
  );
}

/* ---------------- Step 2 ---------------- */
function Step2() {
  const { data, update } = useAG();
  return (
    <StepShell title="Convocation" subtitle="Le courrier envoyé aux membres pour annoncer l'AG.">
      <div className="rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-foreground">Délai légal :</strong> souvent 10 à 20 jours selon les statuts — à vérifier dans les statuts de votre association.
      </div>
      <Field label="Date d'envoi de la convocation">
        <Input type="date" value={data.convocationDate} onChange={(e) => update({ convocationDate: e.target.value })} />
      </Field>
      <Field label="Texte d'introduction">
        <Textarea rows={5} value={data.convocationIntro} onChange={(e) => update({ convocationIntro: e.target.value })} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Président·e (signature)">
          <Input value={data.signPresident} onChange={(e) => update({ signPresident: e.target.value })} placeholder="Prénom Nom" />
        </Field>
        <Field label="Secrétaire (signature)">
          <Input value={data.signSecretaire} onChange={(e) => update({ signSecretaire: e.target.value })} placeholder="Prénom Nom" />
        </Field>
      </div>
    </StepShell>
  );
}

/* ---------------- Step 3 ---------------- */
function Step3() {
  const { data, update } = useAG();
  const items = data.agenda;

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    update({ agenda: next });
  };
  const setItem = (i: number, patch: Partial<AgendaItem>) => {
    const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
    update({ agenda: next });
  };
  const add = () => update({ agenda: [...items, { id: uid(), title: "Nouveau point", notes: "", hasVote: false, vote: { pour: 0, contre: 0, abstention: 0 } }] });
  const remove = (i: number) => update({ agenda: items.filter((_, idx) => idx !== i) });

  return (
    <StepShell title="Ordre du jour" subtitle="Réorganisez, éditez, ajoutez ou supprimez les points de l'AG.">
      <div className="space-y-3">
        {items.map((it, i) => (
          <Card key={it.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 font-serif text-lg text-muted-foreground">{i + 1}.</div>
              <div className="flex-1">
                <Input value={it.title} onChange={(e) => setItem(i, { title: e.target.value })} />
                <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox checked={it.hasVote} onCheckedChange={(v) => setItem(i, { hasVote: !!v })} />
                  Point soumis au vote
                </label>
              </div>
              <div className="flex flex-col gap-1">
                <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === items.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(i)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Button variant="outline" onClick={add} className="mt-4"><Plus className="mr-2 h-4 w-4" /> Ajouter un point</Button>
    </StepShell>
  );
}

/* ---------------- Step 4 ---------------- */
function Step4() {
  const { data, update } = useAG();
  const atts = data.attendees;

  const setAt = (i: number, patch: Partial<Attendee>) =>
    update({ attendees: atts.map((a, idx) => (idx === i ? { ...a, ...patch } : a)) });
  const add = () => update({ attendees: [...atts, { id: uid(), name: "", voix: 1 }] });
  const remove = (i: number) => update({ attendees: atts.filter((_, idx) => idx !== i) });

  const voteItems = data.agenda.filter((a) => a.hasVote);
  const setVote = (id: string, patch: Partial<AgendaItem["vote"]>) => {
    update({
      agenda: data.agenda.map((it) => it.id === id ? { ...it, vote: { ...it.vote, ...patch } } : it),
    });
  };

  return (
    <StepShell title="Présence & votes" subtitle="Membres présents, quorum, et résultats des votes.">
      <section>
        <h3 className="font-serif text-xl">Membres présents</h3>
        <div className="mt-3 space-y-2">
          {atts.map((a, i) => (
            <div key={a.id} className="grid grid-cols-[1fr_100px_auto] gap-2">
              <Input placeholder="Nom Prénom" value={a.name} onChange={(e) => setAt(i, { name: e.target.value })} />
              <Input type="number" min={0} value={a.voix} onChange={(e) => setAt(i, { voix: Number(e.target.value) || 0 })} />
              <Button size="icon" variant="ghost" onClick={() => remove(i)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          {atts.length === 0 && <p className="text-sm text-muted-foreground">Aucun membre ajouté pour l'instant.</p>}
        </div>
        <Button variant="outline" onClick={add} className="mt-3"><Plus className="mr-2 h-4 w-4" /> Ajouter un membre</Button>
      </section>

      <Field label="Note sur le quorum">
        <Textarea rows={2} value={data.quorumNote} onChange={(e) => update({ quorumNote: e.target.value })} />
      </Field>

      <section>
        <h3 className="font-serif text-xl">Votes par point</h3>
        {voteItems.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Aucun point n'est marqué comme soumis au vote. Retournez à l'étape 3 pour en désigner.</p>}
        <div className="mt-3 space-y-3">
          {voteItems.map((it) => (
            <Card key={it.id} className="p-4">
              <p className="font-medium">{it.title}</p>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <Field label="Pour"><Input type="number" min={0} value={it.vote.pour} onChange={(e) => setVote(it.id, { pour: Number(e.target.value) || 0 })} /></Field>
                <Field label="Contre"><Input type="number" min={0} value={it.vote.contre} onChange={(e) => setVote(it.id, { contre: Number(e.target.value) || 0 })} /></Field>
                <Field label="Abstention"><Input type="number" min={0} value={it.vote.abstention} onChange={(e) => setVote(it.id, { abstention: Number(e.target.value) || 0 })} /></Field>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Résultat : <strong className="text-foreground">{it.vote.pour > it.vote.contre ? "adopté" : "rejeté"}</strong>
              </p>
            </Card>
          ))}
        </div>
      </section>
    </StepShell>
  );
}

/* ---------------- Step 5 ---------------- */
function Step5() {
  const { data, update } = useAG();
  const setItem = (id: string, patch: Partial<AgendaItem>) => {
    update({ agenda: data.agenda.map((it) => it.id === id ? { ...it, ...patch } : it) });
  };

  return (
    <StepShell title="Procès-verbal" subtitle="Complétez les décisions prises pour chaque point de l'ordre du jour.">
      <div className="space-y-3">
        {data.agenda.map((it, i) => (
          <Card key={it.id} className="p-4">
            <p className="font-medium">{i + 1}. {it.title}</p>
            <Textarea
              className="mt-3"
              rows={3}
              placeholder="Décisions, discussions, remarques…"
              value={it.notes}
              onChange={(e) => setItem(it.id, { notes: e.target.value })}
            />
            {it.hasVote && (
              <p className="mt-2 text-xs text-muted-foreground">
                Vote — Pour {it.vote.pour} · Contre {it.vote.contre} · Abstention {it.vote.abstention}
              </p>
            )}
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Lieu de clôture"><Input value={data.pvClosingLieu} onChange={(e) => update({ pvClosingLieu: e.target.value })} placeholder={data.agLieu} /></Field>
        <Field label="Date de clôture"><Input type="date" value={data.pvClosingDate} onChange={(e) => update({ pvClosingDate: e.target.value })} /></Field>
      </div>
    </StepShell>
  );
}

/* ---------------- Step 6 ---------------- */
function Step6() {
  const { data, update } = useAG();
  const [email, setEmail] = useState(data.email || "");

  const docs = useDocs();

  const save = () => {
    if (!email || !email.includes("@")) {
      toast.error("Merci d'entrer une adresse e-mail valide.");
      return;
    }
    update({ email });
    toast.success("Pack AG sauvegardé sur cet appareil ✓");
  };

  return (
    <StepShell title="Aperçu & export" subtitle="Vérifiez, imprimez ou enregistrez en PDF depuis votre navigateur.">
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Imprimer / PDF</Button>
        <Button variant="outline" asChild><Link to="/ag" onClick={() => setTimeout(() => window.scrollTo(0, 0), 0)}>Reprendre l'édition</Link></Button>
      </div>

      <div className="mt-8 space-y-6">
        {docs.map((doc) => (
          <Card key={doc.title} className="p-6">
            <p className="font-serif text-xl">{doc.title}</p>
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
{doc.body}
            </pre>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-6">
        <p className="font-serif text-lg">Sauvegarder le pack AG</p>
        <p className="mt-1 text-sm text-muted-foreground">Nous conservons vos données localement dans ce navigateur. Laissez votre e-mail pour être averti·e des mises à jour.</p>
        <div className="mt-4 flex gap-2">
          <Input type="email" placeholder="vous@asso.ch" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button onClick={save}>Sauvegarder</Button>
        </div>
      </Card>
    </StepShell>
  );
}

/* ---------------- Docs & Printable ---------------- */
function useDocs() {
  const { data } = useAG();
  return useMemo(() => {
    const wantFR = data.lang === "fr" || data.lang === "bilingual";
    const wantDE = data.lang === "de" || data.lang === "bilingual";
    const out: { title: string; body: string }[] = [];
    if (wantFR) {
      out.push({ title: "Convocation (FR)", body: convocationFR(data) });
      out.push({ title: "Ordre du jour (FR)", body: agendaFR(data) });
      out.push({ title: "Liste de présence (FR)", body: presenceFR(data) });
      out.push({ title: "Procès-verbal (FR)", body: pvFR(data) });
    }
    if (wantDE) {
      out.push({ title: "Einladung (DE)", body: convocationDE(data) });
      out.push({ title: "Traktandenliste (DE)", body: agendaDE(data) });
      out.push({ title: "Anwesenheitsliste (DE)", body: presenceDE(data) });
      out.push({ title: "Protokoll (DE)", body: pvDE(data) });
    }
    return out;
  }, [data]);
}

function PrintablePack() {
  const docs = useDocs();
  return (
    <div className="print-only">
      {docs.map((doc, i) => (
        <div key={i} className="print-page" style={{ padding: "0", fontFamily: "Georgia, serif" }}>
          <h2 style={{ fontSize: "18pt", marginBottom: "16pt", borderBottom: "1px solid #000", paddingBottom: "6pt" }}>{doc.title}</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "11pt", lineHeight: 1.5 }}>{doc.body}</pre>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Small UI helpers ---------------- */
function StepShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-serif text-3xl md:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
      <div className="mt-8 space-y-5">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
