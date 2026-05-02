import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { Lead, LeadStage, STAGES } from './types/Lead';
import { api } from './services/api';
import { KanbanColumn } from './components/leads/KanbanColumn';
import { LeadCard } from './components/leads/LeadCard';
import { LeadModal } from './components/leads/LeadModal';
import { CreateLeadForm } from './components/leads/CreateLeadForm';
import { Layout } from './components/ui/Layout';
import { discordApi, DiscordMember } from './services/discord';

function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [discordMembers, setDiscordMembers] = useState<Map<string, DiscordMember>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadLeads();
    loadDiscordMembers();
    const interval = setInterval(() => {
      loadLeads();
      loadDiscordMembers();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadLeads = async () => {
    try {
      const data = await api.getAllLeads();
      setLeads(data);
    } catch (error) {
      console.error('Error cargando leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDiscordMembers = async () => {
    try {
      const members = await discordApi.getMembers();
      const membersMap = new Map<string, DiscordMember>();
      members.forEach(member => {
        membersMap.set(member.id, member);
      });
      setDiscordMembers(membersMap);
    } catch (error) {
      console.error('Error cargando miembros de Discord:', error);
    }
  };

  const getLeadsByStage = (stage: LeadStage): Lead[] => {
    return leads.filter((lead) => lead.stage === stage);
  };

  const handleDragStart = (event: any) => {
    const lead = leads.find((l) => l.id === event.active.id);
    setActiveLead(lead || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id;

    const activeLead = leads.find((l) => l.id === activeId);
    if (!activeLead) return;

    let overStage: LeadStage | null = null;
    let overLead: Lead | null = null;

    if (typeof overId === 'string' && STAGES.includes(overId as LeadStage)) {
      overStage = overId as LeadStage;
    } else {
      overLead = leads.find((l) => l.id === overId) || null;
      if (overLead) {
        overStage = overLead.stage;
      }
    }

    if (!overStage) return;

    if (activeLead.stage !== overStage) {
      const activeStageLeads = leads.filter((l) => l.stage === activeLead.stage && l.id !== activeId);
      const overStageLeads = leads.filter((l) => l.stage === overStage);

      const newLeads = [
        ...leads.filter((l) => l.stage !== activeLead.stage && l.stage !== overStage),
        ...activeStageLeads,
        ...overStageLeads,
        { ...activeLead, stage: overStage },
      ];

      setLeads(newLeads);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveLead(null);
    
    const { active, over } = event;
    if (!over) {
      await loadLeads();
      return;
    }

    const activeId = active.id as number;
    const overId = over.id;

    const activeLead = leads.find((l) => l.id === activeId);
    if (!activeLead) return;

    let targetStage: LeadStage;
    let targetOrder: number;

    if (typeof overId === 'string' && STAGES.includes(overId as LeadStage)) {
      targetStage = overId as LeadStage;
      const stageLeads = leads.filter((l) => l.stage === targetStage);
      targetOrder = stageLeads.length + 1;
    } else {
      const overLead = leads.find((l) => l.id === overId);
      if (!overLead) {
        await loadLeads();
        return;
      }
      targetStage = overLead.stage;

      if (activeLead.stage === targetStage) {
        const stageLeads = leads.filter((l) => l.stage === targetStage);
        const oldIndex = stageLeads.findIndex((l) => l.id === activeId);
        const newIndex = stageLeads.findIndex((l) => l.id === overId);

        if (oldIndex === newIndex) return;

        targetOrder = newIndex + 1;
      } else {
        const stageLeads = leads.filter((l) => l.stage === targetStage);
        const targetIndex = stageLeads.findIndex((l) => l.id === overId);
        targetOrder = targetIndex + 1;
      }
    }

    try {
      await api.reorderLead(activeId, targetStage, targetOrder);
      await loadLeads();
    } catch (error) {
      console.error('Error reordenando lead:', error);
      alert('Error al mover el lead');
      await loadLeads();
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="bmw-body-sm" style={{ color: 'var(--bmw-muted)' }}>Cargando...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: '32px' }}>
        <div className="max-w-screen-2xl mx-auto">
          <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="bmw-body-sm" style={{ color: 'var(--bmw-muted)', marginBottom: '8px', fontSize: '12px' }}>
                Total de leads: {leads.length}
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bmw-btn-primary"
            >
              + Agregar Lead Manual
            </button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {STAGES.map((stage) => (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  leads={getLeadsByStage(stage)}
                  onLeadClick={setSelectedLead}
                  discordMembers={discordMembers}
                />
              ))}
            </div>

            <DragOverlay>
              {activeLead ? (
                <div className="rotate-3">
                  <LeadCard 
                    lead={activeLead} 
                    onClick={() => {}}
                    discordMember={activeLead.discord_id ? discordMembers.get(activeLead.discord_id) : null}
                    isDragOverlay={true}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={() => {
            loadLeads();
            setSelectedLead(null);
          }}
        />
      )}

      {showCreateForm && (
        <CreateLeadForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={loadLeads}
        />
      )}
    </Layout>
  );
}

export default App;
