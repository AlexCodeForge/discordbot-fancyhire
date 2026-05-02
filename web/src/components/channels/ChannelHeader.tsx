import { useState } from 'react';
import type { Channel } from '../../types/Channel';
import { ConfirmationModal } from '../ui/modals/ConfirmationModal';

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M9 3h6M4 7h16M6 7l1 14h10l1-14M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export interface ChannelHeaderProps {
  channel: Channel;
  onDeleteChannel: () => void;
}

export function ChannelHeader({ channel, onDeleteChannel }: ChannelHeaderProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      <header
        className="flex w-full items-center justify-between gap-4"
        style={{
          minHeight: '56px',
          backgroundColor: 'var(--bmw-surface-1)',
          borderBottom: '1px solid var(--bmw-on-surface-variant)',
          padding: '16px',
        }}
      >
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          <h1 className="bmw-title-md truncate">
            <span style={{ color: 'var(--bmw-muted)' }}>#</span>
            {channel.name}
          </h1>
          {channel.topic ? (
            <p className="bmw-body-xs truncate">{channel.topic}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="bmw-btn-ghost"
            aria-label="Eliminar canal"
            title="Eliminar canal"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <TrashIcon />
          </button>
        </div>
      </header>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDeleteChannel();
        }}
        title="Eliminar Canal"
        message={`¿Estás seguro de eliminar el canal "#${channel.name}"? Esta acción no se puede deshacer y se perderán todos los mensajes.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  );
}
