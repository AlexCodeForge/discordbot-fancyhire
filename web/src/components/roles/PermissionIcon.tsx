import React from 'react';

interface PermissionIconProps {
  type: 'administrator' | 'manageGuild' | 'manageRoles' | 'manageChannels' | 'kickMembers' | 'banMembers';
  hasPermission: boolean;
}

const permissionLabels = {
  administrator: 'Administrator',
  manageGuild: 'Manage Server',
  manageRoles: 'Manage Roles',
  manageChannels: 'Manage Channels',
  kickMembers: 'Kick Members',
  banMembers: 'Ban Members'
};

const permissionIcons = {
  administrator: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  manageGuild: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  manageRoles: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  manageChannels: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0-7-9-7-9-7s-9 0-9 7c0 3 0 7 9 7s9-4 9-7z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  kickMembers: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  banMembers: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  )
};

export const PermissionIcon: React.FC<PermissionIconProps> = ({ type, hasPermission }) => {
  if (!hasPermission) return null;

  return (
    <span
      className="inline-flex items-center justify-center text-gray-600"
      title={permissionLabels[type]}
    >
      {permissionIcons[type]}
    </span>
  );
};
