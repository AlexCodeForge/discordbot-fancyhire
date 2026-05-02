import { useState, useEffect } from 'react';
import { ForumThread, ThreadMessage } from '../../types/ForumThread';
import { AnnouncementEmbed } from '../../types/Announcement';
import { AnnouncementEditor } from '../announcements/AnnouncementEditor';
import { EmbedPreview } from '../announcements/EmbedPreview';
import { api } from '../../services/api';

interface EditThreadModalProps {
  thread: ForumThread;
  onClose: () => void;
  onSave: (threadId: number, name: string, content: string) => Promise<void>;
}

export function EditThreadModal({ thread, onClose, onSave }: EditThreadModalProps) {
  const [name, setName] = useState(thread.name);
  const [content, setContent] = useState('');
  const [useEmbed, setUseEmbed] = useState(false);
  const [embedData, setEmbedData] = useState<AnnouncementEmbed>({
    title: '',
    description: '',
    color: '#1c69d4',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStarterMessage = async () => {
      setName(thread.name);
      setContent('');
      setError(null);
      setLoading(true);

      if (thread.start_message_id) {
        try {
          const messages = await api.getThreadMessages(thread.id);
          const starter = messages.find(m => m.discord_message_id === thread.start_message_id);
          if (starter) {
            const messageContent = starter.content || '';
            
            // Detectar si el contenido tiene formato de embed
            const hasEmbedFormat = messageContent.includes('**') || messageContent.includes('Link:') || messageContent.includes('[Imagen:');
            
            if (hasEmbedFormat) {
              // Parsear el contenido del embed
              const lines = messageContent.split('\n\n');
              const parsedEmbed: AnnouncementEmbed = {
                title: '',
                description: '',
                color: '#1c69d4',
              };
              
              for (const line of lines) {
                if (line.startsWith('**') && line.endsWith('**')) {
                  parsedEmbed.title = line.replace(/\*\*/g, '');
                } else if (line.startsWith('Link: ')) {
                  parsedEmbed.url = line.replace('Link: ', '');
                } else if (line.startsWith('[Imagen: ') && line.endsWith(']')) {
                  parsedEmbed.image_url = line.replace('[Imagen: ', '').replace(']', '');
                } else if (!line.startsWith('Link:') && !line.startsWith('[Imagen:')) {
                  parsedEmbed.description = line;
                }
              }
              
              setEmbedData(parsedEmbed);
              setUseEmbed(true);
            } else {
              setContent(messageContent);
              setUseEmbed(false);
            }
          }
        } catch (err) {
          console.error('Error cargando mensaje inicial:', err);
        }
      }
      
      setLoading(false);
    };

    loadStarterMessage();
  }, [thread]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (!useEmbed && !content.trim()) {
      setError('El contenido es requerido');
      return;
    }

    if (useEmbed && !embedData.description?.trim()) {
      setError('La descripción del embed es requerida');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Si usa embed, construir el contenido formateado
      let finalContent = content.trim();
      if (useEmbed) {
        const embedParts = [];
        if (embedData.title) embedParts.push(`**${embedData.title}**`);
        if (embedData.description) embedParts.push(embedData.description);
        if (embedData.url) embedParts.push(`Link: ${embedData.url}`);
        if (embedData.image_url) embedParts.push(`[Imagen: ${embedData.image_url}]`);
        finalContent = embedParts.join('\n\n');
      }
      
      await onSave(thread.id, name.trim(), finalContent);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el thread');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full overflow-hidden flex flex-col"
        style={{ 
          backgroundColor: 'var(--bmw-surface-1)',
          border: '1px solid var(--bmw-hairline)',
          maxWidth: useEmbed ? '95vw' : '600px',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b p-6 shrink-0" style={{ borderColor: 'var(--bmw-hairline)' }}>
          <div className="flex items-center justify-between">
            <h2 className="bmw-title-md">Editar Thread</h2>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--bmw-muted)',
                cursor: 'pointer',
              }}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div
                className="mb-4 p-3"
                style={{
                  backgroundColor: 'var(--bmw-error-soft)',
                  border: '1px solid var(--bmw-error)',
                }}
              >
                <p className="bmw-body-sm" style={{ color: 'var(--bmw-error)' }}>
                  {error}
                </p>
              </div>
            )}
            
            {loading && (
              <p className="bmw-body-sm mb-4" style={{ color: 'var(--bmw-muted)' }}>
                Cargando datos del thread...
              </p>
            )}

            <div className="mb-6">
              <label htmlFor="thread-name" className="bmw-label mb-2 block">
                Nombre del Thread
              </label>
              <input
                id="thread-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                className="bmw-input w-full"
                placeholder="Título del thread"
                disabled={isSubmitting || loading}
                autoFocus
              />
              <p className="bmw-body-xs mt-1" style={{ color: 'var(--bmw-muted)' }}>
                {name.length}/100 caracteres
              </p>
            </div>

            <div className="mb-6 flex items-center gap-3">
              <input
                type="checkbox"
                id="use-embed-edit"
                checked={useEmbed}
                onChange={(e) => setUseEmbed(e.target.checked)}
                className="h-5 w-5"
                style={{ cursor: 'pointer' }}
                disabled={loading}
              />
              <label htmlFor="use-embed-edit" className="bmw-label" style={{ cursor: 'pointer', marginBottom: 0 }}>
                Usar editor enriquecido (embed con imágenes, colores y formato)
              </label>
            </div>

            {!useEmbed ? (
              <div className="mb-6">
                <label htmlFor="thread-content" className="bmw-label mb-2 block">
                  Mensaje Inicial
                </label>
                <textarea
                  id="thread-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={2000}
                  rows={8}
                  className="bmw-input w-full resize-y"
                  placeholder="Escribe el primer mensaje del thread..."
                  disabled={isSubmitting || loading}
                />
                <p className="bmw-body-xs mt-1" style={{ color: 'var(--bmw-muted)' }}>
                  {content.length}/2000 caracteres
                </p>
              </div>
            ) : (
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-6">
                  <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <AnnouncementEditor embedData={embedData} onChange={setEmbedData} />
                  </div>
                  <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <EmbedPreview embedData={embedData} />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--bmw-hairline)' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || loading}
                className="bmw-btn-secondary"
                style={{ height: 48, padding: '0 32px' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loading || !name.trim() || (!useEmbed && !content.trim()) || (useEmbed && !embedData.description?.trim())}
                className="bmw-btn-primary"
                style={{ height: 48, padding: '0 32px' }}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
