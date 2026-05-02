import { useState } from 'react';
import { ForumThread } from '../../types/ForumThread';
import { ThreadDetailsModal } from './ThreadDetailsModal';

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

interface ThreadListProps {
  threads: ForumThread[];
  selectedThread: ForumThread | null;
  onSelectThread: (thread: ForumThread) => void;
  onCreateThread: () => void;
  onDeleteThread: (thread: ForumThread) => void;
  onEditThread: (thread: ForumThread) => void;
}

export function ThreadList({
  threads,
  selectedThread,
  onSelectThread,
  onCreateThread,
  onDeleteThread,
  onEditThread,
}: ThreadListProps) {
  const [detailsThread, setDetailsThread] = useState<ForumThread | null>(null);

  const handleViewDetails = (e: React.MouseEvent, thread: ForumThread) => {
    e.stopPropagation();
    setDetailsThread(thread);
  };

  const handleEdit = (e: React.MouseEvent, thread: ForumThread) => {
    e.stopPropagation();
    onEditThread(thread);
  };

  const handleDelete = (e: React.MouseEvent, thread: ForumThread) => {
    e.stopPropagation();
    onDeleteThread(thread);
  };

  return (
    <>
      {detailsThread && (
        <ThreadDetailsModal
          thread={detailsThread}
          onClose={() => setDetailsThread(null)}
        />
      )}
    <div
      className="flex w-80 flex-col border-r"
      style={{
        backgroundColor: 'var(--bmw-surface-1)',
        borderColor: 'var(--bmw-hairline)',
      }}
    >
      <div
        className="flex items-center justify-between border-b p-4"
        style={{ borderColor: 'var(--bmw-hairline)' }}
      >
        <h3 className="bmw-title-sm">Threads</h3>
        <button
          onClick={onCreateThread}
          className="bmw-btn-primary"
          style={{ height: 32, padding: '0 12px', fontSize: 14 }}
        >
          Crear Thread
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center p-8 text-center"
            style={{ color: 'var(--bmw-muted)' }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mb-4"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="bmw-body-sm">No hay threads en este foro</p>
            <p className="bmw-body-xs mt-1">Crea el primer thread</p>
          </div>
        ) : (
          threads.map((thread) => {
            const isSelected = selectedThread?.id === thread.id;
            return (
              <div
                key={thread.id}
                className="border-b transition-colors cursor-pointer"
                style={{
                  borderColor: 'var(--bmw-hairline)',
                  backgroundColor: isSelected
                    ? 'var(--bmw-surface-soft)'
                    : 'transparent',
                }}
                onClick={() => onSelectThread(thread)}
              >
                <div className="flex items-center gap-2 p-4">
                  <div className="min-w-0 flex-1">
                    <h4
                      className="bmw-label-sm truncate"
                      style={{
                        color: isSelected ? 'var(--bmw-primary)' : 'var(--bmw-ink)',
                      }}
                    >
                      {thread.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleViewDetails(e, thread)}
                      className="bmw-btn-ghost"
                      style={{ height: 32, padding: '0 12px', fontSize: 13 }}
                      title="Ver detalles"
                    >
                      Ver
                    </button>

                    <button
                      onClick={(e) => handleEdit(e, thread)}
                      className="bmw-btn-ghost"
                      style={{ height: 32, padding: '0 12px', fontSize: 13 }}
                      title="Editar thread"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, thread)}
                      className="bmw-btn-ghost"
                      aria-label="Eliminar thread"
                      title="Eliminar thread"
                      style={{ height: 32, padding: '0 8px' }}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
    </>
  );
}
