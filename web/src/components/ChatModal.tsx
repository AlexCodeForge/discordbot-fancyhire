import { useState, useEffect, useRef } from 'react';
import { Lead } from '../types/Lead';
import { api } from '../services/api';

interface ChatModalProps {
  lead: Lead;
  onClose: () => void;
}

interface Message {
  id: number;
  content: string;
  sender_type: 'admin' | 'user';
  sender_name?: string;
  sent_at: string;
  error?: string;
}

export function ChatModal({ lead, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [lead.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const data = await api.getMessages(lead.id);
      setMessages(data);
      await api.markMessagesRead(lead.id);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    if (newMessage.length > 2000) {
      alert('El mensaje no puede exceder 2000 caracteres (límite de Discord)');
      return;
    }

    setSending(true);
    try {
      await api.sendMessage(lead.id, newMessage, 'Admin');
      setNewMessage('');
      await loadMessages();
    } catch (error: any) {
      console.error('Error enviando mensaje:', error);
      alert(error.response?.data?.message || 'Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!lead.discord_id) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-[60] p-4" style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}>
        <div className="max-w-md w-full p-6" style={{ 
          backgroundColor: 'var(--bmw-surface-card)',
          borderRadius: '0',
          border: '1px solid var(--bmw-hairline)'
        }}>
          <div className="flex justify-between items-start mb-4">
            <h2 className="bmw-title-md">Conversar</h2>
            <button
              onClick={onClose}
              className="bmw-body-sm"
              style={{ 
                background: 'transparent',
                border: 'none',
                color: 'var(--bmw-muted)',
                fontSize: '32px',
                cursor: 'pointer',
                lineHeight: '1'
              }}
            >
              ×
            </button>
          </div>
          <p className="bmw-body-sm mb-4" style={{ color: 'var(--bmw-body)' }}>
            Este lead no tiene un Discord ID asociado. No es posible enviar mensajes directos.
          </p>
          <button
            onClick={onClose}
            className="bmw-btn-primary w-full"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60] p-4" style={{ 
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }}>
      <div className="max-w-4xl w-full h-[80vh] flex flex-col" style={{ 
        backgroundColor: 'var(--bmw-surface-card)',
        borderRadius: '0',
        border: '1px solid var(--bmw-hairline)'
      }}>
        <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--bmw-hairline)' }}>
          <div>
            <h2 className="bmw-title-md">Conversación con {lead.name}</h2>
            <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)' }}>{lead.discord_tag || lead.discord_id}</p>
          </div>
          <button
            onClick={onClose}
            className="bmw-body-sm"
            style={{ 
              background: 'transparent',
              border: 'none',
              color: 'var(--bmw-muted)',
              fontSize: '32px',
              cursor: 'pointer',
              lineHeight: '1'
            }}
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: 'var(--bmw-surface-soft)' }}>
          {messages.length === 0 ? (
            <div className="text-center bmw-body-sm mt-8" style={{ color: 'var(--bmw-muted)' }}>
              No hay mensajes todavía. Inicia la conversación.
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[70%] px-4 py-2"
                  style={{
                    borderRadius: '0',
                    backgroundColor: msg.sender_type === 'admin' ? 'var(--bmw-primary)' : 'var(--bmw-canvas)',
                    color: msg.sender_type === 'admin' ? 'var(--bmw-on-primary)' : 'var(--bmw-ink)',
                    border: msg.sender_type === 'admin' ? 'none' : '1px solid var(--bmw-hairline)',
                    boxShadow: msg.sender_type === 'admin' ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <div className="bmw-body-sm mb-1" style={{ 
                    fontWeight: 700,
                    color: msg.sender_type === 'admin' ? 'var(--bmw-on-primary)' : 'var(--bmw-ink)'
                  }}>
                    {msg.sender_name || (msg.sender_type === 'admin' ? 'Admin' : 'Usuario')}
                  </div>
                  <div className="bmw-body-sm whitespace-pre-wrap break-words">{msg.content}</div>
                  <div
                    className="bmw-body-sm mt-1"
                    style={{
                      fontSize: '12px',
                      color: msg.sender_type === 'admin' ? 'rgba(255, 255, 255, 0.7)' : 'var(--bmw-muted)'
                    }}
                  >
                    {new Date(msg.sent_at).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  {msg.error && (
                    <div className="bmw-body-sm mt-1 px-2 py-1" style={{ 
                      fontSize: '12px',
                      color: '#fca5a5',
                      backgroundColor: 'rgba(220, 38, 38, 0.3)',
                      borderRadius: '0'
                    }}>
                      Error: {msg.error}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4" style={{ 
          borderTop: '1px solid var(--bmw-hairline)',
          backgroundColor: 'var(--bmw-surface-card)'
        }}>
          <div className="flex gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
              className="bmw-input flex-1 resize-none"
              rows={3}
              disabled={sending}
              style={{ height: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !newMessage.trim()}
              className="bmw-btn-primary self-end"
              style={{ height: '48px', padding: '8px 24px' }}
            >
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
          <div className="bmw-body-sm mt-1" style={{ fontSize: '12px', color: 'var(--bmw-muted)' }}>
            {newMessage.length}/2000 caracteres
          </div>
        </div>
      </div>
    </div>
  );
}
