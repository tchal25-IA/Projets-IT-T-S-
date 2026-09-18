import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Shield, User, Zap, Loader2, ChevronLeft, Users, Bell, Check, CheckCheck,
  Mic, Square, Play,
} from "lucide-react";
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
  useConversationMeta,
} from "@/hooks/use-messages";
import { useNotifications, useUnreadNotifCount, useMarkNotifRead } from "@/hooks/use-notifications";
import { AvatarUploader } from "@/components/avatar-uploader";
import { supabase } from "@/integrations/supabase/client";
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
function NotificationsPanel() {
  const { data: notifs = [] } = useNotifications(30);
  const { data: unread = 0 } = useUnreadNotifCount();
  const { mutate: markRead } = useMarkNotifRead();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

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
  return <Conversation otherId={coachId} titre="Head Coach" coachSide={false} />;
}

function CoachMessagerie() {
  const { data: athletes = [], isLoading } = useAthletes();
  const { data: unreadByPeer = {} } = useUnreadByPeer();
  const [selected, setSelected] = useState<{ id: string; prenom: string; avatar_url: string | null } | null>(null);
  const { with: withId } = Route.useSearch();

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
        text="Aucun athlète. Invite-en un depuis l'onglet Athlète."
      />
    );
  }

  const sorted = [...athletes].sort((a, b) => {
    const ua = unreadByPeer[a.user_id] ? 1 : 0;
    const ub = unreadByPeer[b.user_id] ? 1 : 0;
    if (ub !== ua) return ub - ua;
    const ta = a.last_message_at || a.last_checkin || "";
    const tb = b.last_message_at || b.last_checkin || "";
    return tb.localeCompare(ta);
  });

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: FF.amber }}>
          // Mode Coach · Messagerie
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

function Conversation({ otherId, titre, coachSide, avatarUserId, avatarPath }: {
  otherId: string; titre: string; coachSide: boolean;
  avatarUserId?: string; avatarPath?: string | null;
}) {
  const { user } = useAuth();
  const { data: conversationId, isLoading: loadingConv } = useConversationId(otherId);
  const { data: messages = [], refetch } = useMessages(conversationId);
  const { data: meta } = useConversationMeta(conversationId);
  const { mutate: sendMessage, isPending: sending } = useSendMessage();
  const { mutate: markRead } = useMarkConversationRead();
  const [input, setInput] = useState("");
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (conversationId) markRead(conversationId);
  }, [conversationId, messages.length, markRead]);

  const handleNewMessage = useCallback(() => { refetch(); }, [refetch]);
  useMessagesRealtime(conversationId, handleNewMessage);

  const peerLastRead = coachSide
    ? meta?.abonne_last_read_at
    : meta?.coach_last_read_at;

  const lastSentAt = useRef(0);
  function envoyer(texte: string) {
    if (!texte.trim() || !conversationId) return;
    const now = Date.now();
    if (now - lastSentAt.current < 400) return;
    lastSentAt.current = now;
    sendMessage({ conversation_id: conversationId, texte });
    setInput("");
  }

  async function envoyerVocal(blob: Blob, durationSec: number) {
    if (!conversationId || !user) return;
    setUploadingVoice(true);
    try {
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      const path = `${user.id}/${conversationId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("chat-audio")
        .upload(path, blob, { contentType: blob.type || "audio/webm", upsert: false });
      if (upErr) throw upErr;
      sendMessage({
        conversation_id: conversationId,
        texte: "🎤 Note vocale",
        type: "voice",
        media_url: path,
        media_duration_sec: Math.max(1, Math.round(durationSec)),
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Envoi vocal impossible");
    } finally {
      setUploadingVoice(false);
    }
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
            {coachSide ? "Mode Athlète" : "Mode Coach"}
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
          const isRead = !!(peerLastRead && msg.created_at <= peerLastRead);
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
                  {msg.type === "voice" && msg.media_url ? (
                    <VoiceBubble path={msg.media_url} durationSec={msg.media_duration_sec} />
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.texte}</p>
                  )}
                </div>
                <p className={`text-[10px] font-mono mt-1 flex items-center gap-1 ${isMe ? "justify-end" : "justify-start"}`}
                  style={{ color: FF.textMuted }}>
                  {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  {isMe && <ReadReceipt read={isRead} />}
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
        <VoiceRecorder onRecorded={envoyerVocal} disabled={sending || uploadingVoice || !conversationId} />
        <input
          placeholder="Écrire un message…"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: FF.text }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(input); } }}
        />
        <button onClick={() => envoyer(input)} disabled={!input.trim() || sending || uploadingVoice}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-all"
          style={{
            background: input.trim() ? FF.cyanBg20 : FF.surface2,
            border: `1px solid ${input.trim() ? FF.cyan : FF.border}`,
            color: input.trim() ? FF.cyan : FF.textMuted,
          }}>
          {sending || uploadingVoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function ReadReceipt({ read }: { read: boolean }) {
  return (
    <span title={read ? "Lu" : "Envoyé"} aria-label={read ? "Lu" : "Envoyé"}>
      {read
        ? <CheckCheck className="h-3.5 w-3.5" style={{ color: FF.cyan }} />
        : <Check className="h-3.5 w-3.5" style={{ color: FF.textMuted }} />}
    </span>
  );
}

function VoiceBubble({ path, durationSec }: { path: string; durationSec?: number | null }) {
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.storage.from("chat-audio").createSignedUrl(path, 3600);
      if (cancelled || error || !data?.signedUrl) return;
      setUrl(data.signedUrl);
    })();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
      audioRef.current?.pause();
    };
  }, [path]);

  function toggle() {
    if (!url) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      void audioRef.current.play();
      setPlaying(true);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center gap-2 min-w-[140px]"
      disabled={!url}
    >
      <span className="h-8 w-8 rounded-full grid place-items-center border"
        style={{ borderColor: FF.cyan, color: FF.cyan, background: FF.cyanBg }}>
        {playing ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </span>
      <span className="text-sm">
        Note vocale{durationSec ? ` · ${durationSec}s` : ""}
      </span>
    </button>
  );
}

function VoiceRecorder({
  onRecorded,
  disabled,
}: {
  onRecorded: (blob: Blob, durationSec: number) => void | Promise<void>;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAt = useRef(0);
  const tickRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    mediaRef.current?.stop();
  }, []);

  async function start() {
    if (disabled || recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        const duration = Math.max(1, (Date.now() - startedAt.current) / 1000);
        void onRecorded(blob, duration);
      };
      mediaRef.current = rec;
      startedAt.current = Date.now();
      setSecs(0);
      tickRef.current = window.setInterval(() => {
        setSecs(Math.floor((Date.now() - startedAt.current) / 1000));
      }, 250);
      rec.start();
      setRecording(true);
    } catch {
      alert("Micro inaccessible. Autorise le micro dans le navigateur.");
    }
  }

  function stop() {
    if (!recording) return;
    if (tickRef.current) window.clearInterval(tickRef.current);
    mediaRef.current?.stop();
    setRecording(false);
    setSecs(0);
  }

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      disabled={disabled && !recording}
      aria-label={recording ? "Arrêter l'enregistrement" : "Note vocale"}
      className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0 relative"
      style={{
        background: recording ? "oklch(0.65 0.20 22 / 18%)" : FF.surface2,
        border: `1px solid ${recording ? "var(--ff-red)" : FF.border}`,
        color: recording ? "var(--ff-red)" : FF.textMuted,
      }}
    >
      {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      {recording && (
        <span className="absolute -top-2 -right-1 text-[9px] font-mono tabular-nums px-1 rounded"
          style={{ background: "var(--ff-red)", color: "#fff" }}>
          {secs}s
        </span>
      )}
    </button>
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
