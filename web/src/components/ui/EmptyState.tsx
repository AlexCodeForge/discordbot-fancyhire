export interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-2 px-6"
      style={{ backgroundColor: 'var(--bmw-surface-2)' }}
    >
      <p className="bmw-title-sm" style={{ color: 'var(--bmw-ink)', margin: 0 }}>
        {message}
      </p>
      <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)', margin: 0 }}>
        Elige un canal en la lista para ver mensajes.
      </p>
    </div>
  );
}
