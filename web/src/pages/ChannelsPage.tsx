import { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/ui/Layout';
import { ChannelSidebar } from '../components/channels/ChannelSidebar';
import { ChannelHeader } from '../components/channels/ChannelHeader';
import { ChannelChat } from '../components/channels/ChannelChat';
import { EmptyState } from '../components/ui/EmptyState';
import { CreateChannelModal } from '../components/channels/modals/CreateChannelModal';
import { ManageCategoriesModal } from '../components/channels/modals/ManageCategoriesModal';
import { MoveChannelsModal } from '../components/channels/modals/MoveChannelsModal';
import { api } from '../services/api';
import { Channel } from '../types/Channel';
import { ChannelMessage, CreateChannelData } from '../types/ChannelMessage';
import { isCategoryChannel } from '../components/channels/ChannelSidebar';

function logError(message: string) {
  console.error(message);
}

export function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isMoveChannelsOpen, setIsMoveChannelsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const loadChannels = useCallback(async () => {
    try {
      const data = await api.getChannels();
      setChannels(data);
      setBannerError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al cargar canales';
      logError(msg);
      setBannerError(msg);
    }
  }, []);

  const loadMessages = useCallback(async (channelId: number) => {
    try {
      const data = await api.getChannelMessages(channelId);
      setMessages(data);
      setBannerError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al cargar mensajes';
      logError(msg);
      setBannerError(msg);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const data = await api.getChannels();
        if (!cancelled) {
          setChannels(data);
          setBannerError(null);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error al cargar canales';
        logError(msg);
        if (!cancelled) setBannerError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    const interval = setInterval(() => {
      void loadChannels();
    }, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [loadChannels]);

  useEffect(() => {
    if (!selectedChannel) {
      setMessages([]);
      return;
    }

    const id = selectedChannel.id;
    setMessages([]);

    let cancelled = false;
    const tick = async () => {
      try {
        const data = await api.getChannelMessages(id);
        if (!cancelled) {
          setMessages(data);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error al cargar mensajes';
        logError(msg);
        if (!cancelled) setBannerError(msg);
      }
    };

    void tick();
    const interval = setInterval(tick, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedChannel?.id]);

  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
  };

  const handleCreateChannel = () => {
    setIsCreateModalOpen(true);
  };

  const handleManageCategories = () => {
    setIsManageCategoriesOpen(true);
  };

  const handleCreateCategory = async (name: string) => {
    try {
      await api.createChannel({ 
        name, 
        type: 'GUILD_CATEGORY'
      });
      await loadChannels();
    } catch (e) {
      throw e;
    }
  };

  const handleCreateChannelSubmit = async (data: CreateChannelData) => {
    try {
      await api.createChannel(data);
      await loadChannels();
    } catch (e) {
      throw e;
    }
  };

  const handleDeleteChannel = async (channel: Channel) => {
    try {
      await api.deleteChannel(channel.discord_channel_id);
      if (selectedChannel?.id === channel.id) {
        setSelectedChannel(null);
        setMessages([]);
      }
      await loadChannels();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo eliminar el canal';
      logError(msg);
      setBannerError(msg);
    }
  };

  const handleSendMessage = async (content: string, mentions: string[]) => {
    if (!selectedChannel) return;
    try {
      const msg = await api.sendChannelMessage(selectedChannel.id, content, mentions);
      setMessages((prev) => [...prev, msg]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo enviar el mensaje';
      logError(msg);
      setBannerError(msg);
      void loadMessages(selectedChannel.id);
    }
  };

  const handleDeleteMessage = (discordMessageId: string) => {
    if (!selectedChannel) return;
    void (async () => {
      try {
        await api.deleteChannelMessage(selectedChannel.id, discordMessageId);
        setMessages((prev) => prev.filter((m) => m.discord_message_id !== discordMessageId));
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'No se pudo eliminar el mensaje';
        logError(msg);
        setBannerError(msg);
        void loadMessages(selectedChannel.id);
      }
    })();
  };

  const handleMoveChannels = async (channelIds: number[], targetCategoryId: string | null) => {
    try {
      await api.moveChannels(channelIds, targetCategoryId);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadChannels();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudieron mover los canales';
      logError(msg);
      setBannerError(msg);
    }
  };

  const handleDeleteChannels = async (channelIds: number[]) => {
    try {
      const channelsToDelete = channels.filter(ch => channelIds.includes(ch.id));
      
      for (const channel of channelsToDelete) {
        await api.deleteChannel(channel.discord_channel_id);
      }
      
      if (selectedChannel && channelIds.includes(selectedChannel.id)) {
        setSelectedChannel(null);
        setMessages([]);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadChannels();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudieron eliminar los canales';
      logError(msg);
      setBannerError(msg);
      throw e;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center">
          <div className="bmw-body-sm" style={{ color: 'var(--bmw-muted)' }}>
            Cargando canales...
          </div>
        </div>
      </Layout>
    );
  }

  const categoryChannels = channels.filter(isCategoryChannel);

  return (
    <Layout>
      <div
        className="flex h-full min-h-0 flex-col"
        style={{ backgroundColor: 'var(--bmw-surface-2)' }}
      >
        {bannerError && (
          <div
            className="bmw-body-sm flex shrink-0 items-center justify-between gap-4 px-4 py-2"
            style={{
              backgroundColor: 'var(--bmw-surface-strong)',
              color: 'var(--bmw-error)',
              borderBottom: '1px solid var(--bmw-hairline)',
            }}
            role="alert"
          >
            <span>{bannerError}</span>
            <button
              type="button"
              className="bmw-btn-text shrink-0"
              style={{ color: 'var(--bmw-ink)' }}
              onClick={() => setBannerError(null)}
            >
              Cerrar
            </button>
          </div>
        )}

        <div className="flex min-h-0 flex-1" style={{ backgroundColor: 'var(--bmw-surface-2)' }}>
          <ChannelSidebar
            channels={channels}
            selectedChannel={selectedChannel}
            onSelectChannel={handleSelectChannel}
            onCreateChannel={handleCreateChannel}
            onOpenMoveModal={() => setIsMoveChannelsOpen(true)}
            onManageCategories={handleManageCategories}
          />
          <div className="flex min-h-0 flex-1 flex-col">
            {selectedChannel ? (
              <>
                <ChannelHeader
                  channel={selectedChannel}
                  onDeleteChannel={() => void handleDeleteChannel(selectedChannel)}
                />
                <ChannelChat
                  channel={selectedChannel}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onDeleteMessage={handleDeleteMessage}
                  isAdmin
                />
              </>
            ) : (
              <EmptyState message="Selecciona un canal" />
            )}
          </div>
        </div>
      </div>

      <CreateChannelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateChannelSubmit}
        categories={categoryChannels}
      />

      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        categories={categoryChannels}
        onCreateCategory={handleCreateCategory}
        onDeleteCategory={handleDeleteChannel}
      />

      <MoveChannelsModal
        isOpen={isMoveChannelsOpen}
        onClose={() => setIsMoveChannelsOpen(false)}
        channels={channels}
        onMoveChannels={handleMoveChannels}
        onDeleteChannels={handleDeleteChannels}
      />
    </Layout>
  );
}
