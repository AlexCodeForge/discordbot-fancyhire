import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';

interface TicketsPanelProps {
  leadId: number;
  onTicketSelect: (ticket: any) => void;
}

export function TicketsPanel({ leadId, onTicketSelect }: TicketsPanelProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [channelExistence, setChannelExistence] = useState<Record<number, boolean>>({});
  const [successMessage, setSuccessMessage] = useState<{
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    loadTickets();
  }, [leadId]);

  useEffect(() => {
    console.log('[TicketsPanel] successMessage changed:', successMessage);
  }, [successMessage]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await api.getTickets(leadId);
      setTickets(data);

      // Verificar existencia de canales para tickets cerrados
      const closedTickets = data.filter((t: any) => t.status !== 'open');
      const existenceMap: Record<number, boolean> = {};
      
      await Promise.all(
        closedTickets.map(async (ticket: any) => {
          try {
            const exists = await api.checkTicketChannelExists(ticket.id);
            existenceMap[ticket.id] = exists;
          } catch (error) {
            console.error(`Error checking channel for ticket ${ticket.id}:`, error);
            existenceMap[ticket.id] = false;
          }
        })
      );
      
      setChannelExistence(existenceMap);
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
      console.log('[TicketsPanel] Setting success message...');
      setSuccessMessage({
        title: 'Ticket Creado',
        message: 'El ticket ha sido creado correctamente',
      });
      console.log('[TicketsPanel] Success message set');
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
    <>
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
                  {channelExistence[ticket.id] === false && (
                    <p className="bmw-caption mt-1 flex items-center gap-1" style={{ color: 'var(--bmw-error)' }}>
                      <span style={{ fontSize: '14px' }}>🗑️</span>
                      Canal eliminado
                    </p>
                  )}
                  {channelExistence[ticket.id] === true && (
                    <p className="bmw-caption mt-1 flex items-center gap-1" style={{ color: 'var(--bmw-success)' }}>
                      <span style={{ fontSize: '14px' }}>✓</span>
                      Canal activo
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>

    {successMessage && (
      <>
        {console.log('[TicketsPanel] Rendering portal with message:', successMessage)}
        {createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 9999,
            }}
            onClick={() => {
              console.log('[TicketsPanel] Closing modal');
              setSuccessMessage(null);
            }}
          >
            <div
              className="bmw-card"
              style={{
                width: '520px',
                maxWidth: '90vw',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '24px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: '0',
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ color: 'var(--bmw-success)' }}
                  >
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div style={{ flex: 1 }}>
                  <h2
                    className="bmw-title-lg"
                    style={{
                      color: 'var(--bmw-ink)',
                      marginBottom: '8px',
                    }}
                  >
                    {successMessage.title}
                  </h2>
                  <p
                    className="bmw-body-md"
                    style={{
                      color: 'var(--bmw-body)',
                      lineHeight: '1.5',
                    }}
                  >
                    {successMessage.message}
                  </p>
                </div>
              </div>

              <div
                style={{
                  padding: '24px',
                  paddingTop: '0',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    console.log('[TicketsPanel] Button clicked, closing modal');
                    setSuccessMessage(null);
                  }}
                  className="bmw-btn-primary"
                  style={{
                    minWidth: '140px',
                  }}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    )}
    </>
  );
}
