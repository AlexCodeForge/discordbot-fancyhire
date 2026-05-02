import { useState } from 'react';
import axios from 'axios';
import { Layout } from '../components/ui/Layout';
import { AnnouncementEditor } from '../components/announcements/AnnouncementEditor';
import { EmbedPreview } from '../components/announcements/EmbedPreview';
import { ChannelSelector } from '../components/channels/ChannelSelector';
import { TemplateSelector } from '../components/templates/TemplateSelector';
import { TemplateManager } from '../components/templates/TemplateManager';
import { TemplateList } from '../components/templates/TemplateList';
import { AnnouncementHistory } from '../components/announcements/AnnouncementHistory';
import { AnnouncementStatsModal } from '../components/announcements/modals/AnnouncementStatsModal';
import { CategoryList } from '../components/channels/CategoryList';
import { CategorySelector } from '../components/channels/CategorySelector';
import { AnnouncementEmbed, AnnouncementTemplate } from '../types/Announcement';
import { SuccessModal } from '../components/ui/modals/SuccessModal';
import { ErrorModal } from '../components/ui/modals/ErrorModal';

type Tab = 'editor' | 'history' | 'templates' | 'categories';

export function Announcements() {
  const [activeTab, setActiveTab] = useState<Tab>('editor');
  const [embedData, setEmbedData] = useState<AnnouncementEmbed>({
    color: '#1c69d4',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<AnnouncementTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<number | null>(null);

  const handleTemplateSelect = (template: AnnouncementTemplate | null) => {
    setSelectedTemplate(template);
    if (template) {
      setEmbedData({
        title: template.title,
        description: template.description,
        color: template.color,
        url: template.url,
        thumbnail_url: template.thumbnail_url,
        image_url: template.image_url,
        footer_text: template.footer_text,
        footer_icon_url: template.footer_icon_url,
        author_name: template.author_name,
        author_icon_url: template.author_icon_url,
      });
    }
  };

  const handleTemplateSave = () => {
    setSuccessMessage('Plantilla guardada correctamente');
  };

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
      const createResponse = await axios.post('/api/announcements', {
        embedData,
        templateId: selectedTemplate?.id,
        categoryId: selectedCategory,
      });
      const announcementId = createResponse.data.id;

      const sendResponse = await axios.post(`/api/announcements/${announcementId}/send`, {
        channelId: selectedChannel,
      });

      if (sendResponse.data.success) {
        setSuccessMessage('Anuncio enviado correctamente al canal de Discord');
        setEmbedData({ color: '#1c69d4' });
        setSelectedChannel('');
        setSelectedTemplate(null);
        setSelectedCategory(null);
        setActiveTab('history');
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

  const handleViewStats = (announcementId: number) => {
    setSelectedAnnouncementId(announcementId);
  };

  const handleSelectTemplateForEdit = (template: AnnouncementTemplate) => {
    setSelectedTemplate(template);
    setEmbedData({
      title: template.title,
      description: template.description,
      color: template.color,
      url: template.url,
      thumbnail_url: template.thumbnail_url,
      image_url: template.image_url,
      footer_text: template.footer_text,
      footer_icon_url: template.footer_icon_url,
      author_name: template.author_name,
      author_icon_url: template.author_icon_url,
    });
    setActiveTab('editor');
  };

  const renderTabButton = (tab: Tab, label: string) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => setActiveTab(tab)}
        style={{
          backgroundColor: isActive ? '#1c69d4' : 'transparent',
          color: isActive ? '#ffffff' : '#262626',
          fontFamily: "'BMW Type Next Latin', sans-serif",
          fontSize: '16px',
          fontWeight: 700,
          lineHeight: 1.0,
          letterSpacing: '0.5px',
          border: 'none',
          borderBottom: isActive ? '4px solid #1c69d4' : '4px solid transparent',
          padding: '16px 32px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <Layout>
      <div style={{
        padding: '32px',
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
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
          borderBottom: '2px solid #d6d6d6',
          marginBottom: '32px',
          display: 'flex',
        }}>
          {renderTabButton('editor', 'Editor')}
          {renderTabButton('templates', 'Plantillas')}
          {renderTabButton('categories', 'Categorías')}
          {renderTabButton('history', 'Historial')}
        </div>

        {activeTab === 'editor' && (
          <>
            <div style={{
              backgroundColor: '#fafafa',
              padding: '24px',
              borderRadius: '0px',
              marginBottom: '24px',
            }}>
              <TemplateSelector
                onSelect={handleTemplateSelect}
                selectedTemplateId={selectedTemplate?.id}
              />
              <CategorySelector
                selectedCategoryId={selectedCategory}
                onSelect={setSelectedCategory}
              />
              <TemplateManager
                embedData={embedData}
                templateId={selectedTemplate?.id}
                onSave={handleTemplateSave}
              />
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
          </>
        )}

        {activeTab === 'templates' && (
          <TemplateList onSelectForEdit={handleSelectTemplateForEdit} />
        )}

        {activeTab === 'categories' && (
          <CategoryList />
        )}

        {activeTab === 'history' && (
          <AnnouncementHistory
            onViewStats={handleViewStats}
          />
        )}
      </div>

      {successMessage && (
        <SuccessModal
          isOpen={!!successMessage}
          title="Operación correcta"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {error && (
        <ErrorModal
          isOpen={!!error}
          title="Error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {selectedAnnouncementId && (
        <AnnouncementStatsModal
          announcementId={selectedAnnouncementId}
          onClose={() => setSelectedAnnouncementId(null)}
        />
      )}
    </Layout>
  );
}
