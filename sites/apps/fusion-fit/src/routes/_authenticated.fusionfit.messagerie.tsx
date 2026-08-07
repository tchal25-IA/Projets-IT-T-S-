import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Shield, User, Zap, Loader2, ChevronLeft, Users, Bell, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  useMessages,
  useMessagesRealtime,
  useSendMessage,
  useCoachId,
  useConversationId,
  useAthletes,
  useMarkConversationRead,
  useUnreadByPeer,
} from "@/hooks/use-messages";
import { useNotifications, useUnreadNotifCount, useMarkNotifRead } from "@/hooks/use-notifications";
import { AvatarUploader } from "@/components/avatar-uploader";
import { FF } from "@/lib/ff-colors";

export const Route = createFileRoute("/_authenticated/fusionfit/messagerie")({
  component: MessageriePage,
  // Deep link depuis une notification : ?with=<userId> ouvre directement la
  // conversation avec cette personne.
  validateSearch: (search: Record<string, unknown>) => ({
    with: typeof search.with === "string" ? search.with : undefined,
  }),
});

const SUGGESTIONS = [
  "Mon énergie est haute aujourd'hui",
  "J'ai besoin d'adapter la séance",
  "Comment progresser sur Hyrox ?",
  "Check-in fait ✓",
];

function MessageriePage() {
  const { role } = useAuth();
  return (
    <div className="space-y-4">
      <NotificationsPanel />
      {role === "coach" ? <CoachMessagerie /> : <AbonneMessagerie />}
    </div>
  );
}

// Panneau notifications regroupé dans la messagerie (la cloche a été retirée).
// Repliable ; s'ouvre automatiquement s'il y a des non-lues.
function NotificationsPanel() {
  const { data: notifs = [] } = useNotifications(30);
  const { data: unread = 0 } = useUnreadNotifCount();
  const { mutate: markRead } = useMarkNotifRead();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Ouvre le panneau si notifs non-lues au premier affichage.
  useEffect(() => {
    if (unread > 0) setOpen(true);
  }, [unread]);

  return (
    <section className="rounded-2xl border overflow-hidden"
      style={{ background: FF.surface, borderColor: FF.border }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <span className="flex items-center gap-2">
          <Bell className="h-4 w-4" style={{ color: unread > 0 ? FF.amber : FF.textMuted }} />
          <span className="text-xs font-mono uppercase tracking-widest" style={{ color: FF.textMuted }}>
            Notifications
          </span>
          {unread > 0 && (
            <span className="min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold grid place-items-center"
              style={{ background: FF.amber, color: "#0a0e1a" }}>
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
        {notifs.length > 0 && open && (
          <button
            onClick={(e) => { e.stopPropagation(); markRead(undefined); }}
            className="text-[10px] flex items-center gap-1"
            style={{ color: FF.cyan }}
          >
            <Check className="h-3 w-3" /> Tout lire
          </button>
        )}
      </button>
      {open && (
        <div className="max-h-[45vh] overflow-y-auto border-t" style={{ borderColor: FF.border }}>
          {notifs.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: FF.textMuted }}>Aucune notification.</p>
          ) : (
            notifs.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.read_at) markRead([n.id]);
                  if (!n.link) return;
                  // Deep links avec query (?with=) : ne pas passer la query dans `to`
                  try {
                    const url = new URL(n.link, window.location.origin);
                    const path = url.pathname;
                    const search = Object.fromEntries(url.searchParams.entries());
                    if (path.startsWith("/fusionfit")) {
                      navigate({
                        to: path as "/fusionfit/messagerie",
                        search: Object.keys(search).length ? search : undefined,
                      } as never);
                    }
                  } catch {
                    window.location.assign(n.link);
                  }
                }}
                className="w-full text-left px-4 py-3 border-b transition hover:opacity-90"
                style={{ borderColor: FF.border, background: n.read_at ? "transparent" : FF.cyanBg }}
              >
                <p className="text-sm font-semibold" style={{ color: FF.text }}>{n.title}</p>
                {n.body && <p className="text-xs mt-0.5" style={{ color: FF.textMuted }}>{n.body}</p>}
                <p className="text-[10px] font-mono mt-1" style={{ color: FF.textMuted }}>
                  {new Date(n.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </section>
  );
}

// ─── Vue Abonné : conversation unique avec son coach ──────────────────
function AbonneMessagerie() {
  const { data: coachId, isLoading } = useCoachId();

  if (isLoading) return <CenterSpinner />;
  if (!coachId) {
    return (
      <Empty
        icon={<Shield className="h-10 w-10" style={{ color: FF.textMuted }} />}
        text="Aucun coach rattaché pour le moment. Rejoins un coach via son lien d'invitation."
      />
    );
  }
  return <Conversation otherId={coachId} titre="Coach Initiative" coachSide={false} />;
}

// ─── Vue Coach : sélection d'un athlète puis conversation ─────────────
function CoachMessagerie() {
  const { data: athletes = [], isLoading } = useAthletes();
  const { data: unreadByPeer = {} } = useUnreadByPeer();
  const [selected, setSelected] = useState<{ id: string; prenom: string; avatar_url: string | null } | null>(null);
  const { with: withId } = Route.useSearch();

  // Deep link : ouvre directement la conversation demandée par la notification.
  useEffect(() => {
    if (!withId || selected || !athletes.length) return;
    const a = athletes.find((x) => x.user_id === withId);
    if (a) setSelected({ id: a.user_id, prenom: a.prenom, avatar_url: a.avatar_url });
  }, [withId, athletes, selected]);

  if (isLoading) return <CenterSpinner />;

  if (selected) {
    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1 text-xs mb-3"
          style={{ color: FF.textMuted }}
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Athlètes
        </button>
        <Conversation
          otherId={selected.id}
          titre={selected.prenom}
          coachSide
          avatarUserId={selected.id}
          avatarPath={selected.avatar_url}
        />
      </div>
    );
  }

  if (athletes.length === 0) {
    return (
      <Empty
        icon={<Users className="h-10 w-10" style={{ color: FF.textMuted }} />}
        text="Aucun athlète. Invite-en un depuis l'onglet Escouade."
      />
    );
  }

  // Conversations non lues en tête
  const sorted = [...athletes].sort((a, b) => {
    const ua = unreadByPeer[a.user_id] ? 1 : 0;
    const ub = unreadByPeer[b.user_id] ? 1 : 0;
    return ub - ua;
  });

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: FF.amber }}>
          // Coach · Messagerie
        </p>
        <h1 className="mt-2 text-2xl font-bold">Conversations</h1>
      </div>
      {sorted.map((a) => {
        const unread = !!unreadByPeer[a.user_id];
        return (
          <button
            key={a.user_id}
            onClick={() => setSelected({ id: a.user_id, prenom: a.prenom, avatar_url: a.avatar_url })}
            className="w-full flex items-center gap-3 rounded-2xl border p-3 text-left transition hover:opacity-90"
            style={{
              background: unread ? "oklch(0.78 0.18 55 / 10%)" : FF.surface,
              borderColor: unread ? FF.amber : FF.border,
            }}
          >
            <div className="relative">
              <AvatarUploader userId={a.user_id} avatarPath={a.avatar_url} size={40} />
              {unread && (
                <span
                  className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border"
                  style={{ background: FF.amber, borderColor: FF.surface }}
                  aria-label="Nouveau message"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm flex items-center gap-2">
                {a.prenom}
                {unread && (
                  <span
                    className="min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold grid place-items-center"
                    style={{ background: FF.amber, color: "#0a0e1a" }}
                  >
                    1
                  </span>
                )}
              </p>
              <p className="text-xs truncate" style={{ color: FF.textMuted }}>
                {unread ? "Nouveau message" : (a.objectif_principal || a.email || "—")}
              </p>
            </div>
            <Send className="h-4 w-4" style={{ color: unread ? FF.amber : FF.textMuted }} />
          </button>
        );
      })}
    </div>
  );
}

// ─── Conversation (commune coach/abonné) ──────────────────────────────
function Conversation({ otherId, titre, coachSide, avatarUserId, avatarPath }: {
  otherId: string; titre: string; coachSide: boolean;
  avatarUserId?: string; avatarPath?: string | null;
}) {
  const { user } = useAuth();
  const { data: conversationId, isLoading: loadingConv } = useConversationId(otherId);
  const { data: messages = [], refetch } = useMessages(conversationId);
  const { mutate: sendMessage, isPending: sending } = useSendMessage();
  const { mutate: markRead } = useMarkConversationRead();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Marquer comme lu à l'ouverture + à chaque nouveau message reçu
  useEffect(() => {
    if (conversationId) markRead(conversationId);
  }, [conversationId, messages.length, markRead]);

  const handleNewMessage = useCallback(() => { refetch(); }, [refetch]);
  useMessagesRealtime(conversationId, handleNewMessage);

  const lastSentAt = useRef(0);
  function envoyer(texte: string) {
    if (!texte.trim() || !conversationId) return;
    const now = Date.now();
    if (now - lastSentAt.current < 400) return;
    lastSentAt.current = now;
    sendMessage({ conversation_id: conversationId, texte });
    setInput("");
  }

  if (loadingConv) return <CenterSpinner />;

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      <div className="flex items-center gap-3 pb-3 mb-3 border-b" style={{ borderColor: FF.border }}>
        {avatarUserId ? (
          <AvatarUploader userId={avatarUserId} avatarPath={avatarPath ?? null} size={40} />
        ) : (
          <div className="h-10 w-10 rounded-full grid place-items-center border-2 ff-glow-cyan"
            style={{ borderColor: FF.cyan, background: FF.surface2 }}>
            <Shield className="h-5 w-5" style={{ color: FF.cyan }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{titre}</p>
          <p className="text-[11px]" style={{ color: FF.textMuted }}>
            {coachSide ? "Athlète Initiative" : "Ton coach"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <p className="text-center text-xs py-8" style={{ color: FF.textMuted }}>
            Aucun message — commencez la conversation !
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.from_user_id === user?.id;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              <div className="h-7 w-7 rounded-full grid place-items-center flex-shrink-0 border"
                style={{ background: FF.surface2, borderColor: isMe ? FF.border : FF.cyan }}>
                {isMe
                  ? <User className="h-3.5 w-3.5" style={{ color: FF.textMuted }} />
                  : <Shield className="h-3.5 w-3.5" style={{ color: FF.cyan }} />}
              </div>
              <div className={`max-w-[75%] ${isMe ? "items-end" : ""}`}>
                <div className="rounded-2xl px-3 py-2 border"
                  style={{
                    background: isMe ? FF.cyanBg20 : FF.surface,
                    borderColor: isMe ? FF.cyan : FF.border,
                  }}>
                  {msg.type === "protocole" && (
                    <p className="text-[10px] font-mono uppercase tracking-widest mb-1 flex items-center gap-1"
                      style={{ color: FF.amber }}>
                      <Zap className="h-3 w-3" /> Protocole prescrit
                    </p>
                  )}
                  {(msg.type === "encouragement" || msg.type === "notification") && (
                    <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: FF.green }}>
                      {msg.type === "notification" ? "Notification" : "Encouragement"}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.texte}</p>
                </div>
                <p className={`text-[10px] font-mono mt-1 ${isMe ? "text-right" : "text-left"}`}
                  style={{ color: FF.textMuted }}>
                  {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!coachSide && (
        <div className="flex gap-2 overflow-x-auto py-2 -mx-1 px-1">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => envoyer(s)}
              className="flex-shrink-0 text-[11px] px-2.5 py-1.5 rounded-lg border whitespace-nowrap"
              style={{ borderColor: FF.border, color: FF.textMuted, background: FF.surface }}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-xl px-3 py-2 border mt-2"
        style={{ background: FF.surface, borderColor: FF.border }}>
        <input
          placeholder="Écrire un message…"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: FF.text }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(input); } }}
        />
        <button onClick={() => envoyer(input)} disabled={!input.trim() || sending}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-all"
          style={{
            background: input.trim() ? FF.cyanBg20 : FF.surface2,
            border: `1px solid ${input.trim() ? FF.cyan : FF.border}`,
            color: input.trim() ? FF.cyan : FF.textMuted,
          }}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function CenterSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: FF.cyan }} />
    </div>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      {icon}
      <p className="text-sm max-w-xs" style={{ color: FF.textMuted }}>{text}</p>
    </div>
  );
}
