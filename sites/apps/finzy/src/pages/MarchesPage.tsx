import { useState, useEffect, useCallback, useMemo } from 'react';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Newspaper, TrendingUp, TrendingDown, Search, RefreshCw, ExternalLink,
  Building2, Globe, BarChart3, Info, ChevronRight, ArrowUpRight, ArrowDownRight, Minus, Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import securitiesData from '@/data/securities.json';

// Type for local securities database
interface LocalSecurity {
  name: string;
  isin: string;
  symbol: string;
  type: string;
  sector_zone: string;
  composition: string;
}

// ─── Types ───
interface MarketQuote {
  symbol: string; name: string; zone: string; category: string;
  price: number; change: number; changePercent: number;
  previousClose: number; currency: string; marketState: string; updatedAt: string | null;
}

type SparklinePeriod = '5d' | '1mo' | '3mo' | '1y' | '5y';
const PERIOD_LABELS: { key: SparklinePeriod; label: string }[] = [
  { key: '5d', label: '5J' },
  { key: '1mo', label: '1M' },
  { key: '3mo', label: '3M' },
  { key: '1y', label: '1A' },
  { key: '5y', label: '5A' },
];

interface NewsArticle {
  title: string; description: string; url: string; image: string;
  source: string; publishedAt: string;
}

interface SearchResult {
  symbol: string; name: string; type: string; exchange: string;
  sector: string | null; industry: string | null;
}

interface StockDetail {
  symbol: string; name: string; currency: string;
  price: number; change: number; changePercent: number; marketCap: number;
  sector: string | null; industry: string | null; country: string | null;
  website: string | null; description: string | null; descriptionFr: string | null;
  sectorFr: string | null; industryFr: string | null;
  pe: number | null; forwardPE: number | null; eps: number | null; forwardEps: number | null;
  dividendYield: number | null; dividendRate: number | null; beta: number | null;
  fiftyTwoWeekHigh: number | null; fiftyTwoWeekLow: number | null;
  revenue: number | null; revenueGrowth: number | null; profitMargin: number | null;
  targetPrice: number | null; recommendationMean: number | null; recommendationKey: string | null;
  analystCount: number | null;
  analystBreakdown: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number };
  isIndex?: boolean;
}

// ─── Glossary data ───
const GLOSSARY = [
  { term: 'PER (Price/Earnings)', desc: "Ratio cours/bénéfice. Un PER de 15 signifie qu'il faut 15 ans de bénéfices pour rembourser le prix de l'action. Plus il est bas, plus l'action est « bon marché » par rapport à ses bénéfices." },
  { term: 'BPA / EPS', desc: 'Bénéfice Net Par Action. Le bénéfice total divisé par le nombre d\'actions. Indicateur clé de rentabilité pour les actionnaires.' },
  { term: 'Capitalisation boursière', desc: 'Valeur totale d\'une entreprise en bourse = cours × nombre d\'actions. Permet de classer les entreprises par taille (small/mid/large cap).' },
  { term: 'Rendement du dividende', desc: 'Dividende annuel / cours de l\'action. Un rendement de 3% signifie que vous recevez 3€ pour chaque 100€ investis, sans vendre vos actions.' },
  { term: 'Chiffre d\'affaires (Revenue)', desc: 'Total des ventes d\'une entreprise sur une période. C\'est le "top line" — avant toute déduction de coûts.' },
  { term: 'Résultat net (Net Income)', desc: 'Le bénéfice final après toutes les charges, impôts et intérêts. C\'est ce qui reste pour les actionnaires.' },
  { term: 'Marge bénéficiaire', desc: 'Résultat net / Chiffre d\'affaires. Mesure le pourcentage de chaque euro de vente qui devient du profit.' },
  { term: 'Beta', desc: 'Mesure la volatilité d\'une action par rapport au marché. Beta > 1 = plus volatile que le marché, Beta < 1 = moins volatile.' },
  { term: 'Consensus analystes', desc: 'Moyenne des recommandations des analystes financiers (Acheter, Conserver, Vendre). Donne une idée du sentiment du marché sur un titre.' },
  { term: 'Objectif de cours', desc: 'Prix cible moyen fixé par les analystes à 12 mois. Représente la valeur estimée de l\'action selon les professionnels.' },
];

// ─── Helpers ───
function formatNum(n: number | null | undefined, opts?: Intl.NumberFormatOptions) {
  if (n == null) return '—';
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 2, ...opts });
}

function formatBigNum(n: number | null | undefined) {
  if (n == null) return '—';
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)} T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} Mds`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} M`;
  return formatNum(n);
}

function formatPercent(n: number | null | undefined) {
  if (n == null) return '—';
  return `${(n * 100).toFixed(2)}%`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

// ─── Components ───
function MiniSparkline({ points, isUp }: { points: { v: number }[]; isUp: boolean }) {
  if (!points.length) return null;
  return (
    <div className="w-20 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={isUp ? 'sparkUp' : 'sparkDown'} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isUp ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} stopOpacity={0.3} />
              <stop offset="100%" stopColor={isUp ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Area
            type="monotone"
            dataKey="v"
            stroke={isUp ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
            strokeWidth={1.5}
            fill={`url(#${isUp ? 'sparkUp' : 'sparkDown'})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function QuoteCard({ q, sparkData, periodPct }: { q: MarketQuote; sparkData?: { v: number }[]; periodPct?: number | null }) {
  const usePeriodPct = periodPct != null;
  const displayPct = usePeriodPct ? periodPct : q.changePercent;
  const isUp = displayPct >= 0;
  const sparkIsUp = sparkData && sparkData.length >= 2 ? sparkData[sparkData.length - 1].v >= sparkData[0].v : isUp;
  return (
    <Card className="p-3 flex items-center justify-between gap-2 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg">{q.zone}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{q.name}</p>
          <p className="text-[10px] text-muted-foreground">{q.symbol}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {sparkData && <MiniSparkline points={sparkData} isUp={sparkIsUp} />}
        <div className="text-right shrink-0">
          <p className="text-sm font-bold tabular-nums">{formatNum(q.price)}</p>
          <div className={cn('flex items-center gap-0.5 text-xs font-semibold', isUp ? 'text-emerald-500' : 'text-destructive')}>
            {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            <span>{isUp ? '+' : ''}{displayPct?.toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer" className="block">
      <Card className="p-3 hover:bg-muted/50 transition-colors flex gap-3">
        {article.image && (
          <img src={article.image} alt="" className="w-20 h-14 rounded object-cover shrink-0" loading="lazy" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold line-clamp-2 leading-tight">{article.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-[10px]">{article.source}</Badge>
            <span className="text-[10px] text-muted-foreground">{timeAgo(article.publishedAt)}</span>
          </div>
        </div>
        <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
      </Card>
    </a>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function AnalystBar({ breakdown }: { breakdown: StockDetail['analystBreakdown'] }) {
  const total = breakdown.strongBuy + breakdown.buy + breakdown.hold + breakdown.sell + breakdown.strongSell;
  if (!total) return <p className="text-xs text-muted-foreground">Aucune donnée</p>;
  const pcts = {
    strongBuy: (breakdown.strongBuy / total) * 100,
    buy: (breakdown.buy / total) * 100,
    hold: (breakdown.hold / total) * 100,
    sell: (breakdown.sell / total) * 100,
    strongSell: (breakdown.strongSell / total) * 100,
  };
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden">
        <div className="bg-emerald-600" style={{ width: `${pcts.strongBuy}%` }} />
        <div className="bg-emerald-400" style={{ width: `${pcts.buy}%` }} />
        <div className="bg-yellow-400" style={{ width: `${pcts.hold}%` }} />
        <div className="bg-orange-400" style={{ width: `${pcts.sell}%` }} />
        <div className="bg-red-500" style={{ width: `${pcts.strongSell}%` }} />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
        <span>Achat fort ({breakdown.strongBuy})</span>
        <span>Achat ({breakdown.buy})</span>
        <span>Neutre ({breakdown.hold})</span>
        <span>Vente ({breakdown.sell})</span>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function MarchesPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState('indices');

  // Indices state
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(true);

  // News state
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Detail dialog
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [detail, setDetail] = useState<StockDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Glossary
  const [showGlossary, setShowGlossary] = useState(false);

  // Sparkline
  const [sparkPeriod, setSparkPeriod] = useState<SparklinePeriod>('1mo');
  const [sparkData, setSparkData] = useState<Record<string, { v: number }[]>>({});
  const [loadingSpark, setLoadingSpark] = useState(false);

  const fetchQuotes = useCallback(async () => {
    setLoadingQuotes(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-data');
      if (error) throw error;
      if (data?.success) setQuotes(data.data);
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Impossible de charger les indices', variant: 'destructive' });
    } finally {
      setLoadingQuotes(false);
    }
  }, [toast]);

  const fetchNews = useCallback(async () => {
    setLoadingNews(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-news', {
        body: { category: 'business', lang: 'fr' },
      });
      if (error) throw error;
      if (data?.success) setNews(data.data);
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Impossible de charger les actualités', variant: 'destructive' });
    } finally {
      setLoadingNews(false);
    }
  }, [toast]);

  const fetchSparklines = useCallback(async (symbols: string[], period: SparklinePeriod) => {
    if (!symbols.length) return;
    setLoadingSpark(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-sparkline', {
        body: { symbols, period },
      });
      if (error) throw error;
      if (data?.success) setSparkData(data.data);
    } catch (e) {
      console.error('Sparkline error:', e);
    } finally {
      setLoadingSpark(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
    fetchNews();
  }, [fetchQuotes, fetchNews]);

  // Fetch sparklines when quotes load or period changes
  useEffect(() => {
    if (quotes.length > 0) {
      fetchSparklines(quotes.map(q => q.symbol), sparkPeriod);
    }
  }, [quotes, sparkPeriod, fetchSparklines]);

  // Auto-refresh quotes every 60s
  useEffect(() => {
    const interval = setInterval(fetchQuotes, 60000);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  // Search in local database first
  const searchLocalDatabase = (query: string): SearchResult[] => {
    const normalizedQuery = query.toLowerCase().trim();
    const securities = securitiesData as LocalSecurity[];
    
    // Search by ISIN (exact match)
    const byIsin = securities.filter(s => s.isin.toLowerCase() === normalizedQuery);
    if (byIsin.length > 0) {
      return byIsin.map(s => ({
        symbol: s.symbol,
        name: s.name,
        type: s.type === 'INDICE' ? 'INDEX' : s.type === 'ACTION' ? 'EQUITY' : s.type,
        exchange: s.sector_zone.split('–')[0]?.trim() || '',
        sector: s.sector_zone,
        industry: s.composition || null,
      }));
    }
    
    // Search by name (partial match)
    const byName = securities.filter(s => 
      s.name.toLowerCase().includes(normalizedQuery) ||
      s.symbol.toLowerCase().includes(normalizedQuery)
    );
    
    // Sort by relevance: exact match first, then starts with, then contains
    const sorted = byName.sort((a, b) => {
      const aNameLower = a.name.toLowerCase();
      const bNameLower = b.name.toLowerCase();
      
      // Exact match
      if (aNameLower === normalizedQuery) return -1;
      if (bNameLower === normalizedQuery) return 1;
      
      // Starts with
      if (aNameLower.startsWith(normalizedQuery) && !bNameLower.startsWith(normalizedQuery)) return -1;
      if (bNameLower.startsWith(normalizedQuery) && !aNameLower.startsWith(normalizedQuery)) return 1;
      
      // By name length (shorter = more relevant)
      return a.name.length - b.name.length;
    });
    
    return sorted.slice(0, 10).map(s => ({
      symbol: s.symbol,
      name: s.name,
      type: s.type === 'INDICE' ? 'INDEX' : s.type === 'ACTION' ? 'EQUITY' : s.type,
      exchange: s.sector_zone.split('–')[0]?.trim() || '',
      sector: s.sector_zone,
      industry: s.composition || null,
    }));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoadingSearch(true);
    
    try {
      // 1. Search local database first
      const localResults = searchLocalDatabase(searchQuery);
      
      if (localResults.length > 0) {
        // Found in local database - use these results
        setSearchResults(localResults);
        setLoadingSearch(false);
        return;
      }
      
      // 2. Fallback to API if not found locally
      const { data, error } = await supabase.functions.invoke('market-search', {
        body: { query: searchQuery },
      });
      if (error) throw error;
      if (data?.success) {
        const allowedTypes = ['EQUITY', 'INDEX', 'ETF', 'MUTUALFUND'];
        const filtered = (data.data as SearchResult[])
          .filter(r => allowedTypes.includes(r.type.toUpperCase()))
          .reduce((acc: SearchResult[], curr) => {
            const normalizedName = curr.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const exists = acc.some(r => r.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedName);
            if (!exists) acc.push(curr);
            return acc;
          }, [])
          .slice(0, 15);
        setSearchResults(filtered);
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Recherche échouée', variant: 'destructive' });
    } finally {
      setLoadingSearch(false);
    }
  };

  const openDetail = async (symbol: string) => {
    setSelectedSymbol(symbol);
    setDetail(null);
    setLoadingDetail(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-search', {
        body: { symbol },
      });
      if (error) throw error;
      if (data?.success && data.data) {
        const isIndex = symbol.startsWith('^') || ['URTH', 'EEM'].includes(symbol);
        const d = { ...data.data, isIndex, descriptionFr: null as string | null, sectorFr: null as string | null, industryFr: null as string | null };

        // Build a single translation request for all English fields
        const toTranslate: string[] = [];
        const keys: string[] = [];
        if (d.description) { toTranslate.push(d.description); keys.push('description'); }
        if (d.sector) { toTranslate.push(d.sector); keys.push('sector'); }
        if (d.industry) { toTranslate.push(d.industry); keys.push('industry'); }

        if (toTranslate.length > 0) {
          try {
            const prompt = `Traduis chaque ligne suivante en français. Réponds avec exactement ${toTranslate.length} ligne(s), une traduction par ligne, sans numérotation ni commentaire.\n\n${toTranslate.join('\n---\n')}`;
            const { data: aiData } = await supabase.functions.invoke('ai-chat', {
              body: {
                messages: [{ role: 'user', content: prompt }],
                context: { stream: false },
              },
            });
            if (aiData?.reply) {
              const parts = aiData.reply.split(/\n[-—]*\n|\n/).filter((s: string) => s.trim());
              keys.forEach((k, i) => {
                if (parts[i]) {
                  if (k === 'description') d.descriptionFr = parts[i].trim();
                  if (k === 'sector') d.sectorFr = parts[i].trim();
                  if (k === 'industry') d.industryFr = parts[i].trim();
                }
              });
            }
          } catch { /* ignore translation errors */ }
        }

        setDetail(d);
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Impossible de charger les détails', variant: 'destructive' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const groupedQuotes = quotes.reduce<Record<string, MarketQuote[]>>((acc, q) => {
    (acc[q.category] = acc[q.category] || []).push(q);
    return acc;
  }, {});

  return (
    <div className="space-y-6 pb-24">
      <SEO title="Marchés" description="Suivez les marchés financiers en temps réel : indices, actions, crypto et matières premières." path="/marches" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marchés</h1>
          <p className="text-sm text-muted-foreground">Indices, actualités & répertoire</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowGlossary(true)}>
          <Info className="h-4 w-4 mr-1" /> Glossaire
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="indices" className="gap-1"><TrendingUp className="h-3.5 w-3.5" /> Indices</TabsTrigger>
          <TabsTrigger value="news" className="gap-1"><Newspaper className="h-3.5 w-3.5" /> Actus</TabsTrigger>
          <TabsTrigger value="search" className="gap-1"><Search className="h-3.5 w-3.5" /> Répertoire</TabsTrigger>
        </TabsList>

        {/* ─── INDICES TAB ─── */}
        <TabsContent value="indices" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {PERIOD_LABELS.map(p => (
                <Button
                  key={p.key}
                  variant={sparkPeriod === p.key ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setSparkPeriod(p.key)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={fetchQuotes} disabled={loadingQuotes}>
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1', loadingQuotes && 'animate-spin')} /> Actualiser
            </Button>
          </div>

          {loadingQuotes ? (
            <div className="grid gap-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : (
            Object.entries(groupedQuotes).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{category}</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {items.map(q => (
                    <div key={q.symbol} onClick={() => openDetail(q.symbol)} className="cursor-pointer">
                      <QuoteCard q={q} sparkData={sparkData[q.symbol]} periodPct={(() => {
                        const pts = sparkData[q.symbol];
                        if (!pts || pts.length < 2) return null;
                        const first = pts[0].v;
                        const last = pts[pts.length - 1].v;
                        return first ? ((last - first) / first) * 100 : null;
                      })()} />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {quotes.length > 0 && quotes[0].updatedAt && (
            <p className="text-[10px] text-muted-foreground text-center">
              Dernière mise à jour : {timeAgo(quotes[0].updatedAt)} • Données différées ~15min
            </p>
          )}
        </TabsContent>

        {/* ─── NEWS TAB ─── */}
        <TabsContent value="news" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button variant="ghost" size="sm" onClick={fetchNews} disabled={loadingNews}>
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1', loadingNews && 'animate-spin')} /> Actualiser
            </Button>
          </div>

          {loadingNews ? (
            <div className="grid gap-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : news.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Aucune actualité disponible</p>
          ) : (
            <div className="grid gap-2">
              {news.map((a, i) => <NewsCard key={i} article={a} />)}
            </div>
          )}
        </TabsContent>

        {/* ─── SEARCH TAB ─── */}
        <TabsContent value="search" className="mt-4 space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher une entreprise ou un indice (ex: Apple, LVMH, CAC 40...)"
              className="flex-1"
            />
            <Button type="submit" disabled={loadingSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {loadingSearch ? (
            <div className="grid gap-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid gap-2">
              {searchResults.map(r => {
                const isETF = r.type.toUpperCase() === 'ETF' || r.type.toUpperCase() === 'MUTUALFUND';
                return (
                  <Card
                    key={r.symbol}
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => openDetail(r.symbol)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{r.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{r.symbol}</Badge>
                        <Badge variant={isETF ? 'default' : 'secondary'} className="text-[10px]">
                          {r.type === 'EQUITY' ? 'Action' : r.type === 'INDEX' ? 'Indice' : r.type === 'ETF' ? 'ETF' : r.type === 'MUTUALFUND' ? 'Fonds' : r.type}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{r.exchange}</span>
                        {r.sector && <span className="text-[10px] text-muted-foreground">• {r.sector}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isETF && (
                        <a
                          href={`https://www.justetf.com/fr/find-etf.html?query=${encodeURIComponent(r.symbol)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                        >
                          <ExternalLink className="h-3 w-3" /> justETF
                        </a>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : searchQuery && !loadingSearch ? (
            <p className="text-center text-muted-foreground py-8">Aucun résultat pour « {searchQuery} »</p>
          ) : (
            <div className="text-center py-8 space-y-3">
              <Building2 className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Recherchez un titre pour voir ses fondamentaux</p>
              <p className="text-xs text-muted-foreground">Actions, indices, ETF et fonds</p>
              <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                <Database className="h-3 w-3" />
                <span>Base locale : {(securitiesData as LocalSecurity[]).length} titres référencés</span>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── DETAIL DIALOG ─── */}
      <Dialog open={!!selectedSymbol} onOpenChange={(open) => !open && setSelectedSymbol(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {loadingDetail ? (
            <div className="space-y-3 py-6">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : detail ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {detail.name}
                  <Badge variant="outline" className="text-xs">{detail.symbol}</Badge>
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {detail.sector && <Badge variant="secondary" className="text-[10px]">{detail.sectorFr || detail.sector}</Badge>}
                  {detail.industry && <Badge variant="outline" className="text-[10px]">{detail.industryFr || detail.industry}</Badge>}
                  {detail.country && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Globe className="h-3 w-3" /> {detail.country}</span>}
                </div>
              </DialogHeader>

              {/* Price */}
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-3xl font-bold tabular-nums">{formatNum(detail.price)}</span>
                <span className="text-sm text-muted-foreground">{detail.currency}</span>
                <span className={cn('text-sm font-semibold', detail.change >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                  {detail.change >= 0 ? '+' : ''}{detail.changePercent?.toFixed(2)}%
                </span>
              </div>

              {/* Potential upside/downside */}
              {!detail.isIndex && detail.targetPrice != null && detail.price > 0 && (
                <div className="mt-1">
                  {(() => {
                    const pct = ((detail.targetPrice - detail.price) / detail.price) * 100;
                    const isUp = pct >= 0;
                    return (
                      <span className={cn('text-xs font-medium', isUp ? 'text-emerald-500' : 'text-destructive')}>
                        Potentiel {isUp ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}% vs objectif analystes ({formatNum(detail.targetPrice)} {detail.currency})
                      </span>
                    );
                  })()}
                </div>
              )}

              {/* 52-week range */}
              {detail.fiftyTwoWeekLow != null && detail.fiftyTwoWeekHigh != null && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1">Fourchette 52 semaines</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] tabular-nums">{formatNum(detail.fiftyTwoWeekLow)}</span>
                    <div className="flex-1 relative">
                      <Progress
                        value={((detail.price - detail.fiftyTwoWeekLow) / (detail.fiftyTwoWeekHigh - detail.fiftyTwoWeekLow)) * 100}
                        className="h-2"
                      />
                    </div>
                    <span className="text-[10px] tabular-nums">{formatNum(detail.fiftyTwoWeekHigh)}</span>
                  </div>
                </div>
              )}

              <Separator className="my-3" />

              {/* Key stats - hidden for indices */}
              {!detail.isIndex && (
                <>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fondamentaux</h4>
                  <div className="grid grid-cols-2 gap-x-6">
                    <DetailStat label="Capitalisation" value={formatBigNum(detail.marketCap)} />
                    <DetailStat label="PER" value={detail.pe ? formatNum(detail.pe) : '—'} />
                    <DetailStat label="PER forward" value={detail.forwardPE ? formatNum(detail.forwardPE) : '—'} />
                    <DetailStat label="BPA (EPS)" value={detail.eps ? formatNum(detail.eps) : '—'} />
                    <DetailStat label="BPA forward" value={detail.forwardEps ? formatNum(detail.forwardEps) : '—'} />
                    <DetailStat label="Dividende" value={detail.dividendRate ? `${formatNum(detail.dividendRate)} (${formatPercent(detail.dividendYield)})` : '—'} />
                    <DetailStat label="CA (Revenue)" value={formatBigNum(detail.revenue)} />
                    <DetailStat label="Croissance CA" value={detail.revenueGrowth ? formatPercent(detail.revenueGrowth) : '—'} />
                    <DetailStat label="Marge nette" value={detail.profitMargin ? formatPercent(detail.profitMargin) : '—'} />
                    <DetailStat label="Beta" value={detail.beta ? formatNum(detail.beta) : '—'} />
                  </div>

                  {/* Quick verdict summary */}
                  {(detail.pe || detail.dividendYield) && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/50 space-y-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Résumé rapide</p>
                      {detail.pe && (
                        <p className="text-xs text-muted-foreground">
                          💰 PER de {formatNum(detail.pe)} — {detail.pe < 10 ? 'valorisation basse' : detail.pe < 20 ? 'valorisation raisonnable' : detail.pe < 35 ? 'valorisation élevée' : 'valorisation très élevée'}
                        </p>
                      )}
                      {detail.dividendYield != null && detail.dividendYield > 0 && (
                        <p className="text-xs text-muted-foreground">
                          📊 Rendement dividende : {formatPercent(detail.dividendYield)} {detail.dividendYield > 0.04 ? '(attractif)' : detail.dividendYield > 0.02 ? '(modéré)' : '(faible)'}
                        </p>
                      )}
                      {detail.beta != null && (
                        <p className="text-xs text-muted-foreground">
                          📈 Beta de {formatNum(detail.beta)} — {detail.beta < 0.8 ? 'peu volatile (défensif)' : detail.beta <= 1.2 ? 'volatilité proche du marché' : 'très volatile (agressif)'}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Analysts */}
              {detail.analystCount && detail.analystCount > 0 && (
                <>
                  <Separator className="my-3" />
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Consensus analystes ({detail.analystCount} analystes)</h4>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant={
                      detail.recommendationKey === 'buy' || detail.recommendationKey === 'strong_buy' ? 'default' :
                      detail.recommendationKey === 'hold' ? 'secondary' : 'destructive'
                    } className="capitalize">
                      {detail.recommendationKey === 'strong_buy' ? 'Achat fort' :
                       detail.recommendationKey === 'buy' ? 'Achat' :
                       detail.recommendationKey === 'hold' ? 'Conserver' :
                       detail.recommendationKey === 'sell' ? 'Vendre' :
                       detail.recommendationKey === 'strong_sell' ? 'Vente forte' :
                       detail.recommendationKey || '—'}
                    </Badge>
                    {detail.targetPrice && (
                      <span className="text-xs text-muted-foreground">
                        Objectif : <strong>{formatNum(detail.targetPrice)} {detail.currency}</strong>
                      </span>
                    )}
                  </div>
                  <AnalystBar breakdown={detail.analystBreakdown} />
                </>
              )}

              {/* Description */}
              {detail.description && (
                <>
                  <Separator className="my-3" />
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">À propos</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {detail.descriptionFr || detail.description}
                  </p>
                </>
              )}

              <div className="flex flex-wrap gap-3 mt-2">
                {detail.website && (
                  <a href={detail.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary">
                    <Globe className="h-3 w-3" /> Site officiel
                  </a>
                )}
                {(detail.symbol && (detail.symbol.includes('ETF') || !detail.sector)) && (
                  <a
                    href={`https://www.justetf.com/fr/find-etf.html?query=${encodeURIComponent(detail.symbol)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary"
                  >
                    <ExternalLink className="h-3 w-3" /> Voir sur justETF
                  </a>
                )}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">Données non disponibles pour ce titre</p>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── GLOSSARY DIALOG ─── */}
      <Dialog open={showGlossary} onOpenChange={setShowGlossary}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📖 Glossaire financier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {GLOSSARY.map(g => (
              <div key={g.term}>
                <p className="text-sm font-semibold">{g.term}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
