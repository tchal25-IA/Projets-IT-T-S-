// Logo Phénix FusionFit — vectorisation fidèle du visuel officiel :
// 4 plumes en croissant par aile, tête de profil (crête à gauche, bec à
// droite), corps en goutte avec encoche en V, deux lames de queue détachées.
// Dégradé or clair → or foncé.
export function PhoenixLogo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="FusionFit Phénix"
    >
      <defs>
        <linearGradient id="ffgold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE082" />
          <stop offset="45%" stopColor="#F5B301" />
          <stop offset="100%" stopColor="#C97F03" />
        </linearGradient>
      </defs>

      {/* Aile gauche : 3 croissants + lame basse détachée */}
      <g fill="url(#ffgold)">
        <path d="M25 3 C11 17 5 36 11 55 C10 39 14 20 25 3 Z" />
        <path d="M34 11 C22 23 17 38 21 53 C20 39 24 25 34 11 Z" />
        <path d="M41 21 C32 30 28 40 31 51 C30 41 33 31 41 21 Z" />
        <path d="M25 57 C31 61 37 63 44 62 C38 66 30 64 25 57 Z" />
      </g>
      {/* Aile droite (miroir) */}
      <g fill="url(#ffgold)" transform="translate(100,0) scale(-1,1)">
        <path d="M25 3 C11 17 5 36 11 55 C10 39 14 20 25 3 Z" />
        <path d="M34 11 C22 23 17 38 21 53 C20 39 24 25 34 11 Z" />
        <path d="M41 21 C32 30 28 40 31 51 C30 41 33 31 41 21 Z" />
        <path d="M25 57 C31 61 37 63 44 62 C38 66 30 64 25 57 Z" />
      </g>

      {/* Tête de profil : crête flamme à gauche, bec vers la droite */}
      <path
        d="M46 22
           C42 20 39.5 17 39 13
           C42 15 44 15.5 45.5 15
           C44 12 44 9 45.5 6
           C47 9 49 11 51.5 11.5
           C56 12.5 59.5 14.5 61.5 17.5
           L53.5 18
           C52 19 51 20.5 50.8 22.5
           C49 22.8 47.5 22.6 46 22 Z"
        fill="url(#ffgold)"
      />

      {/* Corps en goutte avec encoche en V au bas */}
      <path
        d="M50 23
           C42.5 33 40.5 46 44.5 58
           L48 68 L50 63.5 L52 68 L55.5 58
           C59.5 46 57.5 33 50 23 Z"
        fill="url(#ffgold)"
      />

      {/* Lames de queue détachées */}
      <g fill="url(#ffgold)">
        <path d="M42 70 C43 78 45.5 84 49.5 89 C44.5 85 41.5 78 42 70 Z" />
        <path d="M58 70 C57 78 54.5 84 50.5 89 C55.5 85 58.5 78 58 70 Z" />
      </g>
    </svg>
  );
}

// Favicon (fond sombre arrondi + phénix), en data URI.
export const PHOENIX_FAVICON_DATA_URI =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFE082"/><stop offset="45%" stop-color="#F5B301"/><stop offset="100%" stop-color="#C97F03"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="#0a0a0f"/><g fill="url(#g)"><path d="M27 8 C15 20 10 37 15 54 C14 40 18 23 27 8 Z"/><path d="M35 15 C24 26 20 39 23 52 C22 40 26 27 35 15 Z"/><path d="M41 24 C33 32 30 41 32 51 C31 42 34 33 41 24 Z"/><g transform="translate(100,0) scale(-1,1)"><path d="M27 8 C15 20 10 37 15 54 C14 40 18 23 27 8 Z"/><path d="M35 15 C24 26 20 39 23 52 C22 40 26 27 35 15 Z"/><path d="M41 24 C33 32 30 41 32 51 C31 42 34 33 41 24 Z"/></g><path d="M46 26 C42 24 40 21.5 39.5 18 C42 19.5 44 20 45.5 19.5 C44 17 44 14.5 45.5 12 C47 14.5 48.8 16.2 51 16.7 C55 17.5 58 19.2 60 21.8 L53 22.3 C51.7 23.2 50.9 24.4 50.7 26.2 C49 26.5 47.5 26.4 46 26 Z"/><path d="M50 27 C43.5 36 42 47 45.5 57.5 L48.4 66 L50 62.2 L51.6 66 L54.5 57.5 C58 47 56.5 36 50 27 Z"/><path d="M43.5 68 C44.5 75 46.5 80 50 84.5 C45.5 81 43 75 43.5 68 Z"/><path d="M56.5 68 C55.5 75 53.5 80 50 84.5 C54.5 81 57 75 56.5 68 Z"/></g></svg>`
  );
