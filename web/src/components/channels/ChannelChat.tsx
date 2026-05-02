import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Component,
  type ReactNode,
} from 'react';
import { Channel } from '../../types/Channel';
import { ChannelMessage } from '../../types/ChannelMessage';
import { MemberMentionInput } from '../announcements/MemberMentionInput';
import { MemberAvatar } from '../ui/MemberAvatar';
import { RoleBadge } from '../roles/RoleBadge';
import { api, type DiscordMember } from '../../services/api';

class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const MAX_LENGTH = 2000;
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

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFullDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeDate(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${diffDays} días`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
  return `Hace ${Math.floor(diffDays / 365)} años`;
}

// Esta función ya no se usa, se reemplazó por renderMentionContent dentro del componente

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

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Solo hacer scroll al cargar inicialmente los mensajes
  const prevMessagesLengthRef = useRef(sortedMessages.length);
  
  useEffect(() => {
    // Si hay nuevos mensajes (aumentó la cantidad), hacer scroll
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
    (content: string): ReactNode => {
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
              transition: 'opacity 0.2s ease',
              borderRadius: '2px',
            }}
            onClick={() => handleViewMember(userId)}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            title={member ? `Ver detalles de ${member.display_name}` : userId}
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
                  {showDeleteFor(msg) && (
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
            <ErrorBoundary
              fallback={
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Escribe un mensaje..."
                  disabled={sending}
                  maxLength={MAX_LENGTH}
                  rows={4}
                  className="bmw-input min-h-[120px] w-full resize-y"
                />
              }
            >
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
            </ErrorBoundary>
          </div>
          <button
            type="submit"
            disabled={sending || !draft.trim() || draft.length > MAX_LENGTH}
            className="bmw-btn-primary shrink-0 transition-opacity duration-200"
            style={{ height: 48, marginBottom: 4 }}
          >
            {sending ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      </div>

      {viewingMember && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            className="max-w-3xl w-full max-h-[90vh] overflow-auto"
            style={{
              backgroundColor: 'var(--bmw-surface-card)',
              borderRadius: '0',
              border: '1px solid var(--bmw-hairline)',
            }}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2
                  style={{
                    fontSize: '32px',
                    lineHeight: '1.15',
                    fontWeight: 700,
                    color: 'var(--bmw-ink)',
                  }}
                >
                  Detalles del Miembro
                </h2>
                <button
                  onClick={() => setViewingMember(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--bmw-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div
                className="flex items-start gap-6 mb-6 pb-6"
                style={{ borderBottom: '1px solid var(--bmw-hairline)' }}
              >
                <MemberAvatar
                  avatar={viewingMember.avatar}
                  username={viewingMember.username}
                  id={viewingMember.id}
                  size={80}
                />
                <div className="flex-1">
                  <h3
                    style={{
                      fontSize: '24px',
                      lineHeight: '1.25',
                      fontWeight: 700,
                      color: 'var(--bmw-ink)',
                      marginBottom: '4px',
                    }}
                  >
                    {viewingMember.display_name}
                  </h3>
                  <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)', marginBottom: '8px' }}>
                    {viewingMember.tag}
                  </p>
                  <div className="bmw-body-sm" style={{ color: 'var(--bmw-body)' }}>
                    <span style={{ color: 'var(--bmw-muted)' }}>ID:</span> {viewingMember.id}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="bmw-label block mb-2">Nombre de Usuario</label>
                    <div className="bmw-body-sm" style={{ color: 'var(--bmw-ink)' }}>
                      {viewingMember.username}
                    </div>
                  </div>
                  <div>
                    <label className="bmw-label block mb-2">Nombre en Servidor</label>
                    <div className="bmw-body-sm" style={{ color: 'var(--bmw-ink)' }}>
                      {viewingMember.display_name}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="bmw-label block mb-2">Ingreso al Servidor</label>
                    <div className="bmw-body-sm" style={{ color: 'var(--bmw-ink)' }}>
                      {formatFullDate(viewingMember.joined_at)}
                    </div>
                    <div
                      className="bmw-body-sm"
                      style={{ color: 'var(--bmw-muted)', fontSize: '12px', marginTop: '4px' }}
                    >
                      {formatRelativeDate(viewingMember.joined_at)}
                    </div>
                  </div>
                  <div>
                    <label className="bmw-label block mb-2">Cuenta Creada</label>
                    <div className="bmw-body-sm" style={{ color: 'var(--bmw-ink)' }}>
                      {formatFullDate(viewingMember.created_at)}
                    </div>
                    <div
                      className="bmw-body-sm"
                      style={{ color: 'var(--bmw-muted)', fontSize: '12px', marginTop: '4px' }}
                    >
                      {formatRelativeDate(viewingMember.created_at)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="bmw-label block mb-2">Roles ({viewingMember.roles?.length || 0})</label>
                  {(viewingMember.roles?.length || 0) > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {viewingMember.roles?.map((role) => (
                        <RoleBadge key={role.id} role={role} />
                      ))}
                    </div>
                  ) : (
                    <div className="bmw-body-sm" style={{ color: 'var(--bmw-muted)' }}>
                      Sin roles asignados
                    </div>
                  )}
                </div>

                <div>
                  <label className="bmw-label block mb-3">Permisos</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="flex items-center gap-3 p-3"
                      style={{
                        backgroundColor: viewingMember.permissions?.administrator
                          ? 'var(--bmw-surface-soft)'
                          : 'transparent',
                        border: '1px solid var(--bmw-hairline)',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: viewingMember.permissions?.administrator
                            ? 'var(--bmw-primary)'
                            : 'var(--bmw-muted)',
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 2L2 7l10 5 10-5-10-5z" />
                          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                      </div>
                      <div>
                        <div className="bmw-body-sm" style={{ fontWeight: 500, color: 'var(--bmw-ink)' }}>
                          Administrator
                        </div>
                        <div
                          className="bmw-body-sm"
                          style={{ fontSize: '12px', color: 'var(--bmw-muted)' }}
                        >
                          {viewingMember.permissions?.administrator ? 'Sí' : 'No'}
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-3 p-3"
                      style={{
                        backgroundColor: viewingMember.permissions?.manageGuild
                          ? 'var(--bmw-surface-soft)'
                          : 'transparent',
                        border: '1px solid var(--bmw-hairline)',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: viewingMember.permissions?.manageGuild
                            ? 'var(--bmw-primary)'
                            : 'var(--bmw-muted)',
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </div>
                      <div>
                        <div className="bmw-body-sm" style={{ fontWeight: 500, color: 'var(--bmw-ink)' }}>
                          Manage Server
                        </div>
                        <div
                          className="bmw-body-sm"
                          style={{ fontSize: '12px', color: 'var(--bmw-muted)' }}
                        >
                          {viewingMember.permissions?.manageGuild ? 'Sí' : 'No'}
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-3 p-3"
                      style={{
                        backgroundColor: viewingMember.permissions?.manageRoles
                          ? 'var(--bmw-surface-soft)'
                          : 'transparent',
                        border: '1px solid var(--bmw-hairline)',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: viewingMember.permissions?.manageRoles
                            ? 'var(--bmw-primary)'
                            : 'var(--bmw-muted)',
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                      </div>
                      <div>
                        <div className="bmw-body-sm" style={{ fontWeight: 500, color: 'var(--bmw-ink)' }}>
                          Manage Roles
                        </div>
                        <div
                          className="bmw-body-sm"
                          style={{ fontSize: '12px', color: 'var(--bmw-muted)' }}
                        >
                          {viewingMember.permissions?.manageRoles ? 'Sí' : 'No'}
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-3 p-3"
                      style={{
                        backgroundColor: viewingMember.permissions?.manageChannels
                          ? 'var(--bmw-surface-soft)'
                          : 'transparent',
                        border: '1px solid var(--bmw-hairline)',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: viewingMember.permissions?.manageChannels
                            ? 'var(--bmw-primary)'
                            : 'var(--bmw-muted)',
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 10c0-7-9-7-9-7s-9 0-9 7c0 3 0 7 9 7s9-4 9-7z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <div>
                        <div className="bmw-body-sm" style={{ fontWeight: 500, color: 'var(--bmw-ink)' }}>
                          Manage Channels
                        </div>
                        <div
                          className="bmw-body-sm"
                          style={{ fontSize: '12px', color: 'var(--bmw-muted)' }}
                        >
                          {viewingMember.permissions?.manageChannels ? 'Sí' : 'No'}
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-3 p-3"
                      style={{
                        backgroundColor: viewingMember.permissions?.kickMembers
                          ? 'var(--bmw-surface-soft)'
                          : 'transparent',
                        border: '1px solid var(--bmw-hairline)',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: viewingMember.permissions?.kickMembers
                            ? 'var(--bmw-primary)'
                            : 'var(--bmw-muted)',
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                      </div>
                      <div>
                        <div className="bmw-body-sm" style={{ fontWeight: 500, color: 'var(--bmw-ink)' }}>
                          Kick Members
                        </div>
                        <div
                          className="bmw-body-sm"
                          style={{ fontSize: '12px', color: 'var(--bmw-muted)' }}
                        >
                          {viewingMember.permissions?.kickMembers ? 'Sí' : 'No'}
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-3 p-3"
                      style={{
                        backgroundColor: viewingMember.permissions?.banMembers
                          ? 'var(--bmw-surface-soft)'
                          : 'transparent',
                        border: '1px solid var(--bmw-hairline)',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: viewingMember.permissions?.banMembers
                            ? 'var(--bmw-primary)'
                            : 'var(--bmw-muted)',
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </svg>
                      </div>
                      <div>
                        <div className="bmw-body-sm" style={{ fontWeight: 500, color: 'var(--bmw-ink)' }}>
                          Ban Members
                        </div>
                        <div
                          className="bmw-body-sm"
                          style={{ fontSize: '12px', color: 'var(--bmw-muted)' }}
                        >
                          {viewingMember.permissions?.banMembers ? 'Sí' : 'No'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="mt-6 pt-6 flex justify-end"
                style={{ borderTop: '1px solid var(--bmw-hairline)' }}
              >
                <button
                  onClick={() => setViewingMember(null)}
                  className="bmw-btn-primary"
                  style={{ height: '40px', padding: '8px 24px' }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
