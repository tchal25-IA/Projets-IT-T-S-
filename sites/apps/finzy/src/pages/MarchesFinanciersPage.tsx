import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp, RefreshCw, Building2, ArrowUpRight, ArrowDownRight,
  Info, Plus, Search, Database, Globe, ExternalLink
} from 'lucide-react';
import securitiesData from '@/data/securities.json';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AreaChart, Area, ResponsiveContainer, YAxis, LineChart, Line, XAxis, CartesianGrid, Tooltip } from 'recharts';

interface MarketQuote {
  symbol: string; name: string; zone: string; category: string;
  price: number; change: number; changePercent: number; previousClose: number; currency: string; marketState: string; updatedAt: string | null;
}
interface StockDetail {
  symbol: string; name: string; currency: string; price: number; change: number; changePercent: number; marketCap: number;
  sector: string | null; industry: string | null; country: string | null; website: string | null; description: string | null;
  pe: number | null; forwardPE: number | null; eps: number | null; forwardEps: number | null;
  dividendYield: number | null; dividendRate: number | null; beta: number | null;
  fiftyTwoWeekHigh: number | null; fiftyTwoWeekLow: number | null;
  revenue: number | null; revenueGrowth: number | null; profitMargin: number | null;
  targetPrice: number | null; recommendationKey: string | null;
  analystBreakdown: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number };
  analystCount: number | null;
  isIndex?: boolean;
}
interface SearchResult { symbol: string; name: string; type: string; exchange: string; sector: string | null; industry: string | null; }
interface LocalSecurity { name: string; isin: string; symbol: string; type: string; sector_zone: string; composition: string; }

type SparklinePeriod = '5d' | '1mo' | '3mo' | '1y' | '5y';
type GainersPeriod = '1d' | '5d' | '1mo';

const PERIOD_LABELS: { key: SparklinePeriod; label: string }[] = [
  { key: '5d', label: '5J' }, { key: '1mo', label: '1M' }, { key: '3mo', label: '3M' }, { key: '1y', label: '1A' }, { key: '5y', label: '5A' },
];
const GAINERS_PERIODS: { key: GainersPeriod; label: string }[] = [
  { key: '1d', label: '1 jour' }, { key: '5d', label: '5 jours' }, { key: '1mo', label: '1 mois' },
];
const DETAIL_PERIODS: { key: SparklinePeriod; label: string }[] = [
  { key: '5d', label: '5J' }, { key: '1mo', label: '1M' }, { key: '3mo', label: '3M' }, { key: '1y', label: '1A' }, { key: '5y', label: '5A' },
];

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

function MiniSparkline({ points, isUp }: { points: { v: number }[]; isUp: boolean }) {
  if (!points.length) return null;
  const id = `spk-${isUp ? 'u' : 'd'}-${Math.random().toString(36).slice(2, 6)}`;
  return (
    <div className="w-16 h-6">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isUp ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} stopOpacity={0.3} />
              <stop offset="100%" stopColor={isUp ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Area type="monotone" dataKey="v" stroke={isUp ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} strokeWidth={1.5} fill={`url(#${id})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function QuoteCard({ q, sparkData, periodPct, onClick }: { q: MarketQuote; sparkData?: { v: number }[]; periodPct?: number | null; onClick?: () => void }) {
  const displayPct = periodPct != null ? periodPct : q.changePercent;
  const isUp = displayPct >= 0;
  const sparkIsUp = sparkData && sparkData.length >= 2 ? sparkData[sparkData.length - 1].v >= sparkData[0].v : isUp;
  return (
    <Card className="p-3 flex items-center justify-between gap-2 hover:bg-muted/50 transition-colors cursor-pointer" onClick={onClick}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base">{q.zone}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{q.name}</p>
          <p className="text-[10px] text-muted-foreground">{q.symbol}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
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

/* ── Recommendation badge ── */
function RecommendationBadge({ key: rk }: { key: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    strong_buy: { label: 'Achat fort', cls: 'bg-emerald-600 text-white' },
    buy: { label: 'Achat', cls: 'bg-emerald-500 text-white' },
    hold: { label: 'Neutre', cls: 'bg-yellow-500 text-black' },
    underperform: { label: 'Sous-performance', cls: 'bg-orange-500 text-white' },
    sell: { label: 'Vente', cls: 'bg-destructive text-white' },
  };
  const r = map[rk] || { label: rk, cls: 'bg-muted text-foreground' };
  return <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', r.cls)}>{r.label}</span>;
}

export default function MarchesFinanciersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState('indices');
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [sparkPeriod, setSparkPeriod] = useState<SparklinePeriod>('1mo');
  const [gainersPeriod, setGainersPeriod] = useState<GainersPeriod>('1d');
  const [sparkData, setSparkData] = useState<Record<string, { v: number }[]>>({});
  const [gainersSparkData, setGainersSparkData] = useState<Record<string, { v: number }[]>>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [detail, setDetail] = useState<StockDetail | null>(null);
  const [detailSpark, setDetailSpark] = useState<{ v: number }[]>([]);
  const [detailPeriod, setDetailPeriod] = useState<SparklinePeriod>('1mo');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const fetchQuotes = useCallback(async () => {
    setLoadingQuotes(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-data', { body: { datasets: ['indices', 'etfs_materiaux', 'etfs_crypto'] } });
      if (error) throw error;
      if (data?.success) setQuotes(data.data);
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Impossible de charger les données', variant: 'destructive' });
    } finally {
      setLoadingQuotes(false);
    }
  }, [toast]);

  const fetchSparklines = useCallback(async (symbols: string[], period: string, setter: (d: Record<string, { v: number }[]>) => void) => {
    if (!symbols.length) return;
    try {
      const { data } = await supabase.functions.invoke('market-sparkline', { body: { symbols, period } });
      if (data?.success) setter(data.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  // Fetch sparklines for the indices tab period
  useEffect(() => {
    if (quotes.length > 0) fetchSparklines(quotes.map(q => q.symbol), sparkPeriod, setSparkData);
  }, [quotes, sparkPeriod, fetchSparklines]);

  // Fetch sparklines for the gainers tab period (separate)
  useEffect(() => {
    if (quotes.length > 0 && gainersPeriod !== '1d') {
      fetchSparklines(quotes.map(q => q.symbol), gainersPeriod, setGainersSparkData);
    }
  }, [quotes, gainersPeriod, fetchSparklines]);

  useEffect(() => { const t = setInterval(fetchQuotes, 60000); return () => clearInterval(t); }, [fetchQuotes]);

  const addToWatchlist = async (symbol: string, name: string) => {
    if (!user) {
      toast({ title: 'Connecte-toi pour ajouter à la watchlist', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await (supabase.from('watchlist' as any) as any).upsert(
        { user_id: user.id, symbol: symbol.trim().toUpperCase(), name: name || symbol },
        { onConflict: 'user_id,symbol' }
      );
      if (error) throw error;
      toast({ title: 'Ajouté à la watchlist' });
    } catch (e: any) {
      toast({ title: 'Erreur', description: e?.message || 'Impossible d\'ajouter', variant: 'destructive' });
    }
  };

  // Fetch detail sparkline for selected period
  const fetchDetailSpark = useCallback(async (sym: string, period: SparklinePeriod) => {
    try {
      const { data } = await supabase.functions.invoke('market-sparkline', { body: { symbols: [sym], period } });
      if (data?.success && data.data?.[sym]) {
        setDetailSpark(data.data[sym].map((p: { v: number }) => ({ v: p.v })));
      }
    } catch { /* ignore */ }
  }, []);

  const openDetail = async (symbol: string) => {
    setSelectedSymbol(symbol);
    setDetail(null);
    setDetailSpark([]);
    setDetailPeriod('1mo');
    setLoadingDetail(true);
    try {
      const [resSearch, resSpark] = await Promise.all([
        supabase.functions.invoke('market-search', { body: { symbol } }),
        supabase.functions.invoke('market-sparkline', { body: { symbols: [symbol], period: '1mo' } }),
      ]);
      if (resSearch.data?.success && resSearch.data.data) {
        setDetail({ ...resSearch.data.data, isIndex: symbol.startsWith('^') || ['URTH', 'EEM'].includes(symbol) });
      }
      if (resSpark.data?.success && resSpark.data.data?.[symbol]) {
        setDetailSpark(resSpark.data.data[symbol].map((p: { v: number }) => ({ v: p.v })));
      }
    } catch { /* ignore */ } finally {
      setLoadingDetail(false);
    }
  };

  // When detail period changes, refetch sparkline
  useEffect(() => {
    if (selectedSymbol && detail) {
      fetchDetailSpark(selectedSymbol, detailPeriod);
    }
  }, [detailPeriod, selectedSymbol, detail, fetchDetailSpark]);

  const searchLocalDatabase = (query: string): SearchResult[] => {
    const q = query.toLowerCase().trim();
    const securities = securitiesData as LocalSecurity[];
    const byIsin = securities.filter(s => s.isin.toLowerCase() === q);
    if (byIsin.length > 0) {
      return byIsin.map(s => ({
        symbol: s.symbol, name: s.name, type: s.type === 'INDICE' ? 'INDEX' : s.type === 'ACTION' ? 'EQUITY' : s.type,
        exchange: s.sector_zone.split('–')[0]?.trim() || '', sector: s.sector_zone, industry: s.composition || null,
      }));
    }
    const byName = securities.filter(s =>
      s.name.toLowerCase().includes(q) || s.symbol.toLowerCase().includes(q)
    );
    const sorted = byName.sort((a, b) => {
      const an = a.name.toLowerCase(), bn = b.name.toLowerCase();
      if (an === q) return -1; if (bn === q) return 1;
      if (an.startsWith(q) && !bn.startsWith(q)) return -1;
      if (bn.startsWith(q) && !an.startsWith(q)) return 1;
      return a.name.length - b.name.length;
    });
    return sorted.slice(0, 10).map(s => ({
      symbol: s.symbol, name: s.name, type: s.type === 'INDICE' ? 'INDEX' : s.type === 'ACTION' ? 'EQUITY' : s.type,
      exchange: s.sector_zone.split('–')[0]?.trim() || '', sector: s.sector_zone, industry: s.composition || null,
    }));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoadingSearch(true);
    try {
      const local = searchLocalDatabase(searchQuery);
      if (local.length > 0) { setSearchResults(local); setLoadingSearch(false); return; }
      const { data, error } = await supabase.functions.invoke('market-search', { body: { query: searchQuery } });
      if (error) throw error;
      if (data?.success) {
        const allowed = ['EQUITY', 'INDEX', 'ETF', 'MUTUALFUND'];
        const filtered = (data.data as SearchResult[]).filter(r => allowed.includes(r.type?.toUpperCase())).slice(0, 15);
        setSearchResults(filtered);
      }
    } catch {
      toast({ title: 'Erreur recherche', variant: 'destructive' });
    } finally {
      setLoadingSearch(false);
    }
  };

  const groupedQuotes = useMemo(() => {
    const acc: Record<string, MarketQuote[]> = {};
    quotes.forEach(q => { (acc[q.category] = acc[q.category] || []).push(q); });
    return acc;
  }, [quotes]);

  const indicesCategories = useMemo(() => ['Europe', 'US', 'Asie', 'Monde', 'Matières', 'Crypto'], []);

  // Compute period percentage from gainers sparkline data
  const gainersPctByPeriod = useMemo(() => {
    if (gainersPeriod === '1d') return null;
    const out: Record<string, number> = {};
    Object.entries(gainersSparkData).forEach(([sym, pts]) => {
      if (pts.length >= 2) {
        const first = pts[0].v;
        const last = pts[pts.length - 1].v;
        if (first) out[sym] = ((last - first) / first) * 100;
      }
    });
    return out;
  }, [gainersPeriod, gainersSparkData]);

  const gainers = useMemo(() => {
    const list = quotes.map(q => {
      const pct = gainersPeriod === '1d' ? q.changePercent : (gainersPctByPeriod?.[q.symbol] ?? q.changePercent);
      return { ...q, displayPct: pct };
    });
    return [...list].sort((a, b) => (b.displayPct ?? 0) - (a.displayPct ?? 0)).slice(0, 15);
  }, [quotes, gainersPeriod, gainersPctByPeriod]);

  const losers = useMemo(() => {
    const list = quotes.map(q => {
      const pct = gainersPeriod === '1d' ? q.changePercent : (gainersPctByPeriod?.[q.symbol] ?? q.changePercent);
      return { ...q, displayPct: pct };
    });
    return [...list].sort((a, b) => (a.displayPct ?? 0) - (b.displayPct ?? 0)).slice(0, 15);
  }, [quotes, gainersPeriod, gainersPctByPeriod]);

  const heatmapTreeData = useMemo(() => {
    return quotes.map(q => ({
      name: q.symbol, fullName: q.name, category: q.category,
      size: Math.max(1, (q.price || 1) / 100), pct: q.changePercent ?? 0,
    }));
  }, [quotes]);

  // ─── Detail sparkline period % ───
  const detailSparkPct = useMemo(() => {
    if (detailSpark.length < 2) return null;
    const first = detailSpark[0].v;
    const last = detailSpark[detailSpark.length - 1].v;
    if (!first) return null;
    return ((last - first) / first) * 100;
  }, [detailSpark]);

  // 52-week position
  const fiftyTwoWeekPct = useMemo(() => {
    if (!detail || detail.fiftyTwoWeekLow == null || detail.fiftyTwoWeekHigh == null || !detail.price) return null;
    const range = detail.fiftyTwoWeekHigh - detail.fiftyTwoWeekLow;
    if (!range) return 50;
    return ((detail.price - detail.fiftyTwoWeekLow) / range) * 100;
  }, [detail]);

  // Potential upside
  const potential = useMemo(() => {
    if (!detail?.targetPrice || !detail?.price) return null;
    return ((detail.targetPrice - detail.price) / detail.price) * 100;
  }, [detail]);

  return (
    <div className="space-y-6 pb-24">
      <SEO title="Marchés financiers" description="Indices, heatmap, gainers, ETFs et fixed income." path="/investissements/marches" />
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Marchés financiers</h1>
          <p className="text-sm text-muted-foreground">Indices, heatmap, gainers et répertoire</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowGlossary(true)}><Info className="h-3.5 w-3.5" /></Button>
      </div>

      <ScrollArea className="w-full">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex w-max gap-1 p-1 h-auto flex-wrap">
            {[
              { id: 'indices', label: 'Indices', icon: TrendingUp },
              { id: 'heatmap', label: 'Heatmap', icon: Building2 },
              { id: 'gainers', label: 'Gainers', icon: ArrowUpRight },
              { id: 'repertoire', label: 'Répertoire', icon: Search },
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id} className="gap-1.5 text-xs">
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />

          {/* ─── INDICES ─── */}
          <TabsContent value="indices" className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-1">
                {PERIOD_LABELS.map(p => (
                  <Button key={p.key} variant={sparkPeriod === p.key ? 'default' : 'ghost'} size="sm" className="h-7 px-2 text-xs" onClick={() => setSparkPeriod(p.key)}>{p.label}</Button>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={() => fetchQuotes()} disabled={loadingQuotes}><RefreshCw className={cn('h-3.5 w-3.5 mr-1', loadingQuotes && 'animate-spin')} /> Actualiser</Button>
            </div>
            {loadingQuotes ? (
              <div className="grid gap-2 sm:grid-cols-2">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
            ) : (
              indicesCategories.map(cat => (groupedQuotes[cat]?.length ? (
                <div key={cat}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat}</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {groupedQuotes[cat].map(q => {
                      const pts = sparkData[q.symbol];
                      const pct = pts?.length >= 2 ? ((pts[pts.length - 1].v - pts[0].v) / pts[0].v) * 100 : null;
                      return <QuoteCard key={q.symbol} q={q} sparkData={pts} periodPct={pct} onClick={() => openDetail(q.symbol)} />;
                    })}
                  </div>
                </div>
              ) : null))
            )}
          </TabsContent>

          {/* ─── HEATMAP ─── */}
          <TabsContent value="heatmap" className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Performance par actif</p>
            <div className="flex items-center gap-4 mb-3">
              <span className="text-[10px] text-destructive">-3%</span>
              <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-destructive via-muted to-emerald-500" />
              <span className="text-[10px] text-emerald-600">+3%</span>
            </div>
            {loadingQuotes ? <Skeleton className="h-64 w-full rounded-xl" /> : heatmapTreeData.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {heatmapTreeData.map((item) => {
                  const isUp = (item.pct ?? 0) >= 0;
                  const intensity = Math.min(1, Math.abs(item.pct ?? 0) / 5);
                  const bg = isUp ? `rgba(16, 185, 129, ${0.2 + intensity * 0.4})` : `rgba(239, 68, 68, ${0.2 + intensity * 0.4})`;
                  return (
                    <div key={item.name} className="rounded-lg border p-2 text-center cursor-pointer hover:opacity-90 transition-opacity" style={{ backgroundColor: bg }} onClick={() => openDetail(item.name)}>
                      <p className="text-xs font-semibold truncate">{item.name}</p>
                      <p className={cn('text-sm font-bold', isUp ? 'text-emerald-600' : 'text-destructive')}>
                        {(item.pct ?? 0) >= 0 ? '+' : ''}{(item.pct ?? 0).toFixed(2)}%
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-muted-foreground py-8 text-center">Chargement des données…</p>}
          </TabsContent>

          {/* ─── GAINERS ─── */}
          <TabsContent value="gainers" className="mt-4 space-y-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">Variation sur la période sélectionnée</p>
              <div className="flex gap-1">
                {GAINERS_PERIODS.map(p => (
                  <Button key={p.key} variant={gainersPeriod === p.key ? 'default' : 'ghost'} size="sm" className="h-7 px-2 text-xs" onClick={() => setGainersPeriod(p.key)}>{p.label}</Button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Top haussiers</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {loadingQuotes ? <Skeleton className="h-14" /> : gainers.map(q => {
                  const gsd = gainersPeriod === '1d' ? sparkData[q.symbol] : gainersSparkData[q.symbol];
                  return <QuoteCard key={q.symbol} q={q} sparkData={gsd} periodPct={q.displayPct} onClick={() => openDetail(q.symbol)} />;
                })}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Top baissiers</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {losers.map(q => {
                  const gsd = gainersPeriod === '1d' ? sparkData[q.symbol] : gainersSparkData[q.symbol];
                  return <QuoteCard key={q.symbol} q={q} sparkData={gsd} periodPct={q.displayPct} onClick={() => openDetail(q.symbol)} />;
                })}
              </div>
            </div>
          </TabsContent>

          {/* ─── RÉPERTOIRE ─── */}
          <TabsContent value="repertoire" className="mt-4 space-y-4">
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-2">
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher (ex: Apple, CAC 40, LVMH...)" className="flex-1" />
              <Button type="submit" disabled={loadingSearch}><Search className="h-4 w-4" /></Button>
            </form>
            {loadingSearch ? (
              <div className="grid gap-2"><Skeleton className="h-14 rounded-xl" /><Skeleton className="h-14 rounded-xl" /></div>
            ) : searchResults.length > 0 ? (
              <div className="grid gap-2">
                {searchResults.map(r => (
                  <Card key={r.symbol} className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { openDetail(r.symbol); setSearchResults([]); setSearchQuery(''); }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{r.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{r.symbol}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{r.type === 'EQUITY' ? 'Action' : r.type === 'INDEX' ? 'Indice' : r.type}</Badge>
                        {r.sector && <span className="text-[10px] text-muted-foreground">{r.sector}</span>}
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Card>
                ))}
              </div>
            ) : searchQuery && !loadingSearch ? (
              <p className="text-center text-muted-foreground py-8">Aucun résultat pour « {searchQuery} »</p>
            ) : (
              <div className="text-center py-8 space-y-2">
                <Database className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Recherchez un titre (actions, indices, ETF)</p>
                <p className="text-xs text-muted-foreground">Base locale : {(securitiesData as LocalSecurity[]).length} titres</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </ScrollArea>

      {/* ─── DETAIL DIALOG ─── */}
      <Dialog open={!!selectedSymbol} onOpenChange={(o) => !o && setSelectedSymbol(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {loadingDetail ? <Skeleton className="h-40" /> : detail ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  {detail.name} <Badge variant="outline">{detail.symbol}</Badge>
                </DialogTitle>
              </DialogHeader>

              {/* Sector / Industry / Country badges */}
              {(detail.sector || detail.industry || detail.country) && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {detail.sector && <Badge variant="secondary" className="text-[10px]">{detail.sector}</Badge>}
                  {detail.industry && <Badge variant="secondary" className="text-[10px]">{detail.industry}</Badge>}
                  {detail.country && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Globe className="h-3 w-3" />{detail.country}</span>}
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-3xl font-bold">{formatNum(detail.price)}</span>
                <span className="text-sm text-muted-foreground">{detail.currency}</span>
                <span className={cn('text-sm font-semibold', (detail.changePercent ?? 0) >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                  {detail.changePercent != null ? `${detail.changePercent >= 0 ? '+' : ''}${detail.changePercent.toFixed(2)}%` : '—'}
                </span>
              </div>

              {/* Potential vs analyst target */}
              {potential != null && detail.targetPrice != null && (
                <p className={cn('text-sm font-medium', potential >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                  Potentiel {potential >= 0 ? '↑' : '↓'} {Math.abs(potential).toFixed(1)}% vs objectif analystes ({formatNum(detail.targetPrice)} {detail.currency})
                </p>
              )}

              {/* 52-week range */}
              {detail.fiftyTwoWeekLow != null && detail.fiftyTwoWeekHigh != null && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1">Fourchette 52 semaines</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-emerald-500 tabular-nums">{formatNum(detail.fiftyTwoWeekLow)}</span>
                    <div className="flex-1 relative h-2 rounded-full bg-muted overflow-hidden">
                      <div className="absolute left-0 top-0 h-full rounded-full bg-primary" style={{ width: `${fiftyTwoWeekPct ?? 50}%` }} />
                    </div>
                    <span className="tabular-nums">{formatNum(detail.fiftyTwoWeekHigh)}</span>
                  </div>
                </div>
              )}

              {/* Chart with period selector */}
              {detailSpark.length > 0 && (
                <div className="mt-4">
                  <div className="flex gap-1 mb-2">
                    {DETAIL_PERIODS.map(p => (
                      <Button key={p.key} variant={detailPeriod === p.key ? 'default' : 'ghost'} size="sm" className="h-6 px-2 text-[10px]" onClick={() => setDetailPeriod(p.key)}>{p.label}</Button>
                    ))}
                  </div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={detailSpark}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis hide />
                        <YAxis hide domain={['dataMin', 'dataMax']} />
                        <Tooltip formatter={(v: number) => formatNum(v)} />
                        <Line type="monotone" dataKey="v" stroke={detailSparkPct != null && detailSparkPct >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {detailSparkPct != null && (
                    <p className={cn('text-xs font-semibold mt-1', detailSparkPct >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                      {detailSparkPct >= 0 ? '+' : ''}{detailSparkPct.toFixed(2)}% sur la période
                    </p>
                  )}
                </div>
              )}

              <Separator className="my-3" />

              {/* ─── FONDAMENTAUX ─── */}
              {!detail.isIndex && (detail.marketCap != null || detail.pe != null || detail.dividendYield != null || detail.beta != null || detail.eps != null || detail.revenue != null) && (
                <>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fondamentaux</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-2 text-sm">
                    {detail.marketCap != null && <FundRow label="Capitalisation" value={formatBigNum(detail.marketCap)} />}
                    {detail.pe != null && <FundRow label="PER" value={formatNum(detail.pe)} />}
                    {detail.forwardPE != null && <FundRow label="PER forward" value={formatNum(detail.forwardPE)} />}
                    {detail.eps != null && <FundRow label="BPA (EPS)" value={formatNum(detail.eps)} />}
                    {detail.forwardEps != null && <FundRow label="BPA forward" value={formatNum(detail.forwardEps)} />}
                    {detail.dividendRate != null && detail.dividendYield != null && (
                      <FundRow label="Dividende" value={`${formatNum(detail.dividendRate)} (${(detail.dividendYield * 100).toFixed(2)}%)`} />
                    )}
                    {detail.dividendYield != null && detail.dividendRate == null && (
                      <FundRow label="Div. Yield" value={`${(detail.dividendYield * 100).toFixed(2)}%`} />
                    )}
                    {detail.revenue != null && <FundRow label="CA (Revenue)" value={formatBigNum(detail.revenue)} />}
                    {detail.revenueGrowth != null && <FundRow label="Croissance CA" value={`${(detail.revenueGrowth * 100).toFixed(2)}%`} />}
                    {detail.profitMargin != null && <FundRow label="Marge nette" value={`${(detail.profitMargin * 100).toFixed(2)}%`} />}
                    {detail.beta != null && <FundRow label="Beta" value={formatNum(detail.beta)} />}
                  </div>

                  {/* Résumé rapide */}
                  <Card className="p-3 mt-3 bg-muted/50">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Résumé rapide</p>
                    <div className="text-xs space-y-0.5">
                      {detail.pe != null && <p>💰 PER de {formatNum(detail.pe)} — {detail.pe > 25 ? 'valorisation élevée' : detail.pe > 15 ? 'valorisation modérée' : 'valorisation attractive'}</p>}
                      {detail.dividendYield != null && <p>📊 Rendement dividende : {(detail.dividendYield * 100).toFixed(2)}% ({detail.dividendYield > 0.04 ? 'élevé' : detail.dividendYield > 0.02 ? 'modéré' : 'faible'})</p>}
                      {detail.beta != null && <p>📈 Beta de {formatNum(detail.beta)} — {detail.beta > 1.2 ? 'plus volatile que le marché' : detail.beta < 0.8 ? 'moins volatile que le marché' : 'volatilité proche du marché'}</p>}
                    </div>
                  </Card>

                  <Separator className="my-3" />
                </>
              )}

              {/* ─── CONSENSUS ANALYSTES ─── */}
              {detail.analystCount != null && detail.analystCount > 0 && (
                <>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Consensus analystes ({detail.analystCount} analystes)</h4>
                  <div className="mt-2">
                    {detail.recommendationKey && (
                      <div className="flex items-center gap-3 mb-2">
                        <RecommendationBadge key={detail.recommendationKey} />
                        {detail.targetPrice != null && <span className="text-sm">Objectif : <strong>{formatNum(detail.targetPrice)} {detail.currency}</strong></span>}
                      </div>
                    )}
                    {/* Analyst bar */}
                    <div className="flex h-3 rounded-full overflow-hidden">
                      {detail.analystBreakdown.strongBuy > 0 && <div className="bg-emerald-600" style={{ width: `${(detail.analystBreakdown.strongBuy / detail.analystCount) * 100}%` }} />}
                      {detail.analystBreakdown.buy > 0 && <div className="bg-emerald-400" style={{ width: `${(detail.analystBreakdown.buy / detail.analystCount) * 100}%` }} />}
                      {detail.analystBreakdown.hold > 0 && <div className="bg-yellow-400" style={{ width: `${(detail.analystBreakdown.hold / detail.analystCount) * 100}%` }} />}
                      {detail.analystBreakdown.sell > 0 && <div className="bg-orange-500" style={{ width: `${(detail.analystBreakdown.sell / detail.analystCount) * 100}%` }} />}
                      {detail.analystBreakdown.strongSell > 0 && <div className="bg-destructive" style={{ width: `${(detail.analystBreakdown.strongSell / detail.analystCount) * 100}%` }} />}
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>Achat fort ({detail.analystBreakdown.strongBuy})</span>
                      <span>Achat ({detail.analystBreakdown.buy})</span>
                      <span>Neutre ({detail.analystBreakdown.hold})</span>
                      <span>Vente ({detail.analystBreakdown.sell + detail.analystBreakdown.strongSell})</span>
                    </div>
                  </div>
                  <Separator className="my-3" />
                </>
              )}

              {/* ─── DESCRIPTION ─── */}
              {detail.description && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Description</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-6">{detail.description}</p>
                  {detail.website && (
                    <a href={detail.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 mt-1">
                      <ExternalLink className="h-3 w-3" /> {detail.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              )}

              {/* Actions */}
              {user && (
                <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => addToWatchlist(detail.symbol, detail.name)}>
                  <Plus className="h-3.5 w-3.5" /> Ajouter à la watchlist
                </Button>
              )}
              <Button variant="ghost" size="sm" className="mt-2 w-full" asChild>
                <Link to="/investissements/watchlist-portefeuille">Voir watchlist & portefeuille</Link>
              </Button>
            </>
          ) : <p className="text-muted-foreground py-4">Données non disponibles</p>}
        </DialogContent>
      </Dialog>

      {/* ─── GLOSSAIRE ─── */}
      <Dialog open={showGlossary} onOpenChange={setShowGlossary}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Glossaire financier</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2 text-sm">
            <GlossaryItem term="PER (Price-to-Earnings Ratio)" desc="Ratio cours/bénéfice. Indique combien d'années de bénéfices sont nécessaires pour rembourser le prix de l'action. Un PER élevé (>25) signale des attentes de croissance forte." />
            <GlossaryItem term="PER forward" desc="PER basé sur les bénéfices estimés à venir (prévisions analystes), plutôt que les résultats passés." />
            <GlossaryItem term="BPA / EPS (Bénéfice Par Action)" desc="Bénéfice net divisé par le nombre d'actions. Mesure la rentabilité par action." />
            <GlossaryItem term="Capitalisation boursière" desc="Valeur totale de l'entreprise en bourse (prix × nombre d'actions). Permet de comparer la taille des entreprises." />
            <GlossaryItem term="Dividende / Rendement" desc="Part du bénéfice redistribué aux actionnaires. Le rendement (yield) est le dividende annuel divisé par le cours de l'action." />
            <GlossaryItem term="Beta" desc="Mesure la volatilité d'une action par rapport au marché. Beta > 1 = plus volatile. Beta < 1 = moins volatile. Beta = 1 = suit le marché." />
            <GlossaryItem term="Fourchette 52 semaines" desc="Prix le plus bas et le plus haut atteints par le titre au cours des 12 derniers mois." />
            <GlossaryItem term="CA (Chiffre d'Affaires / Revenue)" desc="Total des ventes/revenus de l'entreprise sur une période donnée." />
            <GlossaryItem term="Croissance CA" desc="Taux de croissance du chiffre d'affaires en pourcentage, généralement mesuré d'une année sur l'autre (Year-over-Year)." />
            <GlossaryItem term="Marge nette" desc="Bénéfice net en pourcentage du chiffre d'affaires. Indique l'efficacité de l'entreprise à convertir ses revenus en profits." />
            <GlossaryItem term="Consensus analystes" desc="Moyenne des recommandations des analystes financiers (Achat fort, Achat, Neutre, Vente). L'objectif de cours est le prix cible moyen estimé." />
            <GlossaryItem term="PRU (Prix de Revient Unitaire)" desc="Coût moyen pondéré d'acquisition d'une action. Calculé en divisant le coût total d'achat par le nombre de titres détenus." />
            <GlossaryItem term="P&L (Profit & Loss)" desc="Plus-value ou moins-value : différence entre la valeur actuelle du portefeuille et le coût d'acquisition." />
            <GlossaryItem term="ETF (Exchange-Traded Fund)" desc="Fonds indiciel coté en bourse qui réplique la performance d'un indice, d'un secteur ou d'un actif. Frais faibles et diversification instantanée." />
            <GlossaryItem term="Indice boursier" desc="Panier d'actions représentant un marché (CAC 40 = 40 plus grandes entreprises françaises, S&P 500 = 500 plus grandes US)." />
            <GlossaryItem term="Heatmap" desc="Carte thermique colorée montrant la performance relative des actifs. Vert = hausse, rouge = baisse, intensité = amplitude." />
            <GlossaryItem term="Spread" desc="Écart entre le prix d'achat (ask) et de vente (bid) d'un titre. Un spread faible indique une bonne liquidité." />
            <GlossaryItem term="Ordre au marché / Ordre limité" desc="Ordre au marché : exécuté immédiatement au meilleur prix. Ordre limité : exécuté uniquement au prix fixé ou mieux." />
            <GlossaryItem term="Stop-loss" desc="Ordre de vente automatique déclenché si le cours atteint un seuil bas, pour limiter les pertes." />
            <GlossaryItem term="Volume" desc="Nombre de titres échangés sur une période donnée. Un volume élevé indique un fort intérêt du marché." />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FundRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function GlossaryItem({ term, desc }: { term: string; desc: string }) {
  return (
    <div>
      <p className="font-semibold">{term}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
