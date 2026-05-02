import { useState, useEffect } from 'react';
import { AnnouncementTemplate } from '../../types/Announcement';
import { api } from '../../services/api';
import { EmbedPreview } from '../announcements/EmbedPreview';
import { ConfirmationModal } from '../ui/modals/ConfirmationModal';

interface TemplateListProps {
  onSelectForEdit?: (template: AnnouncementTemplate) => void;
}

export function TemplateList({ onSelectForEdit }: TemplateListProps) {
  const [templates, setTemplates] = useState<AnnouncementTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<AnnouncementTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await api.getAnnouncementTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: number, name: string) => {
    setTemplateToDelete({ id, name });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    try {
      setDeleting(true);
      await api.deleteAnnouncementTemplate(templateToDelete.id);
      await loadTemplates();
      setShowDeleteConfirm(false);
      setTemplateToDelete(null);
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error al eliminar la plantilla');
    } finally {
      setDeleting(false);
    }
  };

  const handleViewPreview = (template: AnnouncementTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center', width: '100%' }}>Cargando plantillas...</div>;
  }

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <div style={{
        marginBottom: '24px',
      }}>
        <h2 style={{
          fontFamily: "'BMW Type Next Latin', sans-serif",
          fontSize: '24px',
          fontWeight: 700,
          color: '#262626',
        }}>
          Gestión de Plantillas
        </h2>
      </div>

      {templates.length === 0 ? (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#fafafa',
          color: '#8e8e8e',
          fontFamily: "'BMW Type Next Latin', sans-serif",
          borderRadius: '0px',
        }}>
          No hay plantillas guardadas. Crea una desde el tab "Editor"
        </div>
      ) : (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #d6d6d6',
          borderRadius: '0px',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#fafafa',
                borderBottom: '2px solid #d6d6d6',
              }}>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontFamily: "'BMW Type Next Latin', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#262626',
                }}>
                  Nombre
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontFamily: "'BMW Type Next Latin', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#262626',
                }}>
                  Título
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontFamily: "'BMW Type Next Latin', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#262626',
                }}>
                  Creado por
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontFamily: "'BMW Type Next Latin', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#262626',
                }}>
                  Última actualización
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'right',
                  fontFamily: "'BMW Type Next Latin', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#262626',
                }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr
                  key={template.id}
                  style={{
                    borderBottom: '1px solid #e8e8e8',
                  }}
                >
                  <td style={{
                    padding: '16px',
                    fontFamily: "'BMW Type Next Latin', sans-serif",
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#262626',
                  }}>
                    {template.name}
                  </td>
                  <td style={{
                    padding: '16px',
                    fontFamily: "'BMW Type Next Latin', sans-serif",
                    fontSize: '14px',
                    color: '#3c3c3c',
                  }}>
                    {template.title || 'Sin título'}
                  </td>
                  <td style={{
                    padding: '16px',
                    fontFamily: "'BMW Type Next Latin', sans-serif",
                    fontSize: '14px',
                    color: '#666',
                  }}>
                    {template.created_by}
                  </td>
                  <td style={{
                    padding: '16px',
                    fontFamily: "'BMW Type Next Latin', sans-serif",
                    fontSize: '14px',
                    color: '#666',
                  }}>
                    {new Date(template.updated_at).toLocaleString('es-ES')}
                  </td>
                  <td style={{
                    padding: '16px',
                    textAlign: 'right',
                  }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleViewPreview(template)}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontFamily: "'BMW Type Next Latin', sans-serif",
                          fontWeight: 700,
                          backgroundColor: '#1c69d4',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Ver Preview
                      </button>
                      {onSelectForEdit && (
                        <button
                          onClick={() => onSelectForEdit(template)}
                          style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontFamily: "'BMW Type Next Latin', sans-serif",
                            fontWeight: 700,
                            backgroundColor: '#ffffff',
                            color: '#262626',
                            border: '2px solid #262626',
                            cursor: 'pointer',
                          }}
                        >
                          Usar
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteClick(template.id, template.name)}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontFamily: "'BMW Type Next Latin', sans-serif",
                          fontWeight: 700,
                          backgroundColor: '#d32f2f',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setTemplateToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Plantilla"
        message={`¿Estás seguro de que deseas eliminar la plantilla "${templateToDelete?.name}"?`}
        confirmText="Eliminar"
        variant="danger"
        loading={deleting}
      />

      {showPreview && selectedTemplate && (
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
          }}
          onClick={() => setShowPreview(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}>
              <h2 style={{
                fontFamily: "'BMW Type Next Latin', sans-serif",
                fontSize: '24px',
                fontWeight: 700,
                color: '#262626',
              }}>
                {selectedTemplate.name}
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '32px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0',
                  width: '40px',
                  height: '40px',
                }}
              >
                ×
              </button>
            </div>
            <EmbedPreview embedData={selectedTemplate} />
          </div>
        </div>
      )}
    </div>
  );
}
