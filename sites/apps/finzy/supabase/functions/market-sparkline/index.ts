const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Map frontend period keys to Yahoo Finance range/interval
const PERIOD_MAP: Record<string, { range: string; interval: string }> = {
  '5d': { range: '5d', interval: '1d' },
  '1mo': { range: '1mo', interval: '1d' },
  '3mo': { range: '3mo', interval: '1wk' },
  '1y': { range: '1y', interval: '1wk' },
  '5y': { range: '5y', interval: '1mo' },
};

async function fetchSparkline(symbol: string, period: string) {
  const p = PERIOD_MAP[period] || PERIOD_MAP['1mo'];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${p.range}&interval=${p.interval}`;
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  if (!resp.ok) return null;
  const json = await resp.json();
  const result = json.chart?.result?.[0];
  if (!result) return null;

  const timestamps: number[] = result.timestamp || [];
  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];

  // Build clean array of {t, v} pairs, skipping nulls
  const points: { t: number; v: number }[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (closes[i] != null) {
      points.push({ t: timestamps[i], v: closes[i] as number });
    }
  }

  return { symbol, period, points };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const symbols: string[] = body.symbols || [];
    const period: string = body.period || '1mo';

    if (!symbols.length) {
      return new Response(JSON.stringify({ success: false, error: 'No symbols provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = await Promise.allSettled(symbols.map(s => fetchSparkline(s, period)));

    const data: Record<string, { t: number; v: number }[]> = {};
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value) {
        data[symbols[i]] = r.value.points;
      }
    });

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching sparklines:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
