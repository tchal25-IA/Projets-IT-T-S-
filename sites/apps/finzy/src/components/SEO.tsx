import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
}

const BASE_TITLE = 'Finzy';
const DEFAULT_DESCRIPTION = 'Gérez votre budget, patrimoine et investissements avec Finzy. Simulateurs financiers, suivi de projets et éducation financière personnalisée.';

export function SEO({ title, description = DEFAULT_DESCRIPTION, path = '/' }: SEOProps) {
  const fullTitle = title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} — Finances personnelles simplifiées`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <link rel="canonical" href={`https://finzy.app${path}`} />
    </Helmet>
  );
}
