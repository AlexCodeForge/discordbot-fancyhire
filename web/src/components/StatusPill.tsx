import { useState } from 'react';
import { StatusModal } from './StatusModal';

export const StatusPill = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bmw-btn-secondary flex items-center gap-2"
        title="Verificar estado del sistema"
      >
        <span className="w-2 h-2 animate-pulse" style={{ 
          backgroundColor: 'var(--bmw-success)',
          borderRadius: '9999px'
        }}></span>
        Estado del Sistema
      </button>

      {showModal && <StatusModal onClose={() => setShowModal(false)} />}
    </>
  );
};
