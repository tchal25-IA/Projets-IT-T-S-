import { Info, AlertTriangle, ShieldAlert } from "lucide-react";

type Variant = "finance" | "ai" | "data";

const CONTENT: Record<Variant, { icon: typeof Info; title: string; body: string }> = {
  finance: {
    icon: Info,
    title: "Information indicative",
    body: "Les calculs et simulations sont indicatifs et basés sur les informations que vous saisissez. Ils ne constituent pas un conseil fiscal, juridique ou financier personnalisé. Pour toute décision engageant votre responsabilité, rapprochez-vous des sources officielles et, le cas échéant, d'un professionnel habilité.",
  },
  ai: {
    icon: AlertTriangle,
    title: "Réponses générées par IA",
    body: "Les réponses sont produites par un modèle tiers (Google Gemini) : vos saisies lui sont transmises et peuvent être traitées hors de l'Union européenne. Les synthèses peuvent être incomplètes ou simplifiées. N'y incluez pas de données bancaires ni d'informations confidentielles, et vérifiez auprès des sources officielles avant toute décision. Voir notre politique de confidentialité.",
  },
  data: {
    icon: ShieldAlert,
    title: "Données personnelles",
    body: "Ne saisissez pas de données bancaires complètes ni d'informations confidentielles non nécessaires.",
  },
};

export function Disclaimer({ variant }: { variant: Variant }) {
  const { icon: Icon, title, body } = CONTENT[variant];
  return (
    <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm">
      <div className="flex gap-3">
        <Icon className="h-5 w-5 shrink-0 text-warning-foreground/80" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-muted-foreground leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}
