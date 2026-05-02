import { useState, useEffect } from 'react';
import { AnnouncementCategory } from '../../types/Announcement';
import { api } from '../../services/api';
import { ConfirmationModal } from '../ui/modals/ConfirmationModal';

export function CategoryList() {
  const [categories, setCategories] = useState<AnnouncementCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AnnouncementCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#1c69d4', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await api.getAnnouncementCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', color: '#1c69d4', description: '' });
    setShowModal(true);
  };

  const handleEdit = (category: AnnouncementCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color || '#1c69d4',
      description: category.description || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    try {
      setSaving(true);
      if (editingCategory) {
        await api.updateAnnouncementCategory(editingCategory.id, formData);
      } else {
        await api.createAnnouncementCategory(formData);
      }
      await loadCategories();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error al guardar la categoría');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setCategoryToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      setDeleting(true);
      await api.deleteAnnouncementCategory(categoryToDelete);
      await loadCategories();
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error al eliminar la categoría');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center', width: '100%' }}>Cargando categorías...</div>;
  }

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
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
          Categorías de Anuncios
        </h2>
        <button
          onClick={handleCreate}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontFamily: "'BMW Type Next Latin', sans-serif",
            fontWeight: 700,
            backgroundColor: '#1c69d4',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Nueva Categoría
        </button>
      </div>

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
                Color
              </th>
              <th style={{
                padding: '16px',
                textAlign: 'left',
                fontFamily: "'BMW Type Next Latin', sans-serif",
                fontSize: '14px',
                fontWeight: 700,
                color: '#262626',
              }}>
                Descripción
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
            {categories.map((category) => (
              <tr
                key={category.id}
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
                  {category.name}
                </td>
                <td style={{
                  padding: '16px',
                }}>
                  <div style={{
                    width: '40px',
                    height: '24px',
                    backgroundColor: category.color || '#1c69d4',
                    border: '1px solid #d6d6d6',
                  }} />
                </td>
                <td style={{
                  padding: '16px',
                  fontFamily: "'BMW Type Next Latin', sans-serif",
                  fontSize: '14px',
                  color: '#3c3c3c',
                }}>
                  {category.description || '-'}
                </td>
                <td style={{
                  padding: '16px',
                  textAlign: 'right',
                }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleEdit(category)}
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
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(category.id)}
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

      {showModal && (
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
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontFamily: "'BMW Type Next Latin', sans-serif",
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '24px',
            }}>
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontFamily: "'BMW Type Next Latin', sans-serif",
                fontSize: '14px',
                fontWeight: 700,
                marginBottom: '8px',
              }}>
                Nombre *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  height: '48px',
                  fontFamily: "'BMW Type Next Latin', sans-serif",
                  fontSize: '16px',
                  padding: '0 16px',
                  border: '2px solid #d6d6d6',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontFamily: "'BMW Type Next Latin', sans-serif",
                fontSize: '14px',
                fontWeight: 700,
                marginBottom: '8px',
              }}>
                Color
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                style={{
                  width: '100px',
                  height: '48px',
                  border: '2px solid #d6d6d6',
                  cursor: 'pointer',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontFamily: "'BMW Type Next Latin', sans-serif",
                fontSize: '14px',
                fontWeight: 700,
                marginBottom: '8px',
              }}>
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  fontFamily: "'BMW Type Next Latin', sans-serif",
                  fontSize: '16px',
                  padding: '12px 16px',
                  border: '2px solid #d6d6d6',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#262626',
                  border: '2px solid #d6d6d6',
                  padding: '12px 24px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: "'BMW Type Next Latin', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
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

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Categoría"
        message="¿Estás seguro de que deseas eliminar esta categoría? Los anuncios asociados no se eliminarán."
        confirmText="Eliminar"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
