import React from 'react';

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
  const getAvatarUrl = () => {
    if (!avatar) return null;
    return `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=${size * 2}`;
  };

  const getInitials = () => {
    return username.slice(0, 2).toUpperCase();
  };

  const avatarUrl = getAvatarUrl();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className="rounded-full"
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {getInitials()}
    </div>
  );
};
