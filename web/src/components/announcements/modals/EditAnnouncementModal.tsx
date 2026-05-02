import { useState } from 'react';
import { Announcement, AnnouncementEmbed } from '../../../types/Announcement';
import { AnnouncementEditor } from '../AnnouncementEditor';
import { EmbedPreview } from '../EmbedPreview';
import { CategorySelector } from '../../channels/CategorySelector';
import axios from 'axios';

interface EditAnnouncementModalProps {
  announcement: Announcement;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditAnnouncementModal({ announcement, onClose, onSuccess }: EditAnnouncementModalProps) {
  const [embedData, setEmbedData] = useState<AnnouncementEmbed>({
    title: announcement.title,
    description: announcement.description,
    color: announcement.color,
    url: announcement.url,
    thumbnail_url: announcement.thumbnail_url,
    image_url: announcement.image_url,
    footer_text: announcement.footer_text,
    footer_icon_url: announcement.footer_icon_url,
    author_name: announcement.author_name,
    author_icon_url: announcement.author_icon_url,
  });
  const [selectedCategory, setSelectedCategory] = useState<number | null>(announcement.category_id || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!embedData.title && !embedData.description) {
      setError('Debes agregar al menos un título o descripción');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Actualizar el anuncio en la DB (incluyendo categoría)
      await axios.put(`/api/announcements/${announcement.id}`, {
        ...embedData,
        categoryId: selectedCategory,
      });

      // Si el anuncio fue enviado, actualizar el mensaje en Discord
      if (announcement.status === 'sent' && announcement.discord_message_id && announcement.discord_channel_id) {
        const botResponse = await axios.patch('/api/bot/edit-announcement', {
          channelId: announcement.discord_channel_id,
          messageId: announcement.discord_message_id,
          embedData
        });

        if (!botResponse.data.success) {
          throw new Error(botResponse.data.error || 'Error al actualizar mensaje en Discord');
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating announcement:', err);
      setError(err.response?.data?.error || err.message || 'Error al actualizar el anuncio');
    } finally {
      setSaving(false);
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
        padding: '32px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '32px',
          maxWidth: '1200px',
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
            Editar Anuncio
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '32px',
              cursor: saving ? 'not-allowed' : 'pointer',
              color: '#666',
              padding: '0',
              width: '40px',
              height: '40px',
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fee',
            color: '#c00',
            marginBottom: '24px',
            fontFamily: "'BMW Type Next Latin', sans-serif",
          }}>
            {error}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
          marginBottom: '24px',
        }}>
          <div style={{
            backgroundColor: '#fafafa',
            padding: '24px',
          }}>
            <h3 style={{
              fontFamily: "'BMW Type Next Latin', sans-serif",
              fontSize: '18px',
              fontWeight: 700,
              marginBottom: '16px',
            }}>
              Editar Contenido
            </h3>
            <CategorySelector
              selectedCategoryId={selectedCategory}
              onSelect={setSelectedCategory}
            />
            <AnnouncementEditor 
              embedData={embedData}
              onChange={setEmbedData}
            />
          </div>

          <div>
            <h3 style={{
              fontFamily: "'BMW Type Next Latin', sans-serif",
              fontSize: '18px',
              fontWeight: 700,
              marginBottom: '16px',
            }}>
              Vista Previa
            </h3>
            <EmbedPreview embedData={embedData} />
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '16px',
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              backgroundColor: '#ffffff',
              color: '#262626',
              border: '2px solid #262626',
              fontFamily: "'BMW Type Next Latin', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              padding: '14px 32px',
              height: '48px',
              cursor: saving ? 'not-allowed' : 'pointer',
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
              fontFamily: "'BMW Type Next Latin', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              padding: '14px 32px',
              height: '48px',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
