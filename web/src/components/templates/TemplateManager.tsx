import { useState } from 'react';
import { AnnouncementEmbed } from '../../types/Announcement';
import { api } from '../../services/api';

interface TemplateManagerProps {
  embedData: AnnouncementEmbed;
  templateId?: number;
  onSave: () => void;
}

export function TemplateManager({ embedData, templateId, onSave }: TemplateManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveAsNew = async () => {
    if (!templateName.trim()) {
      setError('El nombre de la plantilla es requerido');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await api.createAnnouncementTemplate({
        name: templateName,
        embedData
      });
      setShowModal(false);
      setTemplateName('');
      onSave();
    } catch (err: any) {
      console.error('Error saving template:', err);
      setError(err.response?.data?.error || 'Error al guardar la plantilla');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!templateId) return;

    try {
      setSaving(true);
      setError(null);
      await api.updateAnnouncementTemplate(templateId, embedData);
      onSave();
    } catch (err: any) {
      console.error('Error updating template:', err);
      setError(err.response?.data?.error || 'Error al actualizar la plantilla');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <button
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: '#ffffff',
            color: '#262626',
            fontFamily: "'BMW Type Next Latin', sans-serif",
            fontSize: '14px',
            fontWeight: 700,
            lineHeight: 1.0,
            letterSpacing: '0.5px',
            border: '2px solid #262626',
            borderRadius: '0px',
            padding: '12px 24px',
            height: '48px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#262626';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.color = '#262626';
          }}
        >
          Guardar como Plantilla
        </button>

        {templateId && (
          <button
            onClick={handleUpdate}
            disabled={saving}
            style={{
              backgroundColor: saving ? '#d6d6d6' : '#ffffff',
              color: '#262626',
              fontFamily: "'BMW Type Next Latin', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              lineHeight: 1.0,
              letterSpacing: '0.5px',
              border: '2px solid #262626',
              borderRadius: '0px',
              padding: '12px 24px',
              height: '48px',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = '#262626';
                e.currentTarget.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#262626';
              }
            }}
          >
            {saving ? 'Actualizando...' : 'Actualizar Plantilla'}
          </button>
        )}
      </div>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee',
          color: '#c00',
          marginBottom: '16px',
          borderRadius: '0px',
        }}>
          {error}
        </div>
      )}

      {showModal && (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
          }}>
            <h2 style={{
              fontFamily: "'BMW Type Next Latin', sans-serif",
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '24px',
            }}>
              Guardar Plantilla
            </h2>

            <label style={{
              display: 'block',
              fontFamily: "'BMW Type Next Latin', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              marginBottom: '8px',
            }}>
              Nombre de la plantilla
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Ej: Anuncio de actualización"
              style={{
                width: '100%',
                height: '48px',
                fontFamily: "'BMW Type Next Latin', sans-serif",
                fontSize: '16px',
                padding: '0 16px',
                border: '2px solid #d6d6d6',
                marginBottom: '24px',
              }}
            />

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setTemplateName('');
                  setError(null);
                }}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#262626',
                  border: '2px solid #d6d6d6',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  fontFamily: "'BMW Type Next Latin', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAsNew}
                disabled={saving}
                style={{
                  backgroundColor: saving ? '#d6d6d6' : '#1c69d4',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 24px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: "'BMW Type Next Latin', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
