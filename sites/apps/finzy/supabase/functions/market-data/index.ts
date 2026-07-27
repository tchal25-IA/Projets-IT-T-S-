const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type AssetInfo = { name: string; zone: string; category: string };

const INDICES: Record<string, AssetInfo> = {
  '^FCHI': { name: 'CAC 40', zone: '🇫🇷', category: 'Europe' },
  '^GDAXI': { name: 'DAX', zone: '🇩🇪', category: 'Europe' },
  '^SSMI': { name: 'SMI', zone: '🇨🇭', category: 'Europe' },
  '^STOXX': { name: 'STOXX 600', zone: '🇪🇺', category: 'Europe' },
  '^GSPC': { name: 'S&P 500', zone: '🇺🇸', category: 'US' },
  '^IXIC': { name: 'NASDAQ', zone: '🇺🇸', category: 'US' },
  '^DJI': { name: 'Dow Jones', zone: '🇺🇸', category: 'US' },
  '^N225': { name: 'Nikkei 225', zone: '🇯🇵', category: 'Asie' },
  'URTH': { name: 'MSCI World', zone: '🌍', category: 'Monde' },
  'EEM': { name: 'MSCI EM', zone: '🌍', category: 'Monde' },
};

// ETFs par secteur (US)
const ETFS_SECTEURS: Record<string, AssetInfo> = {
  'XLK': { name: 'Technology', zone: '🇺🇸', category: 'Secteurs' },
  'XLE': { name: 'Energy', zone: '🇺🇸', category: 'Secteurs' },
  'XLY': { name: 'Consumer Cyclical', zone: '🇺🇸', category: 'Secteurs' },
  'XLP': { name: 'Consumer Defensive', zone: '🇺🇸', category: 'Secteurs' },
  'XLC': { name: 'Communication', zone: '🇺🇸', category: 'Secteurs' },
  'XLI': { name: 'Industrials', zone: '🇺🇸', category: 'Secteurs' },
  'XLF': { name: 'Financials', zone: '🇺🇸', category: 'Secteurs' },
  'XLU': { name: 'Utilities', zone: '🇺🇸', category: 'Secteurs' },
  'XLB': { name: 'Materials', zone: '🇺🇸', category: 'Secteurs' },
  'XLRE': { name: 'Real Estate', zone: '🇺🇸', category: 'Secteurs' },
  'XLV': { name: 'Healthcare', zone: '🇺🇸', category: 'Secteurs' },
};

// ETFs par zone géographique
const ETFS_ZONES: Record<string, AssetInfo> = {
  'VTI': { name: 'US Total Market', zone: '🇺🇸', category: 'Zones' },
  'VEA': { name: 'Developed ex-US', zone: '🌍', category: 'Zones' },
  'VWO': { name: 'Emerging Markets', zone: '🌍', category: 'Zones' },
  'EFA': { name: 'Europe, Australasia, Far East', zone: '🌍', category: 'Zones' },
  'IEMG': { name: 'iShares EM', zone: '🌍', category: 'Zones' },
  'EWJ': { name: 'Japan', zone: '🇯🇵', category: 'Zones' },
  'EWG': { name: 'Germany', zone: '🇩🇪', category: 'Zones' },
  'EWU': { name: 'UK', zone: '🇬🇧', category: 'Zones' },
  'EWQ': { name: 'France', zone: '🇫🇷', category: 'Zones' },
};

// ETFs matières premières
const ETFS_MATERIAUX: Record<string, AssetInfo> = {
  'GC=F': { name: 'Or (Gold)', zone: '🪙', category: 'Matières' },
  'GLD': { name: 'SPDR Gold', zone: '🪙', category: 'Matières' },
  'SLV': { name: 'Silver', zone: '🪙', category: 'Matières' },
  'SI=F': { name: 'Argent (Silver)', zone: '🪙', category: 'Matières' },
  'CL=F': { name: 'Pétrole WTI', zone: '🛢️', category: 'Matières' },
  'USO': { name: 'Crude Oil', zone: '🛢️', category: 'Matières' },
  'DBC': { name: 'Commodities Diversified', zone: '📦', category: 'Matières' },
  'PDBC': { name: 'Commodities Optimised', zone: '📦', category: 'Matières' },
};

// ETFs crypto
const ETFS_CRYPTO: Record<string, AssetInfo> = {
  'BTC-USD': { name: 'Bitcoin', zone: '₿', category: 'Crypto' },
  'ETH-USD': { name: 'Ethereum', zone: 'Ξ', category: 'Crypto' },
  'SOL-USD': { name: 'Solana', zone: '◎', category: 'Crypto' },
  'XRP-USD': { name: 'XRP', zone: '✕', category: 'Crypto' },
};

// ETFs obligataires / Fixed income
const ETFS_OBLIGATAIRES: Record<string, AssetInfo> = {
  'TIP': { name: 'TIPS', zone: '📜', category: 'Fixed income' },
  'GOVT': { name: 'US Treasuries', zone: '📜', category: 'Fixed income' },
  'MUB': { name: 'Municipals', zone: '📜', category: 'Fixed income' },
  'CWB': { name: 'Convertibles', zone: '📜', category: 'Fixed income' },
  'HYG': { name: 'High Yield', zone: '📜', category: 'Fixed income' },
  'LQD': { name: 'Investment Grade', zone: '📜', category: 'Fixed income' },
  'BND': { name: 'Total Bond', zone: '📜', category: 'Fixed income' },
  'AGG': { name: 'US Aggregate', zone: '📜', category: 'Fixed income' },
};

// Taux des bons du Trésor (US, rendement en %)
const TRESOR_TAUX: Record<string, AssetInfo> = {
  '^IRX': { name: 'US 13 sem', zone: '🇺🇸', category: 'Taux' },
  '^FVX': { name: 'US 5Y', zone: '🇺🇸', category: 'Taux' },
  '^TNX': { name: 'US 10Y', zone: '🇺🇸', category: 'Taux' },
  '^TYX': { name: 'US 30Y', zone: '🇺🇸', category: 'Taux' },
};

const ALL_ASSETS: Record<string, AssetInfo> = {
  ...INDICES,
  ...ETFS_SECTEURS,
  ...ETFS_ZONES,
  ...ETFS_MATERIAUX,
  ...ETFS_CRYPTO,
  ...ETFS_OBLIGATAIRES,
  ...TRESOR_TAUX,
};

async function fetchChart(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  if (!resp.ok) return null;
  const json = await resp.json();
  const result = json.chart?.result?.[0];
  if (!result) return null;
  const meta = result.meta;
  const price = meta.regularMarketPrice;
  const prevClose = meta.chartPreviousClose || meta.previousClose;
  const change = price - prevClose;
  const changePercent = prevClose ? (change / prevClose) * 100 : 0;
  return {
    symbol: meta.symbol,
    price,
    previousClose: prevClose,
    change,
    changePercent,
    currency: meta.currency || 'USD',
    marketState: meta.currentTradingPeriod?.regular ? 'REGULAR' : 'CLOSED',
    updatedAt: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let symbolsToFetch = Object.keys(INDICES);
    
    // Parse body - must handle both JSON and empty bodies
    let body: Record<string, any> = {};
    try {
      const text = await req.text();
      if (text && text.trim()) {
        body = JSON.parse(text);
      }
    } catch {
      // ignore parse errors, use defaults
    }

    const datasets: string[] = body.datasets || [];
    const customSymbols: string[] = body.symbols || [];
    
    if (customSymbols.length > 0) {
      symbolsToFetch = customSymbols;
    } else if (datasets.length > 0) {
      const sets: Record<string, Record<string, AssetInfo>> = {
        indices: INDICES,
        etfs_secteurs: ETFS_SECTEURS,
        etfs_zones: ETFS_ZONES,
        etfs_materiaux: ETFS_MATERIAUX,
        etfs_crypto: ETFS_CRYPTO,
        etfs_obligataires: ETFS_OBLIGATAIRES,
        taux: TRESOR_TAUX,
      };
      const merged: Record<string, AssetInfo> = {};
      datasets.forEach((d) => {
        if (sets[d]) Object.assign(merged, sets[d]);
      });
      if (Object.keys(merged).length > 0) {
        symbolsToFetch = Object.keys(merged);
      }
    } else if (body.all) {
      symbolsToFetch = Object.keys(ALL_ASSETS);
    }

    const assetInfos = ALL_ASSETS;
    const results = await Promise.allSettled(symbolsToFetch.map((s) => fetchChart(s)));

    const data = results
      .map((r, i) => {
        if (r.status !== 'fulfilled' || !r.value) return null;
        const v = r.value;
        const info = assetInfos[symbolsToFetch[i]] || {
          name: v.symbol,
          zone: '•',
          category: 'Autres',
        };
        return {
          ...v,
          symbol: symbolsToFetch[i],
          name: info.name,
          zone: info.zone,
          category: info.category,
        };
      })
      .filter(Boolean);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
