import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FolderCog, Copy, Printer, ExternalLink, FileText, Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vie-admin")({
  head: () => ({
    meta: [
      { title: "Vie admin & pro — Quotidien IA" },
      {
        name: "description",
        content:
          "Générateur de modèles de courriers administratifs : résiliation, contestation, demande, attestation. Lien vers Paperasse.",
      },
      { property: "og:title", content: "Vie admin & pro — Quotidien IA" },
      {
        property: "og:description",
        content: "Modèles de courriers prêts à l'emploi et accès à Paperasse.",
      },
    ],
  }),
  component: VieAdminPage,
});

/* ─── Modèles de courriers ───────────────────────────────── */

type TplCtx = {
  expediteur: string;
  adresseExp: string;
  destinataire: string;
  adresseDest: string;
  objet: string;
  reference: string;
  date: string;
  detail: string;
};

type Template = {
  id: string;
  label: string;
  emoji: string;
  defaultObjet: string;
  needsRef: boolean;
  build: (c: TplCtx) => string;
};

const HEAD = (c: TplCtx) =>
  `${c.expediteur}
${c.adresseExp}

${c.destinataire}
${c.adresseDest}

${c.date ? `Fait le ${c.date}` : ""}

Objet : ${c.objet}${c.reference ? `
Référence : ${c.reference}` : ""}

Madame, Monsieur,`;

const FOOT = (c: TplCtx) =>
  `

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${c.expediteur}`;

const TEMPLATES: Template[] = [
  {
    id: "resiliation-bail",
    label: "Résiliation de bail",
    emoji: "🏠",
    defaultObjet: "Résiliation de bail — congé locataire",
    needsRef: true,
    build: (c) =>
      `${HEAD(c)}

Par la présente, je vous informe de ma décision de résilier le bail du logement situé à l'adresse ci-dessus, conformément aux dispositions légales en vigueur.

Je respecte le préavis applicable et resterai à votre disposition pour la réalisation de l'état des lieux de sortie.

${c.detail ? `Précisions : ${c.detail}\n` : ""}Merci de me confirmer la bonne réception du présent courrier.${FOOT(c)}`,
  },
  {
    id: "resiliation-abo",
    label: "Résiliation d'abonnement / contrat",
    emoji: "✂️",
    defaultObjet: "Résiliation de contrat",
    needsRef: true,
    build: (c) =>
      `${HEAD(c)}

Je vous prie de bien vouloir procéder à la résiliation du contrat référencé ci-dessus, à la prochaine échéance possible dans le respect des conditions générales.

${c.detail ? `Motif / précisions : ${c.detail}\n` : ""}Je vous remercie de me confirmer la date effective de résiliation ainsi que les modalités éventuelles de restitution du matériel.${FOOT(c)}`,
  },
  {
    id: "remboursement",
    label: "Demande de remboursement",
    emoji: "💶",
    defaultObjet: "Demande de remboursement",
    needsRef: true,
    build: (c) =>
      `${HEAD(c)}

Je sollicite par la présente le remboursement relatif au dossier référencé ci-dessus.

${c.detail ? `Détails : ${c.detail}\n` : ""}Vous trouverez en pièces jointes les justificatifs nécessaires au traitement de ma demande. Je vous remercie de procéder au virement sur le compte habituel.${FOOT(c)}`,
  },
  {
    id: "contestation",
    label: "Contestation / réclamation",
    emoji: "⚖️",
    defaultObjet: "Contestation",
    needsRef: true,
    build: (c) =>
      `${HEAD(c)}

Je conteste formellement le contenu du document / la décision référencée ci-dessus.

${c.detail ? `Motifs : ${c.detail}\n` : ""}Je vous demande de bien vouloir réexaminer ce dossier dans les meilleurs délais et de m'adresser une réponse écrite et motivée. À défaut de réponse satisfaisante, je me réserve le droit d'engager toute action utile à la défense de mes intérêts.${FOOT(c)}`,
  },
  {
    id: "attestation",
    label: "Demande d'attestation",
    emoji: "📜",
    defaultObjet: "Demande d'attestation",
    needsRef: false,
    build: (c) =>
      `${HEAD(c)}

Je vous prie de bien vouloir m'adresser une attestation concernant ma situation auprès de vos services.

${c.detail ? `Précisions : ${c.detail}\n` : ""}Ce document m'est nécessaire pour des démarches administratives. Je vous remercie par avance de votre réactivité.${FOOT(c)}`,
  },
  {
    id: "attestation-hebergement",
    label: "Attestation d'hébergement",
    emoji: "🏡",
    defaultObjet: "Attestation d'hébergement",
    needsRef: false,
    build: (c) =>
      `${c.expediteur}
${c.adresseExp}

${c.date ? `Fait le ${c.date}` : ""}

Objet : ${c.objet}

ATTESTATION SUR L'HONNEUR

Je soussigné(e) ${c.expediteur || "[Nom de l'hébergeant]"}, demeurant à l'adresse :
${c.adresseExp || "[Adresse complète de l'hébergeant]"}

certifie sur l'honneur héberger à mon domicile, à titre gratuit et de manière permanente :

${c.destinataire || "[Nom et prénom de la personne hébergée]"}
${c.adresseDest ? `né(e) le / à : ${c.adresseDest}` : "né(e) le [date] à [lieu]"}

depuis le ${c.detail || "[date d'entrée dans le logement]"}.

La présente attestation est délivrée pour servir et valoir ce que de droit, afin de justifier le domicile de la personne hébergée auprès des administrations et organismes qui en feraient la demande.

Je joins à la présente :
— une copie de ma pièce d'identité,
— un justificatif de domicile à mon nom de moins de trois mois.

Je suis informé(e) qu'une fausse attestation m'expose aux sanctions prévues par les articles 441-1 et suivants du Code pénal.

Fait pour servir et valoir ce que de droit.

Signature :


${c.expediteur}`,
  },
  {
    id: "changement-adresse",
    label: "Changement d'adresse",
    emoji: "📬",
    defaultObjet: "Changement d'adresse",
    needsRef: true,
    build: (c) =>
      `${HEAD(c)}

Je vous informe de mon changement d'adresse postale. Toute correspondance future devra être envoyée à la nouvelle adresse mentionnée en en-tête.

${c.detail ? `Date d'effet / précisions : ${c.detail}\n` : ""}Merci de mettre à jour mon dossier en conséquence et de m'en accuser réception.${FOOT(c)}`,
  },
  {
    id: "motivation",
    label: "Lettre de motivation",
    emoji: "💼",
    defaultObjet: "Candidature au poste de …",
    needsRef: false,
    build: (c) =>
      `${HEAD(c)}

Actuellement à la recherche d'une nouvelle opportunité professionnelle, je me permets de vous adresser ma candidature.

${c.detail ? `${c.detail}\n` : "Mon parcours et mes compétences correspondent aux exigences du poste, et je serais ravi(e) de pouvoir contribuer au développement de votre structure.\n"}
Je me tiens à votre disposition pour un entretien à votre convenance.${FOOT(c)}`,
  },
  {
    id: "mise-en-demeure",
    label: "Mise en demeure",
    emoji: "🚨",
    defaultObjet: "Mise en demeure",
    needsRef: true,
    build: (c) =>
      `${HEAD(c)}

Malgré mes précédentes relances restées sans réponse satisfaisante, je vous mets en demeure, par la présente lettre recommandée avec accusé de réception, d'exécuter vos obligations dans un délai de quinze (15) jours à compter de la réception de ce courrier.

${c.detail ? `Objet du litige : ${c.detail}\n` : ""}À défaut, je me réserve le droit d'engager toutes les procédures nécessaires à la défense de mes intérêts, y compris par voie judiciaire.${FOOT(c)}`,
  },
];

function todayFR(): string {
  const d = new Date();
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function VieAdminPage() {
  const [tplId, setTplId] = useState(TEMPLATES[0].id);
  const [ctx, setCtx] = useState<TplCtx>({
    expediteur: "",
    adresseExp: "",
    destinataire: "",
    adresseDest: "",
    objet: TEMPLATES[0].defaultObjet,
    reference: "",
    date: todayFR(),
    detail: "",
  });
  const [copied, setCopied] = useState(false);

  const tpl = useMemo(() => TEMPLATES.find((t) => t.id === tplId)!, [tplId]);
  const letter = useMemo(() => tpl.build(ctx), [tpl, ctx]);

  const selectTpl = (id: string) => {
    const next = TEMPLATES.find((t) => t.id === id)!;
    setTplId(id);
    setCtx((c) => ({ ...c, objet: next.defaultObjet }));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard indispo */
    }
  };

  const update = <K extends keyof TplCtx>(k: K, v: TplCtx[K]) =>
    setCtx((c) => ({ ...c, [k]: v }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FolderCog}
        eyebrow="Module"
        title="Vie admin & pro"
        description="Générateur de courriers administratifs prêts à imprimer ou copier."
      />

      {/* Lien Paperasse (intégré nativement) */}
      <Link
        to="/paperasse"
        className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-gradient-to-br from-primary-soft to-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/50"
      >
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Intégré · 9 agents IA
            </div>
            <h2 className="font-display text-lg font-bold">Paperasse</h2>
            <p className="text-xs text-muted-foreground">
              Consultez nos experts IA : fiscaliste, comptable, notaire, syndic, contrôleur fiscal, CAC, banque d'affaires, banque privée, private equity.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-card">
          Ouvrir Paperasse
        </span>
      </Link>

      {/* Générateur */}
      <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Formulaire */}
        <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-card">
          <div>
            <h3 className="font-display text-base font-bold">Modèle de courrier</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Choisissez un sujet, remplissez les champs, le courrier se génère à droite.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sujet
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTpl(t.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-left text-[11px] transition-colors",
                    tplId === t.id
                      ? "border-primary bg-primary-soft font-semibold text-primary"
                      : "bg-background hover:bg-muted",
                  )}
                >
                  <span>{t.emoji}</span>
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Field
            label="Expéditeur (nom)"
            value={ctx.expediteur}
            onChange={(v) => update("expediteur", v)}
            placeholder="Jean Dupont"
          />
          <Field
            label="Adresse expéditeur"
            value={ctx.adresseExp}
            onChange={(v) => update("adresseExp", v)}
            placeholder="12 rue de la Paix, 75002 Paris"
            multiline
          />
          <Field
            label="Destinataire"
            value={ctx.destinataire}
            onChange={(v) => update("destinataire", v)}
            placeholder="Service client SFR"
          />
          <Field
            label="Adresse destinataire"
            value={ctx.adresseDest}
            onChange={(v) => update("adresseDest", v)}
            placeholder="TSA 73917, 62978 Arras Cedex 9"
            multiline
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Date"
              value={ctx.date}
              onChange={(v) => update("date", v)}
              placeholder={todayFR()}
            />
            {tpl.needsRef && (
              <Field
                label="Référence / n° contrat"
                value={ctx.reference}
                onChange={(v) => update("reference", v)}
                placeholder="N° 123456"
              />
            )}
          </div>
          <Field
            label="Objet"
            value={ctx.objet}
            onChange={(v) => update("objet", v)}
            placeholder={tpl.defaultObjet}
          />
          <Field
            label="Détails / précisions (facultatif)"
            value={ctx.detail}
            onChange={(v) => update("detail", v)}
            placeholder="Précisez le contexte, les montants, dates…"
            multiline
            rows={4}
          />
        </div>

        {/* Aperçu */}
        <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/50 px-4 py-3">
            <div>
              <h3 className="font-display text-base font-bold">{tpl.emoji} {tpl.label}</h3>
              <p className="text-[11px] text-muted-foreground">
                Aperçu généré en direct — copiez ou imprimez.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copié !" : "Copier"}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-card print:hidden"
              >
                <Printer className="h-3.5 w-3.5" /> Imprimer
              </button>
            </div>
          </div>
          <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap p-6 font-serif text-sm leading-relaxed text-foreground">
{letter}
          </pre>
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        ⚠️ Ces modèles sont indicatifs. Pour les courriers à valeur juridique (mise en demeure,
        contestation…), envoyez en recommandé avec accusé de réception et conservez une copie.
      </p>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, multiline, rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}) {
  const cls =
    "w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows ?? 2}
          className={cn(cls, "resize-y")}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  );
}
