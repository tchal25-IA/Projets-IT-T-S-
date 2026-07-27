import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePlan } from '@/hooks/usePlan';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LevelBadge } from '@/components/LevelBadge';
import { XPBar } from '@/components/XPBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Calculator, Flame, Users, LogOut, Loader2, Copy, Check, Gift, Moon, Sun, Download, Bell, Sparkles, Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { useBadges } from '@/hooks/useBadges';
import { useStreak } from '@/hooks/useStreak';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const avatarEmojis = ['😎', '🧑‍💻', '🦊', '🐱', '🚀', '💎', '🌟', '🎯', '🏆', '🦉', '🐻', '🌸'];

export default function ProfilPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { plan: planTier } = usePlan();
  const { badges, awardBadge } = useBadges();
  const { streak } = useStreak();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar ?? '😎');

  // Security
  const [email, setEmail] = useState(profile?.email ?? '');
  const [newPassword, setNewPassword] = useState('');

  // Settings
  const [selectedMarket, setSelectedMarket] = useState(profile?.market ?? 'FR');

  // Referral
  const [referralCode, setReferralCode] = useState(profile?.referral_code ?? '');
  const [copied, setCopied] = useState(false);
  const [referralInput, setReferralInput] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [submittingReferral, setSubmittingReferral] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if ('Notification' in window) setNotifStatus(Notification.permission);
  }, []);

  // Stats
  const [articleCount, setArticleCount] = useState(0);
  const [simCount, setSimCount] = useState(0);

  const username = profile?.username ?? 'Utilisateur';
  const level = profile?.level ?? 1;
  const xpTotal = profile?.xp_total ?? 0;

  // Generate referral code if missing
  useEffect(() => {
    if (!user || !profile) return;
    if (!profile.referral_code) {
      const code = `FINZY-${username.toUpperCase().slice(0, 4)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      supabase.from('profiles').update({ referral_code: code }).eq('id', user.id).then(() => {
        setReferralCode(code);
        refreshProfile();
      });
    } else {
      setReferralCode(profile.referral_code);
    }
  }, [user, profile]);

  // Fetch stats
  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('user_academy_progress').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('saved_simulations').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      // Count users who used this user's referral code
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('referral_used_by', user.id),
    ]).then(([artRes, simRes, refRes]) => {
      setArticleCount(artRes.count ?? 0);
      setSimCount(simRes.count ?? 0);
      setReferralCount(refRes.count ?? 0);
    });
  }, [user, profile]);

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [prof, tx, rec, proj, goals, pat, liab, arts, sims] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('transactions').select('*').eq('user_id', user.id),
        supabase.from('recurring_transactions').select('*').eq('user_id', user.id),
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('patrimoine_entries').select('*').eq('user_id', user.id),
        supabase.from('patrimoine_liabilities').select('*').eq('user_id', user.id),
        supabase.from('user_academy_progress').select('*').eq('user_id', user.id),
        supabase.from('saved_simulations').select('*').eq('user_id', user.id),
      ]);
      const exportData = {
        exported_at: new Date().toISOString(),
        profile: prof.data,
        transactions: tx.data,
        recurring_transactions: rec.data,
        projects: proj.data,
        goals: goals.data,
        patrimoine_entries: pat.data,
        patrimoine_liabilities: liab.data,
        article_progress: arts.data,
        saved_simulations: sims.data,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finzy-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export téléchargé');
    } catch (e) {
      toast.error('Erreur lors de l\'export');
    }
    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirm.toLowerCase() !== username.toLowerCase()) {
      toast.error('Le pseudo ne correspond pas');
      return;
    }
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ confirmUsername: deleteConfirm }),
        },
      );
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error ?? 'Erreur');
      }
      await signOut();
      navigate('/');
      toast.success('Compte supprimé. À bientôt.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la suppression');
    }
    setDeleting(false);
  };

  const handleSaveSecurity = async () => {
    if (!user) return;
    setSaving(true);
    if (email && email !== profile?.email) {
      await supabase.from('profiles').update({ email }).eq('id', user.id);
    }
    if (newPassword.length >= 8) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) { toast.error(error.message); setSaving(false); return; }
    }
    await refreshProfile();
    toast.success('Profil mis à jour');
    setSaving(false);
    setNewPassword('');
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setSaving(true);
    const currency = selectedMarket === 'CH' ? 'CHF' : 'EUR';
    await supabase.from('profiles').update({ market: selectedMarket, currency }).eq('id', user.id);
    await refreshProfile();
    toast.success('Paramètres mis à jour');
    setSaving(false);
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success('Code copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitReferral = async () => {
    if (!user || !referralInput.trim()) return;
    const code = referralInput.trim().toUpperCase();
    if (code === referralCode) {
      toast.error('Tu ne peux pas utiliser ton propre code !');
      return;
    }
    setSubmittingReferral(true);
    // Find the referrer
    const { data: referrer } = await supabase.from('profiles').select('id').eq('referral_code', code).maybeSingle();
    if (!referrer) {
      toast.error('Code de parrainage invalide');
      setSubmittingReferral(false);
      return;
    }
    // Check if user already used a referral code
    const { data: selfProfile } = await supabase.from('profiles').select('referral_used_by').eq('id', user.id).single();
    if (selfProfile?.referral_used_by) {
      toast.error('Tu as déjà utilisé un code de parrainage.');
      setSubmittingReferral(false);
      return;
    }
    // Mark this user as having used the referral code
    await supabase.from('profiles').update({ referral_used_by: referrer.id }).eq('id', user.id);
    // Grant XP to both
    await supabase.rpc('grant_xp', { p_user_id: user.id, p_xp: 25 });
    await supabase.rpc('grant_xp', { p_user_id: referrer.id, p_xp: 50 });
    // Award referrer badge to the referrer
    // (We can't directly award to another user via the hook, so we insert directly)
    const referrerBadge = badges.find(b => b.key === 'referrer');
    if (referrerBadge) {
      await supabase.from('user_badges').insert({ user_id: referrer.id, badge_id: referrerBadge.id }).then(() => {});
    }
    await refreshProfile();
    toast.success('🎉 Parrainage validé ! +25 XP pour toi, +50 XP pour ton parrain');
    setReferralInput('');
    setSubmittingReferral(false);
  };

  const stats = [
    { icon: BookOpen, label: 'Articles lus', value: `${articleCount}` },
    { icon: Calculator, label: 'Simulations', value: `${simCount}` },
    { icon: Flame, label: 'Streak', value: `${streak}j` },
    { icon: Users, label: 'Parrainages', value: `${referralCount}` },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-3xl">
            {selectedAvatar}
          </div>
          <div>
            <h1 className="text-xl font-bold">{username}</h1>
            <LevelBadge level={level} />
            <XPBar currentXP={xpTotal} level={level} className="mt-2 w-48" />
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleSignOut} title="Déconnexion"><LogOut className="h-4 w-4" /></Button>
      </div>

      <Tabs defaultValue="profil">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="referral">Parrainage</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="profil" className="space-y-6">
          {/* Avatar picker */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">Avatar</h3>
            <div className="flex flex-wrap gap-2">
              {avatarEmojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={async () => {
                    setSelectedAvatar(emoji);
                    if (user) await supabase.from('profiles').update({ avatar: emoji }).eq('id', user.id);
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-xl transition-all ${selectedAvatar === emoji ? 'ring-2 ring-primary scale-110' : 'hover:bg-muted'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(s => (
              <div key={s.label} className="rounded-xl border bg-card p-4 text-center">
                <s.icon className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-2 text-lg font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="mb-3 font-semibold">Badges</h3>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {badges.map(b => (
                <div key={b.key} className={`rounded-xl border p-3 text-center transition-all ${b.earned ? 'hover:shadow-md' : 'opacity-30 grayscale'}`}>
                  <span className="text-2xl">{b.icon}</span>
                  <p className="mt-1 text-[10px] font-medium leading-tight">{b.label}</p>
                  {b.earned && <p className="text-[9px] text-primary font-medium mt-0.5">✓ Obtenu</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Plan info */}
          <div className="rounded-xl border bg-card p-4">
            {planTier === 'beta' && (
              <>
                <h3 className="text-sm font-bold">Plan : Beta 🧪</h3>
                <p className="mt-1 text-xs text-muted-foreground">Tous les modules sont accessibles gratuitement pendant la beta.</p>
              </>
            )}
            {planTier === 'premium' && (
              <>
                <h3 className="text-sm font-bold flex items-center gap-1">Plan : Premium 💎</h3>
                <p className="mt-1 text-xs text-muted-foreground">Tu profites de toutes les fonctionnalités, FinzyImmo inclus. Merci de ton soutien !</p>
              </>
            )}
            {planTier === 'free' && (
              <>
                <h3 className="text-sm font-bold">Plan : Gratuit</h3>
                <p className="mt-1 text-xs text-muted-foreground mb-3">Débloque les simulateurs avancés, l'Academy complète et FinzyImmo.</p>
                <Button asChild size="sm" className="bg-premium text-premium-foreground hover:bg-premium/90 gap-2">
                  <Link to="/premium"><Sparkles className="h-4 w-4" /> Passer Premium</Link>
                </Button>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="referral" className="space-y-6">
          {/* Share referral code */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Parraine tes amis</h3>
                <p className="text-xs text-muted-foreground">Gagne 50 XP + le badge 🤝 Ambassadeur pour chaque ami parrainé</p>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Ton code de parrainage</Label>
              <div className="flex gap-2 mt-1">
                <Input value={referralCode} readOnly className="font-mono text-sm tracking-wider" />
                <Button variant="outline" size="icon" onClick={copyReferralCode}>
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
              <p className="text-xs font-medium">Comment ça marche ?</p>
              <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside">
                <li>Partage ton code avec un ami</li>
                <li>Ton ami entre ton code dans son espace Parrainage</li>
                <li>Tu gagnes <strong className="text-foreground">50 XP</strong> + le badge <strong className="text-foreground">🤝 Ambassadeur</strong></li>
                <li>Ton ami gagne <strong className="text-foreground">25 XP</strong> de bienvenue</li>
              </ol>
            </div>
          </div>

          {/* Enter a referral code */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h3 className="font-semibold">Tu as un code parrain ?</h3>
            <p className="text-xs text-muted-foreground">Entre le code de la personne qui t'a invité pour recevoir 25 XP bonus.</p>
            <div className="flex gap-2">
              <Input
                value={referralInput}
                onChange={e => setReferralInput(e.target.value.toUpperCase())}
                placeholder="FINZY-XXXX-XXXX"
                className="font-mono text-sm tracking-wider"
              />
              <Button onClick={handleSubmitReferral} disabled={submittingReferral || !referralInput.trim()}>
                {submittingReferral ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Valider'}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 max-w-md">
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <h4 className="font-medium">Export de tes données (RGPD)</h4>
            <p className="text-xs text-muted-foreground">Télécharge une copie de toutes tes données personnelles.</p>
            <Button variant="outline" size="sm" onClick={handleExportData} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Télécharger mes données
            </Button>
          </div>
          <div><Label>Nom d'utilisateur</Label><Input value={username} disabled className="mt-1" /></div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Ajouter un email" className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">Sans email, pas de récupération de mot de passe</p>
          </div>
          <div><Label>Nouveau mot de passe</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 caractères" className="mt-1" /></div>
          <Button onClick={handleSaveSecurity} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer
          </Button>

          {/* Password reset hint */}
          {!email && (
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              💡 Ajoute un email ci-dessus pour pouvoir réinitialiser ton mot de passe si tu l'oublies.
            </div>
          )}

          {/* Danger zone */}
          <div className="rounded-xl border border-destructive/30 p-4 space-y-3 mt-6">
            <div className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              <h4 className="font-semibold text-sm">Supprimer mon compte</h4>
            </div>
            <p className="text-xs text-muted-foreground">Cette action est <strong>irréversible</strong>. Toutes tes données seront définitivement supprimées.</p>
            <div className="space-y-2">
              <Label className="text-xs">Tape ton pseudo <strong>{username}</strong> pour confirmer</Label>
              <Input
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder={username}
                className="border-destructive/30"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirm.toLowerCase() !== username.toLowerCase()}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Supprimer définitivement
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 max-w-md">
          <div className="flex items-center justify-between rounded-xl border p-4">
            <div>
              <p className="font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </p>
              <p className="text-xs text-muted-foreground">Rappels quiz, streak, alertes projets</p>
            </div>
            {notifStatus !== null && (
              <Button
                variant={notifStatus === 'granted' ? 'secondary' : 'outline'}
                size="sm"
                onClick={async () => {
                  if (Notification.permission === 'default') {
                    const p = await Notification.requestPermission();
                    setNotifStatus(p);
                    if (p === 'granted') toast.success('Notifications activées');
                    else if (p === 'denied') toast.error('Notifications refusées');
                  }
                }}
                disabled={notifStatus === 'granted'}
              >
                {notifStatus === 'granted' ? 'Activées' : notifStatus === 'denied' ? 'Refusées' : 'Activer'}
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between rounded-xl border p-4">
            <div>
              <p className="font-medium">Thème</p>
              <p className="text-xs text-muted-foreground">Mode clair ou sombre</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
                aria-label="Mode clair"
              >
                <Sun className="h-4 w-4" />
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
                aria-label="Mode sombre"
              >
                <Moon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label>Marché</Label>
            <Select value={selectedMarket} onValueChange={setSelectedMarket}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FR">🇫🇷 France (EUR)</SelectItem>
                <SelectItem value="CH">🇨🇭 Suisse (CHF)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            Changer le marché adapte les simulateurs, catégories, enveloppes et la devise.
          </div>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
