import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Lead, LeadStage, STAGE_LABELS } from '../types/Lead';
import { LeadCard } from './LeadCard';

interface KanbanColumnProps {
  stage: LeadStage;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

const STAGE_COLORS: Record<LeadStage, { bg: string; border: string }> = {
  nuevo: { bg: '#fafafa', border: '#cccccc' },
  contactado: { bg: '#f0f7ff', border: '#94c5f7' },
  propuesta_enviada: { bg: '#fffbf0', border: '#fcd34d' },
  negociacion: { bg: '#fff5f0', border: '#fdba74' },
  ganado: { bg: '#f0fdf5', border: '#86efac' },
  perdido: { bg: '#fef5f5', border: '#fca5a5' },
};

export function KanbanColumn({ stage, leads, onLeadClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const stageColor = STAGE_COLORS[stage];

  return (
    <div className="flex-1 min-w-[280px]" style={{ 
      backgroundColor: 'var(--bmw-canvas)', 
      borderRadius: '0',
      padding: '16px'
    }}>
      <div style={{ 
        marginBottom: '16px', 
        padding: '12px', 
        backgroundColor: stageColor.bg,
        borderLeft: `4px solid ${stageColor.border}`,
        border: `1px solid ${stageColor.border}`,
        borderRadius: '0'
      }}>
        <h2 className="bmw-title-sm" style={{ color: 'var(--bmw-ink)' }}>
          {STAGE_LABELS[stage]}
          <span className="bmw-body-sm" style={{ marginLeft: '8px', color: 'var(--bmw-muted)' }}>
            ({leads.length})
          </span>
        </h2>
      </div>

      <div
        ref={setNodeRef}
        style={{ 
          minHeight: '400px',
          transition: 'background-color 0.2s',
          backgroundColor: isOver ? 'var(--bmw-surface-soft)' : 'transparent',
          borderRadius: '0'
        }}
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
