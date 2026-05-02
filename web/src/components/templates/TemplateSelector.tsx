import { useEffect, useState } from 'react';
import { AnnouncementTemplate } from '../../types/Announcement';
import { api } from '../../services/api';

interface TemplateSelectorProps {
  onSelect: (template: AnnouncementTemplate | null) => void;
  selectedTemplateId?: number;
}

export function TemplateSelector({ onSelect, selectedTemplateId }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<AnnouncementTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await api.getAnnouncementTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    if (templateId === '') {
      onSelect(null);
    } else {
      const template = templates.find(t => t.id === parseInt(templateId));
      onSelect(template || null);
    }
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{
        display: 'block',
        fontFamily: "'BMW Type Next Latin', sans-serif",
        fontSize: '14px',
        fontWeight: 700,
        lineHeight: 1.0,
        letterSpacing: '0.5px',
        color: '#262626',
        marginBottom: '8px',
      }}>
        Plantilla
      </label>
      <select
        value={selectedTemplateId || ''}
        onChange={handleChange}
        disabled={loading}
        style={{
          width: '100%',
          height: '48px',
          fontFamily: "'BMW Type Next Latin', sans-serif",
          fontSize: '16px',
          fontWeight: 300,
          lineHeight: 1.55,
          color: '#262626',
          backgroundColor: '#ffffff',
          border: '2px solid #d6d6d6',
          borderRadius: '0px',
          padding: '0 16px',
          outline: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        <option value="">Selecciona una plantilla</option>
        {templates.map(template => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>
    </div>
  );
}
