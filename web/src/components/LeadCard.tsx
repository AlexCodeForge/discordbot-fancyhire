import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lead } from '../types/Lead';
import { useState, useEffect } from 'react';
import { discordApi, DiscordMember } from '../services/discord';

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: lead.id });

  const [discordMember, setDiscordMember] = useState<DiscordMember | null>(null);

  useEffect(() => {
    const loadMemberData = async () => {
      if (!lead.discord_id) return;
      try {
        const members = await discordApi.getMembers();
        const member = members.find(m => m.id === lead.discord_id);
        if (member) setDiscordMember(member);
      } catch (error) {
        console.error('Error loading member data:', error);
      }
    };
    loadMemberData();
  }, [lead.discord_id]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  const dropIndicatorClass = isOver ? 'drop-indicator drop-indicator-top' : '';

  const hasUnreadMessages = lead.unread_count && lead.unread_count > 0;

  const getAvatarUrl = () => {
    if (!discordMember?.avatar || !discordMember?.id) return null;
    return `https://cdn.discordapp.com/avatars/${discordMember.id}/${discordMember.avatar}.png?size=64`;
  };

  const getInitials = () => {
    return lead.name.slice(0, 2).toUpperCase();
  };

  const avatarUrl = getAvatarUrl();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bmw-card cursor-pointer mb-3 ${dropIndicatorClass}`}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--bmw-ink)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--bmw-hairline)';
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div style={{ flexShrink: 0 }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={lead.name}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--bmw-primary) 0%, var(--bmw-primary-active) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--bmw-on-primary)',
                fontWeight: 700,
                fontSize: '16px'
              }}
            >
              {getInitials()}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="bmw-title-sm" style={{ marginBottom: 0 }}>{lead.name}</h3>
            {hasUnreadMessages && (
              <div className="relative" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bmw-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--bmw-on-primary)'
                }}>
                  {lead.unread_count && lead.unread_count > 9 ? '9+' : lead.unread_count}
                </div>
              </div>
            )}
            {lead.source === 'auto' && (
              <span className="bmw-body-sm" style={{ 
                fontSize: '10px',
                fontWeight: 700,
                backgroundColor: 'var(--bmw-surface-strong)',
                color: 'var(--bmw-ink)',
                padding: '2px 6px',
                borderRadius: '0'
              }}>AUTO</span>
            )}
          </div>
          
          <div className="bmw-body-sm" style={{ color: 'var(--bmw-muted)', fontSize: '12px', marginBottom: '4px' }}>
            {lead.discord_tag || lead.contact_discord}
          </div>

          {discordMember && discordMember.roles.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {discordMember.roles.slice(0, 2).map((role) => (
                <span
                  key={role.id}
                  className="inline-block px-2 py-1 text-xs rounded-full font-medium"
                  style={{ 
                    backgroundColor: role.color && role.color !== '#000000' ? role.color : '#99AAB5',
                    color: role.color && role.color !== '#000000' && parseInt(role.color.slice(1), 16) > 0x888888 ? '#000000' : '#FFFFFF',
                    fontSize: '10px'
                  }}
                >
                  {role.name}
                </span>
              ))}
              {discordMember.roles.length > 2 && (
                <span className="bmw-body-sm" style={{ color: 'var(--bmw-muted)', fontSize: '10px' }}>
                  +{discordMember.roles.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {lead.service_interest && (
        <div className="bmw-body-sm line-clamp-2" style={{ 
          fontSize: '12px',
          color: 'var(--bmw-body)',
          marginBottom: '8px'
        }}>
          {lead.service_interest}
        </div>
      )}
      
      {lead.assigned_to && (
        <div className="bmw-body-sm" style={{ 
          fontSize: '11px',
          color: 'var(--bmw-muted-soft)',
          paddingTop: '8px',
          borderTop: '1px solid var(--bmw-hairline)'
        }}>
          👤 {lead.assigned_to}
        </div>
      )}
    </div>
  );
}
