import { useState, useEffect } from 'react';
import { StatusModal } from './StatusModal';
import axios from 'axios';

export const StatusPill = () => {
  const [showModal, setShowModal] = useState(false);
  const [isSystemHealthy, setIsSystemHealthy] = useState(true);

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkSystemHealth = async () => {
    try {
      const response = await axios.get('/api/system/status');
      const data = response.data;
      
      const allOk = data.database && data.bot;
      setIsSystemHealthy(allOk);
    } catch (error) {
      setIsSystemHealthy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bmw-btn-secondary flex items-center gap-2"
        title="Verificar estado del sistema"
      >
        <span className="w-2 h-2 animate-pulse" style={{ 
          backgroundColor: isSystemHealthy ? 'var(--bmw-success)' : 'var(--bmw-error)',
          borderRadius: '9999px'
        }}></span>
        Estado del Sistema
      </button>

      {showModal && <StatusModal onClose={() => setShowModal(false)} />}
    </>
  );
};
