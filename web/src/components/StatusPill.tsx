import { useState } from 'react';
import { StatusModal } from './StatusModal';

export const StatusPill = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 font-medium text-sm flex items-center gap-2 transition-colors"
        title="Verificar estado del sistema"
      >
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        Estado del Sistema
      </button>

      {showModal && <StatusModal onClose={() => setShowModal(false)} />}
    </>
  );
};
