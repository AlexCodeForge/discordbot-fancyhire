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
      className="bg-white rounded-lg shadow-sm p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{lead.name}</h3>
        {lead.source === 'auto' && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Auto</span>
        )}
      </div>
      
      <div className="text-sm text-gray-600 mb-2">
        {lead.discord_tag || lead.contact_discord}
      </div>
      
      {lead.service_interest && (
        <div className="text-xs text-gray-500 line-clamp-2">
          {lead.service_interest}
        </div>
      )}
      
      {lead.assigned_to && (
        <div className="text-xs text-gray-400 mt-2">
          Asignado: {lead.assigned_to}
        </div>
      )}
    </div>
  );
}
