import { useState, useEffect } from 'react';
import { GuildRoleDetailed } from '../../../services/discord';

interface RoleModalProps {
  role?: GuildRoleDetailed;
  guildId: string;
  onClose: () => void;
  onSave: (roleData: any) => Promise<void>;
}

const PERMISSION_GROUPS = {
  administrative: {
    label: 'Administrativos',
    permissions: [
      { key: 'Administrator', label: 'Administrator', flag: '0x8' },
      { key: 'ManageGuild', label: 'Manage Server', flag: '0x20' },
      { key: 'ManageRoles', label: 'Manage Roles', flag: '0x10000000' },
    ],
  },
  moderation: {
    label: 'Moderación',
    permissions: [
      { key: 'KickMembers', label: 'Kick Members', flag: '0x2' },
      { key: 'BanMembers', label: 'Ban Members', flag: '0x4' },
      { key: 'ManageMessages', label: 'Manage Messages', flag: '0x2000' },
      { key: 'ModerateMembers', label: 'Timeout Members', flag: '0x10000000000' },
    ],
  },
  general: {
    label: 'Generales',
    permissions: [
      { key: 'ViewChannel', label: 'View Channel', flag: '0x400' },
      { key: 'SendMessages', label: 'Send Messages', flag: '0x800' },
      { key: 'MentionEveryone', label: 'Mention Everyone', flag: '0x20000' },
    ],
  },
  management: {
    label: 'Gestión',
    permissions: [
      { key: 'ManageChannels', label: 'Manage Channels', flag: '0x10' },
      { key: 'ManageNicknames', label: 'Manage Nicknames', flag: '0x8000000' },
      { key: 'ManageEmojisAndStickers', label: 'Manage Emojis', flag: '0x40000000' },
    ],
  },
};

const PRESET_COLORS = [
  '#99aab5', '#1abc9c', '#2ecc71', '#3498db', '#9b59b6',
  '#e91e63', '#f1c40f', '#e67e22', '#e74c3c', '#95a5a6',
  '#607d8b', '#11806a', '#1f8b4c', '#206694', '#71368a',
];

export function RoleModal({ role, guildId, onClose, onSave }: RoleModalProps) {
  const [name, setName] = useState(role?.name || '');
  const [color, setColor] = useState(role?.color || '#99aab5');
  const [hoist, setHoist] = useState(role?.hoist || false);
  const [mentionable, setMentionable] = useState(role?.mentionable || false);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (role?.permissions) {
      const permBigInt = BigInt(role.permissions);
      const activePerms = new Set<string>();
      
      Object.values(PERMISSION_GROUPS).forEach(group => {
        group.permissions.forEach(perm => {
          const flag = BigInt(perm.flag);
          if ((permBigInt & flag) === flag) {
            activePerms.add(perm.key);
          }
        });
      });
      
      setPermissions(activePerms);
    }
  }, [role]);

  const togglePermission = (key: string) => {
    setPermissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('El nombre del rol es requerido');
      return;
    }

    if (name.length > 100) {
      setError('El nombre no puede exceder 100 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const permissionsArray: string[] = [];
      Object.values(PERMISSION_GROUPS).forEach(group => {
        group.permissions.forEach(perm => {
          if (permissions.has(perm.key)) {
            permissionsArray.push(perm.flag);
          }
        });
      });

      const roleData = {
        guildId,
        name: name.trim(),
        color: color,
        permissions: permissionsArray,
        hoist,
        mentionable,
      };

      await onSave(roleData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al guardar rol');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      }}
      onClick={onClose}
    >
      <div
        className="bmw-card"
        style={{
          width: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--bmw-hairline)',
          }}
        >
          <h2
            className="bmw-title-lg"
            style={{
              color: 'var(--bmw-ink)',
              marginBottom: '4px',
            }}
          >
            {role ? 'Editar Rol' : 'Crear Rol'}
          </h2>
          <p
            className="bmw-body-sm"
            style={{
              color: 'var(--bmw-muted)',
            }}
          >
            {role ? 'Modifica las propiedades del rol' : 'Configura el nuevo rol del servidor'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px' }}>
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  border: '1px solid var(--bmw-error)',
                  borderRadius: '0',
                  marginBottom: '24px',
                }}
              >
                <p
                  className="bmw-body-sm"
                  style={{
                    color: 'var(--bmw-error)',
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label
                className="bmw-label-uppercase"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: 'var(--bmw-body-strong)',
                }}
              >
                Nombre del Rol
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bmw-text-input"
                placeholder="Ej: Moderador"
                maxLength={100}
                disabled={loading}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                className="bmw-label-uppercase"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: 'var(--bmw-body-strong)',
                }}
              >
                Color del Rol
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {PRESET_COLORS.map((presetColor) => (
                  <button
                    key={presetColor}
                    type="button"
                    onClick={() => setColor(presetColor)}
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: presetColor,
                      border: color === presetColor ? '3px solid var(--bmw-primary)' : '1px solid var(--bmw-hairline)',
                      borderRadius: '0',
                      cursor: 'pointer',
                    }}
                    disabled={loading}
                  />
                ))}
              </div>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  border: '1px solid var(--bmw-hairline)',
                  borderRadius: '0',
                  cursor: 'pointer',
                }}
                disabled={loading}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={hoist}
                  onChange={(e) => setHoist(e.target.checked)}
                  disabled={loading}
                />
                <span className="bmw-body-md" style={{ color: 'var(--bmw-ink)' }}>
                  Mostrar miembros separadamente en la lista
                </span>
              </label>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={mentionable}
                  onChange={(e) => setMentionable(e.target.checked)}
                  disabled={loading}
                />
                <span className="bmw-body-md" style={{ color: 'var(--bmw-ink)' }}>
                  Permitir que cualquiera mencione este rol
                </span>
              </label>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                className="bmw-label-uppercase"
                style={{
                  display: 'block',
                  marginBottom: '16px',
                  color: 'var(--bmw-body-strong)',
                }}
              >
                Permisos
              </label>

              {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => (
                <div key={groupKey} style={{ marginBottom: '16px' }}>
                  <h4
                    className="bmw-title-sm"
                    style={{
                      color: 'var(--bmw-body-strong)',
                      marginBottom: '8px',
                    }}
                  >
                    {group.label}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {group.permissions.map((perm) => (
                      <label
                        key={perm.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          padding: '8px',
                          backgroundColor: permissions.has(perm.key)
                            ? 'rgba(28, 105, 212, 0.1)'
                            : 'transparent',
                          borderRadius: '0',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={permissions.has(perm.key)}
                          onChange={() => togglePermission(perm.key)}
                          disabled={loading}
                        />
                        <span className="bmw-body-sm" style={{ color: 'var(--bmw-ink)' }}>
                          {perm.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: '24px',
              borderTop: '1px solid var(--bmw-hairline)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="bmw-btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bmw-btn-primary"
              disabled={loading}
            >
              {loading ? 'Guardando...' : role ? 'Guardar Cambios' : 'Crear Rol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
