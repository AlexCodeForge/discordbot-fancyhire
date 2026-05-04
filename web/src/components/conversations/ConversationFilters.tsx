import { ConversationFilters as Filters } from '../../types/Conversation';
import { STAGE_LABELS, STAGES } from '../../types/Lead';

interface ConversationFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function ConversationFilters({ filters, onFiltersChange }: ConversationFiltersProps) {
  const handleUnreadToggle = () => {
    onFiltersChange({ ...filters, unread: !filters.unread });
  };

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status: status === 'all' ? undefined : status });
  };

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search: search || undefined });
  };

  const handleSortChange = (sortBy: string) => {
    onFiltersChange({ ...filters, sortBy: sortBy as any });
  };

  return (
    <div className="bmw-card mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="bmw-label block mb-1">
            Buscar:
          </label>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Nombre o email..."
            className="bmw-input"
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ minWidth: '200px' }}>
          <label className="bmw-label block mb-1">
            Estado:
          </label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bmw-input"
            style={{ width: '100%' }}
          >
            <option value="all">Todos</option>
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: '200px' }}>
          <label className="bmw-label block mb-1">
            Ordenar por:
          </label>
          <select
            value={filters.sortBy || 'last_message'}
            onChange={(e) => handleSortChange(e.target.value)}
            className="bmw-input"
            style={{ width: '100%' }}
          >
            <option value="last_message">Más reciente</option>
            <option value="unread_count">Más no leídas</option>
            <option value="name">Nombre A-Z</option>
          </select>
        </div>

        <div style={{ minWidth: '150px' }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.unread || false}
              onChange={handleUnreadToggle}
              style={{ 
                width: '18px', 
                height: '18px',
                cursor: 'pointer'
              }}
            />
            <span className="bmw-body-sm" style={{ color: 'var(--bmw-ink)' }}>
              Solo no leídas
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
