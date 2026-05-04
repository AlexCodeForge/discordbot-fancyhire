import { Conversation } from '../../types/Conversation';
import { ConversationItem } from './ConversationItem';

interface ConversationListProps {
  conversations: Conversation[];
  onConversationClick: (conversation: Conversation) => void;
}

export function ConversationList({ conversations, onConversationClick }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16"
        style={{
          backgroundColor: 'var(--bmw-canvas)',
          border: '1px solid var(--bmw-hairline)',
          borderRadius: '0',
        }}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ color: 'var(--bmw-muted)', marginBottom: '16px' }}
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)' }}>
          No hay conversaciones
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--bmw-canvas)',
        border: '1px solid var(--bmw-hairline)',
        borderRadius: '0',
        overflow: 'hidden',
      }}
    >
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.lead.id}
          conversation={conversation}
          onClick={() => onConversationClick(conversation)}
        />
      ))}
    </div>
  );
}
