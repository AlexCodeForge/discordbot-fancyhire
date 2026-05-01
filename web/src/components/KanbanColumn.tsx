import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Lead, LeadStage, STAGE_LABELS } from '../types/Lead';
import { LeadCard } from './LeadCard';

interface KanbanColumnProps {
  stage: LeadStage;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

const STAGE_COLORS: Record<LeadStage, string> = {
  nuevo: 'bg-gray-100 border-gray-300',
  contactado: 'bg-blue-100 border-blue-300',
  propuesta_enviada: 'bg-yellow-100 border-yellow-300',
  negociacion: 'bg-orange-100 border-orange-300',
  ganado: 'bg-green-100 border-green-300',
  perdido: 'bg-red-100 border-red-300',
};

export function KanbanColumn({ stage, leads, onLeadClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="flex-1 min-w-[280px] bg-gray-50 rounded-lg p-4">
      <div className={`mb-4 p-3 rounded-lg border-2 ${STAGE_COLORS[stage]}`}>
        <h2 className="font-bold text-gray-800 text-lg">
          {STAGE_LABELS[stage]}
          <span className="ml-2 text-sm font-normal text-gray-600">
            ({leads.length})
          </span>
        </h2>
      </div>

      <div
        ref={setNodeRef}
        className={`min-h-[400px] transition-colors ${isOver ? 'bg-blue-50' : ''}`}
      >
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick(lead)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
