import { useState } from 'react';
import { SEO } from '@/components/SEO';
import { Shield, Search, Crown, Gift, X, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/hooks/usePlan';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

interface UserResult {
  id: string;
  username: string;
  plan: string;
  premium_type: string | null;
  premium_trial_ends_at: string | null;
  is_admin: boolean;
}

export default function AdminPage() {
  const { user } = useAuth();
  const { isAdmin } = usePlan();
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<UserResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [action, setAction] = useState<'lifetime' | 'trial' | 'revoke'>('trial');
  const [months, setMonths] = useState('3');
  const [applying, setApplying] = useState(false);

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    setResult(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, plan, premium_type, premium_trial_ends_at, is_admin')
      .ilike('username', search.trim())
      .limit(1)
      .maybeSingle();
    if (error) toast.error('Erreur de recherche');
    else if (!data) toast.error('Utilisateur introuvable');
    else setResult(data as UserResult);
    setSearching(false);
  };

  const handleApply = async () => {
    if (!result || !user) return;
    setApplying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-manage-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            targetUserId: result.id,
            action,
            months: action === 'trial' ? parseInt(months, 10) : undefined,
          }),
        },
      );
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error ?? 'Erreur');
      }
      const updated = await resp.json();
      setResult(prev => prev ? { ...prev, ...updated } : null);
      toast.success('Modification appliquée avec succès');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur inconnue');
    }
    setApplying(false);
  };

  const planLabel = (u: UserResult) => {
    if (u.plan === 'free') return 'Gratuit';
    if (u.premium_type === 'lifetime') return 'Premium à vie 👑';
    if (u.premium_type === 'trial' && u.premium_trial_ends_at) {
      const d = new Date(u.premium_trial_ends_at).toLocaleDateString('fr-FR');
      return `Premium offert jusqu'au ${d}`;
    }
    return 'Premium';
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <SEO title="Admin — Finzy" path="/admin" />
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
          <Shield className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Panel Admin</h1>
          <p className="text-xs text-muted-foreground">Gestion des abonnements utilisateurs</p>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Search className="h-4 w-4" /> Rechercher un utilisateur</h2>
        <div className="flex gap-2">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Pseudo exact ou partiel…"
          />
          <Button onClick={handleSearch} disabled={searching}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {result && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{result.username}</p>
                <p className="text-xs text-muted-foreground">{planLabel(result)}</p>
                {result.is_admin && <p className="text-xs text-destructive font-medium">⚠️ Admin</p>}
              </div>
              <button onClick={() => setResult(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Action</Label>
                <Select value={action} onValueChange={v => setAction(v as typeof action)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lifetime">
                      <span className="flex items-center gap-2"><Crown className="h-3.5 w-3.5" /> Premium à vie</span>
                    </SelectItem>
                    <SelectItem value="trial">
                      <span className="flex items-center gap-2"><Gift className="h-3.5 w-3.5" /> Mois offerts</span>
                    </SelectItem>
                    <SelectItem value="revoke">
                      <span className="flex items-center gap-2"><X className="h-3.5 w-3.5" /> Révoquer premium</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {action === 'trial' && (
                <div>
                  <Label className="text-xs">Nombre de mois</Label>
                  <Select value={months} onValueChange={setMonths}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 6, 12, 24].map(m => (
                        <SelectItem key={m} value={String(m)}>{m} mois{m >= 12 ? ` (${m / 12} an${m > 12 ? 's' : ''})` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button onClick={handleApply} disabled={applying} className="w-full">
                {applying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Appliquer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
