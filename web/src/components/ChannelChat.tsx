import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Channel } from '../types/Channel';
import { ChannelMessage } from '../types/ChannelMessage';

const MAX_LENGTH = 2000;
const COUNTER_THRESHOLD = 1800;
const MESSAGE_GAP = 12;
const AVATAR_SIZE = 32;

export interface ChannelChatProps {
  channel: Channel;
  messages: ChannelMessage[];
  onSendMessage: (content: string, mentions: string[]) => Promise<void>;
  onDeleteMessage: (discordMessageId: string) => void;
  /** When true, delete control is shown for non-deleted messages. */
  isAdmin?: boolean;
  /** Per-message delete permission (e.g. own messages). Used when `isAdmin` is false. */
  canDeleteMessage?: (message: ChannelMessage) => boolean;
}

const MENTION_RE = /<@!?(\d+)>/g;

function extractMentionIds(content: string): string[] {
  const ids = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(MENTION_RE.source, 'g');
  while ((m = re.exec(content)) !== null) {
    ids.add(m[1]);
  }
  return [...ids];
}

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderMessageContent(content: string): ReactNode {
  const nodes: ReactNode[] = [];
  const re = new RegExp(MENTION_RE.source, 'g');
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) {
      nodes.push(
        <span key={`t-${key++}`}>{content.slice(last, m.index)}</span>
      );
    }
    const full = m[0];
    nodes.push(
      <span
        key={`m-${key++}`}
        className="bmw-body-sm px-0.5"
        style={{
          backgroundColor: 'var(--bmw-primary)',
          color: 'var(--bmw-on-primary)',
          transition: 'background-color 0.2s ease, color 0.2s ease',
          borderRadius: 0,
        }}
      >
        {full}
      </span>
    );
    last = m.index + full.length;
  }
  if (last < content.length) {
    nodes.push(<span key={`t-${key++}`}>{content.slice(last)}</span>);
  }
  return nodes.length > 0 ? nodes : content;
}

function DeleteIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export function ChannelChat({
  channel,
  messages,
  onSendMessage,
  onDeleteMessage,
  isAdmin = false,
  canDeleteMessage,
}: ChannelChatProps) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) =>
        new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
    );
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [sortedMessages, scrollToBottom]);

  const showDeleteFor = useCallback(
    (msg: ChannelMessage) => {
      if (msg.deleted_at) return false;
      if (isAdmin) return true;
      return canDeleteMessage?.(msg) ?? false;
    },
    [isAdmin, canDeleteMessage]
  );

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || sending || trimmed.length > MAX_LENGTH) return;

    setSending(true);
    try {
      const mentions = extractMentionIds(draft);
      await onSendMessage(trimmed, mentions);
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      role="region"
      aria-label={`Chat del canal ${channel.name}`}
    >
      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto p-4"
        style={{
          backgroundColor: 'var(--bmw-surface-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: MESSAGE_GAP,
        }}
      >
        {sortedMessages.length === 0 ? (
          <p className="bmw-body-sm py-8 text-center" style={{ color: 'var(--bmw-muted)' }}>
            No hay mensajes en #{channel.name}.
          </p>
        ) : (
          sortedMessages.map((msg) => {
            const deleted = Boolean(msg.deleted_at);
            return (
              <article
                key={msg.id}
                className="bmw-card group relative flex gap-3"
                style={{ padding: 12, borderRadius: 0 }}
              >
                {msg.author_avatar ? (
                  <img
                    src={msg.author_avatar}
                    alt=""
                    width={AVATAR_SIZE}
                    height={AVATAR_SIZE}
                    className="mt-0.5 shrink-0 object-cover"
                    style={{
                      width: AVATAR_SIZE,
                      height: AVATAR_SIZE,
                      borderRadius: '9999px',
                    }}
                  />
                ) : (
                  <div
                    className="bmw-label-sm mt-0.5 flex shrink-0 items-center justify-center"
                    style={{
                      width: AVATAR_SIZE,
                      height: AVATAR_SIZE,
                      borderRadius: '9999px',
                      backgroundColor: 'var(--bmw-surface-strong)',
                      fontSize: 14,
                    }}
                    aria-hidden
                  >
                    {(msg.author_name || '?').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                    <span className="bmw-label-sm">{msg.author_name}</span>
                    <time
                      className="bmw-body-xs shrink-0"
                      dateTime={msg.sent_at}
                      style={{ color: 'var(--bmw-muted)' }}
                    >
                      {formatMessageTime(msg.sent_at)}
                    </time>
                  </div>
                  {deleted ? (
                    <p
                      className="bmw-body-sm mt-1 italic"
                      style={{ color: 'var(--bmw-muted-soft)' }}
                    >
                      Mensaje eliminado
                    </p>
                  ) : (
                    <div className="bmw-body-sm mt-1 whitespace-pre-wrap break-words">
                      {renderMessageContent(msg.content)}
                    </div>
                  )}
                </div>
                {showDeleteFor(msg) && (
                  <button
                    type="button"
                    onClick={() => onDeleteMessage(msg.discord_message_id)}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    style={{
                      color: 'var(--bmw-muted)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: 0,
                    }}
                    title="Eliminar mensaje"
                    aria-label="Eliminar mensaje"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--bmw-error)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--bmw-muted)';
                    }}
                  >
                    <DeleteIcon />
                  </button>
                )}
              </article>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div
        className="shrink-0 border-t"
        style={{
          borderColor: 'var(--bmw-hairline)',
          backgroundColor: 'var(--bmw-surface-1)',
          padding: 16,
        }}
      >
        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            disabled={sending}
            maxLength={MAX_LENGTH}
            rows={3}
            className="bmw-input min-h-[80px] flex-1 resize-none"
            style={{ height: 'auto', minHeight: '80px' }}
            aria-label="Escribe un mensaje"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || !draft.trim() || draft.length > MAX_LENGTH}
            className="bmw-btn-primary self-end shrink-0 transition-opacity duration-200"
            style={{ height: 48 }}
          >
            {sending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
        {draft.length > COUNTER_THRESHOLD && (
          <p
            className="bmw-body-xs mt-2 text-right transition-opacity duration-200"
            style={{
              color:
                draft.length >= MAX_LENGTH ? 'var(--bmw-error)' : 'var(--bmw-muted)',
            }}
          >
            {draft.length}/{MAX_LENGTH}
          </p>
        )}
      </div>
    </div>
  );
}
