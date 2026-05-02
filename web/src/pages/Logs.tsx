import { useState, useEffect } from 'react';
import { logsApi, SystemLog, LogStats } from '../services/logs';
import { Layout } from '../components/ui/Layout';
import { ConfirmationModal } from '../components/ui/modals/ConfirmationModal';
import { SuccessModal } from '../components/ui/modals/SuccessModal';

const LEVELS = ['error', 'warning', 'info', 'debug'] as const;
const LEVEL_COLORS = {
  error: { bg: 'var(--bmw-surface-soft)', text: 'var(--bmw-error)', border: 'var(--bmw-error)' },
  warning: { bg: 'var(--bmw-surface-soft)', text: 'var(--bmw-warning)', border: 'var(--bmw-warning)' },
  info: { bg: 'var(--bmw-surface-soft)', text: 'var(--bmw-primary)', border: 'var(--bmw-primary)' },
  debug: { bg: 'var(--bmw-surface-soft)', text: 'var(--bmw-body)', border: 'var(--bmw-hairline-strong)' }
};

export function Logs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{
    title: string;
    message: string;
    details?: Array<{ label: string; value: string }>;
  } | null>(null);
  const limit = 50;

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [selectedLevel, currentPage]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await logsApi.getLogs({
        level: selectedLevel || undefined,
        limit,
        offset: (currentPage - 1) * limit
      });
      setLogs(response.logs);
      setTotal(response.total);
    } catch (error) {
      console.error('Error cargando logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await logsApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleCleanupClick = () => {
    setShowCleanupConfirm(true);
  };

  const handleCleanupConfirm = async () => {
    try {
      setCleaning(true);
      const result = await logsApi.cleanup();
      setSuccessMessage({
        title: 'Logs Limpiados',
        message: 'Los logs antiguos han sido eliminados correctamente',
        details: [
          { label: 'Logs eliminados', value: result.deleted.toString() },
          { label: 'Retención', value: `${result.retentionDays} días` }
        ]
      });
      loadLogs();
      loadStats();
      setShowCleanupConfirm(false);
    } catch (error) {
      console.error('Error limpiando logs:', error);
      alert('Error al limpiar logs');
    } finally {
      setCleaning(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Layout>
      <div style={{ padding: '32px' }}>
        <div className="max-w-screen-2xl mx-auto">
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)', fontSize: '12px' }}>
                Total: {total} logs
              </p>
            </div>
            <button
              onClick={handleCleanupClick}
              className="bmw-btn-secondary"
              style={{ 
                backgroundColor: 'transparent',
                color: 'var(--bmw-error)',
                borderColor: 'var(--bmw-error)'
              }}
            >
              Limpiar Logs Antiguos
            </button>
          </div>

          {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            {stats.byLevel.map((stat) => {
              const colors = LEVEL_COLORS[stat.level as keyof typeof LEVEL_COLORS];
              return (
                <div
                  key={stat.level}
                  className="p-4"
                  style={{ 
                    backgroundColor: colors.bg,
                    border: `2px solid ${colors.border}`,
                    borderRadius: '0'
                  }}
                >
                  <div className="bmw-label" style={{ color: colors.text }}>{stat.level}</div>
                  <div style={{ 
                    fontSize: '32px',
                    lineHeight: '1.15',
                    fontWeight: 700,
                    color: colors.text,
                    marginTop: '4px'
                  }}>{stat.count}</div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bmw-card mb-6">
          <div className="flex gap-4 items-center">
            <div>
              <label className="bmw-label block mb-1">
                Filtrar por nivel:
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => {
                  setSelectedLevel(e.target.value);
                  setCurrentPage(1);
                }}
                className="bmw-input"
                style={{ minWidth: '200px' }}
              >
                <option value="">Todos</option>
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="bmw-body-sm" style={{ color: 'var(--bmw-body)' }}>Cargando logs...</div>
          </div>
        ) : (
          <>
            <div className="overflow-hidden" style={{ 
              backgroundColor: 'var(--bmw-canvas)',
              border: '1px solid var(--bmw-hairline)',
              borderRadius: '0'
            }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ 
                    backgroundColor: 'var(--bmw-surface-soft)',
                    borderBottom: '1px solid var(--bmw-hairline)'
                  }}>
                    <tr>
                      <th className="px-4 py-3 text-left bmw-label">
                        Nivel
                      </th>
                      <th className="px-4 py-3 text-left bmw-label">
                        Mensaje
                      </th>
                      <th className="px-4 py-3 text-left bmw-label">
                        Endpoint
                      </th>
                      <th className="px-4 py-3 text-left bmw-label">
                        Usuario
                      </th>
                      <th className="px-4 py-3 text-left bmw-label">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left bmw-label">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ borderTop: '1px solid var(--bmw-hairline)' }}>
                    {logs.map((log) => {
                      const colors = LEVEL_COLORS[log.level];
                      return (
                        <tr 
                          key={log.id}
                          style={{ borderBottom: '1px solid var(--bmw-hairline)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bmw-surface-soft)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <td className="px-4 py-3">
                            <span
                              className="bmw-body-sm"
                              style={{
                                display: 'inline-block',
                                padding: '4px 8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                backgroundColor: colors.bg,
                                color: colors.text,
                                borderRadius: '0'
                              }}
                            >
                              {log.level.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 bmw-body-sm max-w-md truncate">
                            {log.message}
                          </td>
                          <td className="px-4 py-3 bmw-body-sm" style={{ color: 'var(--bmw-body)' }}>
                            {log.method} {log.endpoint || '-'}
                          </td>
                          <td className="px-4 py-3 bmw-body-sm" style={{ color: 'var(--bmw-body)' }}>
                            {log.user_id || '-'}
                          </td>
                          <td className="px-4 py-3 bmw-body-sm" style={{ color: 'var(--bmw-body)' }}>
                            {formatDate(log.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="bmw-btn-text"
                              style={{ 
                                color: 'var(--bmw-primary)',
                                fontSize: '14px',
                                padding: '0'
                              }}
                            >
                              Ver detalles
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="bmw-btn-secondary"
                  style={{ height: '40px', padding: '8px 24px' }}
                >
                  Anterior
                </button>
                <span className="bmw-body-sm flex items-center" style={{ padding: '0 16px', color: 'var(--bmw-ink)' }}>
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="bmw-btn-secondary"
                  style={{ height: '40px', padding: '8px 24px' }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div className="max-w-3xl w-full max-h-[90vh] overflow-auto" style={{ 
            backgroundColor: 'var(--bmw-surface-card)',
            borderRadius: '0',
            border: '1px solid var(--bmw-hairline)'
          }}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 style={{ fontSize: '32px', lineHeight: '1.15', fontWeight: 700, color: 'var(--bmw-ink)' }}>Detalle del Log</h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  style={{ 
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--bmw-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="bmw-label">Nivel</label>
                  <div className="mt-1">
                    <span
                      className="bmw-body-sm inline-block"
                      style={{
                        padding: '4px 12px',
                        fontWeight: 700,
                        backgroundColor: LEVEL_COLORS[selectedLog.level].bg,
                        color: LEVEL_COLORS[selectedLog.level].text,
                        borderRadius: '0'
                      }}
                    >
                      {selectedLog.level.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="bmw-label">Mensaje</label>
                  <div className="mt-1 bmw-body-sm">{selectedLog.message}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="bmw-label">Usuario</label>
                    <div className="mt-1 bmw-body-sm">{selectedLog.user_id || '-'}</div>
                  </div>
                  <div>
                    <label className="bmw-label">IP</label>
                    <div className="mt-1 bmw-body-sm">{selectedLog.ip_address || '-'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="bmw-label">Método</label>
                    <div className="mt-1 bmw-body-sm">{selectedLog.method || '-'}</div>
                  </div>
                  <div>
                    <label className="bmw-label">Endpoint</label>
                    <div className="mt-1 bmw-body-sm">{selectedLog.endpoint || '-'}</div>
                  </div>
                </div>

                <div>
                  <label className="bmw-label">Fecha</label>
                  <div className="mt-1 bmw-body-sm">{formatDate(selectedLog.created_at)}</div>
                </div>

                {selectedLog.context && (
                  <div>
                    <label className="bmw-label">Contexto</label>
                    <pre className="mt-1 p-3 bmw-body-sm overflow-auto" style={{ 
                      backgroundColor: 'var(--bmw-surface-soft)',
                      borderRadius: '0',
                      fontSize: '12px'
                    }}>
                      {JSON.stringify(selectedLog.context, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.stack_trace && (
                  <div>
                    <label className="bmw-label">Stack Trace</label>
                    <pre className="mt-1 p-3 bmw-body-sm overflow-auto" style={{ 
                      backgroundColor: 'var(--bmw-surface-soft)',
                      borderRadius: '0',
                      fontSize: '12px'
                    }}>
                      {selectedLog.stack_trace}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showCleanupConfirm}
        onClose={() => setShowCleanupConfirm(false)}
        onConfirm={handleCleanupConfirm}
        title="Limpiar Logs Antiguos"
        message="¿Estás seguro de que quieres eliminar los logs antiguos? Esta acción no se puede deshacer."
        confirmText="Limpiar"
        variant="danger"
        loading={cleaning}
      />

      <SuccessModal
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        title={successMessage?.title || ''}
        message={successMessage?.message || ''}
        details={successMessage?.details}
      />
    </Layout>
  );
}
