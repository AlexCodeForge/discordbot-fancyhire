import { useState, useEffect } from 'react';
import { Announcement, AnnouncementCategory } from '../types/Announcement';
import { api } from '../services/api';
import { ConfirmationModal } from './ConfirmationModal';
import { EditAnnouncementModal } from './EditAnnouncementModal';

interface AnnouncementHistoryProps {
  onViewStats: (announcementId: number) => void;
  onRefresh?: () => void;
}

export function AnnouncementHistory({ onViewStats, onRefresh }: AnnouncementHistoryProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [categories, setCategories] = useState<AnnouncementCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [announcementToEdit, setAnnouncementToEdit] = useState<Announcement | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [announcementsData, categoriesData] = await Promise.all([
        api.getAnnouncements(),
        api.getAnnouncementCategories(),
      ]);
      setAnnouncements(announcementsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const data = await api.getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const handleEditClick = (announcement: Announcement) => {
    setAnnouncementToEdit(announcement);
    setShowEditModal(true);
  };

  const handleEditSuccess = async () => {
    await loadAnnouncements();
    if (onRefresh) onRefresh();
  };

  const handleDeleteClick = (id: number) => {
    setAnnouncementToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!announcementToDelete) return;

    try {
      setDeleting(true);
      await api.deleteAnnouncement(announcementToDelete);
      await loadAnnouncements();
      if (onRefresh) onRefresh();
      setShowDeleteConfirm(false);
      setAnnouncementToDelete(null);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Error al eliminar el anuncio');
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return '-';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '-';
  };

  const getDiscordLink = (channelId?: string, messageId?: string) => {
    if (!channelId || !messageId) return null;
    const guildId = import.meta.env.VITE_GUILD_ID || '525075185649451018';
    return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = !searchText || 
      announcement.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      announcement.description?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || announcement.status === filterStatus;
    
    const matchesCategory = filterCategory === 'all' || 
      (filterCategory === 'none' ? !announcement.category_id : announcement.category_id === parseInt(filterCategory));

    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center', width: '100%' }}>Cargando...</div>;
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
          Historial de Anuncios
        </h2>
      </div>

      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        <input
          type="text"
          placeholder="Buscar por título o descripción..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            flex: 1,
            minWidth: '300px',
            height: '48px',
            fontFamily: "'BMW Type Next Latin', sans-serif",
            fontSize: '16px',
            padding: '0 16px',
            border: '2px solid #d6d6d6',
            borderRadius: '0px',
          }}
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            height: '48px',
            fontFamily: "'BMW Type Next Latin', sans-serif",
            fontSize: '16px',
            padding: '0 16px',
            border: '2px solid #d6d6d6',
            borderRadius: '0px',
            minWidth: '150px',
          }}
        >
          <option value="all">Todos los estados</option>
          <option value="draft">Borradores</option>
          <option value="sent">Enviados</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            height: '48px',
            fontFamily: "'BMW Type Next Latin', sans-serif",
            fontSize: '16px',
            padding: '0 16px',
            border: '2px solid #d6d6d6',
            borderRadius: '0px',
            minWidth: '150px',
          }}
        >
          <option value="all">Todas las categorías</option>
          <option value="none">Sin categoría</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
          ))}
        </select>
      </div>

      {filteredAnnouncements.length === 0 ? (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#fafafa',
          color: '#8e8e8e',
          fontFamily: "'BMW Type Next Latin', sans-serif",
          borderRadius: '0px',
        }}>
          No hay anuncios que mostrar
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
                  Categoría
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontFamily: "'BMW Type Next Latin', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#262626',
                }}>
                  Canal/Link
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontFamily: "'BMW Type Next Latin', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#262626',
                }}>
                  Estado
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontFamily: "'BMW Type Next Latin', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#262626',
                }}>
                  Fecha
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
              {filteredAnnouncements.map((announcement) => {
                const discordLink = getDiscordLink(announcement.discord_channel_id, announcement.discord_message_id);
                return (
                  <tr
                    key={announcement.id}
                    style={{
                      borderBottom: '1px solid #e8e8e8',
                    }}
                  >
                    <td style={{
                      padding: '16px',
                      fontFamily: "'BMW Type Next Latin', sans-serif",
                      fontSize: '16px',
                      color: '#262626',
                    }}>
                      {announcement.title || 'Sin título'}
                    </td>
                    <td style={{
                      padding: '16px',
                      fontFamily: "'BMW Type Next Latin', sans-serif",
                      fontSize: '14px',
                      color: '#3c3c3c',
                    }}>
                      {getCategoryName(announcement.category_id)}
                    </td>
                    <td style={{
                      padding: '16px',
                      fontFamily: "'BMW Type Next Latin', sans-serif",
                      fontSize: '14px',
                      color: '#3c3c3c',
                    }}>
                      {discordLink ? (
                        <a
                          href={discordLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#1c69d4',
                            textDecoration: 'none',
                          }}
                        >
                          Ver en Discord
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{
                      padding: '16px',
                    }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        fontFamily: "'BMW Type Next Latin', sans-serif",
                        backgroundColor: announcement.status === 'sent' ? '#e8f5e9' : '#fff3e0',
                        color: announcement.status === 'sent' ? '#2e7d32' : '#e65100',
                      }}>
                        {announcement.status === 'sent' ? 'Enviado' : 'Borrador'}
                      </span>
                    </td>
                    <td style={{
                      padding: '16px',
                      fontFamily: "'BMW Type Next Latin', sans-serif",
                      fontSize: '14px',
                      color: '#666',
                    }}>
                      {announcement.sent_at
                        ? new Date(announcement.sent_at).toLocaleString('es-ES')
                        : new Date(announcement.created_at).toLocaleString('es-ES')}
                    </td>
                    <td style={{
                      padding: '16px',
                      textAlign: 'right',
                    }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {announcement.status === 'sent' && (
                          <>
                            <button
                              onClick={() => onViewStats(announcement.id)}
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
                              Ver Stats
                            </button>
                            <button
                              onClick={() => handleEditClick(announcement)}
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
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteClick(announcement.id)}
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setAnnouncementToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Anuncio"
        message="¿Estás seguro de que deseas eliminar este anuncio? Esto también eliminará el mensaje de Discord."
        confirmText="Eliminar"
        variant="danger"
        loading={deleting}
      />

      {showEditModal && announcementToEdit && (
        <EditAnnouncementModal
          announcement={announcementToEdit}
          onClose={() => {
            setShowEditModal(false);
            setAnnouncementToEdit(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
