import { useMemo, useState, useRef, useEffect } from 'react';
import { Channel } from '../types/Channel';

export interface ChannelSidebarImprovedProps {
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

function ChannelItem({
  channel,
  isSelected,
  onSelect,
}: ChannelItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="bmw-body-sm w-full text-left"
        style={{
          display: 'block',
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
      >
        #{channel.name}
      </button>
    </li>
  );
}

export function ChannelSidebarImproved({
  channels,
  selectedChannel,
  onSelectChannel,
  onCreateChannel,
  onOpenMoveModal,
  onManageCategories,
}: ChannelSidebarImprovedProps) {
  const groups = useMemo(() => buildChannelGroups(channels), [channels]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
      </header>

      <nav
        className="flex flex-col flex-1 min-h-0 overflow-y-auto"
        aria-label="Lista de canales"
        style={{ padding: '8px 0' }}
      >
        {groups.map((group) => (
          <div key={group.categoryId ?? 'uncategorized'} style={{ marginBottom: '16px' }}>
            {group.categoryName && (
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
                {group.categoryName}
              </div>
            )}
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
