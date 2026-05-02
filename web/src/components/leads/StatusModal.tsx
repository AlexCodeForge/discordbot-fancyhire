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
    if (status === 'ok') {
      return { color: 'var(--bmw-success)' };
    }
    return { color: 'var(--bmw-error)' };
  };

  const getStatusIcon = (status: 'ok' | 'error') => {
    return status === 'ok' ? '✓' : '✗';
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ 
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }}>
      <div className="max-w-md w-full mx-4" style={{ 
        backgroundColor: 'var(--bmw-surface-card)',
        borderRadius: '0',
        border: '1px solid var(--bmw-hairline)'
      }}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 style={{ fontSize: '32px', lineHeight: '1.15', fontWeight: 700, color: 'var(--bmw-ink)' }}>Estado del Sistema</h2>
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

          {loading ? (
            <div className="py-8 text-center bmw-body-sm" style={{ color: 'var(--bmw-body)' }}>
              Verificando sistema...
            </div>
          ) : status ? (
            <div className="space-y-4">
              <div className="p-4" style={{ 
                border: '1px solid var(--bmw-hairline)',
                borderRadius: '0'
              }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="bmw-title-sm">API</h3>
                  <span className="text-2xl" style={getStatusColor(status.api.status)}>
                    {getStatusIcon(status.api.status)}
                  </span>
                </div>
                <p className="bmw-body-sm" style={getStatusColor(status.api.status)}>
                  {status.api.message}
                </p>
              </div>

              <div className="p-4" style={{ 
                border: '1px solid var(--bmw-hairline)',
                borderRadius: '0'
              }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="bmw-title-sm">Base de Datos</h3>
                  <span className="text-2xl" style={getStatusColor(status.database.status)}>
                    {getStatusIcon(status.database.status)}
                  </span>
                </div>
                <p className="bmw-body-sm" style={getStatusColor(status.database.status)}>
                  {status.database.message}
                </p>
              </div>

              <div className="p-4" style={{ 
                border: '1px solid var(--bmw-hairline)',
                borderRadius: '0'
              }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="bmw-title-sm">Discord Bot</h3>
                  <span className="text-2xl" style={getStatusColor(status.bot.status)}>
                    {getStatusIcon(status.bot.status)}
                  </span>
                </div>
                <p className="bmw-body-sm" style={getStatusColor(status.bot.status)}>
                  {status.bot.message}
                </p>
              </div>

              <div className="mt-6 p-4" style={{ 
                backgroundColor: 'var(--bmw-surface-soft)',
                borderRadius: '0'
              }}>
                <p className="bmw-body-sm" style={{ fontSize: '12px', color: 'var(--bmw-body)' }}>
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
              className="bmw-btn-text"
              disabled={loading}
              style={{ 
                color: 'var(--bmw-primary)',
                padding: '8px 16px'
              }}
            >
              Verificar de nuevo
            </button>
            <button
              onClick={onClose}
              className="bmw-btn-secondary"
              style={{ 
                height: '40px',
                padding: '8px 24px'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
