import { useEffect, useState } from 'react';
import type { Channel } from '../../../types/Channel';
import { isCategoryChannel } from '../ChannelSidebar';
import { ConfirmationModal } from '../../ui/modals/ConfirmationModal';

export interface MoveChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  onMoveChannels: (channelIds: number[], targetCategoryId: string | null) => Promise<void>;
  onDeleteChannels: (channelIds: number[]) => Promise<void>;
}

export function MoveChannelsModal({
  isOpen,
  onClose,
  channels,
  onMoveChannels,
  onDeleteChannels,
}: MoveChannelsModalProps) {
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen);
  const [selectedChannelIds, setSelectedChannelIds] = useState<Set<number>>(new Set());
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      setSelectedChannelIds(new Set());
      setTargetCategoryId(null);
      setLoading(false);
      setDeleting(false);
      setError(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen]);

  const categories = channels.filter(isCategoryChannel);
  const nonCategoryChannels = channels.filter((c) => !isCategoryChannel(c));

  const groupedChannels = nonCategoryChannels.reduce((acc, channel) => {
    const key = channel.parent_id || 'uncategorized';
    if (!acc[key]) acc[key] = [];
    acc[key].push(channel);
    return acc;
  }, {} as Record<string, Channel[]>);

  const toggleChannel = (channelId: number) => {
    setSelectedChannelIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(channelId)) {
        newSet.delete(channelId);
      } else {
        newSet.add(channelId);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedChannelIds.size === 0) {
      setError('Selecciona al menos un canal');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onMoveChannels(Array.from(selectedChannelIds), targetCategoryId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al mover canales');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (selectedChannelIds.size === 0) {
      setError('Selecciona al menos un canal');
      return;
    }
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      await onDeleteChannels(Array.from(selectedChannelIds));
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar canales');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (!mounted) return null;

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Sin categoría';
    const category = categories.find((c) => c.discord_channel_id === categoryId);
    return category ? category.name : 'Categoría';
  };

  return (
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
        className="bmw-card elevation-3 w-full max-w-[680px] flex flex-col"
        style={{
          backgroundColor: 'var(--bmw-canvas)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'opacity 200ms ease, transform 200ms ease',
          maxHeight: '80vh',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-channels-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0" style={{ padding: 'var(--bmw-spacing-lg)' }}>
          <h2 id="move-channels-title" className="bmw-title-md mb-1">
            Mover Canales
          </h2>
          <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)' }}>
            Selecciona los canales que deseas mover y elige la categoría de destino.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto" style={{ padding: '0 var(--bmw-spacing-lg)' }}>
            <div className="mb-4">
              <label htmlFor="target-category" className="bmw-label block mb-2">
                Categoría de destino
              </label>
              <select
                id="target-category"
                value={targetCategoryId || ''}
                onChange={(e) => setTargetCategoryId(e.target.value || null)}
                className="bmw-input w-full"
                disabled={loading}
              >
                <option value="">Sin categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.discord_channel_id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <p className="bmw-label mb-2">
                Canales seleccionados: {selectedChannelIds.size}
              </p>
            </div>

            <div className="space-y-4">
              {Object.entries(groupedChannels).map(([categoryKey, channelsInGroup]) => {
                const categoryId = categoryKey === 'uncategorized' ? null : categoryKey;
                const categoryName = getCategoryName(categoryId);

                return (
                  <div key={categoryKey}>
                    <h3
                      className="bmw-label mb-2"
                      style={{
                        textTransform: 'uppercase',
                        fontSize: '12px',
                        color: 'var(--bmw-muted)',
                        letterSpacing: '1px',
                      }}
                    >
                      {categoryName}
                    </h3>
                    <div className="space-y-1">
                      {channelsInGroup.map((channel) => (
                        <label
                          key={channel.id}
                          className="flex items-center gap-3 p-2 cursor-pointer"
                          style={{
                            backgroundColor: selectedChannelIds.has(channel.id)
                              ? 'var(--bmw-surface-strong)'
                              : 'transparent',
                            borderRadius: '0',
                            transition: 'background-color 150ms ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!selectedChannelIds.has(channel.id)) {
                              e.currentTarget.style.backgroundColor = 'var(--bmw-surface-2)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!selectedChannelIds.has(channel.id)) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedChannelIds.has(channel.id)}
                            onChange={() => toggleChannel(channel.id)}
                            disabled={loading}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                            }}
                          />
                          <span className="bmw-body-sm flex-1">#{channel.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div
              className="shrink-0"
              style={{
                padding: 'var(--bmw-spacing-lg)',
                backgroundColor: 'var(--bmw-surface-strong)',
                borderTop: '1px solid var(--bmw-hairline)',
                borderLeft: '3px solid var(--bmw-error)',
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
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    stroke="var(--bmw-error)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M10 6V11"
                    stroke="var(--bmw-error)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="10" cy="14" r="1" fill="var(--bmw-error)" />
                </svg>
                <div className="flex-1">
                  <p className="bmw-label mb-1" style={{ color: 'var(--bmw-error)' }}>
                    Error
                  </p>
                  <p className="bmw-body-sm" style={{ color: 'var(--bmw-ink)' }}>
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div
            className="flex justify-between shrink-0"
            style={{
              padding: 'var(--bmw-spacing-lg)',
              borderTop: '1px solid var(--bmw-hairline)',
            }}
          >
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || deleting || selectedChannelIds.size === 0}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--bmw-error)',
                border: '1px solid var(--bmw-error)',
                padding: '14px 24px',
                borderRadius: '0',
                fontSize: '14px',
                fontWeight: '700',
                letterSpacing: '0.5px',
                cursor: loading || deleting || selectedChannelIds.size === 0 ? 'not-allowed' : 'pointer',
                opacity: loading || deleting || selectedChannelIds.size === 0 ? 0.5 : 1,
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                if (!loading && !deleting && selectedChannelIds.size > 0) {
                  e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && !deleting && selectedChannelIds.size > 0) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Eliminar {selectedChannelIds.size} canal(es)
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || deleting}
                className="bmw-btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || deleting || selectedChannelIds.size === 0}
                className="bmw-btn-primary"
              >
                {loading ? 'Moviendo...' : `Mover ${selectedChannelIds.size} canal(es)`}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Canales"
        message={`¿Estás seguro de que deseas eliminar ${selectedChannelIds.size} canal(es)? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
