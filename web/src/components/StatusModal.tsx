import { useState, useEffect } from 'react';
import axios from 'axios';

interface StatusModalProps {
  onClose: () => void;
}

interface SystemStatus {
  api: { status: 'ok' | 'error'; message: string };
  database: { status: 'ok' | 'error'; message: string };
  bot: { status: 'ok' | 'error'; message: string };
}

export const StatusModal = ({ onClose }: StatusModalProps) => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    const result: SystemStatus = {
      api: { status: 'error', message: 'No verificado' },
      database: { status: 'error', message: 'No verificado' },
      bot: { status: 'error', message: 'No verificado' },
    };

    try {
      const response = await axios.get('/api/system/status');
      const data = response.data;

      result.api = { 
        status: 'ok', 
        message: 'Conectado correctamente' 
      };

      result.database = {
        status: data.database ? 'ok' : 'error',
        message: data.database ? `${data.leadsCount} leads en DB` : 'Error de conexión'
      };

      result.bot = {
        status: data.bot ? 'ok' : 'error',
        message: data.bot ? `Bot: ${data.botUsername || 'Conectado'}` : 'Bot no configurado o desconectado'
      };

    } catch (error) {
      result.api = { 
        status: 'error', 
        message: 'Error al conectar con la API' 
      };
    }

    setStatus(result);
    setLoading(false);
  };

  const getStatusColor = (status: 'ok' | 'error') => {
    return status === 'ok' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (status: 'ok' | 'error') => {
    return status === 'ok' ? '✓' : '✗';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Estado del Sistema</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-gray-600">
              Verificando sistema...
            </div>
          ) : status ? (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">API</h3>
                  <span className={`text-2xl ${getStatusColor(status.api.status)}`}>
                    {getStatusIcon(status.api.status)}
                  </span>
                </div>
                <p className={`text-sm ${getStatusColor(status.api.status)}`}>
                  {status.api.message}
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Base de Datos</h3>
                  <span className={`text-2xl ${getStatusColor(status.database.status)}`}>
                    {getStatusIcon(status.database.status)}
                  </span>
                </div>
                <p className={`text-sm ${getStatusColor(status.database.status)}`}>
                  {status.database.message}
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Discord Bot</h3>
                  <span className={`text-2xl ${getStatusColor(status.bot.status)}`}>
                    {getStatusIcon(status.bot.status)}
                  </span>
                </div>
                <p className={`text-sm ${getStatusColor(status.bot.status)}`}>
                  {status.bot.message}
                </p>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  {status.api.status === 'ok' && status.database.status === 'ok' && status.bot.status === 'ok'
                    ? 'Todos los sistemas operando correctamente.'
                    : 'Algunos componentes requieren atención. Revisa la configuración.'}
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={checkSystemStatus}
              className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
              disabled={loading}
            >
              Verificar de nuevo
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
