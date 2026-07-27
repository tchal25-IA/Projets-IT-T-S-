const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category = 'business', lang = 'fr' } = await req.json().catch(() => ({}));

    const apiKey = Deno.env.get('GNEWS_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'GNEWS_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=${lang}&max=20&token=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GNews API error [${response.status}]: ${errText}`);
    }

    const data = await response.json();

    const articles = (data.articles || []).map((a: any) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      image: a.image,
      source: a.source?.name || 'Unknown',
      publishedAt: a.publishedAt,
    }));

    return new Response(JSON.stringify({ success: true, data: articles }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch news' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
