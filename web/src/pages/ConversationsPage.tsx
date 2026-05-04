import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/ui/Layout';
import { ConversationFilters } from '../components/conversations/ConversationFilters';
import { ConversationList } from '../components/conversations/ConversationList';
import { ChatModal } from '../components/leads/ChatModal';
import { Conversation, ConversationFilters as Filters } from '../types/Conversation';
import { Lead } from '../types/Lead';
import { api } from '../services/api';

export function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filters, setFilters] = useState<Filters>({
    sortBy: 'last_message',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await api.getConversations(filters);
      setConversations(data);
      setFilteredConversations(data);
      setError(null);
    } catch (err) {
      console.error('Error cargando conversaciones:', err);
      setError('Error al cargar las conversaciones');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadConversations]);

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setLoading(true);
  };

  const handleConversationClick = (conversation: Conversation) => {
    const lead: Lead = {
      id: conversation.lead.id,
      name: conversation.lead.name,
      discord_id: conversation.lead.discord_id,
      discord_tag: conversation.lead.discord_tag,
      contact_discord: conversation.lead.email || conversation.lead.contact_discord || '',
      stage: conversation.lead.stage,
      source: conversation.lead.source || 'auto',
      display_order: conversation.lead.display_order || 0,
      created_at: conversation.lead.created_at || new Date().toISOString(),
      updated_at: conversation.lead.updated_at || new Date().toISOString(),
      service_interest: conversation.lead.service_interest,
      assigned_to: conversation.lead.assigned_to,
      notes: conversation.lead.notes,
      unread_count: conversation.lead.unread_count,
      has_open_ticket: conversation.lead.has_open_ticket,
    };
    setSelectedLead(lead);
  };

  const handleCloseModal = () => {
    setSelectedLead(null);
    loadConversations();
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <Layout>
      <div style={{ padding: '32px' }}>
        <div className="max-w-screen-xl mx-auto">
          <div style={{ marginBottom: '24px' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)', fontSize: '12px' }}>
                  {conversations.length} conversaciones
                  {totalUnread > 0 && (
                    <span style={{ color: 'var(--bmw-primary)', marginLeft: '8px' }}>
                      · {totalUnread} no leída{totalUnread !== 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <ConversationFilters 
            filters={filters} 
            onFiltersChange={handleFiltersChange} 
          />

          {loading && conversations.length === 0 ? (
            <div className="text-center py-12">
              <div className="bmw-body-sm" style={{ color: 'var(--bmw-body)' }}>
                Cargando conversaciones...
              </div>
            </div>
          ) : error ? (
            <div
              className="p-6 text-center"
              style={{
                backgroundColor: 'var(--bmw-surface-card)',
                border: '1px solid var(--bmw-error)',
                borderRadius: '0',
              }}
            >
              <p className="bmw-body-sm" style={{ color: 'var(--bmw-error)' }}>
                {error}
              </p>
              <button
                onClick={() => {
                  setLoading(true);
                  loadConversations();
                }}
                className="bmw-btn-primary mt-4"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <ConversationList
              conversations={filteredConversations}
              onConversationClick={handleConversationClick}
            />
          )}
        </div>
      </div>

      {selectedLead && (
        <ChatModal
          lead={selectedLead}
          onClose={handleCloseModal}
        />
      )}
    </Layout>
  );
}
