import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface TicketsPanelProps {
  leadId: number;
  onTicketSelect: (ticket: any) => void;
}

export function TicketsPanel({ leadId, onTicketSelect }: TicketsPanelProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [leadId]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await api.getTickets(leadId);
      setTickets(data);
    } catch (error) {
      console.error('Error cargando tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    setCreating(true);
    try {
      const username = localStorage.getItem('username') || 'Admin';
      await api.createTicket(leadId, username);
      await loadTickets();
    } catch (error: any) {
      console.error('Error creando ticket:', error);
      alert(error.message || 'Error al crear ticket');
    } finally {
      setCreating(false);
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

  const openTickets = tickets.filter(t => t.status === 'open');
  const closedTickets = tickets.filter(t => t.status === 'closed' || t.status === 'archived');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)' }}>Cargando tickets...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="bmw-title-sm">Tickets de Soporte</h3>
        {openTickets.length === 0 && (
          <button
            onClick={handleCreateTicket}
            disabled={creating}
            className="bmw-btn-primary"
          >
            {creating ? 'Creando...' : 'Abrir Ticket'}
          </button>
        )}
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-8 px-4" style={{
          backgroundColor: 'var(--bmw-surface-soft)',
          border: '1px solid var(--bmw-hairline)',
          borderRadius: '0'
        }}>
          <p className="bmw-body-md mb-2" style={{ color: 'var(--bmw-body)' }}>
            No hay tickets creados
          </p>
          <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)' }}>
            Los tickets permiten conversaciones estructuradas en canales privados de Discord
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {openTickets.length > 0 && (
            <div>
              <p className="bmw-label-uppercase mb-2" style={{ color: 'var(--bmw-muted)' }}>
                Tickets Abiertos
              </p>
              {openTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => onTicketSelect(ticket)}
                  className="p-4 mb-2 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: 'var(--bmw-surface-card)',
                    border: '1px solid var(--bmw-hairline)',
                    borderRadius: '0'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bmw-surface-strong)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bmw-surface-card)';
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="bmw-title-sm">Ticket #{ticket.id}</span>
                    <span
                      className="bmw-caption px-2 py-1"
                      style={{
                        backgroundColor: getStatusColor(ticket.status),
                        color: 'var(--bmw-on-primary)',
                        borderRadius: '0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {getStatusLabel(ticket.status)}
                    </span>
                  </div>
                  <p className="bmw-body-sm mb-1" style={{ color: 'var(--bmw-body)' }}>
                    Creado por: {ticket.created_by}
                  </p>
                  <p className="bmw-caption" style={{ color: 'var(--bmw-muted)' }}>
                    {new Date(ticket.created_at).toLocaleString('es-ES')}
                  </p>
                </div>
              ))}
            </div>
          )}

          {closedTickets.length > 0 && (
            <div>
              <p className="bmw-label-uppercase mb-2" style={{ color: 'var(--bmw-muted)' }}>
                Historial
              </p>
              {closedTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => onTicketSelect(ticket)}
                  className="p-4 mb-2 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: 'var(--bmw-surface-soft)',
                    border: '1px solid var(--bmw-hairline)',
                    borderRadius: '0',
                    opacity: 0.8
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="bmw-title-sm">Ticket #{ticket.id}</span>
                    <span
                      className="bmw-caption px-2 py-1"
                      style={{
                        backgroundColor: getStatusColor(ticket.status),
                        color: 'var(--bmw-on-primary)',
                        borderRadius: '0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {getStatusLabel(ticket.status)}
                    </span>
                  </div>
                  <p className="bmw-body-sm mb-1" style={{ color: 'var(--bmw-body)' }}>
                    {ticket.closed_by && `Cerrado por: ${ticket.closed_by}`}
                  </p>
                  <p className="bmw-caption" style={{ color: 'var(--bmw-muted)' }}>
                    {ticket.closed_at ? new Date(ticket.closed_at).toLocaleString('es-ES') : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
