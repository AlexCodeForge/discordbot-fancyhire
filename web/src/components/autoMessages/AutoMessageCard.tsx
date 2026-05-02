interface AutoMessageTemplate {
  id: number;
  message_type: string;
  content: string;
  is_enabled: boolean;
  description: string | null;
  available_variables: string[];
}

interface AutoMessageCardProps {
  template: AutoMessageTemplate;
  onConfigure: () => void;
  onToggle: () => void;
}

export function AutoMessageCard({ template, onConfigure, onToggle }: AutoMessageCardProps) {
  const getTitle = (messageType: string): string => {
    const titles: Record<string, string> = {
      welcome_dm: 'Bienvenida DM',
      admin_new_lead: 'Notificación Nuevo Lead',
      admin_lead_error: 'Notificación Error Lead',
      ticket_open: 'Apertura de Ticket',
      ticket_close: 'Cierre de Ticket',
      ticket_transfer: 'Transferencia de Ticket'
    };
    return titles[messageType] || messageType;
  };

  return (
    <div className="bmw-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <h3 className="bmw-title-md" style={{ marginBottom: '8px' }}>
            {getTitle(template.message_type)}
          </h3>
          <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)', marginBottom: '16px' }}>
            {template.description}
          </p>
        </div>
        <label
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            cursor: 'pointer',
            marginLeft: '16px',
          }}
        >
          <input
            type="checkbox"
            checked={template.is_enabled}
            onChange={onToggle}
            style={{
              position: 'absolute',
              opacity: 0,
              width: 0,
              height: 0,
            }}
          />
          <div
            style={{
              position: 'relative',
              width: '44px',
              height: '24px',
              backgroundColor: template.is_enabled ? 'var(--bmw-primary)' : 'var(--bmw-surface-strong)',
              borderRadius: '12px',
              transition: 'background-color 0.2s',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: template.is_enabled ? '22px' : '2px',
                width: '20px',
                height: '20px',
                backgroundColor: '#ffffff',
                borderRadius: '50%',
                transition: 'left 0.2s',
              }}
            />
          </div>
        </label>
      </div>

      <div style={{ marginBottom: '20px', flex: 1 }}>
        <span className="bmw-caption" style={{ color: 'var(--bmw-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Variables disponibles:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
          {template.available_variables.map((variable) => (
            <span
              key={variable}
              style={{
                display: 'inline-block',
                padding: '4px 8px',
                fontSize: '11px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                backgroundColor: 'var(--bmw-surface-soft)',
                border: '1px solid var(--bmw-hairline)',
                color: 'var(--bmw-body)',
              }}
            >
              {`{${variable}}`}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={onConfigure}
        className="bmw-btn-secondary"
        style={{ width: '100%' }}
      >
        Configurar
      </button>
    </div>
  );
}
