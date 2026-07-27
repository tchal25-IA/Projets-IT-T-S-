import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/mentions")({
  head: () => ({
    meta: [
      { title: "Mentions légales — SiteConforme" },
      {
        name: "description",
        content: "Mentions légales et disclaimer : SiteConforme n'est pas un cabinet d'avocats.",
      },
      { property: "og:title", content: "Mentions légales — SiteConforme" },
      { property: "og:description", content: "Éditeur, hébergeur et disclaimer juridique." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MentionsPage,
});

function MentionsPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Mentions légales</h1>

        <div className="mt-8 rounded-xl border border-destructive/40 bg-destructive/5 p-5 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-destructive">Important — pas de conseil juridique</div>
            <p className="mt-1 text-foreground/90">
              SiteConforme est un prestataire technique. Nous ne sommes pas un cabinet d'avocats et
              nos livrables (audit, templates, correctifs) <strong>ne constituent pas un conseil
              juridique</strong>. Pour toute question ayant une portée juridique — contrat,
              contentieux, contrôle CNIL / PFPDT — consultez un avocat spécialisé en protection des
              données.
            </p>
          </div>
        </div>

        <div className="prose prose-slate mt-10 max-w-none text-sm text-foreground/90 space-y-6">
          <section>
            <h2 className="text-lg font-semibold">Éditeur</h2>
            <p>SiteConforme — service productisé de mise en conformité RGPD / nLPD pour sites web PME.</p>
            <p>Contact : contact@siteconforme.example</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Hébergement</h2>
            <p>Ce site est hébergé sur une infrastructure edge (Cloudflare Workers).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Propriété intellectuelle</h2>
            <p>
              L'ensemble des contenus (textes, checklists, visuels) est la propriété de SiteConforme.
              Toute reproduction sans autorisation est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Données personnelles</h2>
            <p>
              Les demandes envoyées via le formulaire sont utilisées uniquement pour répondre à votre
              demande. Aucune revente à des tiers. Vous pouvez demander l'accès ou la suppression de
              vos données à l'adresse de contact ci-dessus.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Limitation de responsabilité</h2>
            <p>
              SiteConforme met en œuvre les meilleures pratiques connues à la date de livraison. La
              conformité RGPD / nLPD est un processus continu : elle dépend aussi de l'usage que vous
              faites de votre site après notre intervention. Notre responsabilité est limitée au
              montant du package souscrit.
            </p>
          </section>
        </div>
      </section>
    </SiteLayout>
  );
}