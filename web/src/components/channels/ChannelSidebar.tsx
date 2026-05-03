import { useMemo, useState, useRef, useEffect } from 'react';
import { Channel } from '../../types/Channel';

export interface ChannelSidebarProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  onCreateChannel: () => void;
  onOpenMoveModal: () => void;
  onManageCategories: () => void;
}

export function isCategoryChannel(c: Channel): boolean {
  const t = Number(c.type);
  if (t === 4) return true;
  const s = String(c.type).toUpperCase();
  return s.includes('GUILD_CATEGORY') || s === 'GUILDCATEGORY';
}

interface ChannelGroup {
  categoryId: string | null;
  categoryName: string | null;
  channels: Channel[];
}

function buildChannelGroups(channels: Channel[]): ChannelGroup[] {
  const categories = channels.filter(isCategoryChannel);
  const nonCategoryChannels = channels.filter((c) => !isCategoryChannel(c));

  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    categoryMap.set(cat.discord_channel_id, cat.name);
  }

  const grouped = new Map<string | null, Channel[]>();
  
  for (const ch of nonCategoryChannels) {
    const key = ch.parent_id ?? null;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(ch);
  }

  for (const channels of grouped.values()) {
    channels.sort((a, b) => a.position - b.position);
  }

  const uncategorizedChannels = grouped.get(null) || [];
  const categorizedGroups = categories
    .sort((a, b) => a.position - b.position)
    .map((cat) => ({
      categoryId: cat.discord_channel_id,
      categoryName: cat.name,
      channels: grouped.get(cat.discord_channel_id) || [],
    }));

  const result: ChannelGroup[] = [];
  
  if (uncategorizedChannels.length > 0) {
    result.push({
      categoryId: null,
      categoryName: null,
      channels: uncategorizedChannels,
    });
  }

  result.push(...categorizedGroups);

  return result;
}

interface ChannelItemProps {
  channel: Channel;
  isSelected: boolean;
  onSelect: () => void;
}

function getChannelIcon(channel: Channel): string {
  const type = Number(channel.type);
  if (type === 15) return '💬'; // GUILD_FORUM
  return '#'; // GUILD_TEXT (default)
}

function getChannelTypeName(channel: Channel): string {
  const type = Number(channel.type);
  if (type === 15) return 'Foro';
  return 'Texto';
}

function TicketIcon({ className, color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V9C19.4696 9 18.9609 9.21071 18.5858 9.58579C18.2107 9.96086 18 10.4696 18 11C18 11.5304 18.2107 12.0391 18.5858 12.4142C18.9609 12.7893 19.4696 13 20 13V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V13C4.53043 13 5.03914 12.7893 5.41421 12.4142C5.78929 12.0391 6 11.5304 6 11C6 10.4696 5.78929 9.96086 5.41421 9.58579C5.03914 9.21071 4.53043 9 4 9V6Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 9L10 15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 9L14 15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getTicketStatusColor(status?: 'open' | 'closed' | 'archived'): string {
  if (!status) return 'var(--bmw-accent-secondary)';
  switch (status) {
    case 'open':
      return '#00d26a';
    case 'closed':
      return '#8a8a8a';
    case 'archived':
      return 'var(--bmw-accent-secondary)';
    default:
      return 'var(--bmw-accent-secondary)';
  }
}

function ChannelItem({
  channel,
  isSelected,
  onSelect,
}: ChannelItemProps) {
  const icon = getChannelIcon(channel);
  const typeName = getChannelTypeName(channel);
  const isTicket = !!channel.ticket_id;
  
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="bmw-body-sm w-full text-left"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '8px 16px',
          margin: 0,
          border: 'none',
          fontFamily: 'inherit',
          backgroundColor: isSelected ? 'var(--bmw-primary)' : 'transparent',
          color: isSelected ? 'var(--bmw-on-primary)' : 'var(--bmw-body)',
          transition: 'background-color 200ms ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'var(--bmw-surface-strong)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
        title={`${typeName}: ${channel.name}${isTicket ? ` (Ticket ${channel.ticket_status})` : ''}`}
      >
        <span style={{ fontSize: '16px', lineHeight: 1 }}>{icon}</span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {channel.name}
        </span>
        {isTicket && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 6px',
              backgroundColor: getTicketStatusColor(channel.ticket_status),
              borderRadius: '2px',
              flexShrink: 0,
            }}
          >
            <TicketIcon color="#fff" />
          </span>
        )}
      </button>
    </li>
  );
}

type ChannelFilter = 'all' | 'tickets' | 'normal';

export function ChannelSidebar({
  channels,
  selectedChannel,
  onSelectChannel,
  onCreateChannel,
  onOpenMoveModal,
  onManageCategories,
}: ChannelSidebarProps) {
  const [filter, setFilter] = useState<ChannelFilter>('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredChannels = useMemo(() => {
    if (filter === 'all') return channels;
    if (filter === 'tickets') return channels.filter((ch) => !!ch.ticket_id);
    if (filter === 'normal') return channels.filter((ch) => !ch.ticket_id);
    return channels;
  }, [channels, filter]);

  const groups = useMemo(() => buildChannelGroups(filteredChannels), [filteredChannels]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  const handleMenuAction = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  return (
    <aside
      className="flex flex-col shrink-0 box-border"
      style={{
        width: '280px',
        minHeight: '100vh',
        height: '100vh',
        backgroundColor: 'var(--bmw-surface-1)',
        borderRight: '1px solid var(--bmw-on-surface-variant)',
      }}
    >
      <header
        className="flex flex-col gap-2 shrink-0"
        style={{ padding: '16px', borderBottom: '1px solid var(--bmw-hairline)' }}
      >
        <div className="flex flex-row items-center justify-between gap-3">
          <h2 className="bmw-title-md" style={{ margin: 0 }}>
            Canales
          </h2>
          
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              type="button"
              className="inline-flex items-center justify-center shrink-0 border-0 cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menú de canales"
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: isMenuOpen ? 'var(--bmw-primary-active)' : 'var(--bmw-primary)',
                color: 'var(--bmw-on-primary)',
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: '20px',
                lineHeight: 1,
                letterSpacing: '0.5px',
                borderRadius: 0,
                transition: 'background-color 200ms ease',
              }}
              onMouseEnter={(e) => {
                if (!isMenuOpen) {
                  e.currentTarget.style.backgroundColor = 'var(--bmw-primary-active)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMenuOpen) {
                  e.currentTarget.style.backgroundColor = 'var(--bmw-primary)';
                }
              }}
            >
              ⋮
            </button>

            {isMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  minWidth: '200px',
                  backgroundColor: 'var(--bmw-canvas)',
                  border: '1px solid var(--bmw-hairline)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  zIndex: 100,
                }}
              >
                <button
                  type="button"
                  onClick={() => handleMenuAction(onCreateChannel)}
                  className="bmw-body-sm w-full text-left"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--bmw-ink)',
                    cursor: 'pointer',
                    transition: 'background-color 150ms ease',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bmw-surface-2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '18px' }}>+</span>
                  <span>Crear canal</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMenuAction(onOpenMoveModal)}
                  className="bmw-body-sm w-full text-left"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--bmw-ink)',
                    cursor: 'pointer',
                    transition: 'background-color 150ms ease',
                    fontFamily: 'inherit',
                    borderTop: '1px solid var(--bmw-hairline)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bmw-surface-2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '18px' }}>↔</span>
                  <span>Mover canales</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMenuAction(onManageCategories)}
                  className="bmw-body-sm w-full text-left"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--bmw-ink)',
                    cursor: 'pointer',
                    transition: 'background-color 150ms ease',
                    fontFamily: 'inherit',
                    borderTop: '1px solid var(--bmw-hairline)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bmw-surface-2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '18px' }}>⚙</span>
                  <span>Gestionar categorías</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div style={{ width: '100%' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ChannelFilter)}
            className="bmw-body-sm"
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: 'var(--bmw-canvas)',
              color: 'var(--bmw-ink)',
              border: '1px solid var(--bmw-hairline)',
              fontFamily: 'inherit',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <option value="all">Todos los canales</option>
            <option value="tickets">Solo tickets</option>
            <option value="normal">Solo canales normales</option>
          </select>
        </div>
      </header>

      <nav
        className="flex flex-col flex-1 min-h-0 overflow-y-auto"
        aria-label="Lista de canales"
        style={{ padding: '8px 0' }}
      >
        {groups.map((group) => (
          <div key={group.categoryId ?? 'uncategorized'} style={{ marginBottom: '16px' }}>
            <div
              className="bmw-label"
              style={{
                padding: '8px 16px 4px',
                color: 'var(--bmw-muted)',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              {group.categoryName || 'SIN CATEGORÍA'}
            </div>
            {group.channels.length === 0 ? (
              <p
                className="bmw-body-xs"
                style={{
                  padding: '8px 16px',
                  color: 'var(--bmw-muted)',
                  fontStyle: 'italic',
                }}
              >
                Sin canales
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {group.channels.map((channel) => (
                  <ChannelItem
                    key={channel.id}
                    channel={channel}
                    isSelected={selectedChannel?.id === channel.id}
                    onSelect={() => onSelectChannel(channel)}
                  />
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
