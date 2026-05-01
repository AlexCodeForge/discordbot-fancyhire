import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lead } from '../types/Lead';

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasUnreadMessages = lead.unread_count && lead.unread_count > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bmw-card cursor-pointer mb-3"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--bmw-ink)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--bmw-hairline)';
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="bmw-title-sm">{lead.name}</h3>
          {hasUnreadMessages && (
            <div className="relative" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 2H4C2.9 2 2.01 2.9 2.01 4L2 22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
                  fill="var(--bmw-interactive)"
                />
                <circle cx="12" cy="10" r="1.5" fill="var(--bmw-surface)" />
                <circle cx="8" cy="10" r="1.5" fill="var(--bmw-surface)" />
                <circle cx="16" cy="10" r="1.5" fill="var(--bmw-surface)" />
              </svg>
              {lead.unread_count > 1 && (
                <span
                  className="absolute -top-1 -right-1 bmw-body-sm"
                  style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    backgroundColor: 'var(--bmw-error)',
                    color: 'var(--bmw-surface)',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {lead.unread_count > 9 ? '9+' : lead.unread_count}
                </span>
              )}
            </div>
          )}
        </div>
        {lead.source === 'auto' && (
          <span className="bmw-body-sm" style={{ 
            fontSize: '12px',
            backgroundColor: 'var(--bmw-surface-strong)',
            color: 'var(--bmw-ink)',
            padding: '4px 8px',
            borderRadius: '0'
          }}>Auto</span>
        )}
      </div>
      
      <div className="bmw-body-sm mb-2" style={{ color: 'var(--bmw-body)' }}>
        {lead.discord_tag || lead.contact_discord}
      </div>
      
      {lead.service_interest && (
        <div className="bmw-body-sm line-clamp-2" style={{ 
          fontSize: '12px',
          color: 'var(--bmw-muted)'
        }}>
          {lead.service_interest}
        </div>
      )}
      
      {lead.assigned_to && (
        <div className="bmw-body-sm mt-2" style={{ 
          fontSize: '12px',
          color: 'var(--bmw-muted-soft)'
        }}>
          Asignado: {lead.assigned_to}
        </div>
      )}
    </div>
  );
}
