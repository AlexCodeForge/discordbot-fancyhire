import { Conversation } from '../../types/Conversation';
import { MemberAvatar } from '../ui/MemberAvatar';
import { STAGE_LABELS } from '../../types/Lead';

interface ConversationItemProps {
  conversation: Conversation;
  onClick: () => void;
}

export function ConversationItem({ conversation, onClick }: ConversationItemProps) {
  const { lead, lastMessage, unreadCount } = conversation;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const truncateMessage = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      nuevo: 'var(--bmw-primary)',
      contactado: '#9333ea',
      propuesta_enviada: '#f59e0b',
      negociacion: '#3b82f6',
      ganado: '#22c55e',
      perdido: '#dc2626',
    };
    return colors[status] || 'var(--bmw-primary)';
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-4 cursor-pointer transition-all"
      style={{
        borderBottom: '1px solid var(--bmw-hairline)',
        backgroundColor: unreadCount > 0 ? 'var(--bmw-surface-soft)' : 'var(--bmw-canvas)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bmw-surface-card)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = unreadCount > 0 ? 'var(--bmw-surface-soft)' : 'var(--bmw-canvas)';
      }}
    >
      <MemberAvatar
        avatar={lead.avatar || null}
        username={lead.username || lead.name}
        id={lead.discord_id || '0'}
        size={48}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span 
            className="bmw-body-sm" 
            style={{ 
              color: 'var(--bmw-ink)', 
              fontWeight: unreadCount > 0 ? 700 : 400 
            }}
          >
            {lead.name}
          </span>
          <span
            className="px-2 py-0.5 text-xs"
            style={{
              backgroundColor: getStatusColor(lead.stage),
              color: '#ffffff',
              borderRadius: '0',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            {STAGE_LABELS[lead.stage]}
          </span>
        </div>
        
        <div 
          className="bmw-body-sm" 
          style={{ 
            color: unreadCount > 0 ? 'var(--bmw-ink)' : 'var(--bmw-muted)',
            fontSize: '14px',
            fontWeight: unreadCount > 0 ? 500 : 300
          }}
        >
          {lastMessage.senderType === 'admin' && (
            <span style={{ color: 'var(--bmw-primary)', marginRight: '4px' }}>Tú:</span>
          )}
          {truncateMessage(lastMessage.content)}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span 
          className="bmw-body-sm" 
          style={{ 
            color: 'var(--bmw-muted)', 
            fontSize: '12px',
            whiteSpace: 'nowrap'
          }}
        >
          {formatTimeAgo(lastMessage.sentAt)}
        </span>
        
        {unreadCount > 0 && (
          <div
            className="flex items-center justify-center"
            style={{
              minWidth: '20px',
              height: '20px',
              backgroundColor: 'var(--bmw-primary)',
              color: 'var(--bmw-on-primary)',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '0 6px',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </div>
    </div>
  );
}
