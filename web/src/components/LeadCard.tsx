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
        <h3 className="bmw-title-sm">{lead.name}</h3>
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
