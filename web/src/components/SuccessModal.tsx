/**
 * Modal de éxito reutilizable que sigue el BMW Design System
 * 
 * @example Ticket cerrado exitosamente
 * ```tsx
 * <SuccessModal
 *   isOpen={showSuccess}
 *   onClose={() => setShowSuccess(false)}
 *   title="Ticket Cerrado"
 *   message="El ticket ha sido cerrado exitosamente."
 *   details={[
 *     { label: "Canal", value: "Eliminado de Discord" },
 *     { label: "Transcripción", value: "PDF generado", link: "/transcripts/..." }
 *   ]}
 * />
 * ```
 */
interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  details?: Array<{
    label: string;
    value: string;
    link?: string;
  }>;
  actionText?: string;
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  details,
  actionText = 'Entendido',
}: SuccessModalProps) {
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
          width: '520px',
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
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '0',
              flexShrink: 0,
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: 'var(--bmw-success)' }}
            >
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2.5"
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
                marginBottom: details && details.length > 0 ? '16px' : '0',
              }}
            >
              {message}
            </p>

            {details && details.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--bmw-surface-soft)',
                  padding: '16px',
                  borderRadius: '0',
                  marginTop: '16px',
                }}
              >
                {details.map((detail, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: index < details.length - 1 ? '12px' : '0',
                    }}
                  >
                    <div
                      className="bmw-label-uppercase"
                      style={{
                        color: 'var(--bmw-muted)',
                        marginBottom: '4px',
                        fontSize: '11px',
                      }}
                    >
                      {detail.label}
                    </div>
                    {detail.link ? (
                      <a
                        href={detail.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bmw-body-sm"
                        style={{
                          color: 'var(--bmw-primary)',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                      >
                        {detail.value}
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </a>
                    ) : (
                      <div
                        className="bmw-body-sm"
                        style={{
                          color: 'var(--bmw-ink)',
                        }}
                      >
                        {detail.value}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
