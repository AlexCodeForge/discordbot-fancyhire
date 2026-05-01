import { useMemo } from 'react';
import { Channel } from '../types/Channel';

export interface ChannelSidebarProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  onCreateChannel: () => void;
}

/** Discord API channel type for GUILD_CATEGORY */
export function isCategoryChannel(c: Channel): boolean {
  const t = Number(c.type);
  if (t === 4) return true;
  const s = String(c.type).toUpperCase();
  return s.includes('GUILD_CATEGORY') || s === 'GUILDCATEGORY';
}

interface ChannelGroup {
  parentId: string | null;
  categoryLabel: string | null;
  items: Channel[];
}

function buildChannelGroups(channels: Channel[]): ChannelGroup[] {
  const categoryNameById = new Map<string, string>();
  for (const c of channels) {
    if (isCategoryChannel(c)) {
      categoryNameById.set(c.discord_channel_id, c.name);
    }
  }

  const leaves = channels.filter((c) => !isCategoryChannel(c));
  const sortedLeaves = [...leaves].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return a.id - b.id;
  });

  const byParent = new Map<string | null, Channel[]>();
  for (const ch of sortedLeaves) {
    const key = ch.parent_id ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(ch);
  }

  const keys = Array.from(byParent.keys());
  const minPos = (parentKey: string | null): number => {
    const list = byParent.get(parentKey);
    if (!list?.length) return 0;
    return Math.min(...list.map((c) => c.position));
  };
  keys.sort((a, b) => minPos(a) - minPos(b));

  return keys.map((parentId) => {
    const items = byParent.get(parentId)!;
    let categoryLabel: string | null = null;
    if (parentId !== null) {
      categoryLabel = categoryNameById.get(parentId) ?? 'Categoría';
    }
    return { parentId, categoryLabel, items };
  });
}

export function ChannelSidebar({
  channels,
  selectedChannel,
  onSelectChannel,
  onCreateChannel,
}: ChannelSidebarProps) {
  const groups = useMemo(() => buildChannelGroups(channels), [channels]);

  return (
    <aside
      className="flex flex-col shrink-0 box-border"
      style={{
        width: '240px',
        minHeight: '100vh',
        height: '100vh',
        backgroundColor: 'var(--bmw-surface-1)',
        borderRight: '1px solid var(--bmw-on-surface-variant)',
      }}
    >
      <header
        className="flex flex-row items-center justify-between gap-3 shrink-0"
        style={{ padding: '16px' }}
      >
        <h2 className="bmw-title-md" style={{ margin: 0 }}>
          Canales
        </h2>
        <button
          type="button"
          className="inline-flex items-center justify-center shrink-0 border-0 cursor-pointer"
          onClick={onCreateChannel}
          aria-label="Crear canal"
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: 'var(--bmw-primary)',
            color: 'var(--bmw-on-primary)',
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: '18px',
            lineHeight: 1,
            letterSpacing: '0.5px',
            borderRadius: 0,
            transition: 'background-color 200ms ease, color 200ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bmw-primary-active)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bmw-primary)';
          }}
        >
          +
        </button>
      </header>

      <nav
        className="flex flex-col flex-1 min-h-0 overflow-y-auto"
        aria-label="Lista de canales"
      >
        {groups.map((group) => (
          <div key={group.parentId ?? 'uncategorized'}>
            {group.categoryLabel && (
              <div
                className="bmw-label"
                style={{
                  padding: '8px 16px 4px',
                  color: 'var(--bmw-muted)',
                  fontSize: '12px',
                  letterSpacing: '1px',
                }}
              >
                {group.categoryLabel}
              </div>
            )}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {group.items.map((channel) => {
                const isSelected = selectedChannel?.id === channel.id;
                return (
                  <li key={channel.id}>
                    <button
                      type="button"
                      onClick={() => onSelectChannel(channel)}
                      className="bmw-body-sm w-full text-left border-0 cursor-pointer"
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px 16px',
                        margin: 0,
                        fontFamily: 'inherit',
                        backgroundColor: isSelected
                          ? 'var(--bmw-primary)'
                          : 'transparent',
                        color: isSelected
                          ? 'var(--bmw-on-primary)'
                          : 'var(--bmw-body)',
                        transition:
                          'background-color 200ms ease, color 200ms ease',
                      }}
                      onMouseEnter={(e) => {
                        if (isSelected) return;
                        e.currentTarget.style.backgroundColor =
                          'var(--bmw-surface-strong)';
                      }}
                      onMouseLeave={(e) => {
                        if (isSelected) return;
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      #{channel.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
