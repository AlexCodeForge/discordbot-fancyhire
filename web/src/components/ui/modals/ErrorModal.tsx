/**
 * Modal de error reutilizable que sigue el BMW Design System
 * 
 * @example Error general
 * ```tsx
 * <ErrorModal
 *   isOpen={showError}
 *   onClose={() => setShowError(false)}
 *   title="Error al Procesar"
 *   message="No se pudo completar la operación."
 * />
 * ```
 */
interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  actionText?: string;
}

export function ErrorModal({
  isOpen,
  onClose,
  title,
  message,
  actionText = 'Entendido',
}: ErrorModalProps) {
  if (!isOpen) return null;

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
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
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
              style={{ color: 'var(--bmw-error)' }}
            >
              <path
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="bmw-btn-primary"
            style={{
              minWidth: '140px',
            }}
          >
            {actionText}
          </button>
        </div>
      </div>
    </div>
  );
}
