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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-900">Conversar</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mb-4">
            Este lead no tiene un Discord ID asociado. No es posible enviar mensajes directos.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Conversación con {lead.name}</h2>
            <p className="text-sm text-gray-500">{lead.discord_tag || lead.discord_id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              No hay mensajes todavía. Inicia la conversación.
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    msg.sender_type === 'admin'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {msg.sender_name || (msg.sender_type === 'admin' ? 'Admin' : 'Usuario')}
                  </div>
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      msg.sender_type === 'admin' ? 'text-blue-100' : 'text-gray-400'
                    }`}
                  >
                    {new Date(msg.sent_at).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  {msg.error && (
                    <div className="text-xs mt-1 text-red-300 bg-red-900 bg-opacity-30 rounded px-2 py-1">
                      Error: {msg.error}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={sending || !newMessage.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed self-end"
            >
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {newMessage.length}/2000 caracteres
          </div>
        </div>
      </div>
    </div>
  );
}
