import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { FinancialDisclaimer } from '@/components/FinancialDisclaimer';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/hooks/usePlan';
import { useLocation, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const pageContextMap: Record<string, string> = {
  '/dashboard': 'Dashboard — vue d\'ensemble financière',
  '/budget': 'Budget — gestion des revenus et dépenses',
  '/projets': 'Projets — objectifs d\'épargne',
  '/patrimoine': 'Patrimoine — suivi des actifs et passifs',
  '/simulateurs': 'Simulateurs — outils de calcul financier',
  '/academy': 'Academy — articles d\'éducation financière',
  '/profil': 'Profil — paramètres utilisateur',
};

export function FinzyBotFAB() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [dailyUsed, setDailyUsed] = useState(0);
  const { user, profile } = useAuth();
  const { isPremium } = usePlan();
  const FREE_LIMIT = 3;

  const loadLastConversation = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('ai_conversations')
      .select('id, messages_json')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.messages_json && Array.isArray(data.messages_json) && data.messages_json.length > 0) {
      setMessages(data.messages_json as Msg[]);
      setConversationId(data.id);
    }
  }, [user]);

  const loadDailyUsage = useCallback(async () => {
    if (!user || isPremium) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from('ai_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();
    setDailyUsed(data?.count ?? 0);
  }, [user, isPremium]);

  useEffect(() => {
    if (open && user) { loadLastConversation(); loadDailyUsage(); }
  }, [open, user, loadLastConversation, loadDailyUsage]);

  const saveConversation = async (msgs: Msg[]) => {
    if (!user || msgs.length === 0) return;
    const payload = { user_id: user.id, messages_json: msgs };
    if (conversationId) {
      await supabase.from('ai_conversations').update(payload).eq('id', conversationId);
    } else {
      const { data } = await supabase.from('ai_conversations').insert(payload).select('id').single();
      if (data) setConversationId(data.id);
    }
  };
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const market = profile?.market ?? 'FR';
  const currentPage = Object.entries(pageContextMap).find(([path]) => location.pathname.startsWith(path))?.[1] ?? 'Page inconnue';

  const suggestions = market === 'CH'
    ? ['Comment optimiser mon 3ème pilier ?', "C'est quoi l'EPL ?", 'Combien je paie d\'impôts ?']
    : ['Comment optimiser mon épargne ?', "C'est quoi le PEA ?", 'Combien puis-je emprunter ?'];

  // Context-aware suggestions based on current page
  const pageSuggestions: Record<string, string[]> = {
    '/budget': ['Comment réduire mes dépenses ?', 'Quel taux d\'épargne viser ?'],
    '/patrimoine': ['Comment diversifier mon patrimoine ?', 'Quels placements choisir ?'],
    '/simulateurs': ['Quel simulateur utiliser en premier ?', 'Comment calculer ma capacité d\'emprunt ?'],
    '/academy': ['Par quel article commencer ?', 'C\'est quoi les ETF ?'],
  };
  const contextSuggestions = Object.entries(pageSuggestions).find(([path]) => location.pathname.startsWith(path))?.[1] ?? [];

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';
    const allMessages = [...messages, userMsg];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          context: {
            market: profile?.market ?? 'FR',
            currency: profile?.currency ?? 'EUR',
            profile_type: profile?.profile_type ?? 'curieux',
            level: profile?.level ?? 1,
            username: profile?.username ?? 'Utilisateur',
            current_page: currentPage,
          },
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
        const errData = await resp.json().catch(() => ({}));
        if (errData.quota_reached) { setDailyUsed(FREE_LIMIT); }
        const { toast } = await import('sonner');
        toast.error(errData.error ?? 'Trop de requêtes, réessaie dans un moment.');
        setIsLoading(false); return;
      }
        if (resp.status === 402) { const { toast } = await import('sonner'); toast.error('Crédits IA épuisés.'); setIsLoading(false); return; }
        throw new Error('Erreur serveur');
      }

      if (!resp.body) throw new Error('No stream body');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
      const finalMessages: Msg[] = [...allMessages, { role: 'assistant', content: assistantSoFar }];
      setMessages(finalMessages);
      saveConversation(finalMessages);
      if (!isPremium) setDailyUsed(prev => Math.min(prev + 1, FREE_LIMIT));
    } catch (e) {
      console.error('FinzyBot error:', e);
      const { toast } = await import('sonner');
      toast.error('Erreur de communication avec FinzyBot');
    }
    setIsLoading(false);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed z-50 rounded-full bg-primary p-3.5 text-primary-foreground shadow-lg hover:shadow-xl transition-shadow focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          style={{ bottom: isMobile ? 80 : 24, right: 24 }}
          aria-label="Ouvrir FinzyBot, assistant financier"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className={cn('fixed z-50 flex flex-col bg-card border shadow-2xl',
          isMobile ? 'inset-x-0 bottom-0 h-[80vh] rounded-t-2xl' : 'right-4 bottom-4 top-4 w-[400px] rounded-xl')}>
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <span className="font-bold">FinzyBot ✨</span>
              <span className="ml-2 text-[10px] text-muted-foreground">{currentPage}</span>
              {!isPremium && (
                <span className={cn('ml-2 text-[10px] font-medium', dailyUsed >= FREE_LIMIT ? 'text-destructive' : 'text-muted-foreground')}>
                  {dailyUsed}/{FREE_LIMIT} msg
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={() => { setMessages([]); setConversationId(null); }}
                  className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                >
                  Nouvelle
                </button>
              )}
              <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-muted" aria-label="Fermer"><X className="h-4 w-4" /></button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="rounded-lg bg-muted p-3 text-sm max-w-[85%]">
              Salut {profile?.username ?? ''} ! 👋 Je suis FinzyBot, ton assistant financier {market === 'CH' ? '🇨🇭' : '🇫🇷'}. Comment puis-je t'aider ?
            </div>
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {(contextSuggestions.length > 0 ? contextSuggestions : suggestions).map(s => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border px-3 py-1 text-xs hover:bg-muted transition-colors">{s}</button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn('rounded-lg p-3 text-sm max-w-[85%] whitespace-pre-wrap',
                m.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted')}>
                {m.content}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Réflexion...</div>
            )}
          </div>

          <div className="border-t px-4 py-2"><FinancialDisclaimer /></div>

          {!isPremium && dailyUsed >= FREE_LIMIT ? (
            <div className="border-t px-4 py-3 text-center space-y-2">
              <p className="text-xs text-muted-foreground">Quota journalier atteint (3 messages/jour)</p>
              <Button asChild size="sm" className="bg-premium text-premium-foreground hover:bg-premium/90 gap-1 w-full">
                <Link to="/premium"><Sparkles className="h-3.5 w-3.5" /> Passer Premium — illimité</Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 border-t px-4 py-3">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
                placeholder="Pose ta question…"
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
              <Button size="icon" className="shrink-0" onClick={() => send(input)} disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
