import { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/ui/Layout';
import { ChannelSidebar } from '../components/channels/ChannelSidebar';
import { ChannelHeader } from '../components/channels/ChannelHeader';
import { ChannelChat } from '../components/channels/ChannelChat';
import { EmptyState } from '../components/ui/EmptyState';
import { CreateChannelModal } from '../components/channels/modals/CreateChannelModal';
import { ManageCategoriesModal } from '../components/channels/modals/ManageCategoriesModal';
import { MoveChannelsModal } from '../components/channels/modals/MoveChannelsModal';
import { SuccessModal } from '../components/ui/modals/SuccessModal';
import { ConfirmationModal } from '../components/ui/modals/ConfirmationModal';
import { ThreadList } from '../components/forums/ThreadList';
import { ThreadChat } from '../components/forums/ThreadChat';
import { CreateThreadModal } from '../components/forums/CreateThreadModal';
import { EditThreadModal } from '../components/forums/EditThreadModal';
import { api } from '../services/api';
import { Channel } from '../types/Channel';
import { ChannelMessage, CreateChannelData } from '../types/ChannelMessage';
import { ForumThread, ThreadMessage } from '../types/ForumThread';
import { isCategoryChannel } from '../components/channels/ChannelSidebar';

function logError(message: string) {
  console.error(message);
}

export function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateThreadModalOpen, setIsCreateThreadModalOpen] = useState(false);
  const [threadToEdit, setThreadToEdit] = useState<ForumThread | null>(null);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isMoveChannelsOpen, setIsMoveChannelsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [threadToDelete, setThreadToDelete] = useState<ForumThread | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const loadThreads = useCallback(async (channelId: number) => {
    try {
      const data = await api.getForumThreads(channelId);
      setThreads(data);
      setBannerError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al cargar threads';
      logError(msg);
      setBannerError(msg);
    }
  }, []);

  const loadThreadMessages = useCallback(async (threadId: number) => {
    try {
      const data = await api.getThreadMessages(threadId);
      setThreadMessages(data);
      setBannerError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al cargar mensajes de thread';
      logError(msg);
      setBannerError(msg);
    }
  }, []);

  const isForumChannel = (channel: Channel) => {
    return Number(channel.type) === 15;
  };

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
      setThreads([]);
      setSelectedThread(null);
      setThreadMessages([]);
      return;
    }

    const id = selectedChannel.id;
    setMessages([]);
    setThreads([]);
    setSelectedThread(null);
    setThreadMessages([]);

    const isForum = isForumChannel(selectedChannel);

    let cancelled = false;
    const tick = async () => {
      try {
        if (isForum) {
          const data = await api.getForumThreads(id);
          if (!cancelled) {
            setThreads(data);
          }
        } else {
          const data = await api.getChannelMessages(id);
          if (!cancelled) {
            setMessages(data);
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error al cargar datos';
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

  useEffect(() => {
    if (!selectedThread) {
      setThreadMessages([]);
      return;
    }

    const id = selectedThread.id;
    setThreadMessages([]);

    let cancelled = false;
    const tick = async () => {
      try {
        const data = await api.getThreadMessages(id);
        if (!cancelled) {
          setThreadMessages(data);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error al cargar mensajes de thread';
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
  }, [selectedThread?.id]);

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
      setSuccessMessage({
        title: 'Canal Eliminado',
        message: 'El canal ha sido eliminado',
      });
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

  const handleSendThreadMessage = async (content: string, mentions: string[]) => {
    if (!selectedThread) return;
    try {
      const msg = await api.sendThreadMessage(selectedThread.id, content, mentions);
      setThreadMessages((prev) => [...prev, msg]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo enviar el mensaje al thread';
      logError(msg);
      setBannerError(msg);
      void loadThreadMessages(selectedThread.id);
    }
  };

  const handleCreateThread = async (name: string, content: string, embedData?: any) => {
    if (!selectedChannel) return;
    try {
      await api.createForumThread(selectedChannel.id, name, content, {
        embedData,
      });
      await loadThreads(selectedChannel.id);
      setSuccessMessage({
        title: 'Thread Creado',
        message: `El thread "${name}" ha sido creado exitosamente.`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo crear el thread';
      logError(msg);
      setBannerError(msg);
      throw e;
    }
  };

  const handleDeleteMessage = (discordMessageId: string) => {
    setMessageToDelete(discordMessageId);
  };

  const confirmDeleteMessage = async () => {
    if (!selectedChannel || !messageToDelete) return;
    
    setIsDeleting(true);
    try {
      await api.deleteChannelMessage(selectedChannel.id, messageToDelete);
      setMessages((prev) => prev.filter((m) => m.discord_message_id !== messageToDelete));
      setMessageToDelete(null);
      setSuccessMessage({
        title: 'Mensaje Eliminado',
        message: 'El mensaje ha sido eliminado exitosamente.',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo eliminar el mensaje';
      logError(msg);
      setBannerError(msg);
      void loadMessages(selectedChannel.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteThread = (thread: ForumThread) => {
    setThreadToDelete(thread);
  };

  const confirmDeleteThread = async () => {
    if (!selectedChannel || !threadToDelete) return;
    
    setIsDeleting(true);
    try {
      await api.deleteThread(threadToDelete.id);
      setThreads((prev) => prev.filter((t) => t.id !== threadToDelete.id));
      if (selectedThread?.id === threadToDelete.id) {
        setSelectedThread(null);
        setThreadMessages([]);
      }
      setThreadToDelete(null);
      setSuccessMessage({
        title: 'Thread Eliminado',
        message: `El thread "${threadToDelete.name}" ha sido eliminado exitosamente.`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo eliminar el thread';
      logError(msg);
      setBannerError(msg);
      void loadThreads(selectedChannel.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditThread = (thread: ForumThread) => {
    setThreadToEdit(thread);
  };

  const handleSaveThreadEdit = async (threadId: number, name: string, content: string) => {
    if (!selectedChannel) return;
    try {
      await api.updateThread(threadId, name, content);
      await loadThreads(selectedChannel.id);
      if (selectedThread?.id === threadId) {
        const updatedThread = threads.find(t => t.id === threadId);
        if (updatedThread) {
          setSelectedThread({ ...updatedThread, name });
        }
      }
      setSuccessMessage({
        title: 'Thread Actualizado',
        message: `El thread ha sido actualizado exitosamente.`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo actualizar el thread';
      logError(msg);
      throw e;
    }
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
                {isForumChannel(selectedChannel) ? (
                  <div className="flex min-h-0 flex-1">
                    <ThreadList
                      threads={threads}
                      selectedThread={selectedThread}
                      onSelectThread={setSelectedThread}
                      onCreateThread={() => setIsCreateThreadModalOpen(true)}
                      onDeleteThread={handleDeleteThread}
                      onEditThread={handleEditThread}
                    />
                    {selectedThread ? (
                      <ThreadChat
                        thread={selectedThread}
                        messages={threadMessages}
                        onSendMessage={handleSendThreadMessage}
                      />
                    ) : (
                      <EmptyState message="Selecciona un thread" />
                    )}
                  </div>
                ) : (
                  <ChannelChat
                    channel={selectedChannel}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onDeleteMessage={handleDeleteMessage}
                    isAdmin
                  />
                )}
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

      <ConfirmationModal
        isOpen={!!messageToDelete}
        onClose={() => setMessageToDelete(null)}
        onConfirm={confirmDeleteMessage}
        title="Eliminar Mensaje"
        message="¿Estás seguro de que deseas eliminar este mensaje? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        loading={isDeleting}
      />

      <ConfirmationModal
        isOpen={!!threadToDelete}
        onClose={() => setThreadToDelete(null)}
        onConfirm={confirmDeleteThread}
        title="Eliminar Thread"
        message={`¿Estás seguro de que deseas eliminar el thread "${threadToDelete?.name}"? Se eliminarán todos los mensajes del thread. Esta acción no se puede deshacer.`}
        confirmText="Eliminar Thread"
        variant="danger"
        loading={isDeleting}
      />

      <SuccessModal
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        title={successMessage?.title || ''}
        message={successMessage?.message || ''}
      />

      {isCreateThreadModalOpen && selectedChannel && (
        <CreateThreadModal
          onClose={() => setIsCreateThreadModalOpen(false)}
          onCreate={handleCreateThread}
        />
      )}

      {threadToEdit && (
        <EditThreadModal
          thread={threadToEdit}
          onClose={() => setThreadToEdit(null)}
          onSave={handleSaveThreadEdit}
        />
      )}
    </Layout>
  );
}
