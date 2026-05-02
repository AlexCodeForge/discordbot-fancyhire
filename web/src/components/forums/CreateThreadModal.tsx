import { useState } from 'react';
import { AnnouncementEditor } from '../announcements/AnnouncementEditor';
import { EmbedPreview } from '../announcements/EmbedPreview';
import { AnnouncementEmbed } from '../../types/Announcement';

interface CreateThreadModalProps {
  onClose: () => void;
  onCreate: (name: string, content: string, embedData?: AnnouncementEmbed) => Promise<void>;
}

export function CreateThreadModal({ onClose, onCreate }: CreateThreadModalProps) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [embedData, setEmbedData] = useState<AnnouncementEmbed>({
    title: '',
    description: '',
    color: '#1c69d4',
  });
  const [useEmbed, setUseEmbed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('El nombre del thread es requerido');
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

    if (name.length > 100) {
      setError('El nombre no puede exceder 100 caracteres');
      return;
    }

    if (!useEmbed && content.length > 2000) {
      setError('El contenido no puede exceder 2000 caracteres');
      return;
    }

    setCreating(true);
    setError('');
    
    try {
      if (useEmbed) {
        await onCreate(name.trim(), content.trim() || 'Thread creado', embedData);
      } else {
        await onCreate(name.trim(), content.trim());
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear thread');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--bmw-surface-card)',
          border: '1px solid var(--bmw-hairline)',
          maxWidth: useEmbed ? '95vw' : '600px',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b p-6 shrink-0" style={{ borderColor: 'var(--bmw-hairline)' }}>
          <div className="flex items-center justify-between">
            <h2 className="bmw-title-md">Crear Nuevo Thread</h2>
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
            <div className="mb-6">
              <label htmlFor="thread-name" className="bmw-label mb-2 block">
                Nombre del Thread
              </label>
              <input
                id="thread-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Título del thread"
                maxLength={100}
                disabled={creating}
                className="bmw-input w-full"
                autoFocus
              />
              <p className="bmw-body-xs mt-1" style={{ color: 'var(--bmw-muted)' }}>
                {name.length}/100 caracteres
              </p>
            </div>

            <div className="mb-6 flex items-center gap-3">
              <input
                type="checkbox"
                id="use-embed"
                checked={useEmbed}
                onChange={(e) => setUseEmbed(e.target.checked)}
                className="h-5 w-5"
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="use-embed" className="bmw-label" style={{ cursor: 'pointer', marginBottom: 0 }}>
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
                  placeholder="Escribe el primer mensaje del thread..."
                  maxLength={2000}
                  rows={8}
                  disabled={creating}
                  className="bmw-input w-full resize-y"
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

            <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--bmw-hairline)' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={creating}
                className="bmw-btn-secondary"
                style={{ height: 48, padding: '0 32px' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating || !name.trim() || (!useEmbed && !content.trim()) || (useEmbed && !embedData.description?.trim())}
                className="bmw-btn-primary"
                style={{ height: 48, padding: '0 32px' }}
              >
                {creating ? 'Creando...' : 'Crear Thread'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
