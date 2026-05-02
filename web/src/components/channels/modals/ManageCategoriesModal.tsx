import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { Channel } from '../../../types/Channel';
import { ConfirmationModal } from '../../ui/modals/ConfirmationModal';

export interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Channel[];
  onCreateCategory: (name: string) => Promise<void>;
  onDeleteCategory: (category: Channel) => Promise<void>;
}

export function ManageCategoriesModal({
  isOpen,
  onClose,
  categories,
  onCreateCategory,
  onDeleteCategory,
}: ManageCategoriesModalProps) {
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen);
  const [name, setName] = useState('');
  const [touchedName, setTouchedName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Channel | null>(null);

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
      setTouchedName(false);
      setSubmitError(null);
      setLoading(false);
      setDeletingId(null);
      setIsConfirmOpen(false);
      setCategoryToDelete(null);
    }
  }, [isOpen]);

  const formatCategoryName = (input: string): string => {
    return input.toUpperCase().replace(/\s+/g, ' ').trim();
  };

  const formattedName = formatCategoryName(name);
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
      try {
        await onCreateCategory(formattedName);
        setName('');
        setTouchedName(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'No se pudo crear la categoría';
        setSubmitError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [formattedName, onCreateCategory]
  );

  const handleDeleteClick = useCallback((category: Channel) => {
    setCategoryToDelete(category);
    setIsConfirmOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!categoryToDelete) return;

    setDeletingId(categoryToDelete.id);
    setSubmitError(null);
    setIsConfirmOpen(false);
    
    try {
      await onDeleteCategory(categoryToDelete);
      setCategoryToDelete(null);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'No se pudo eliminar la categoría'
      );
    } finally {
      setDeletingId(null);
    }
  }, [categoryToDelete, onDeleteCategory]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease',
      }}
      role="presentation"
      onClick={loading || deletingId !== null ? undefined : onClose}
    >
      <div
        className="bmw-card elevation-3 w-full max-w-[560px] flex flex-col"
        style={{
          backgroundColor: 'var(--bmw-canvas)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'opacity 200ms ease, transform 200ms ease',
          maxHeight: '80vh',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-categories-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0">
          <h2 id="manage-categories-title" className="bmw-title-md mb-1">
            Gestionar Categorías
          </h2>
          <p className="bmw-body-sm mb-4" style={{ color: 'var(--bmw-muted)' }}>
            Crea y elimina categorías para organizar tus canales.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 shrink-0">
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="category-name" className="bmw-label block mb-1">
                Nueva categoría
              </label>
              <input
                id="category-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouchedName(true)}
                placeholder="NOMBRE DE LA CATEGORÍA"
                className="bmw-input w-full"
                disabled={loading}
                autoComplete="off"
              />
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
            <button
              type="submit"
              disabled={loading || !isValid}
              className="bmw-btn-primary self-end"
              style={{ height: '40px' }}
            >
              {loading ? 'Creando...' : 'Crear'}
            </button>
          </div>

          {submitError && (
            <div
              className="bmw-card elevation-1"
              style={{
                backgroundColor: 'var(--bmw-surface-strong)',
                padding: 'var(--bmw-spacing-md)',
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
                    Error al crear categoría
                  </p>
                  <p className="bmw-body-sm" style={{ color: 'var(--bmw-ink)' }}>
                    {submitError}
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>

        <div className="flex-1 min-h-0 overflow-y-auto mt-4">
          <h3 className="bmw-label mb-2">Categorías existentes</h3>
          {categories.length === 0 ? (
            <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)' }}>
              No hay categorías creadas
            </p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="flex flex-col gap-2">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="bmw-card elevation-1 flex items-center justify-between gap-3"
                  style={{
                    padding: 'var(--bmw-spacing-md)',
                    backgroundColor: 'var(--bmw-surface-2)',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="bmw-body-md font-bold truncate">{category.name}</p>
                    <p
                      className="bmw-body-xs truncate"
                      style={{ color: 'var(--bmw-muted)' }}
                    >
                      ID: {category.discord_channel_id}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(category)}
                    disabled={deletingId !== null}
                    className="bmw-btn-secondary"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {deletingId === category.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {submitError && deletingId === null && (
          <div
            className="bmw-card elevation-1 shrink-0 mt-4"
            style={{
              backgroundColor: 'var(--bmw-surface-strong)',
              padding: 'var(--bmw-spacing-md)',
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
                  {submitError}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 mt-4 shrink-0" style={{ borderTop: '1px solid var(--bmw-hairline)' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading || deletingId !== null}
            className="bmw-btn-primary"
          >
            Cerrar
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Categoría"
        message={`¿Estás seguro de que deseas eliminar la categoría "${categoryToDelete?.name}"? Los canales dentro de ella no se eliminarán, solo quedarán sin categoría.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deletingId !== null}
      />
    </div>
  );
}
