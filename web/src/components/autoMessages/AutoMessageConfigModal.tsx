import { useState, useEffect, useRef } from 'react';
import { MessagePreview } from './MessagePreview';
import { VariableSelector } from './VariableSelector';

interface AutoMessageTemplate {
  id: number;
  message_type: string;
  content: string;
  is_enabled: boolean;
  description: string | null;
  available_variables: string[];
}

interface AutoMessageConfigModalProps {
  template: AutoMessageTemplate;
  onSave: (content: string) => Promise<void>;
  onClose: () => void;
}

export function AutoMessageConfigModal({ template, onSave, onClose }: AutoMessageConfigModalProps) {
  const [content, setContent] = useState(template.content);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(template.content);
  }, [template]);

  const getExampleVariables = (): Record<string, string | number> => {
    const examples: Record<string, Record<string, string | number>> = {
      welcome_dm: {
        username: 'Usuario#1234',
        userId: '123456789012345678',
        serverName: 'Mi Servidor'
      },
      admin_new_lead: {
        username: 'Usuario#1234',
        userId: '123456789012345678',
        leadId: 42,
        date: new Date().toLocaleString('es-ES')
      },
      admin_lead_error: {
        username: 'Usuario#1234',
        error: 'Error de ejemplo'
      },
      ticket_open: {
        leadName: 'Usuario#1234',
        leadId: 42
      },
      ticket_close: {
        channelName: 'ticket-usuario-42'
      },
      ticket_transfer: {
        newUserId: '123456789012345678',
        newUserName: 'NuevoUsuario#5678'
      }
    };

    return examples[template.message_type] || {};
  };

  const handleInsertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = content.substring(0, start);
    const textAfter = content.substring(end);
    const newContent = textBefore + `{${variable}}` + textAfter;

    setContent(newContent);

    setTimeout(() => {
      const newPosition = start + variable.length + 2;
      textarea.focus();
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      setError('El contenido no puede estar vacío');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave(content);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setContent(template.content);
    setError(null);
  };

  const getTitle = (messageType: string): string => {
    const titles: Record<string, string> = {
      welcome_dm: 'Configurar Bienvenida DM',
      admin_new_lead: 'Configurar Notificación Nuevo Lead',
      admin_lead_error: 'Configurar Notificación Error Lead',
      ticket_open: 'Configurar Apertura de Ticket',
      ticket_close: 'Configurar Cierre de Ticket',
      ticket_transfer: 'Configurar Transferencia de Ticket'
    };
    return titles[messageType] || `Configurar ${messageType}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '32px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bmw-canvas)',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '24px 32px',
            borderBottom: '1px solid var(--bmw-hairline)',
            position: 'sticky',
            top: 0,
            backgroundColor: 'var(--bmw-canvas)',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 className="bmw-title-lg" style={{ marginBottom: '8px' }}>
                {getTitle(template.message_type)}
              </h2>
              {template.description && (
                <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)' }}>
                  {template.description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--bmw-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div style={{ padding: '32px' }}>
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid var(--bmw-error)',
                color: 'var(--bmw-error)',
                padding: '16px',
                marginBottom: '24px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label
              className="bmw-label-uppercase"
              style={{
                display: 'block',
                marginBottom: '12px',
                color: 'var(--bmw-ink)',
              }}
            >
              Contenido del Mensaje
            </label>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: '100%',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '13px',
                padding: '16px',
                border: '1px solid var(--bmw-hairline)',
                backgroundColor: 'var(--bmw-canvas)',
                color: 'var(--bmw-ink)',
                minHeight: '200px',
                resize: 'vertical',
                outline: 'none',
              }}
              placeholder="Escribe el contenido del mensaje..."
              onFocus={(e) => e.target.style.borderColor = 'var(--bmw-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--bmw-hairline)'}
            />
          </div>

          <VariableSelector 
            variables={template.available_variables}
            onInsert={handleInsertVariable}
          />

          <MessagePreview 
            content={content}
            variables={getExampleVariables()}
          />
        </div>

        <div
          style={{
            padding: '20px 32px',
            borderTop: '1px solid var(--bmw-hairline)',
            backgroundColor: 'var(--bmw-surface-soft)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            bottom: 0,
          }}
        >
          <button
            onClick={handleReset}
            className="bmw-btn-secondary"
            disabled={loading}
          >
            Restablecer
          </button>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              className="bmw-btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="bmw-btn-primary"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
