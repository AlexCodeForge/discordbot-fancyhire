import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { Channel } from '../../../types/Channel';
import type { CreateChannelData } from '../../../types/ChannelMessage';
import { SuccessModal } from '../../ui/modals/SuccessModal';

const CHANNEL_TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: 'Texto', value: 'GUILD_TEXT' },
  { label: 'Foro', value: 'GUILD_FORUM' },
];

export interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateChannelData) => Promise<void>;
  categories: Channel[];
}

export function CreateChannelModal({
  isOpen,
  onClose,
  onCreate,
  categories,
}: CreateChannelModalProps) {
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen);
  const [name, setName] = useState('');
  const [type, setType] = useState(CHANNEL_TYPE_OPTIONS[0].value);
  const [topic, setTopic] = useState('');
  const [parentId, setParentId] = useState('');
  const [touchedName, setTouchedName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const formatChannelName = (input: string): string => {
    return input
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const t = window.setTimeout(() => setMounted(false), 200);
      return () => window.clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setType(CHANNEL_TYPE_OPTIONS[0].value);
      setTopic('');
      setParentId('');
      setTouchedName(false);
      setSubmitError(null);
      setLoading(false);
    }
  }, [isOpen]);

  const formattedName = formatChannelName(name);
  const nameError =
    touchedName && formattedName.length < 2
      ? 'El nombre debe tener al menos 2 caracteres'
      : null;
  const isValid = formattedName.length >= 2;

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setTouchedName(true);
      if (formattedName.length < 2) return;

      setLoading(true);
      setSubmitError(null);
      const payload: CreateChannelData = {
        name: formattedName,
        type,
        ...(topic.trim() ? { topic: topic.trim() } : {}),
        ...(parentId ? { parentId } : {}),
      };
      try {
        await onCreate(payload);
        setSuccessMessage({
          title: 'Canal Creado',
          message: 'El canal ha sido creado en Discord',
        });
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'No se pudo crear el canal'
        );
      } finally {
        setLoading(false);
      }
    },
    [formattedName, type, topic, parentId, onCreate]
  );

  if (!mounted) return null;

  return (
    <>
      <SuccessModal
        isOpen={!!successMessage}
        onClose={() => {
          setSuccessMessage(null);
          onClose();
        }}
        title={successMessage?.title || ''}
        message={successMessage?.message || ''}
      />

      <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease',
      }}
      role="presentation"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="bmw-card elevation-3 w-full max-w-[480px]"
        style={{
          backgroundColor: 'var(--bmw-canvas)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'opacity 200ms ease, transform 200ms ease',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-channel-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="create-channel-title" className="bmw-title-md mb-1">
          Nuevo canal
        </h2>
        <p className="bmw-body-sm mb-4" style={{ color: 'var(--bmw-muted)' }}>
          Completa los datos del canal en Discord.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="channel-name" className="bmw-label block mb-1">
              Nombre del canal
            </label>
            <input
              id="channel-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouchedName(true)}
              placeholder="nombre-del-canal"
              className="bmw-input w-full"
              disabled={loading}
              autoComplete="off"
            />
            {formattedName && formattedName !== name && (
              <p
                className="bmw-body-xs mt-1"
                style={{ color: 'var(--bmw-muted)' }}
              >
                Se formateará como: <strong>{formattedName}</strong>
              </p>
            )}
            {nameError && (
              <p
                className="bmw-body-xs mt-1"
                style={{ color: 'var(--bmw-error)' }}
                role="alert"
              >
                {nameError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="channel-type" className="bmw-label block mb-1">
              Tipo
            </label>
            <select
              id="channel-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bmw-input w-full"
              disabled={loading}
            >
              {CHANNEL_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="channel-topic" className="bmw-label block mb-1">
              Tema (opcional)
            </label>
            <textarea
              id="channel-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Descripción del canal"
              rows={3}
              className="bmw-input w-full"
              style={{ height: 'auto', minHeight: '96px', resize: 'vertical' }}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="channel-category" className="bmw-label block mb-1">
              Categoría (opcional)
            </label>
            <select
              id="channel-category"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="bmw-input w-full"
              disabled={loading}
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.discord_channel_id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {submitError && (
            <div 
              className="bmw-card elevation-1"
              style={{ 
                backgroundColor: 'var(--bmw-surface-strong)', 
                padding: 'var(--bmw-spacing-lg)',
                borderLeft: '3px solid var(--bmw-error)'
              }}
              role="alert"
            >
              <div className="flex items-start gap-2">
                <svg 
                  className="shrink-0 mt-0.5" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 20 20" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle cx="10" cy="10" r="8" stroke="var(--bmw-error)" strokeWidth="2" fill="none"/>
                  <path d="M10 6V11" stroke="var(--bmw-error)" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="10" cy="14" r="1" fill="var(--bmw-error)"/>
                </svg>
                <div className="flex-1">
                  <p className="bmw-label mb-1" style={{ color: 'var(--bmw-error)' }}>
                    Error al crear canal
                  </p>
                  <p className="bmw-body-sm" style={{ color: 'var(--bmw-ink)' }}>
                    {submitError}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bmw-btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !isValid}
              className="bmw-btn-primary"
            >
              {loading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
