import { useState, useEffect } from 'react';
import { Layout } from '../components/ui/Layout';
import { AutoMessageCard } from '../components/autoMessages/AutoMessageCard';
import { AutoMessageConfigModal } from '../components/autoMessages/AutoMessageConfigModal';
import { api } from '../services/api';

interface AutoMessageTemplate {
  id: number;
  message_type: string;
  content: string;
  is_enabled: boolean;
  description: string | null;
  available_variables: string[];
  created_at: string;
  updated_at: string;
}

export function AutoMessages() {
  const [templates, setTemplates] = useState<AutoMessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AutoMessageTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAllAutoMessages();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (template: AutoMessageTemplate) => {
    try {
      const updated = await api.updateAutoMessage(template.message_type, {
        is_enabled: !template.is_enabled
      });

      setTemplates(templates.map(t => 
        t.message_type === template.message_type ? updated : t
      ));

      setSuccessMessage(
        updated.is_enabled 
          ? 'Mensaje automático activado' 
          : 'Mensaje automático desactivado'
      );

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleSave = async (content: string) => {
    if (!selectedTemplate) return;

    try {
      const updated = await api.updateAutoMessage(selectedTemplate.message_type, {
        content
      });

      setTemplates(templates.map(t => 
        t.message_type === selectedTemplate.message_type ? updated : t
      ));

      setSuccessMessage('Mensaje actualizado correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      throw err;
    }
  };

  const handleConfigure = (template: AutoMessageTemplate) => {
    setSelectedTemplate(template);
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
  };

  return (
    <Layout>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 className="bmw-display-sm" style={{ marginBottom: '12px' }}>
            Mensajes Automáticos
          </h1>
          <p className="bmw-body-md" style={{ color: 'var(--bmw-muted)', maxWidth: '800px' }}>
            Configura y gestiona todos los mensajes automáticos que envía el bot. Puedes editar el contenido, 
            activar o desactivar cada mensaje, e insertar variables dinámicas.
          </p>
        </div>

        {successMessage && (
          <div
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid var(--bmw-success)',
              color: 'var(--bmw-success)',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span className="bmw-body-sm">{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--bmw-success)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg
                width="20"
                height="20"
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
        )}

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid var(--bmw-error)',
              color: 'var(--bmw-error)',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span className="bmw-body-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--bmw-error)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg
                width="20"
                height="20"
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
        )}

        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 0',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-block',
                  width: '48px',
                  height: '48px',
                  border: '4px solid var(--bmw-primary)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  marginBottom: '16px',
                }}
              />
              <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)' }}>
                Cargando mensajes automáticos...
              </p>
            </div>
          </div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p className="bmw-body-md" style={{ color: 'var(--bmw-muted)' }}>
              No hay mensajes automáticos configurados
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '24px',
            }}
          >
            {templates.map((template) => (
              <AutoMessageCard
                key={template.message_type}
                template={template}
                onConfigure={() => handleConfigure(template)}
                onToggle={() => handleToggle(template)}
              />
            ))}
          </div>
        )}

        {selectedTemplate && (
          <AutoMessageConfigModal
            template={selectedTemplate}
            onSave={handleSave}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </Layout>
  );
}
