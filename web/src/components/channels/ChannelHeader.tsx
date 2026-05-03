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

function TicketIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V9C19.4696 9 18.9609 9.21071 18.5858 9.58579C18.2107 9.96086 18 10.4696 18 11C18 11.5304 18.2107 12.0391 18.5858 12.4142C18.9609 12.7893 19.4696 13 20 13V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V13C4.53043 13 5.03914 12.7893 5.41421 12.4142C5.78929 12.0391 6 11.5304 6 11C6 10.4696 5.78929 9.96086 5.41421 9.58579C5.03914 9.21071 4.53043 9 4 9V6Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 9L10 15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 9L14 15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
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
  const isTicket = !!channel.ticket_id;

  const getTicketStatusColor = (status?: 'open' | 'closed' | 'archived'): string => {
    if (!status) return 'var(--bmw-accent-secondary)';
    switch (status) {
      case 'open':
        return '#00d26a';
      case 'closed':
        return '#8a8a8a';
      case 'archived':
        return 'var(--bmw-accent-secondary)';
      default:
        return 'var(--bmw-accent-secondary)';
    }
  };

  const getTicketStatusText = (status?: 'open' | 'closed' | 'archived'): string => {
    if (!status) return 'Desconocido';
    switch (status) {
      case 'open':
        return 'Abierto';
      case 'closed':
        return 'Cerrado';
      case 'archived':
        return 'Archivado';
      default:
        return 'Desconocido';
    }
  };

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
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="bmw-title-md truncate">
              <span style={{ color: 'var(--bmw-muted)' }}>#</span>
              {channel.name}
            </h1>
            {isTicket && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  backgroundColor: getTicketStatusColor(channel.ticket_status),
                  color: '#fff',
                  borderRadius: '2px',
                  textTransform: 'uppercase',
                  flexShrink: 0,
                }}
              >
                <TicketIcon color="#fff" />
                {getTicketStatusText(channel.ticket_status)}
              </span>
            )}
          </div>
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
