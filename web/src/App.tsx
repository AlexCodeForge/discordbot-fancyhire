import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Lead, LeadStage, STAGES } from './types/Lead';
import { api } from './services/api';
import { KanbanColumn } from './components/KanbanColumn';
import { LeadCard } from './components/LeadCard';
import { LeadModal } from './components/LeadModal';
import { CreateLeadForm } from './components/CreateLeadForm';
import { Layout } from './components/Layout';

function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadLeads();
    const interval = setInterval(loadLeads, 30000);
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

  const getLeadsByStage = (stage: LeadStage): Lead[] => {
    return leads.filter((lead) => lead.stage === stage);
  };

  const handleDragStart = (event: any) => {
    const lead = leads.find((l) => l.id === event.active.id);
    setActiveLead(lead || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveLead(null);
    
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as number;
    const newStage = over.id as LeadStage;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === newStage) return;

    try {
      await api.updateLead(leadId, { stage: newStage });
      await loadLeads();
    } catch (error) {
      console.error('Error actualizando lead:', error);
      alert('Error al mover el lead');
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
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {STAGES.map((stage) => (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  leads={getLeadsByStage(stage)}
                  onLeadClick={setSelectedLead}
                />
              ))}
            </div>

            <DragOverlay>
              {activeLead ? (
                <div className="rotate-3">
                  <LeadCard lead={activeLead} onClick={() => {}} />
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
