import { useEffect, useState } from 'react';
import { AnnouncementWithStats } from '../types/Announcement';
import { api } from '../services/api';
import { EmbedPreview } from './EmbedPreview';

interface AnnouncementStatsModalProps {
  announcementId: number;
  onClose: () => void;
}

export function AnnouncementStatsModal({ announcementId, onClose }: AnnouncementStatsModalProps) {
  const [announcement, setAnnouncement] = useState<AnnouncementWithStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [announcementId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getAnnouncementWithStats(announcementId);
      setAnnouncement(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
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
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '32px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
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
            fontSize: '32px',
            fontWeight: 700,
            color: '#262626',
          }}>
            Estadísticas del Anuncio
          </h2>
          <button
            onClick={onClose}
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

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>Cargando...</div>
        ) : announcement ? (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '32px',
              marginBottom: '32px',
            }}>
              <div>
                <h3 style={{
                  fontFamily: "'BMW Type Next Latin', sans-serif",
                  fontSize: '18px',
                  fontWeight: 700,
                  marginBottom: '16px',
                }}>
                  Preview del Anuncio
                </h3>
                <EmbedPreview embedData={announcement} />
              </div>

              <div>
                <h3 style={{
                  fontFamily: "'BMW Type Next Latin', sans-serif",
                  fontSize: '18px',
                  fontWeight: 700,
                  marginBottom: '16px',
                }}>
                  Información
                </h3>
                <div style={{
                  backgroundColor: '#fafafa',
                  padding: '16px',
                  fontFamily: "'BMW Type Next Latin', sans-serif",
                }}>
                  <p style={{ marginBottom: '8px' }}>
                    <strong>Estado:</strong> {announcement.status === 'sent' ? 'Enviado' : 'Borrador'}
                  </p>
                  <p style={{ marginBottom: '8px' }}>
                    <strong>Creado por:</strong> {announcement.created_by}
                  </p>
                  <p style={{ marginBottom: '8px' }}>
                    <strong>Fecha de envío:</strong>{' '}
                    {announcement.sent_at
                      ? new Date(announcement.sent_at).toLocaleString('es-ES')
                      : 'No enviado'}
                  </p>
                  {announcement.discord_message_id && (
                    <p style={{ marginBottom: '8px' }}>
                      <strong>Message ID:</strong> {announcement.discord_message_id}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <h3 style={{
              fontFamily: "'BMW Type Next Latin', sans-serif",
              fontSize: '18px',
              fontWeight: 700,
              marginBottom: '16px',
            }}>
              Reacciones
            </h3>

            {announcement.reactions && announcement.reactions.length > 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}>
                {announcement.reactions.map((reaction, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: '#fafafa',
                      padding: '16px',
                      border: '1px solid #d6d6d6',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px',
                    }}>
                      <span style={{
                        fontSize: '24px',
                      }}>
                        {reaction.emoji}
                      </span>
                      <span style={{
                        fontFamily: "'BMW Type Next Latin', sans-serif",
                        fontSize: '18px',
                        fontWeight: 700,
                        color: '#262626',
                      }}>
                        {reaction.count} {reaction.count === 1 ? 'reacción' : 'reacciones'}
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '8px',
                    }}>
                      {reaction.users.map((user) => (
                        <div
                          key={user.user_id}
                          style={{
                            backgroundColor: '#ffffff',
                            padding: '8px 12px',
                            fontFamily: "'BMW Type Next Latin', sans-serif",
                            fontSize: '14px',
                            color: '#3c3c3c',
                          }}
                        >
                          {user.user_name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                backgroundColor: '#fafafa',
                color: '#8e8e8e',
                fontFamily: "'BMW Type Next Latin', sans-serif",
              }}>
                No hay reacciones aún
              </div>
            )}
          </div>
        ) : (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            color: '#d32f2f',
          }}>
            Error al cargar las estadísticas
          </div>
        )}
      </div>
    </div>
  );
}
