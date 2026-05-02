import { useState, useEffect } from 'react';
import { ForumThread, ThreadMessage } from '../../types/ForumThread';
import { api } from '../../services/api';

interface ThreadDetailsModalProps {
  thread: ForumThread;
  onClose: () => void;
}

export function ThreadDetailsModal({ thread, onClose }: ThreadDetailsModalProps) {
  const [starterMessage, setStarterMessage] = useState<ThreadMessage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStarterMessage = async () => {
      if (!thread.start_message_id) {
        setLoading(false);
        return;
      }

      try {
        const messages = await api.getThreadMessages(thread.id);
        const starter = messages.find(m => m.discord_message_id === thread.start_message_id);
        if (starter) {
          setStarterMessage(starter);
        }
      } catch (err) {
        console.error('Error cargando mensaje inicial:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStarterMessage();
  }, [thread.id, thread.start_message_id]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getThreadUrl = () => {
    return `https://discord.com/channels/${thread.discord_thread_id.split('/')[0] || '@me'}/${thread.discord_thread_id}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-lg"
        style={{ 
          backgroundColor: 'var(--bmw-surface-1)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-6" style={{ borderColor: 'var(--bmw-hairline)' }}>
          <h2 className="bmw-title-lg" style={{ color: 'var(--bmw-ink)' }}>
            Detalles del Thread
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded transition-colors"
            style={{
              color: 'var(--bmw-muted)',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bmw-surface-2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="bmw-label-xs mb-1 block" style={{ color: 'var(--bmw-muted)' }}>
              Nombre del Thread
            </label>
            <p className="bmw-body-md" style={{ color: 'var(--bmw-ink)' }}>
              {thread.name}
            </p>
          </div>

          {starterMessage && (
            <div>
              <label className="bmw-label-xs mb-2 block" style={{ color: 'var(--bmw-muted)' }}>
                Contenido del Post
              </label>
              <div 
                className="rounded p-4"
                style={{ 
                  backgroundColor: 'var(--bmw-surface-2)',
                  border: '1px solid var(--bmw-hairline)'
                }}
              >
                <p className="bmw-body-sm whitespace-pre-wrap" style={{ color: 'var(--bmw-ink)' }}>
                  {starterMessage.content}
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div>
              <label className="bmw-label-xs mb-2 block" style={{ color: 'var(--bmw-muted)' }}>
                Contenido del Post
              </label>
              <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)' }}>
                Cargando...
              </p>
            </div>
          )}

          <div>
            <label className="bmw-label-xs mb-2 block" style={{ color: 'var(--bmw-muted)' }}>
              Link del Post en Discord
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={getThreadUrl()}
                readOnly
                className="bmw-input flex-1 bmw-body-xs font-mono"
                style={{ fontSize: 12 }}
              />
              <button
                onClick={() => copyToClipboard(getThreadUrl())}
                className="bmw-btn-secondary"
                style={{ whiteSpace: 'nowrap' }}
                title="Copiar link"
              >
                Copiar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="bmw-label-xs mb-1 block" style={{ color: 'var(--bmw-muted)' }}>
                Creado por
              </label>
              <p className="bmw-body-sm" style={{ color: 'var(--bmw-ink)' }}>
                {thread.owner_name}
              </p>
            </div>

            <div>
              <label className="bmw-label-xs mb-1 block" style={{ color: 'var(--bmw-muted)' }}>
                ID del Autor
              </label>
              <p className="bmw-body-xs font-mono" style={{ color: 'var(--bmw-muted)' }}>
                {thread.owner_id}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="bmw-label-xs mb-1 block" style={{ color: 'var(--bmw-muted)' }}>
                Mensajes
              </label>
              <p className="bmw-body-md" style={{ color: 'var(--bmw-ink)' }}>
                {thread.message_count}
              </p>
            </div>

            <div>
              <label className="bmw-label-xs mb-1 block" style={{ color: 'var(--bmw-muted)' }}>
                Siguiendo
              </label>
              <p className="bmw-body-md" style={{ color: 'var(--bmw-ink)' }}>
                {thread.member_count}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="bmw-label-xs mb-1 block" style={{ color: 'var(--bmw-muted)' }}>
                Fecha de Creación
              </label>
              <p className="bmw-body-sm" style={{ color: 'var(--bmw-ink)' }}>
                {formatDate(thread.created_at)}
              </p>
            </div>

            <div>
              <label className="bmw-label-xs mb-1 block" style={{ color: 'var(--bmw-muted)' }}>
                Última Actualización
              </label>
              <p className="bmw-body-sm" style={{ color: 'var(--bmw-ink)' }}>
                {formatDate(thread.updated_at)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="bmw-label-xs mb-1 block" style={{ color: 'var(--bmw-muted)' }}>
                Estado
              </label>
              <div className="flex gap-2">
                {thread.archived && (
                  <span
                    className="bmw-label-xs rounded px-2 py-1"
                    style={{
                      backgroundColor: 'var(--bmw-warning-surface)',
                      color: 'var(--bmw-warning)',
                    }}
                  >
                    Archivado
                  </span>
                )}
                {thread.locked && (
                  <span
                    className="bmw-label-xs rounded px-2 py-1"
                    style={{
                      backgroundColor: 'var(--bmw-error-surface)',
                      color: 'var(--bmw-error)',
                    }}
                  >
                    Bloqueado
                  </span>
                )}
                {!thread.archived && !thread.locked && (
                  <span
                    className="bmw-label-xs rounded px-2 py-1"
                    style={{
                      backgroundColor: 'var(--bmw-success-surface)',
                      color: 'var(--bmw-success)',
                    }}
                  >
                    Activo
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="bmw-label-xs mb-1 block" style={{ color: 'var(--bmw-muted)' }}>
                ID de Discord
              </label>
              <p className="bmw-body-xs truncate font-mono" style={{ color: 'var(--bmw-muted)' }}>
                {thread.discord_thread_id}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t p-6 flex justify-end" style={{ borderColor: 'var(--bmw-hairline)' }}>
          <button onClick={onClose} className="bmw-btn-primary">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
