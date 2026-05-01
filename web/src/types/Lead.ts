export type LeadStage = 'nuevo' | 'contactado' | 'propuesta_enviada' | 'negociacion' | 'ganado' | 'perdido';

export interface Lead {
  id: number;
  name: string;
  discord_id?: string;
  discord_tag?: string;
  contact_discord: string;
  service_interest?: string;
  stage: LeadStage;
  assigned_to?: string;
  notes?: string;
  source: 'auto' | 'manual';
  created_at: string;
  updated_at: string;
}

export interface LeadHistory {
  id: number;
  lead_id: number;
  action: string;
  previous_value?: string;
  new_value?: string;
  changed_by?: string;
  created_at: string;
}

export const STAGE_LABELS: Record<LeadStage, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  propuesta_enviada: 'Propuesta Enviada',
  negociacion: 'Negociación',
  ganado: 'Ganado',
  perdido: 'Perdido',
};

export const STAGES: LeadStage[] = [
  'nuevo',
  'contactado',
  'propuesta_enviada',
  'negociacion',
  'ganado',
  'perdido',
];
