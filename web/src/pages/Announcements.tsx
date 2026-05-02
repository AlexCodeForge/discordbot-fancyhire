import { useState } from 'react';
import axios from 'axios';
import { Layout } from '../components/Layout';
import { AnnouncementEditor } from '../components/AnnouncementEditor';
import { EmbedPreview } from '../components/EmbedPreview';
import { ChannelSelector } from '../components/ChannelSelector';
import { AnnouncementEmbed } from '../types/Announcement';
import { SuccessModal } from '../components/SuccessModal';
import { ErrorModal } from '../components/ErrorModal';

export function Announcements() {
  const [embedData, setEmbedData] = useState<AnnouncementEmbed>({
    color: '#1c69d4',
  });
  const [selectedChannel, setSelectedChannel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSend = async () => {
    if (!selectedChannel) {
      setChannelError('Debes seleccionar un canal');
      return;
    }

    if (!embedData.title && !embedData.description) {
      setError('Debes agregar al menos un título o descripción');
      return;
    }

    setLoading(true);
    setError(null);
    setChannelError(null);

    try {
      const createResponse = await axios.post('/api/announcements', embedData);
      const announcementId = createResponse.data.id;

      const sendResponse = await axios.post(`/api/announcements/${announcementId}/send`, {
        channelId: selectedChannel,
      });

      if (sendResponse.data.success) {
        setSuccessMessage('Anuncio enviado correctamente al canal de Discord');
        setEmbedData({ color: '#1c69d4' });
        setSelectedChannel('');
      } else {
        setError(`Error al enviar anuncio: ${sendResponse.data.error}`);
      }
    } catch (err: any) {
      console.error('Error sending announcement:', err);
      setError(err.response?.data?.error || 'Error al enviar el anuncio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{
        padding: '32px',
        maxWidth: '1440px',
        margin: '0 auto',
      }}>
        <div style={{
          marginBottom: '32px',
        }}>
          <h1 style={{
            fontFamily: "'BMW Type Next Latin', sans-serif",
            fontSize: '48px',
            fontWeight: 700,
            lineHeight: 1.1,
            color: '#262626',
            marginBottom: '12px',
          }}>
            Anuncios Discord
          </h1>
          <p style={{
            fontFamily: "'BMW Type Next Latin', sans-serif",
            fontSize: '16px',
            fontWeight: 300,
            lineHeight: 1.55,
            color: '#3c3c3c',
          }}>
            Crea y envía mensajes embed profesionales a los canales de Discord
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
          marginBottom: '32px',
        }}>
          <div style={{
            backgroundColor: '#fafafa',
            padding: '24px',
            borderRadius: '0px',
          }}>
            <AnnouncementEditor 
              embedData={embedData}
              onChange={setEmbedData}
            />
          </div>

          <div style={{
            position: 'sticky',
            top: '32px',
            alignSelf: 'start',
          }}>
            <EmbedPreview embedData={embedData} />
          </div>
        </div>

        <div style={{
          backgroundColor: '#fafafa',
          padding: '24px',
          borderRadius: '0px',
          marginBottom: '24px',
        }}>
          <ChannelSelector
            value={selectedChannel}
            onChange={(value) => {
              setSelectedChannel(value);
              setChannelError(null);
            }}
            error={channelError || undefined}
          />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '16px',
        }}>
          <button
            onClick={handleSend}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#d6d6d6' : '#1c69d4',
              color: '#ffffff',
              fontFamily: "'BMW Type Next Latin', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              lineHeight: 1.0,
              letterSpacing: '0.5px',
              border: 'none',
              borderRadius: '0px',
              padding: '14px 32px',
              height: '48px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#0653b6';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#1c69d4';
              }
            }}
          >
            {loading ? 'Enviando...' : 'Enviar Anuncio'}
          </button>
        </div>
      </div>

      {successMessage && (
        <SuccessModal
          isOpen={!!successMessage}
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {error && (
        <ErrorModal
          isOpen={!!error}
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </Layout>
  );
}
