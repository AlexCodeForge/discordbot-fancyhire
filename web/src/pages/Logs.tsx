import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { logsApi, SystemLog, LogStats } from '../services/logs';
import { useAuth } from '../context/AuthContext';

const LEVELS = ['error', 'warning', 'info', 'debug'] as const;
const LEVEL_COLORS = {
  error: 'bg-red-100 text-red-800 border-red-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  debug: 'bg-gray-100 text-gray-800 border-gray-200'
};

export function Logs() {
  const { logout } = useAuth();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
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

  const handleCleanup = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar los logs antiguos?')) {
      return;
    }
    try {
      const result = await logsApi.cleanup();
      alert(`${result.deleted} logs eliminados (más de ${result.retentionDays} días)`);
      loadLogs();
      loadStats();
    } catch (error) {
      console.error('Error limpiando logs:', error);
      alert('Error al limpiar logs');
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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
              <p className="text-gray-600 mt-2">Total: {total} logs</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/"
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
              >
                Volver al CRM
              </Link>
              <button
                onClick={logout}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-6 py-6">

        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            {stats.byLevel.map((stat) => (
              <div
                key={stat.level}
                className={`p-4 rounded-lg border-2 ${LEVEL_COLORS[stat.level as keyof typeof LEVEL_COLORS]}`}
              >
                <div className="text-sm font-medium uppercase">{stat.level}</div>
                <div className="text-2xl font-bold mt-1">{stat.count}</div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por nivel:
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => {
                  setSelectedLevel(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="ml-auto">
              <button
                onClick={handleCleanup}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Limpiar Logs Antiguos
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Cargando logs...</div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Nivel
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Mensaje
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Endpoint
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Usuario
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              LEVEL_COLORS[log.level]
                            }`}
                          >
                            {log.level.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-md truncate">
                          {log.message}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.method} {log.endpoint || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.user_id || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Ver detalles
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Detalle del Log</h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nivel</label>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-3 py-1 text-sm font-medium rounded ${
                        LEVEL_COLORS[selectedLog.level]
                      }`}
                    >
                      {selectedLog.level.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Mensaje</label>
                  <div className="mt-1 text-gray-900">{selectedLog.message}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Usuario</label>
                    <div className="mt-1 text-gray-900">{selectedLog.user_id || '-'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">IP</label>
                    <div className="mt-1 text-gray-900">{selectedLog.ip_address || '-'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Método</label>
                    <div className="mt-1 text-gray-900">{selectedLog.method || '-'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Endpoint</label>
                    <div className="mt-1 text-gray-900">{selectedLog.endpoint || '-'}</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha</label>
                  <div className="mt-1 text-gray-900">{formatDate(selectedLog.created_at)}</div>
                </div>

                {selectedLog.context && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contexto</label>
                    <pre className="mt-1 p-3 bg-gray-50 rounded text-xs overflow-auto">
                      {JSON.stringify(selectedLog.context, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.stack_trace && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Stack Trace</label>
                    <pre className="mt-1 p-3 bg-gray-50 rounded text-xs overflow-auto">
                      {selectedLog.stack_trace}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
