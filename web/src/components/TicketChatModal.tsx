import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

interface TicketChatModalProps {
  ticket: any;
  onClose: () => void;
  onTicketUpdated: () => void;
}

interface TicketMessage {
  id: number;
  ticket_id: number;
  discord_message_id: string;
  author_id: string;
  author_name: string;
  content: string;
  sent_at: string;
}

export function TicketChatModal({ ticket, onClose, onTicketUpdated }: TicketChatModalProps) {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [deleteChannel, setDeleteChannel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [ticket.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await api.getTicketMessages(ticket.id);
      setMessages(data);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    setClosing(true);
    try {
      const username = localStorage.getItem('username') || 'Admin';
      
      console.log('[DEBUG] Cerrando ticket con delete_channel:', deleteChannel);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/tickets/${ticket.id}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          closed_by: username,
          resolution_notes: resolutionNotes.trim() || undefined,
          delete_channel: Boolean(deleteChannel)
        })
      });

      if (!response.ok) {
        throw new Error('Error al cerrar ticket');
      }

      const result = await response.json();
      
      if (result.transcript_url) {
        const channelMsg = deleteChannel ? '\n\nEl canal de Discord ha sido eliminado.' : '';
        alert(`Ticket cerrado exitosamente.${channelMsg}\n\nTranscripción: ${window.location.origin}${result.transcript_url}`);
      }
      
      onTicketUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error cerrando ticket:', error);
      alert(error.message || 'Error al cerrar ticket');
    } finally {
      setClosing(false);
    }
  };

  const handleDeleteChannel = async () => {
    if (!confirm('¿Estás seguro de eliminar el canal de Discord? Esta acción no se puede deshacer.')) {
      return;
    }

    setDeleting(true);
    try {
      await api.deleteTicketChannel(ticket.id);
      alert('Canal eliminado exitosamente');
      onTicketUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error eliminando canal:', error);
      alert(error.message || 'Error al eliminar canal');
    } finally {
      setDeleting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/tickets/${ticket.id}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          content: newMessage,
          discord_channel_id: ticket.discord_channel_id
        })
      });

      if (!response.ok) {
        throw new Error('Error al enviar mensaje');
      }

      setNewMessage('');
      setTimeout(loadMessages, 1000);
    } catch (error: any) {
      console.error('Error enviando mensaje:', error);
      alert(error.message || 'Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'var(--bmw-success)';
      case 'closed':
        return 'var(--bmw-muted)';
      case 'archived':
        return 'var(--bmw-muted-soft)';
      default:
        return 'var(--bmw-body)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Abierto';
      case 'closed':
        return 'Cerrado';
      case 'archived':
        return 'Archivado';
      default:
        return status;
    }
  };

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center z-[70] p-4" style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.6)'
      }}>
        <div className="max-w-5xl w-full h-[85vh] flex flex-col" style={{ 
          backgroundColor: 'var(--bmw-surface-card)',
          borderRadius: '0',
          border: '2px solid var(--bmw-hairline-strong)'
        }}>
          <div className="p-4 flex justify-between items-center" style={{ 
            borderBottom: '2px solid var(--bmw-hairline)',
            backgroundColor: 'var(--bmw-primary)'
          }}>
            <div>
              <h2 className="bmw-title-lg" style={{ color: 'var(--bmw-on-primary)' }}>
                Ticket #{ticket.id}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span
                  className="bmw-caption px-2 py-1"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'var(--bmw-on-primary)',
                    borderRadius: '0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {getStatusLabel(ticket.status)}
                </span>
                <span className="bmw-body-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Canal: {ticket.discord_channel_id.slice(0, 8)}...
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bmw-body-sm"
              style={{ 
                background: 'transparent',
                border: 'none',
                color: 'var(--bmw-on-primary)',
                fontSize: '32px',
                cursor: 'pointer',
                lineHeight: '1'
              }}
            >
              ×
            </button>
          </div>

          <div className="px-4 py-3" style={{ 
            borderBottom: '1px solid var(--bmw-hairline)',
            backgroundColor: 'var(--bmw-surface-soft)'
          }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="bmw-label-uppercase" style={{ color: 'var(--bmw-muted)' }}>
                  Creado por
                </p>
                <p className="bmw-body-sm">{ticket.created_by}</p>
              </div>
              <div>
                <p className="bmw-label-uppercase" style={{ color: 'var(--bmw-muted)' }}>
                  Fecha de creación
                </p>
                <p className="bmw-body-sm">
                  {new Date(ticket.created_at).toLocaleString('es-ES')}
                </p>
              </div>
              {ticket.closed_at && (
                <>
                  <div>
                    <p className="bmw-label-uppercase" style={{ color: 'var(--bmw-muted)' }}>
                      Cerrado por
                    </p>
                    <p className="bmw-body-sm">{ticket.closed_by || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="bmw-label-uppercase" style={{ color: 'var(--bmw-muted)' }}>
                      Fecha de cierre
                    </p>
                    <p className="bmw-body-sm">
                      {new Date(ticket.closed_at).toLocaleString('es-ES')}
                    </p>
                  </div>
                </>
              )}
            </div>
            {ticket.resolution_notes && (
              <div className="mt-3">
                <p className="bmw-label-uppercase" style={{ color: 'var(--bmw-muted)' }}>
                  Notas de resolución
                </p>
                <p className="bmw-body-sm">{ticket.resolution_notes}</p>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: 'var(--bmw-canvas)' }}>
            {loading && messages.length === 0 ? (
              <div className="text-center bmw-body-sm mt-8" style={{ color: 'var(--bmw-muted)' }}>
                Cargando mensajes...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center bmw-body-sm mt-8" style={{ color: 'var(--bmw-muted)' }}>
                No hay mensajes en este ticket todavía.
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex justify-start">
                  <div
                    className="max-w-[80%] px-4 py-3"
                    style={{
                      borderRadius: '0',
                      backgroundColor: 'var(--bmw-surface-card)',
                      border: '1px solid var(--bmw-hairline)',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <div className="bmw-body-sm mb-1" style={{ 
                      fontWeight: 700,
                      color: 'var(--bmw-primary)'
                    }}>
                      {msg.author_name}
                    </div>
                    <div className="bmw-body-sm whitespace-pre-wrap break-words mb-1" style={{ 
                      color: 'var(--bmw-ink)'
                    }}>
                      {msg.content}
                    </div>
                    <div className="bmw-caption" style={{ color: 'var(--bmw-muted)' }}>
                      {new Date(msg.sent_at).toLocaleString('es-ES', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {ticket.status === 'open' && (
            <div className="p-4" style={{ 
              borderTop: '2px solid var(--bmw-hairline)',
              backgroundColor: 'var(--bmw-surface-card)'
            }}>
              <div className="flex gap-2 mb-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Escribe un mensaje... (Enter para enviar)"
                  className="bmw-input flex-1 resize-none"
                  rows={2}
                  disabled={sending}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="bmw-btn-primary self-end"
                  style={{ height: '48px', padding: '8px 24px' }}
                >
                  {sending ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
              <button
                onClick={() => setShowCloseDialog(true)}
                className="bmw-btn-secondary w-full"
              >
                Cerrar Ticket
              </button>
            </div>
          )}

          {ticket.status !== 'open' && (
            <div className="p-4 space-y-3" style={{ 
              borderTop: '2px solid var(--bmw-hairline)',
              backgroundColor: 'var(--bmw-surface-soft)'
            }}>
              <p className="bmw-body-sm text-center" style={{ color: 'var(--bmw-muted)' }}>
                Este ticket está cerrado. Los nuevos mensajes solo pueden enviarse en tickets abiertos.
              </p>
              <button
                onClick={handleDeleteChannel}
                disabled={deleting}
                className="bmw-btn-secondary w-full"
                style={{ 
                  backgroundColor: 'var(--bmw-error)',
                  color: 'white',
                  border: 'none'
                }}
              >
                {deleting ? 'Eliminando...' : 'Eliminar Canal de Discord'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showCloseDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-[80] p-4" style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.7)'
        }}>
          <div className="max-w-md w-full p-6" style={{ 
            backgroundColor: 'var(--bmw-surface-card)',
            borderRadius: '0',
            border: '2px solid var(--bmw-hairline-strong)'
          }}>
            <h3 className="bmw-title-md mb-4">Cerrar Ticket</h3>
            <p className="bmw-body-sm mb-4" style={{ color: 'var(--bmw-body)' }}>
              ¿Estás seguro de cerrar este ticket? Se generará una transcripción PDF automáticamente.
            </p>
            <div className="mb-4">
              <label className="bmw-label-uppercase mb-2 block" style={{ color: 'var(--bmw-body)' }}>
                Notas de resolución (opcional)
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe cómo se resolvió el ticket..."
                className="bmw-input w-full resize-none"
                rows={4}
              />
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteChannel}
                  onChange={(e) => setDeleteChannel(e.target.checked)}
                  className="w-4 h-4"
                  style={{ accentColor: 'var(--bmw-primary)' }}
                />
                <span className="bmw-body-sm" style={{ color: 'var(--bmw-body)' }}>
                  Eliminar el canal de Discord
                </span>
              </label>
              {deleteChannel && (
                <p className="bmw-caption mt-1 ml-6" style={{ color: 'var(--bmw-error)' }}>
                  El canal será eliminado permanentemente de Discord
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCloseDialog(false)}
                className="bmw-btn-secondary flex-1"
                disabled={closing}
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseTicket}
                className="bmw-btn-primary flex-1"
                disabled={closing}
              >
                {closing ? 'Cerrando...' : 'Cerrar Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
