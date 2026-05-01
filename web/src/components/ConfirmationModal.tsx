/**
 * Modal de confirmación reutilizable que sigue el BMW Design System
 * 
 * @example Eliminar un rol
 * ```tsx
 * const [showConfirm, setShowConfirm] = useState(false);
 * 
 * <ConfirmationModal
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Eliminar Rol"
 *   message="¿Estás seguro de que deseas eliminar este rol?"
 *   variant="danger"
 *   loading={isDeleting}
 * />
 * ```
 * 
 * @example Acción con advertencia
 * ```tsx
 * <ConfirmationModal
 *   isOpen={showWarning}
 *   onClose={() => setShowWarning(false)}
 *   onConfirm={handleArchive}
 *   title="Archivar Lead"
 *   message="Este lead será archivado y no aparecerá en el kanban."
 *   confirmText="Archivar"
 *   variant="warning"
 * />
 * ```
 * 
 * @example Acción informativa
 * ```tsx
 * <ConfirmationModal
 *   isOpen={showInfo}
 *   onClose={() => setShowInfo(false)}
 *   onConfirm={handleExport}
 *   title="Exportar Datos"
 *   message="Se generará un archivo CSV con todos los leads."
 *   confirmText="Exportar"
 *   variant="info"
 * />
 * ```
 */
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'rgba(220, 38, 38, 0.1)',
          iconColor: 'var(--bmw-error)',
          confirmBg: 'var(--bmw-error)',
          confirmBgHover: '#b91c1c',
        };
      case 'warning':
        return {
          iconBg: 'rgba(245, 158, 11, 0.1)',
          iconColor: 'var(--bmw-warning)',
          confirmBg: 'var(--bmw-warning)',
          confirmBgHover: '#d97706',
        };
      case 'info':
        return {
          iconBg: 'rgba(28, 105, 212, 0.1)',
          iconColor: 'var(--bmw-primary)',
          confirmBg: 'var(--bmw-primary)',
          confirmBgHover: 'var(--bmw-primary-active)',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[100]"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      }}
      onClick={onClose}
    >
      <div
        className="bmw-card"
        style={{
          width: '480px',
          maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '24px',
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: styles.iconBg,
              borderRadius: '0',
              flexShrink: 0,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: styles.iconColor }}
            >
              {variant === 'danger' && (
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {variant === 'warning' && (
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {variant === 'info' && (
                <path
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </div>

          <div style={{ flex: 1 }}>
            <h2
              className="bmw-title-lg"
              style={{
                color: 'var(--bmw-ink)',
                marginBottom: '8px',
              }}
            >
              {title}
            </h2>
            <p
              className="bmw-body-md"
              style={{
                color: 'var(--bmw-body)',
                lineHeight: '1.5',
              }}
            >
              {message}
            </p>
          </div>
        </div>

        <div
          style={{
            padding: '24px',
            paddingTop: '0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="bmw-btn-secondary"
            disabled={loading}
            style={{
              minWidth: '120px',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            style={{
              minWidth: '120px',
              backgroundColor: styles.confirmBg,
              color: 'var(--bmw-on-primary)',
              border: 'none',
              padding: '14px 32px',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease',
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = styles.confirmBgHover;
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = styles.confirmBg;
              }
            }}
          >
            {loading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
