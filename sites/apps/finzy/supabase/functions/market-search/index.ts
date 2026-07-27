const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

// Get a crumb + cookie for Yahoo Finance authenticated endpoints
async function getYahooCrumb(): Promise<{ crumb: string; cookie: string } | null> {
  try {
    const resp1 = await fetch('https://fc.yahoo.com', { headers: { 'User-Agent': UA }, redirect: 'manual' });
    const cookies = resp1.headers.get('set-cookie') || '';
    await resp1.text().catch(() => {});
    
    const resp2 = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
      headers: { 'User-Agent': UA, Cookie: cookies },
    });
    if (!resp2.ok) return null;
    const crumb = await resp2.text();
    return { crumb, cookie: cookies };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, symbol } = await req.json();

    // ─── Detail mode ───
    if (symbol) {
      // Try authenticated quoteSummary first
      const auth = await getYahooCrumb();
      
      if (auth) {
        const modules = 'summaryProfile,financialData,defaultKeyStatistics,recommendationTrend,price,summaryDetail';
        const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(auth.crumb)}`;
        
        const response = await fetch(url, {
          headers: { 'User-Agent': UA, Cookie: auth.cookie },
        });

        if (response.ok) {
          const data = await response.json();
          const result = data.quoteSummary?.result?.[0];
          if (result) {
            const profile = result.summaryProfile || {};
            const financial = result.financialData || {};
            const stats = result.defaultKeyStatistics || {};
            const price = result.price || {};
            const detail = result.summaryDetail || {};
            const recommend = result.recommendationTrend?.trend?.[0] || {};

            const detail_data = {
              symbol: price.symbol || symbol,
              name: price.shortName || price.longName || symbol,
              currency: price.currency || 'USD',
              price: price.regularMarketPrice?.raw,
              change: price.regularMarketChange?.raw,
              changePercent: price.regularMarketChangePercent?.raw,
              marketCap: price.marketCap?.raw,
              sector: profile.sector || null,
              industry: profile.industry || null,
              country: profile.country || null,
              website: profile.website || null,
              description: profile.longBusinessSummary || null,
              pe: detail.trailingPE?.raw || null,
              forwardPE: stats.forwardPE?.raw || null,
              eps: stats.trailingEps?.raw || null,
              forwardEps: stats.forwardEps?.raw || null,
              dividendYield: detail.dividendYield?.raw || null,
              dividendRate: detail.dividendRate?.raw || null,
              beta: stats.beta?.raw || null,
              fiftyTwoWeekHigh: detail.fiftyTwoWeekHigh?.raw || null,
              fiftyTwoWeekLow: detail.fiftyTwoWeekLow?.raw || null,
              revenue: financial.totalRevenue?.raw || null,
              revenueGrowth: financial.revenueGrowth?.raw || null,
              profitMargin: financial.profitMargins?.raw || null,
              targetPrice: financial.targetMeanPrice?.raw || null,
              recommendationKey: financial.recommendationKey || null,
              analystBreakdown: {
                strongBuy: recommend.strongBuy || 0,
                buy: recommend.buy || 0,
                hold: recommend.hold || 0,
                sell: recommend.sell || 0,
                strongSell: recommend.strongSell || 0,
              },
              analystCount: (recommend.strongBuy || 0) + (recommend.buy || 0) + (recommend.hold || 0) + (recommend.sell || 0) + (recommend.strongSell || 0) || null,
            };

            return new Response(JSON.stringify({ success: true, data: detail_data }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } else {
          await response.text().catch(() => {});
        }
      }

      // Fallback to v8 chart for basic data
      const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
      const chartResp = await fetch(chartUrl, { headers: { 'User-Agent': UA } });
      
      if (!chartResp.ok) {
        const errText = await chartResp.text();
        throw new Error(`Yahoo chart error [${chartResp.status}]: ${errText}`);
      }
      
      const chartData = await chartResp.json();
      const meta = chartData.chart?.result?.[0]?.meta;
      
      if (!meta) {
        return new Response(JSON.stringify({ success: true, data: null }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const price = meta.regularMarketPrice;
      const prevClose = meta.chartPreviousClose || meta.previousClose;
      
      return new Response(JSON.stringify({
        success: true,
        data: {
          symbol: meta.symbol,
          name: meta.shortName || meta.longName || symbol,
          currency: meta.currency || 'USD',
          price,
          change: price - prevClose,
          changePercent: prevClose ? ((price - prevClose) / prevClose) * 100 : 0,
          marketCap: null,
          sector: null, industry: null, country: null, website: null, description: null,
          pe: null, forwardPE: null, eps: null, forwardEps: null,
          dividendYield: null, dividendRate: null, beta: null,
          fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || null,
          fiftyTwoWeekLow: meta.fiftyTwoWeekLow || null,
          revenue: null, revenueGrowth: null, profitMargin: null,
          targetPrice: null, recommendationKey: null,
          analystBreakdown: { strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0 },
          analystCount: null,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── Search mode ───
    if (query) {
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=15&newsCount=0`;
      const response = await fetch(url, { headers: { 'User-Agent': UA } });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Yahoo search error [${response.status}]: ${errText}`);
      }

      const data = await response.json();
      const quotes = (data.quotes || []).map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        type: q.quoteType,
        exchange: q.exchange,
        sector: q.sector || null,
        industry: q.industry || null,
      }));

      return new Response(JSON.stringify({ success: true, data: quotes }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Provide query or symbol parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in market search:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Search failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
