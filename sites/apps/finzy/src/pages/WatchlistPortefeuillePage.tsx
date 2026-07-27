import { useState, useEffect, useCallback, useMemo } from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { usePlan } from '@/hooks/usePlan';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Trash2, Wallet, Database, TrendingUp, TrendingDown, History, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { formatAmount } from '@/lib/formatCurrency';
import securitiesData from '@/data/securities.json';
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { Currency } from '@/types';

interface MarketQuote {
  symbol: string; name: string; price: number; changePercent: number; currency: string;
}
interface WatchlistRow { id: string; symbol: string; name: string | null; }
interface PositionRow {
  id: string; symbol: string; name: string | null; quantity: number;
  price_per_unit: number; currency: string; type: string; trade_date: string;
}
interface LocalSecurity { name: string; isin: string; symbol: string; type: string; sector_zone: string; composition: string; }

function formatNum(n: number | null | undefined) {
  if (n == null) return '—';
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];

export default function WatchlistPortefeuillePage() {
  const { isPremium } = usePlan();
  if (!isPremium) return <PremiumGate feature="Watchlist & Portefeuille" />;
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const defaultCurrency: Currency = (profile?.currency as Currency) ?? 'EUR';
  const [watchlist, setWatchlist] = useState<WatchlistRow[]>([]);
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [watchlistQuotes, setWatchlistQuotes] = useState<Record<string, MarketQuote>>({});
  const [portfolioQuotes, setPortfolioQuotes] = useState<Record<string, MarketQuote>>({});
  const [loading, setLoading] = useState(true);
  const [addPositionOpen, setAddPositionOpen] = useState(false);
  const [addSymbol, setAddSymbol] = useState('');
  const [addName, setAddName] = useState('');
  const [addQty, setAddQty] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addType, setAddType] = useState<'buy' | 'sell'>('buy');
  const [addDate, setAddDate] = useState(new Date().toISOString().slice(0, 10));
  const [addCurrency, setAddCurrency] = useState(defaultCurrency);
  const [saving, setSaving] = useState(false);
  const [symbolSuggestions, setSymbolSuggestions] = useState<LocalSecurity[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Update default currency when profile loads
  useEffect(() => {
    if (profile?.currency) setAddCurrency(profile.currency as Currency);
  }, [profile?.currency]);

  const loadWatchlist = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase.from('watchlist' as any) as any).select('id, symbol, name').eq('user_id', user.id).order('created_at', { ascending: false });
    setWatchlist(data || []);
  }, [user]);

  const loadPositions = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase.from('portfolio_positions' as any) as any).select('id, symbol, name, quantity, price_per_unit, currency, type, trade_date').eq('user_id', user.id).order('trade_date', { ascending: false });
    setPositions(data || []);
  }, [user]);

  const loadQuotes = useCallback(async (symbols: string[], setter: (d: Record<string, MarketQuote>) => void) => {
    if (symbols.length === 0) return;
    const out: Record<string, MarketQuote> = {};
    await Promise.allSettled(
      symbols.map(async (sym) => {
        const { data } = await supabase.functions.invoke('market-search', { body: { symbol: sym } });
        if (data?.success && data.data?.price != null) {
          out[sym] = {
            symbol: sym,
            name: data.data.name || sym,
            price: data.data.price,
            changePercent: data.data.changePercent || 0,
            currency: data.data.currency || 'USD',
          };
        }
      })
    );
    if (Object.keys(out).length > 0) setter(out);
  }, []);

  useEffect(() => {
    if (user) {
      Promise.all([loadWatchlist(), loadPositions()]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, loadWatchlist, loadPositions]);

  useEffect(() => {
    if (watchlist.length > 0) loadQuotes(watchlist.map(w => w.symbol), setWatchlistQuotes);
  }, [watchlist, loadQuotes]);

  const portfolioSymbols = useMemo(() => {
    const syms = new Set<string>();
    positions.forEach(p => syms.add(p.symbol));
    return Array.from(syms);
  }, [positions]);

  useEffect(() => {
    if (portfolioSymbols.length > 0) loadQuotes(portfolioSymbols, setPortfolioQuotes);
  }, [portfolioSymbols, loadQuotes]);

  const handleSymbolChange = (val: string) => {
    setAddSymbol(val);
    if (val.length >= 2) {
      const q = val.toLowerCase();
      const results = (securitiesData as LocalSecurity[]).filter(s =>
        s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      ).slice(0, 5);
      setSymbolSuggestions(results);
    } else {
      setSymbolSuggestions([]);
    }
  };

  const selectSuggestion = (s: LocalSecurity) => {
    setAddSymbol(s.symbol);
    setAddName(s.name);
    setSymbolSuggestions([]);
    supabase.functions.invoke('market-search', { body: { symbol: s.symbol } }).then(({ data }) => {
      if (data?.success && data.data?.price) {
        setAddPrice(data.data.price.toString());
        setAddCurrency((data.data.currency as Currency) || defaultCurrency);
      }
    });
  };

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
      await loadWatchlist();
      toast({ title: 'Ajouté à la watchlist' });
    } catch (e: any) {
      toast({ title: 'Erreur', description: e?.message, variant: 'destructive' });
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    if (!user) return;
    await (supabase.from('watchlist' as any) as any).delete().eq('user_id', user.id).eq('symbol', symbol);
    await loadWatchlist();
    toast({ title: 'Retiré de la watchlist' });
  };

  const deletePosition = async (id: string) => {
    if (!user) return;
    await (supabase.from('portfolio_positions' as any) as any).delete().eq('id', id).eq('user_id', user.id);
    await loadPositions();
    toast({ title: 'Transaction supprimée' });
  };

  const savePosition = async () => {
    if (!user || !addSymbol.trim()) return;
    const qty = parseFloat(addQty);
    const price = parseFloat(addPrice);
    if (!(qty > 0 && price >= 0)) {
      toast({ title: 'Quantité et prix invalides', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await (supabase.from('portfolio_positions' as any) as any).insert({
        user_id: user.id,
        symbol: addSymbol.trim().toUpperCase(),
        name: addName.trim() || null,
        quantity: addType === 'sell' ? -qty : qty,
        price_per_unit: price,
        currency: addCurrency,
        type: addType,
        trade_date: addDate,
      });
      if (error) throw error;
      setAddPositionOpen(false);
      setAddSymbol(''); setAddName(''); setAddQty(''); setAddPrice(''); setAddDate(new Date().toISOString().slice(0, 10));
      setSymbolSuggestions([]);
      await loadPositions();
      toast({ title: 'Position enregistrée' });
    } catch (e: any) {
      toast({ title: 'Erreur', description: e?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ─── AGGREGATED POSITIONS ───
  const aggregatedPositions = useMemo(() => {
    const bySym: Record<string, { quantity: number; cost: number; name: string | null; currency: string }> = {};
    positions.forEach(p => {
      const sym = p.symbol;
      if (!bySym[sym]) bySym[sym] = { quantity: 0, cost: 0, name: p.name, currency: p.currency };
      bySym[sym].quantity += p.quantity;
      bySym[sym].cost += p.quantity * p.price_per_unit;
    });
    return Object.entries(bySym).filter(([, v]) => v.quantity > 0).map(([symbol, v]) => ({
      symbol,
      name: v.name,
      quantity: v.quantity,
      pru: v.cost / v.quantity,
      cost: v.cost,
      currency: v.currency,
    }));
  }, [positions]);

  // ─── PORTFOLIO SUMMARY ───
  const portfolioSummary = useMemo(() => {
    let totalCost = 0;
    let totalValue = 0;
    let hasQuotes = false;

    const items = aggregatedPositions.map(pos => {
      const q = portfolioQuotes[pos.symbol];
      const currentPrice = q?.price ?? null;
      const currentValue = currentPrice != null ? currentPrice * pos.quantity : null;
      const pl = currentValue != null ? currentValue - pos.cost : null;
      const plPct = pos.cost && pl != null ? (pl / pos.cost) * 100 : null;

      totalCost += pos.cost;
      if (currentValue != null) {
        totalValue += currentValue;
        hasQuotes = true;
      }

      return { ...pos, currentPrice, currentValue, pl, plPct, currency: q?.currency || pos.currency };
    });

    const totalPl = hasQuotes ? totalValue - totalCost : null;
    const totalPlPct = totalCost && totalPl != null ? (totalPl / totalCost) * 100 : null;

    return { items, totalCost, totalValue, totalPl, totalPlPct, hasQuotes };
  }, [aggregatedPositions, portfolioQuotes]);

  // ─── PIE DATA ───
  const pieData = useMemo(() => {
    return portfolioSummary.items
      .filter(i => i.currentValue != null && i.currentValue > 0)
      .map(i => ({ name: i.symbol, value: i.currentValue! }));
  }, [portfolioSummary]);

  // Helper to get display currency for a position or fallback
  const getCcy = (ccy?: string): Currency => (ccy as Currency) || defaultCurrency;

  return (
    <div className="space-y-6 pb-24">
      <SEO title="Watchlist & Portefeuille" description="Suivi des titres et portefeuille boursier." path="/investissements/marches/watchlist-portefeuille" />
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Watchlist & Portefeuille</h1>
          <p className="text-sm text-muted-foreground">Suivi des titres et positions</p>
        </div>
      </div>

      {!user ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Connecte-toi pour gérer ta watchlist et ton portefeuille.</p>
          <Button className="mt-4" asChild><Link to="/register">Créer un compte</Link></Button>
        </Card>
      ) : (
        <>
          {/* ─── WATCHLIST ─── */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Database className="h-4 w-4" /> Watchlist</h2>
            <form onSubmit={(e) => { e.preventDefault(); const s = (e.target as HTMLFormElement).querySelector<HTMLInputElement>('input[name="addSymbol"]')?.value?.trim().toUpperCase(); if (s) addToWatchlist(s, s); (e.target as HTMLFormElement).reset(); }} className="flex gap-2 mb-3">
              <Input name="addSymbol" placeholder="Symbole (ex. AAPL, MSFT)" className="flex-1" />
              <Button type="submit" size="sm">Ajouter</Button>
            </form>
            {loading ? <Skeleton className="h-24 rounded-xl" /> : watchlist.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-sm text-muted-foreground">Ta watchlist est vide.</p>
                <Button variant="outline" className="mt-3" asChild><Link to="/investissements/marches">Voir les marchés</Link></Button>
              </Card>
            ) : (
              <div className="space-y-2">
                {watchlist.map(w => {
                  const q = watchlistQuotes[w.symbol];
                  return (
                    <Card key={w.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{q?.name || w.name || w.symbol}</p>
                        <p className="text-xs text-muted-foreground">{w.symbol}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {q && (
                          <>
                            <span className="text-sm font-bold tabular-nums">{formatNum(q.price)} {q.currency}</span>
                            <span className={cn('text-xs font-semibold', (q.changePercent ?? 0) >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                              {(q.changePercent ?? 0) >= 0 ? '+' : ''}{formatNum(q.changePercent)}%
                            </span>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFromWatchlist(w.symbol)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          <Separator />

          {/* ─── PORTEFEUILLE ─── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Wallet className="h-4 w-4" /> Portefeuille</h2>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAddPositionOpen(true)}><Plus className="h-3.5 w-3.5" /> Position</Button>
            </div>

            {positions.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-sm text-muted-foreground">Aucune position. Enregistre tes achats/ventes pour suivre ton PRU et ton P&L.</p>
              </Card>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-3">
                  <TabsTrigger value="overview" className="gap-1 text-xs"><PieChart className="h-3 w-3" /> Vue d'ensemble</TabsTrigger>
                  <TabsTrigger value="positions" className="gap-1 text-xs"><TrendingUp className="h-3 w-3" /> Positions</TabsTrigger>
                  <TabsTrigger value="history" className="gap-1 text-xs"><History className="h-3 w-3" /> Historique</TabsTrigger>
                </TabsList>

                {/* ─── VUE D'ENSEMBLE ─── */}
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="p-3">
                      <p className="text-[10px] text-muted-foreground uppercase">Coût total</p>
                      <p className="text-lg font-bold tabular-nums">{formatAmount(portfolioSummary.totalCost, defaultCurrency)}</p>
                    </Card>
                    <Card className="p-3">
                      <p className="text-[10px] text-muted-foreground uppercase">Valeur actuelle</p>
                      <p className="text-lg font-bold tabular-nums">{portfolioSummary.hasQuotes ? formatAmount(portfolioSummary.totalValue, defaultCurrency) : '—'}</p>
                    </Card>
                    <Card className="p-3">
                      <p className="text-[10px] text-muted-foreground uppercase">P&L total</p>
                      {portfolioSummary.totalPl != null ? (
                        <p className={cn('text-lg font-bold tabular-nums', portfolioSummary.totalPl >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                          {portfolioSummary.totalPl >= 0 ? '+' : ''}{formatAmount(portfolioSummary.totalPl, defaultCurrency)}
                        </p>
                      ) : <p className="text-lg font-bold">—</p>}
                    </Card>
                    <Card className="p-3">
                      <p className="text-[10px] text-muted-foreground uppercase">Performance</p>
                      {portfolioSummary.totalPlPct != null ? (
                        <div className={cn('flex items-center gap-1 text-lg font-bold', portfolioSummary.totalPlPct >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                          {portfolioSummary.totalPlPct >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          {portfolioSummary.totalPlPct >= 0 ? '+' : ''}{formatNum(portfolioSummary.totalPlPct)}%
                        </div>
                      ) : <p className="text-lg font-bold">—</p>}
                    </Card>
                  </div>

                  {pieData.length > 0 && (
                    <Card className="p-4">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Allocation</h3>
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPie>
                              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
                                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                              </Pie>
                              <Tooltip formatter={(v: number) => formatAmount(v, defaultCurrency)} />
                            </RechartsPie>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1 space-y-1">
                          {pieData.map((d, i) => {
                            const pct = portfolioSummary.totalValue ? (d.value / portfolioSummary.totalValue * 100) : 0;
                            return (
                              <div key={d.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                  <span className="font-medium">{d.name}</span>
                                </div>
                                <span className="tabular-nums text-muted-foreground">{pct.toFixed(1)}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  )}

                  <div className="space-y-2">
                    {portfolioSummary.items.map(pos => (
                      <Card key={pos.symbol} className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">{pos.symbol}</p>
                            {pos.name && <p className="text-[10px] text-muted-foreground">{pos.name}</p>}
                          </div>
                          <div className="text-right">
                            {pos.currentValue != null && <p className="text-sm font-bold tabular-nums">{formatAmount(pos.currentValue, getCcy(pos.currency))}</p>}
                            {pos.plPct != null && (
                              <p className={cn('text-xs font-semibold', pos.pl! >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                                {pos.pl! >= 0 ? '+' : ''}{formatAmount(pos.pl!, getCcy(pos.currency))} ({pos.plPct >= 0 ? '+' : ''}{formatNum(pos.plPct)}%)
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-4 mt-1 text-[10px] text-muted-foreground">
                          <span>Qté: {formatNum(pos.quantity)}</span>
                          <span>PRU: {formatAmount(pos.pru, getCcy(pos.currency))}</span>
                          {pos.currentPrice != null && <span>Cours: {formatAmount(pos.currentPrice, getCcy(pos.currency))}</span>}
                          <span>Coût: {formatAmount(pos.cost, getCcy(pos.currency))}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* ─── POSITIONS DÉTAIL ─── */}
                <TabsContent value="positions" className="space-y-3">
                  {portfolioSummary.items.map(pos => {
                    const q = portfolioQuotes[pos.symbol];
                    const ccy = getCcy(q?.currency || pos.currency);
                    return (
                      <Card key={pos.symbol} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{pos.symbol}</p>
                            {pos.name && <p className="text-xs text-muted-foreground">{pos.name}</p>}
                          </div>
                          {q && (
                            <Badge variant={q.changePercent >= 0 ? 'default' : 'destructive'} className="text-[10px]">
                              {q.changePercent >= 0 ? '+' : ''}{formatNum(q.changePercent)}% auj.
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-xs">
                          <div className="flex justify-between"><span className="text-muted-foreground">Quantité</span><span className="font-semibold">{formatNum(pos.quantity)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">PRU</span><span className="font-semibold">{formatAmount(pos.pru, ccy)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Coût total</span><span className="font-semibold">{formatAmount(pos.cost, ccy)}</span></div>
                          {pos.currentPrice != null && <div className="flex justify-between"><span className="text-muted-foreground">Cours actuel</span><span className="font-semibold">{formatAmount(pos.currentPrice, ccy)}</span></div>}
                          {pos.currentValue != null && <div className="flex justify-between"><span className="text-muted-foreground">Valeur</span><span className="font-semibold">{formatAmount(pos.currentValue, ccy)}</span></div>}
                          {pos.pl != null && (
                            <div className="flex justify-between col-span-2">
                              <span className="text-muted-foreground">P&L</span>
                              <span className={cn('font-bold', pos.pl >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                                {pos.pl >= 0 ? '+' : ''}{formatAmount(pos.pl, ccy)} ({pos.plPct != null ? (pos.plPct >= 0 ? '+' : '') + formatNum(pos.plPct) + '%' : ''})
                              </span>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </TabsContent>

                {/* ─── HISTORIQUE TRANSACTIONS ─── */}
                <TabsContent value="history" className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-2">{positions.length} transaction{positions.length > 1 ? 's' : ''}</p>
                  {positions.map(p => {
                    const isBuy = p.type === 'buy';
                    const q = portfolioQuotes[p.symbol];
                    const ccy = getCcy(q?.currency || p.currency);
                    const currentPrice = q?.price ?? null;
                    const perfSinceEntry = currentPrice != null && p.price_per_unit > 0
                      ? ((currentPrice - p.price_per_unit) / p.price_per_unit) * 100
                      : null;
                    const plPerUnit = currentPrice != null ? currentPrice - p.price_per_unit : null;
                    const totalPl = plPerUnit != null ? plPerUnit * Math.abs(p.quantity) : null;
                    return (
                      <Card key={p.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold', isBuy ? 'bg-emerald-500' : 'bg-destructive')}>
                              {isBuy ? 'A' : 'V'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{p.symbol} {p.name && <span className="text-muted-foreground font-normal">({p.name})</span>}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(p.trade_date).toLocaleDateString('fr-FR')} · {Math.abs(p.quantity)} × {formatAmount(p.price_per_unit, ccy)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className={cn('text-sm font-bold tabular-nums', isBuy ? 'text-foreground' : 'text-emerald-500')}>
                                {isBuy ? '-' : '+'}{formatAmount(Math.abs(p.quantity * p.price_per_unit), ccy)}
                              </p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deletePosition(p.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {isBuy && currentPrice != null && (
                          <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Cours actuel: <span className="font-semibold text-foreground">{formatAmount(currentPrice, ccy)}</span></span>
                            <div className="flex items-center gap-2">
                              {totalPl != null && (
                                <span className={cn('font-semibold', totalPl >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                                  {totalPl >= 0 ? '+' : ''}{formatAmount(totalPl, ccy)}
                                </span>
                              )}
                              {perfSinceEntry != null && (
                                <Badge variant={perfSinceEntry >= 0 ? 'default' : 'destructive'} className="text-[10px]">
                                  {perfSinceEntry >= 0 ? '+' : ''}{formatNum(perfSinceEntry)}%
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </TabsContent>
              </Tabs>
            )}
          </section>
        </>
      )}

      {/* ─── ADD POSITION DIALOG ─── */}
      <Dialog open={addPositionOpen} onOpenChange={setAddPositionOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter une position</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2 relative">
              <Label>Symbole (ex. AAPL, MC.PA)</Label>
              <Input value={addSymbol} onChange={e => handleSymbolChange(e.target.value)} placeholder="MC.PA" />
              {symbolSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-popover border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {symbolSuggestions.map(s => (
                    <button key={s.symbol} className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors" onClick={() => selectSuggestion(s)}>
                      <span className="font-semibold">{s.symbol}</span> — <span className="text-muted-foreground">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground block">{s.sector_zone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Nom (optionnel)</Label>
              <Input value={addName} onChange={e => setAddName(e.target.value)} placeholder="Apple Inc." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={addType} onValueChange={(v: 'buy' | 'sell') => setAddType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Achat</SelectItem>
                    <SelectItem value="sell">Vente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input type="date" value={addDate} onChange={e => setAddDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantité</Label>
                <Input type="number" min="0" step="any" value={addQty} onChange={e => setAddQty(e.target.value)} placeholder="10" />
              </div>
              <div className="grid gap-2">
                <Label>Prix unitaire ({addCurrency})</Label>
                <Input type="number" min="0" step="0.01" value={addPrice} onChange={e => setAddPrice(e.target.value)} placeholder="150.00" />
              </div>
            </div>
            <Button onClick={savePosition} disabled={saving}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
