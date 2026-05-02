import React, { useState } from 'react';

interface MemberAvatarProps {
  avatar: string | null;
  username: string;
  id: string;
  size?: number;
}

export const MemberAvatar: React.FC<MemberAvatarProps> = ({ 
  avatar, 
  username, 
  id,
  size = 40 
}) => {
  const [imageError, setImageError] = useState(false);

  const getAvatarUrl = () => {
    if (!avatar) return null;
    return `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=${size * 2}`;
  };

  const getInitials = () => {
    return username.slice(0, 2).toUpperCase();
  };

  const avatarUrl = getAvatarUrl();

  if (avatarUrl && !imageError) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          display: 'block'
        }}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #1c69d4 0%, #9b59b6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontWeight: 700,
        fontSize: `${size * 0.4}px`,
        flexShrink: 0
      }}
    >
      {getInitials()}
    </div>
  );
};
