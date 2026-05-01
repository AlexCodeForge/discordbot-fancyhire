import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { RoleModal } from '../components/RoleModal';
import { RoleMembersModal } from '../components/RoleMembersModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { discordApi, GuildRoleDetailed, Guild } from '../services/discord';

export function RolesPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState<string>('');
  const [roles, setRoles] = useState<GuildRoleDetailed[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<GuildRoleDetailed | undefined>();
  const [error, setError] = useState('');
  const [deletingRole, setDeletingRole] = useState<GuildRoleDetailed | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [botRolePosition, setBotRolePosition] = useState<number>(0);
  const [viewingRole, setViewingRole] = useState<GuildRoleDetailed | null>(null);

  useEffect(() => {
    loadGuilds();
  }, []);

  useEffect(() => {
    if (selectedGuildId) {
      loadRoles();
    }
  }, [selectedGuildId]);

  const loadGuilds = async () => {
    try {
      const data = await discordApi.getGuilds();
      setGuilds(data);
      if (data.length > 0 && !selectedGuildId) {
        setSelectedGuildId(data[0].id);
      }
    } catch (err) {
      console.error('Error cargando servidores:', err);
      setError('Error al cargar servidores');
    }
  };

  const loadRoles = async () => {
    if (!selectedGuildId) return;
    
    setLoading(true);
    setError('');
    try {
      const data = await discordApi.getGuildRoles(selectedGuildId);
      const rolesWithDetails = await Promise.all(
        data.map(async (role) => {
          try {
            const count = await discordApi.getRoleMembersCount(role.id, selectedGuildId);
            return { ...role, membersCount: count };
          } catch {
            return { ...role, membersCount: 0 };
          }
        })
      );
      setRoles(rolesWithDetails as GuildRoleDetailed[]);
      
      const botRole = rolesWithDetails.find(r => r.name === 'CRM Leads Bot' || r.managed);
      if (botRole) {
        setBotRolePosition(botRole.position);
      }
    } catch (err: any) {
      console.error('Error cargando roles:', err);
      setError(err.response?.data?.message || 'Error al cargar roles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = () => {
    setEditingRole(undefined);
    setShowModal(true);
  };

  const handleEditRole = (role: GuildRoleDetailed) => {
    setEditingRole(role);
    setShowModal(true);
  };

  const handleSaveRole = async (roleData: any) => {
    try {
      if (editingRole) {
        await discordApi.updateRole(editingRole.id, roleData);
      } else {
        await discordApi.createRole(roleData);
      }
      await loadRoles();
      setShowModal(false);
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;
    
    setDeleteLoading(true);
    try {
      await discordApi.deleteRole(deletingRole.id, selectedGuildId);
      await loadRoles();
      setDeletingRole(null);
      setError('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Error al eliminar rol';
      setError(errorMsg);
      setDeletingRole(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleMoveRole = async (roleId: string, direction: 'up' | 'down') => {
    const roleIndex = roles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) return;

    const currentRole = roles[roleIndex];
    const newPosition = direction === 'up' 
      ? currentRole.position + 1 
      : currentRole.position - 1;

    if (newPosition < 0) return;

    try {
      await discordApi.updateRolePosition(roleId, selectedGuildId, newPosition);
      await loadRoles();
      setError('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Error al reordenar rol';
      setError(errorMsg);
    }
  };

  const getPermissionBadges = (permissions: string) => {
    const permBigInt = BigInt(permissions);
    const badges: string[] = [];

    if ((permBigInt & BigInt('0x8')) === BigInt('0x8')) badges.push('Admin');
    if ((permBigInt & BigInt('0x20')) === BigInt('0x20')) badges.push('Manage Server');
    if ((permBigInt & BigInt('0x10000000')) === BigInt('0x10000000')) badges.push('Manage Roles');

    return badges;
  };

  return (
    <Layout>
      <div style={{ padding: '32px' }}>
        <div className="max-w-screen-xl mx-auto">
          <div
            style={{
              marginBottom: '32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <h1
                className="bmw-display-md"
                style={{
                  color: 'var(--bmw-ink)',
                  marginBottom: '8px',
                }}
              >
                Gestión de Roles
              </h1>
              <p
                className="bmw-body-md"
                style={{
                  color: 'var(--bmw-muted)',
                }}
              >
                Administra los roles del servidor Discord
              </p>
            </div>
            <button onClick={handleCreateRole} className="bmw-btn-primary">
              + Crear Rol
            </button>
          </div>

          {guilds.length > 0 && (
            <div 
              className="bmw-card"
              style={{ 
                marginBottom: '24px',
                padding: '24px'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                gap: '24px',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: '1', minWidth: '250px' }}>
                  <label
                    className="bmw-label-uppercase"
                    style={{
                      display: 'block',
                      marginBottom: '12px',
                      color: 'var(--bmw-body-strong)',
                    }}
                  >
                    Servidor Discord
                  </label>
                  <select
                    value={selectedGuildId}
                    onChange={(e) => setSelectedGuildId(e.target.value)}
                    className="bmw-text-input"
                    style={{ width: '100%', maxWidth: '400px' }}
                  >
                    {guilds.map((guild) => (
                      <option key={guild.id} value={guild.id}>
                        {guild.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '16px',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ 
                    padding: '12px 24px',
                    backgroundColor: 'var(--bmw-surface-soft)',
                    borderRadius: '0',
                    textAlign: 'center'
                  }}>
                    <div 
                      className="bmw-body-sm" 
                      style={{ 
                        color: 'var(--bmw-muted)',
                        marginBottom: '4px',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Total Roles
                    </div>
                    <div 
                      className="bmw-display-sm" 
                      style={{ 
                        color: 'var(--bmw-primary)',
                        fontWeight: 700
                      }}
                    >
                      {roles.length}
                    </div>
                  </div>
                  
                  <div style={{ 
                    padding: '12px 24px',
                    backgroundColor: 'var(--bmw-surface-soft)',
                    borderRadius: '0',
                    textAlign: 'center'
                  }}>
                    <div 
                      className="bmw-body-sm" 
                      style={{ 
                        color: 'var(--bmw-muted)',
                        marginBottom: '4px',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Editables
                    </div>
                    <div 
                      className="bmw-display-sm" 
                      style={{ 
                        color: 'var(--bmw-success)',
                        fontWeight: 700
                      }}
                    >
                      {roles.filter(r => !r.managed && r.position <= botRolePosition).length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '16px',
                marginBottom: '24px',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid var(--bmw-error)',
                borderRadius: '0',
              }}
            >
              <p className="bmw-body-sm" style={{ color: 'var(--bmw-error)' }}>
                {error}
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center" style={{ padding: '48px' }}>
              <p className="bmw-body-md" style={{ color: 'var(--bmw-muted)' }}>
                Cargando roles...
              </p>
            </div>
          ) : (
            <div
              className="bmw-card"
              style={{
                padding: '0',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: 'var(--bmw-surface-soft)',
                      borderBottom: '1px solid var(--bmw-hairline)',
                    }}
                  >
                    <th
                      className="bmw-label-uppercase"
                      style={{
                        textAlign: 'left',
                        padding: '16px 24px',
                        color: 'var(--bmw-body-strong)',
                      }}
                    >
                      Posición
                    </th>
                    <th
                      className="bmw-label-uppercase"
                      style={{
                        textAlign: 'left',
                        padding: '16px 24px',
                        color: 'var(--bmw-body-strong)',
                      }}
                    >
                      Rol
                    </th>
                    <th
                      className="bmw-label-uppercase"
                      style={{
                        textAlign: 'left',
                        padding: '16px 24px',
                        color: 'var(--bmw-body-strong)',
                      }}
                    >
                      Miembros
                    </th>
                    <th
                      className="bmw-label-uppercase"
                      style={{
                        textAlign: 'left',
                        padding: '16px 24px',
                        color: 'var(--bmw-body-strong)',
                      }}
                    >
                      Permisos
                    </th>
                    <th
                      className="bmw-label-uppercase"
                      style={{
                        textAlign: 'right',
                        padding: '16px 24px',
                        color: 'var(--bmw-body-strong)',
                      }}
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role, index) => {
                    const isBotRole = role.name === 'CRM Leads Bot' || role.name.includes('bot');
                    const isAboveBot = role.position > botRolePosition;
                    const isEditable = !role.managed && !isAboveBot;
                    
                    return (
                    <tr
                      key={role.id}
                      style={{
                        borderBottom:
                          index < roles.length - 1 ? '1px solid var(--bmw-hairline)' : 'none',
                        backgroundColor: isBotRole ? 'rgba(28, 105, 212, 0.05)' : 
                                       isAboveBot ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                        opacity: isAboveBot ? 0.6 : 1,
                      }}
                    >
                      <td
                        className="bmw-body-sm"
                        style={{
                          padding: '16px 24px',
                          color: 'var(--bmw-muted)',
                        }}
                      >
                        #{role.position}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '12px',
                              height: '12px',
                              backgroundColor: role.color || '#99aab5',
                              borderRadius: '50%',
                            }}
                          />
                          <span
                            className="bmw-body-md"
                            style={{
                              color: 'var(--bmw-ink)',
                              fontWeight: role.managed || isBotRole ? 700 : 400,
                            }}
                          >
                            {role.name}
                          </span>
                          {isBotRole && (
                            <span
                              className="bmw-caption"
                              style={{
                                padding: '2px 8px',
                                backgroundColor: 'var(--bmw-primary)',
                                color: 'var(--bmw-on-primary)',
                                borderRadius: '0',
                              }}
                            >
                              Bot
                            </span>
                          )}
                          {role.managed && (
                            <span
                              className="bmw-caption"
                              style={{
                                padding: '2px 8px',
                                backgroundColor: 'var(--bmw-surface-strong)',
                                color: 'var(--bmw-muted)',
                                borderRadius: '0',
                              }}
                            >
                              Managed
                            </span>
                          )}
                          {isAboveBot && !isBotRole && (
                            <span
                              className="bmw-caption"
                              style={{
                                padding: '2px 8px',
                                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                                color: 'var(--bmw-error)',
                                borderRadius: '0',
                              }}
                            >
                              Por encima del bot
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className="bmw-body-sm"
                        style={{
                          padding: '16px 24px',
                          color: 'var(--bmw-body)',
                        }}
                      >
                        {role.membersCount || 0}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {getPermissionBadges(role.permissions).map((badge) => (
                            <span
                              key={badge}
                              className="bmw-caption"
                              style={{
                                padding: '4px 8px',
                                backgroundColor: 'rgba(28, 105, 212, 0.1)',
                                color: 'var(--bmw-primary)',
                                borderRadius: '0',
                              }}
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                          }}
                        >
                          <button
                            onClick={() => setViewingRole(role)}
                            className="bmw-btn-text"
                            style={{
                              padding: '8px 16px',
                              fontSize: '12px',
                              color: 'var(--bmw-primary)',
                            }}
                            title="Ver miembros"
                          >
                            Ver ({role.membersCount || 0})
                          </button>
                          {isEditable ? (
                            <>
                              <button
                                onClick={() => handleMoveRole(role.id, 'up')}
                                className="bmw-btn-text"
                                style={{
                                  padding: '8px',
                                  fontSize: '12px',
                                }}
                                title="Subir"
                              >
                                ↑
                              </button>
                              <button
                                onClick={() => handleMoveRole(role.id, 'down')}
                                className="bmw-btn-text"
                                style={{
                                  padding: '8px',
                                  fontSize: '12px',
                                }}
                                title="Bajar"
                              >
                                ↓
                              </button>
                              <button
                                onClick={() => handleEditRole(role)}
                                className="bmw-btn-secondary"
                                style={{
                                  padding: '8px 16px',
                                  fontSize: '12px',
                                }}
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => setDeletingRole(role)}
                                className="bmw-btn-text"
                                style={{
                                  padding: '8px 16px',
                                  fontSize: '12px',
                                  color: 'var(--bmw-error)',
                                }}
                              >
                                Eliminar
                              </button>
                            </>
                          ) : (
                            <span
                              className="bmw-caption"
                              style={{
                                color: 'var(--bmw-muted)',
                                padding: '8px',
                              }}
                            >
                              {isAboveBot ? 'Fuera de alcance' : 'No editable'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>

              {roles.length === 0 && !loading && (
                <div
                  style={{
                    padding: '48px',
                    textAlign: 'center',
                  }}
                >
                  <p className="bmw-body-md" style={{ color: 'var(--bmw-muted)' }}>
                    No hay roles disponibles
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <RoleModal
          role={editingRole}
          guildId={selectedGuildId}
          onClose={() => setShowModal(false)}
          onSave={handleSaveRole}
        />
      )}

      {viewingRole && (
        <RoleMembersModal
          roleId={viewingRole.id}
          roleName={viewingRole.name}
          roleColor={viewingRole.color}
          guildId={selectedGuildId}
          onClose={() => setViewingRole(null)}
        />
      )}

      <ConfirmationModal
        isOpen={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        onConfirm={handleDeleteRole}
        title="Eliminar Rol"
        message={`¿Estás seguro de que deseas eliminar el rol "${deletingRole?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteLoading}
      />
    </Layout>
  );
}
