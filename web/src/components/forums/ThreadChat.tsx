import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ForumThread, ThreadMessage } from '../../types/ForumThread';
import { MemberMentionInput } from '../announcements/MemberMentionInput';
import { api, type DiscordMember } from '../../services/api';

const MAX_LENGTH = 2000;
const MESSAGE_GAP = 12;
const AVATAR_SIZE = 32;

interface ThreadChatProps {
  thread: ForumThread;
  messages: ThreadMessage[];
  onSendMessage: (content: string, mentions: string[]) => Promise<void>;
  onDeleteMessage: (discordMessageId: string) => void;
  isAdmin?: boolean;
}

const MENTION_RE = /<@!?(\d+)>/g;

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
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

function EyeIcon() {
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
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function ThreadChat({ thread, messages, onSendMessage, onDeleteMessage, isAdmin = false }: ThreadChatProps) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [mentions, setMentions] = useState<string[]>([]);
  const [members, setMembers] = useState<DiscordMember[]>([]);
  const [viewingMember, setViewingMember] = useState<DiscordMember | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) =>
        new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
    );
  }, [messages]);

  const startMessage = useMemo(() => {
    if (!thread.start_message_id) return null;
    return messages.find(m => m.discord_message_id === thread.start_message_id);
  }, [messages, thread.start_message_id]);

  const regularMessages = useMemo(() => {
    return sortedMessages.filter(m => m.discord_message_id !== thread.start_message_id);
  }, [sortedMessages, thread.start_message_id]);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const prevMessagesLengthRef = useRef(sortedMessages.length);

  useEffect(() => {
    if (sortedMessages.length > prevMessagesLengthRef.current) {
      scrollToBottom();
    }
    prevMessagesLengthRef.current = sortedMessages.length;
  }, [sortedMessages, scrollToBottom]);

  useEffect(() => {
    api
      .getMembers()
      .then((data) => {
        setMembers(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error('Error loading members:', error);
        setMembers([]);
      });
  }, []);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || sending || trimmed.length > MAX_LENGTH) return;

    setSending(true);
    try {
      await onSendMessage(trimmed, mentions);
      setDraft('');
      setMentions([]);
    } finally {
      setSending(false);
    }
  };

  const handleViewMember = (authorId: string) => {
    const member = members.find((m) => m.id === authorId);
    if (member) {
      setViewingMember(member);
    }
  };

  const renderMentionContent = useCallback(
    (content: string | null | undefined) => {
      if (!content) return '';
      
      const nodes: React.ReactNode[] = [];
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
        const userId = m[1];
        const member = members.find((mem) => mem.id === userId);
        const displayName = member ? `@${member.display_name}` : m[0];

        nodes.push(
          <span
            key={`m-${key++}`}
            className="bmw-body-sm px-1 cursor-pointer hover:underline"
            style={{
              backgroundColor: 'var(--bmw-primary)',
              color: 'var(--bmw-on-primary)',
              borderRadius: '2px',
            }}
            onClick={() => handleViewMember(userId)}
          >
            {displayName}
          </span>
        );
        last = m.index + m[0].length;
      }
      if (last < content.length) {
        nodes.push(<span key={`t-${key++}`}>{content.slice(last)}</span>);
      }
      return nodes.length > 0 ? nodes : content;
    },
    [members]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="border-b p-4"
        style={{
          borderColor: 'var(--bmw-hairline)',
          backgroundColor: 'var(--bmw-surface-1)',
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="bmw-title-sm mb-1">{thread.name}</h3>
            <div className="flex items-center gap-3">
              <p className="bmw-body-xs" style={{ color: 'var(--bmw-muted)' }}>
                por {thread.owner_name}
              </p>
              <span className="bmw-body-xs" style={{ color: 'var(--bmw-muted)' }}>
                •
              </span>
              <p className="bmw-body-xs" style={{ color: 'var(--bmw-muted)' }}>
                {thread.message_count} mensajes
              </p>
              {thread.member_count > 0 && (
                <>
                  <span className="bmw-body-xs" style={{ color: 'var(--bmw-muted)' }}>
                    •
                  </span>
                  <p className="bmw-body-xs" style={{ color: 'var(--bmw-muted)' }}>
                    {thread.member_count} siguiendo
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

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
        {startMessage && (
          <article
            className="bmw-card mb-4"
            style={{
              padding: 16,
              borderRadius: 0,
              border: '2px solid var(--bmw-primary)',
              backgroundColor: 'var(--bmw-surface-soft)',
            }}
          >
            <div className="flex gap-3">
              {startMessage.author_avatar ? (
                <img
                  src={startMessage.author_avatar}
                  alt=""
                  width={48}
                  height={48}
                  className="mt-0.5 shrink-0 object-cover"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '9999px',
                  }}
                />
              ) : (
                <div
                  className="bmw-label-sm mt-0.5 flex shrink-0 items-center justify-center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '9999px',
                    backgroundColor: 'var(--bmw-surface-strong)',
                    fontSize: 18,
                  }}
                >
                  {(startMessage.author_name || '?').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="bmw-label-sm">{startMessage.author_name}</span>
                  <span
                    className="bmw-body-xs px-2 py-0.5"
                    style={{
                      backgroundColor: 'var(--bmw-primary)',
                      color: 'var(--bmw-on-primary)',
                      borderRadius: '2px',
                    }}
                  >
                    AUTOR DEL THREAD
                  </span>
                  <time
                    className="bmw-body-xs"
                    dateTime={startMessage.sent_at}
                    style={{ color: 'var(--bmw-muted)' }}
                  >
                    {formatMessageTime(startMessage.sent_at)}
                  </time>
                </div>
                <div className="bmw-body-sm whitespace-pre-wrap break-words">
                  {renderMentionContent(startMessage.content)}
                </div>
              </div>
            </div>
          </article>
        )}

        {regularMessages.length === 0 && !startMessage ? (
          <p className="bmw-body-sm py-8 text-center" style={{ color: 'var(--bmw-muted)' }}>
            No hay mensajes en este thread.
          </p>
        ) : (
          regularMessages.map((msg) => {
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
                      {renderMentionContent(msg.content)}
                    </div>
                  )}
                </div>
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleViewMember(msg.author_id)}
                    className="flex h-8 w-8 items-center justify-center"
                    style={{
                      color: 'var(--bmw-muted)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: 0,
                    }}
                    title="Ver detalles del usuario"
                    aria-label="Ver detalles del usuario"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--bmw-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--bmw-muted)';
                    }}
                  >
                    <EyeIcon />
                  </button>
                  {isAdmin && !deleted && (
                    <button
                      type="button"
                      onClick={() => onDeleteMessage(msg.discord_message_id)}
                      className="flex h-8 w-8 items-center justify-center"
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
                </div>
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
          className="flex gap-2 items-end"
        >
          <div className="flex-1">
            <MemberMentionInput
              value={draft}
              onChange={(value, mentionIds) => {
                setDraft(value);
                setMentions(mentionIds);
              }}
              placeholder="Escribe un mensaje... (usa @ para mencionar)"
              maxLength={MAX_LENGTH}
              disabled={sending}
            />
          </div>
          <button
            type="submit"
            disabled={sending || !draft.trim() || draft.length > MAX_LENGTH}
            className="bmw-btn-primary shrink-0"
            style={{ height: 48, marginBottom: 4 }}
          >
            {sending ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}
