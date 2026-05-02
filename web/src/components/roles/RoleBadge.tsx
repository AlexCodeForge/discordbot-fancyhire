import React from 'react';
import { DiscordRole } from '../../services/discord';

interface RoleBadgeProps {
  role: DiscordRole;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const backgroundColor = role.color && role.color !== '#000000' ? role.color : '#99AAB5';
  
  const luminance = (hex: string) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    return 0.299 * r + 0.587 * g + 0.114 * b;
  };

  const textColor = luminance(backgroundColor) > 128 ? '#000000' : '#FFFFFF';

  return (
    <span
      className="inline-block px-2 py-1 text-xs rounded-full font-medium"
      style={{ backgroundColor, color: textColor }}
      title={`${role.name} (Position: ${role.position})`}
    >
      {role.name}
    </span>
  );
};
