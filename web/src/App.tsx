import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { StatusPill } from './components/StatusPill';
import { useAuth } from './context/AuthContext';

function App() {
  const { logout } = useAuth();
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CRM Leads - Kanban Board</h1>
              <div className="mt-2 text-sm text-gray-600">
                Total de leads: {leads.length}
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <StatusPill />
              <Link
                to="/logs"
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
              >
                Ver Logs
              </Link>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                + Agregar Lead Manual
              </button>
              <button
                onClick={logout}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6">
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
      </main>

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
    </div>
  );
}

export default App;
