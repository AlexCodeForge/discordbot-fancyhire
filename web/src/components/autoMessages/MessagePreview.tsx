interface MessagePreviewProps {
  content: string;
  variables: Record<string, string | number>;
}

export function MessagePreview({ content, variables }: MessagePreviewProps) {
  const renderPreview = (): string => {
    let rendered = content;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      rendered = rendered.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value));
    }
    
    return rendered;
  };

  const previewContent = renderPreview();

  return (
    <div
      style={{
        backgroundColor: 'var(--bmw-surface-soft)',
        border: '1px solid var(--bmw-hairline)',
        padding: '20px',
        marginTop: '24px',
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
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span
          className="bmw-caption"
          style={{
            color: 'var(--bmw-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Vista Previa
        </span>
      </div>
      
      <div
        className="bmw-body-sm"
        style={{
          whiteSpace: 'pre-wrap',
          backgroundColor: 'var(--bmw-canvas)',
          border: '1px solid var(--bmw-hairline)',
          padding: '16px',
          minHeight: '120px',
          color: 'var(--bmw-ink)',
          lineHeight: '1.6',
        }}
      >
        {previewContent || (
          <span style={{ color: 'var(--bmw-muted)', fontStyle: 'italic' }}>
            El mensaje aparecerá aquí...
          </span>
        )}
      </div>
    </div>
  );
}
