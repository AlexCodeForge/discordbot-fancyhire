interface VariableSelectorProps {
  variables: string[];
  onInsert: (variable: string) => void;
}

export function VariableSelector({ variables, onInsert }: VariableSelectorProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bmw-surface-soft)',
        border: '1px solid var(--bmw-hairline)',
        padding: '20px',
        marginBottom: '24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: 'var(--bmw-muted)' }}
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        <span
          className="bmw-caption"
          style={{
            color: 'var(--bmw-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Variables Disponibles
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        {variables.length > 0 ? (
          variables.map((variable) => (
            <button
              key={variable}
              onClick={() => onInsert(variable)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                fontSize: '13px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                backgroundColor: 'var(--bmw-canvas)',
                border: '1px solid var(--bmw-hairline)',
                color: 'var(--bmw-ink)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--bmw-primary)';
                e.currentTarget.style.backgroundColor = 'var(--bmw-surface-card)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--bmw-hairline)';
                e.currentTarget.style.backgroundColor = 'var(--bmw-canvas)';
              }}
            >
              <span>{`{${variable}}`}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'var(--bmw-muted)' }}
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          ))
        ) : (
          <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)' }}>
            No hay variables disponibles
          </p>
        )}
      </div>

      <p
        className="bmw-caption"
        style={{
          color: 'var(--bmw-muted)',
          fontSize: '12px',
        }}
      >
        Haz clic en una variable para insertarla en el cursor
      </p>
    </div>
  );
}
