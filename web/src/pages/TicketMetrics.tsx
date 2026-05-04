import { useState, useEffect } from 'react';
import { Layout } from '../components/ui/Layout';
import { api } from '../services/api';
import { TicketChatModal } from '../components/tickets/modals/TicketChatModal';

interface Ticket {
  id: number;
  lead_id: number;
  discord_channel_id: string;
  status: 'open' | 'closed' | 'archived';
  created_by: string;
  closed_by?: string;
  created_at: string;
  closed_at?: string;
  resolution_notes?: string;
  lead?: {
    id: number;
    name: string;
    discord_tag?: string;
    stage: string;
  };
}

export function TicketMetrics() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'list'>('metrics');
  const [metrics, setMetrics] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [channelExistence, setChannelExistence] = useState<Record<number, boolean>>({});
  
  // Filtros
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLeadId, setFilterLeadId] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const [metricsData, leadsData] = await Promise.all([
        api.getTicketMetrics(),
        api.getAllLeads()
      ]);
      setMetrics(metricsData);
      setLeads(leadsData.filter((l: any) => l.discord_id));
      
      const ticketPromises = leadsData.map(lead => 
        api.getTickets(lead.id)
          .then(leadTickets => leadTickets.map((t: any) => ({
            ...t,
            lead: {
              id: lead.id,
              name: lead.name,
              discord_tag: lead.discord_tag,
              stage: lead.stage
            }
          })))
          .catch(err => {
            console.error(`Error loading tickets for lead ${lead.id}:`, err);
            return [];
          })
      );
      
      const ticketArrays = await Promise.all(ticketPromises);
      const allTickets = ticketArrays.flat();
      const sortedTickets = allTickets.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTickets(sortedTickets);

      // Verificar existencia de canales para tickets cerrados
      const closedTickets = sortedTickets.filter(t => t.status !== 'open');
      const existenceMap: Record<number, boolean> = {};
      
      await Promise.all(
        closedTickets.map(async (ticket) => {
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
    } catch (error: any) {
      console.error('Error cargando datos:', error);
      setError(error.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!selectedLeadId) return;
    
    setCreating(true);
    try {
      const username = localStorage.getItem('username') || 'Admin';
      await api.createTicket(selectedLeadId, username);
      setShowCreateModal(false);
      setSelectedLeadId(null);
      await loadData();
    } catch (error: any) {
      console.error('Error creando ticket:', error);
      alert(error.message || 'Error al crear ticket');
    } finally {
      setCreating(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterLeadId !== 'all' && t.lead_id !== Number(filterLeadId)) return false;
    
    if (filterDateFrom) {
      const ticketDate = new Date(t.created_at);
      const fromDate = new Date(filterDateFrom);
      if (ticketDate < fromDate) return false;
    }
    
    if (filterDateTo) {
      const ticketDate = new Date(t.created_at);
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      if (ticketDate > toDate) return false;
    }
    
    if (searchText) {
      const search = searchText.toLowerCase();
      const matchesId = t.id.toString().includes(search);
      const matchesLead = t.lead?.name.toLowerCase().includes(search);
      const matchesCreatedBy = t.created_by.toLowerCase().includes(search);
      if (!matchesId && !matchesLead && !matchesCreatedBy) return false;
    }
    
    return true;
  });

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'var(--bmw-success)';
      case 'closed': return 'var(--bmw-muted)';
      case 'archived': return 'var(--bmw-muted-soft)';
      default: return 'var(--bmw-body)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Abierto';
      case 'closed': return 'Cerrado';
      case 'archived': return 'Archivado';
      default: return status;
    }
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterLeadId('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchText('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="bmw-body-md" style={{ color: 'var(--bmw-muted)' }}>
            Cargando métricas...
          </p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <div className="p-4" style={{ 
            backgroundColor: 'var(--bmw-error)',
            color: 'var(--bmw-on-primary)',
            borderRadius: '0',
            border: '1px solid var(--bmw-hairline)'
          }}>
            <p className="bmw-body-md">Error: {error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {selectedTicket && (
        <TicketChatModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onTicketUpdated={() => {
            setSelectedTicket(null);
            loadData();
          }}
        />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] p-4" style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.6)'
        }}>
          <div className="max-w-md w-full p-6" style={{ 
            backgroundColor: 'var(--bmw-surface-card)',
            borderRadius: '0',
            border: '2px solid var(--bmw-hairline-strong)'
          }}>
            <h3 className="bmw-title-md mb-4">Crear Nuevo Ticket</h3>
            <div className="mb-4">
              <label className="bmw-label-uppercase mb-2 block" style={{ color: 'var(--bmw-body)' }}>
                Seleccionar Lead
              </label>
              <select
                value={selectedLeadId || ''}
                onChange={(e) => setSelectedLeadId(Number(e.target.value))}
                className="bmw-input w-full"
              >
                <option value="">Selecciona un lead...</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} ({lead.discord_tag || lead.contact_discord})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedLeadId(null);
                }}
                className="bmw-btn-secondary flex-1"
                disabled={creating}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTicket}
                className="bmw-btn-primary flex-1"
                disabled={!selectedLeadId || creating}
              >
                {creating ? 'Creando...' : 'Crear Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="bmw-display-md" style={{ color: 'var(--bmw-ink)' }}>
              Tickets
            </h1>
            <p className="bmw-body-sm mt-2" style={{ color: 'var(--bmw-muted)' }}>
              Estadísticas y análisis del sistema de tickets
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bmw-btn-primary"
          >
            Crear Ticket
          </button>
        </div>

        <div className="mb-6 flex gap-2" style={{ borderBottom: '2px solid var(--bmw-hairline)' }}>
          <button
            onClick={() => setActiveTab('metrics')}
            className="bmw-body-md px-6 py-3"
            style={{
              backgroundColor: activeTab === 'metrics' ? 'var(--bmw-primary)' : 'transparent',
              color: activeTab === 'metrics' ? 'var(--bmw-on-primary)' : 'var(--bmw-ink)',
              border: 'none',
              borderBottom: activeTab === 'metrics' ? '3px solid var(--bmw-primary)' : 'none',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Métricas
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className="bmw-body-md px-6 py-3"
            style={{
              backgroundColor: activeTab === 'list' ? 'var(--bmw-primary)' : 'transparent',
              color: activeTab === 'list' ? 'var(--bmw-on-primary)' : 'var(--bmw-ink)',
              border: 'none',
              borderBottom: activeTab === 'list' ? '3px solid var(--bmw-primary)' : 'none',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Listado ({tickets.length})
          </button>
        </div>

        {activeTab === 'metrics' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-6" style={{ 
                backgroundColor: 'var(--bmw-surface-card)',
                border: '1px solid var(--bmw-hairline)',
                borderRadius: '0'
              }}>
                <p className="bmw-label-uppercase mb-2" style={{ color: 'var(--bmw-muted)' }}>
                  Total de Tickets
                </p>
                <p className="bmw-display-sm" style={{ color: 'var(--bmw-primary)' }}>
                  {metrics?.total_tickets || 0}
                </p>
              </div>

              <div className="p-6" style={{ 
                backgroundColor: 'var(--bmw-surface-card)',
                border: '1px solid var(--bmw-hairline)',
                borderRadius: '0'
              }}>
                <p className="bmw-label-uppercase mb-2" style={{ color: 'var(--bmw-muted)' }}>
                  Tickets Abiertos
                </p>
                <p className="bmw-display-sm" style={{ color: 'var(--bmw-success)' }}>
                  {metrics?.open_tickets || 0}
                </p>
              </div>

              <div className="p-6" style={{ 
                backgroundColor: 'var(--bmw-surface-card)',
                border: '1px solid var(--bmw-hairline)',
                borderRadius: '0'
              }}>
                <p className="bmw-label-uppercase mb-2" style={{ color: 'var(--bmw-muted)' }}>
                  Tickets Cerrados
                </p>
                <p className="bmw-display-sm" style={{ color: 'var(--bmw-body)' }}>
                  {metrics?.closed_tickets || 0}
                </p>
              </div>

              <div className="p-6" style={{ 
                backgroundColor: 'var(--bmw-surface-card)',
                border: '1px solid var(--bmw-hairline)',
                borderRadius: '0'
              }}>
                <p className="bmw-label-uppercase mb-2" style={{ color: 'var(--bmw-muted)' }}>
                  Tiempo Promedio de Resolución
                </p>
                <p className="bmw-display-sm" style={{ color: 'var(--bmw-primary)' }}>
                  {metrics?.avg_resolution_minutes 
                    ? `${Math.round(metrics.avg_resolution_minutes)} min`
                    : 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6" style={{ 
                backgroundColor: 'var(--bmw-surface-card)',
                border: '1px solid var(--bmw-hairline)',
                borderRadius: '0'
              }}>
                <h2 className="bmw-title-md mb-4" style={{ color: 'var(--bmw-ink)' }}>
                  Distribución por Estado
                </h2>
                {metrics?.tickets_by_status && metrics.tickets_by_status.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.tickets_by_status.map((item: any) => (
                      <div key={item.status}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="bmw-body-sm" style={{ 
                            textTransform: 'capitalize',
                            color: 'var(--bmw-body)'
                          }}>
                            {item.status === 'open' ? 'Abiertos' : 
                             item.status === 'closed' ? 'Cerrados' : 
                             item.status === 'archived' ? 'Archivados' : item.status}
                          </span>
                          <span className="bmw-body-sm" style={{ 
                            fontWeight: 700,
                            color: 'var(--bmw-ink)'
                          }}>
                            {item.count}
                          </span>
                        </div>
                        <div style={{ 
                          width: '100%',
                          height: '8px',
                          backgroundColor: 'var(--bmw-surface-strong)',
                          borderRadius: '0',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${(item.count / (metrics?.total_tickets || 1)) * 100}%`,
                            height: '100%',
                            backgroundColor: 
                              item.status === 'open' ? 'var(--bmw-success)' :
                              item.status === 'closed' ? 'var(--bmw-primary)' :
                              'var(--bmw-muted)',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="bmw-body-sm text-center py-8" style={{ color: 'var(--bmw-muted)' }}>
                    No hay datos disponibles
                  </p>
                )}
              </div>

              <div className="p-6" style={{ 
                backgroundColor: 'var(--bmw-surface-card)',
                border: '1px solid var(--bmw-hairline)',
                borderRadius: '0'
              }}>
                <h2 className="bmw-title-md mb-4" style={{ color: 'var(--bmw-ink)' }}>
                  Estadísticas Adicionales
                </h2>
                <div className="space-y-4">
                  <div className="p-4" style={{ 
                    backgroundColor: 'var(--bmw-surface-soft)',
                    border: '1px solid var(--bmw-hairline)',
                    borderRadius: '0'
                  }}>
                    <p className="bmw-label-uppercase mb-1" style={{ color: 'var(--bmw-muted)' }}>
                      Tasa de Cierre
                    </p>
                    <p className="bmw-title-lg" style={{ color: 'var(--bmw-ink)' }}>
                      {metrics?.total_tickets > 0
                        ? `${Math.round((metrics.closed_tickets / metrics.total_tickets) * 100)}%`
                        : '0%'}
                    </p>
                  </div>

                  <div className="p-4" style={{ 
                    backgroundColor: 'var(--bmw-surface-soft)',
                    border: '1px solid var(--bmw-hairline)',
                    borderRadius: '0'
                  }}>
                    <p className="bmw-label-uppercase mb-1" style={{ color: 'var(--bmw-muted)' }}>
                      Tickets Archivados
                    </p>
                    <p className="bmw-title-lg" style={{ color: 'var(--bmw-ink)' }}>
                      {metrics?.archived_tickets || 0}
                    </p>
                  </div>

                  <div className="p-4" style={{ 
                    backgroundColor: 'var(--bmw-surface-soft)',
                    border: '1px solid var(--bmw-hairline)',
                    borderRadius: '0'
                  }}>
                    <p className="bmw-label-uppercase mb-1" style={{ color: 'var(--bmw-muted)' }}>
                      Estado del Sistema
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div style={{ 
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: metrics?.open_tickets > 0 ? 'var(--bmw-success)' : 'var(--bmw-muted)'
                      }} />
                      <span className="bmw-body-sm" style={{ color: 'var(--bmw-body)' }}>
                        {metrics?.open_tickets > 0 ? 'Tickets activos' : 'Sin tickets activos'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'list' && (
          <>
            <div className="mb-6 p-6" style={{ 
              backgroundColor: 'var(--bmw-surface-card)',
              border: '1px solid var(--bmw-hairline)',
              borderRadius: '0'
            }}>
              <h2 className="bmw-title-md mb-4" style={{ color: 'var(--bmw-ink)' }}>
                Filtros
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <div>
                  <label className="bmw-label-uppercase mb-2 block" style={{ color: 'var(--bmw-muted)' }}>
                    Buscar
                  </label>
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => {
                      setSearchText(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="ID, cliente, creador..."
                    className="bmw-input w-full"
                  />
                </div>

                <div>
                  <label className="bmw-label-uppercase mb-2 block" style={{ color: 'var(--bmw-muted)' }}>
                    Estado
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bmw-input w-full"
                  >
                    <option value="all">Todos</option>
                    <option value="open">Abiertos</option>
                    <option value="closed">Cerrados</option>
                    <option value="archived">Archivados</option>
                  </select>
                </div>

                <div>
                  <label className="bmw-label-uppercase mb-2 block" style={{ color: 'var(--bmw-muted)' }}>
                    Cliente
                  </label>
                  <select
                    value={filterLeadId}
                    onChange={(e) => {
                      setFilterLeadId(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bmw-input w-full"
                  >
                    <option value="all">Todos los clientes</option>
                    {leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="bmw-label-uppercase mb-2 block" style={{ color: 'var(--bmw-muted)' }}>
                    Desde
                  </label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => {
                      setFilterDateFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bmw-input w-full"
                  />
                </div>

                <div>
                  <label className="bmw-label-uppercase mb-2 block" style={{ color: 'var(--bmw-muted)' }}>
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => {
                      setFilterDateTo(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bmw-input w-full"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)' }}>
                  Mostrando {paginatedTickets.length} de {filteredTickets.length} tickets
                </p>
                <button
                  onClick={clearFilters}
                  className="bmw-btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>

            <div className="mb-6 p-6" style={{ 
              backgroundColor: 'var(--bmw-surface-card)',
              border: '1px solid var(--bmw-hairline)',
              borderRadius: '0'
            }}>
              {filteredTickets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="bmw-body-md" style={{ color: 'var(--bmw-muted)' }}>
                    No se encontraron tickets con los filtros seleccionados
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {paginatedTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className="p-4 cursor-pointer transition-colors"
                        style={{
                          backgroundColor: 'var(--bmw-surface-soft)',
                          border: '1px solid var(--bmw-hairline)',
                          borderRadius: '0'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bmw-surface-strong)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bmw-surface-soft)';
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
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
                            {ticket.lead && (
                              <div className="mb-2">
                                <p className="bmw-body-sm" style={{ color: 'var(--bmw-ink)' }}>
                                  <strong>Cliente:</strong> {ticket.lead.name}
                                </p>
                                {ticket.lead.discord_tag && (
                                  <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)', fontSize: '12px' }}>
                                    {ticket.lead.discord_tag}
                                  </p>
                                )}
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="bmw-caption" style={{ color: 'var(--bmw-muted)' }}>
                                  Creado por
                                </p>
                                <p className="bmw-body-sm">{ticket.created_by}</p>
                              </div>
                              <div>
                                <p className="bmw-caption" style={{ color: 'var(--bmw-muted)' }}>
                                  Fecha
                                </p>
                                <p className="bmw-body-sm">
                                  {new Date(ticket.created_at).toLocaleString('es-ES', {
                                    dateStyle: 'short',
                                    timeStyle: 'short'
                                  })}
                                </p>
                              </div>
                            </div>
                            {ticket.closed_at && (
                              <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--bmw-hairline)' }}>
                                <p className="bmw-caption" style={{ color: 'var(--bmw-muted)' }}>
                                  Cerrado: {new Date(ticket.closed_at).toLocaleString('es-ES', {
                                    dateStyle: 'short',
                                    timeStyle: 'short'
                                  })}
                                  {ticket.closed_by && ` por ${ticket.closed_by}`}
                                </p>
                                {channelExistence[ticket.id] === false && (
                                  <p className="bmw-caption mt-1 flex items-center gap-1" style={{ color: 'var(--bmw-error)' }}>
                                    <span style={{ fontSize: '14px' }}>🗑️</span>
                                    Canal de Discord eliminado
                                  </p>
                                )}
                                {channelExistence[ticket.id] === true && (
                                  <p className="bmw-caption mt-1 flex items-center gap-1" style={{ color: 'var(--bmw-success)' }}>
                                    <span style={{ fontSize: '14px' }}>✓</span>
                                    Canal de Discord activo
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-6 flex justify-center items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="bmw-btn-secondary"
                        style={{ 
                          padding: '8px 16px',
                          opacity: currentPage === 1 ? 0.5 : 1,
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Anterior
                      </button>
                      
                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            if (totalPages <= 7) return true;
                            if (page === 1 || page === totalPages) return true;
                            if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                            return false;
                          })
                          .map((page, idx, arr) => {
                            if (idx > 0 && arr[idx - 1] !== page - 1) {
                              return (
                                <span key={`ellipsis-${page}`}>
                                  <span className="px-3 py-2 bmw-body-sm">...</span>
                                  <button
                                    onClick={() => setCurrentPage(page)}
                                    className="bmw-body-sm px-3 py-2"
                                    style={{
                                      backgroundColor: currentPage === page ? 'var(--bmw-primary)' : 'transparent',
                                      color: currentPage === page ? 'var(--bmw-on-primary)' : 'var(--bmw-ink)',
                                      border: '1px solid var(--bmw-hairline)',
                                      borderRadius: '0',
                                      cursor: 'pointer',
                                      minWidth: '40px'
                                    }}
                                  >
                                    {page}
                                  </button>
                                </span>
                              );
                            }
                            
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className="bmw-body-sm px-3 py-2"
                                style={{
                                  backgroundColor: currentPage === page ? 'var(--bmw-primary)' : 'transparent',
                                  color: currentPage === page ? 'var(--bmw-on-primary)' : 'var(--bmw-ink)',
                                  border: '1px solid var(--bmw-hairline)',
                                  borderRadius: '0',
                                  cursor: 'pointer',
                                  minWidth: '40px'
                                }}
                              >
                                {page}
                              </button>
                            );
                          })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="bmw-btn-secondary"
                        style={{ 
                          padding: '8px 16px',
                          opacity: currentPage === totalPages ? 0.5 : 1,
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Siguiente
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        <div className="mt-6 p-4" style={{ 
          backgroundColor: 'var(--bmw-surface-soft)',
          border: '1px solid var(--bmw-hairline)',
          borderRadius: '0'
        }}>
          <p className="bmw-caption" style={{ color: 'var(--bmw-muted)', textAlign: 'center' }}>
            Última actualización: {new Date().toLocaleString('es-ES')} · Las métricas se actualizan cada 30 segundos
          </p>
        </div>
      </div>
    </Layout>
  );
}
