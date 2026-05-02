import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Lead, LeadStage, STAGE_LABELS } from '../../types/Lead';
import { LeadCard } from './LeadCard';
import { DiscordMember } from '../../services/discord';

interface KanbanColumnProps {
  stage: LeadStage;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  discordMembers: Map<string, DiscordMember>;
}

const STAGE_COLORS: Record<LeadStage, { bgVar: string; borderVar: string }> = {
  nuevo: { bgVar: 'var(--bmw-surface-card)', borderVar: 'var(--bmw-hairline-strong)' },
  contactado: { bgVar: 'var(--bmw-surface-card)', borderVar: 'var(--bmw-primary)' },
  propuesta_enviada: { bgVar: 'var(--bmw-surface-card)', borderVar: 'var(--bmw-warning)' },
  negociacion: { bgVar: 'var(--bmw-surface-card)', borderVar: '#fdba74' },
  ganado: { bgVar: 'var(--bmw-surface-card)', borderVar: 'var(--bmw-success)' },
  perdido: { bgVar: 'var(--bmw-surface-card)', borderVar: 'var(--bmw-error)' },
};

export function KanbanColumn({ stage, leads, onLeadClick, discordMembers }: KanbanColumnProps) {
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
        backgroundColor: stageColor.bgVar,
        borderLeft: `4px solid ${stageColor.borderVar}`,
        border: `1px solid ${stageColor.borderVar}`,
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
              discordMember={lead.discord_id ? discordMembers.get(lead.discord_id) : null}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
