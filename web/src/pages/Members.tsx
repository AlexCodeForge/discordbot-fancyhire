import { useState, useEffect, useMemo } from 'react';
import { discordApi, DiscordMember, Guild, GuildRole } from '../services/discord';
import { Layout } from '../components/Layout';
import { MemberAvatar } from '../components/MemberAvatar';
import { RoleBadge } from '../components/RoleBadge';
import { PermissionIcon } from '../components/PermissionIcon';

export function Members() {
  const [members, setMembers] = useState<DiscordMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'joined' | 'created'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingMember, setEditingMember] = useState<DiscordMember | null>(null);
  const [viewingMember, setViewingMember] = useState<DiscordMember | null>(null);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<string>('');
  const [guildRoles, setGuildRoles] = useState<GuildRole[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [updatingRoles, setUpdatingRoles] = useState(false);
  const itemsPerPage = 50;

  useEffect(() => {
    loadMembers();
    loadGuilds();
  }, []);

  useEffect(() => {
    if (selectedGuild) {
      loadGuildRoles(selectedGuild);
    }
  }, [selectedGuild]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await discordApi.getMembers();
      setMembers(data);
    } catch (error) {
      console.error('Error cargando miembros:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGuilds = async () => {
    try {
      const data = await discordApi.getGuilds();
      setGuilds(data);
      if (data.length > 0) {
        setSelectedGuild(data[0].id);
      }
    } catch (error) {
      console.error('Error cargando servidores:', error);
    }
  };

  const loadGuildRoles = async (guildId: string) => {
    try {
      const data = await discordApi.getGuildRoles(guildId);
      setGuildRoles(data);
    } catch (error) {
      console.error('Error cargando roles del servidor:', error);
    }
  };

  const handleEditRoles = (member: DiscordMember) => {
    setEditingMember(member);
    setSelectedRoleIds(member.roles.map(r => r.id));
  };

  const handleSaveRoles = async () => {
    if (!editingMember || !selectedGuild) return;

    try {
      setUpdatingRoles(true);
      await discordApi.updateMemberRoles(editingMember.id, selectedGuild, selectedRoleIds);
      alert('✓ Roles actualizados correctamente');
      setEditingMember(null);
      await loadMembers();
    } catch (error: any) {
      console.error('Error actualizando roles:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
      const errorType = error.response?.data?.error || '';
      
      let userMessage = '';
      
      if (errorMessage.includes('Missing Permissions') || errorType === 'Permisos insuficientes') {
        userMessage = '⚠ Error: El bot no tiene el permiso "Manage Roles".\n\nSolución:\n1. Ve a la configuración del servidor en Discord\n2. Roles → Selecciona el rol del bot\n3. Activa el permiso "Manage Roles"';
      } else if (errorType === 'Jerarquía de roles') {
        userMessage = `⚠ Error de jerarquía de roles:\n\n${errorMessage}\n\nSolución:\n1. Ve a Configuración del servidor → Roles\n2. Arrastra el rol del bot más arriba en la lista\n3. Debe estar por encima de los roles que quieres asignar`;
      } else {
        userMessage = `⚠ Error al actualizar roles:\n\n${errorMessage}`;
      }
      
      alert(userMessage);
    } finally {
      setUpdatingRoles(false);
    }
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const uniqueRoles = useMemo(() => {
    const roleMap = new Map<string, { id: string; name: string; color: string }>();
    members.forEach(member => {
      member.roles.forEach(role => {
        if (!roleMap.has(role.id)) {
          roleMap.set(role.id, { id: role.id, name: role.name, color: role.color });
        }
      });
    });
    return Array.from(roleMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [members]);

  const filteredAndSortedMembers = useMemo(() => {
    let result = [...members];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(member =>
        member.username.toLowerCase().includes(query) ||
        member.tag.toLowerCase().includes(query) ||
        member.display_name.toLowerCase().includes(query)
      );
    }

    if (selectedRole) {
      result = result.filter(member =>
        member.roles.some(role => role.id === selectedRole)
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.display_name.localeCompare(b.display_name);
          break;
        case 'joined':
          const dateA = a.joined_at ? new Date(a.joined_at).getTime() : 0;
          const dateB = b.joined_at ? new Date(b.joined_at).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [members, searchQuery, selectedRole, sortBy, sortOrder]);

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAndSortedMembers.slice(start, end);
  }, [filteredAndSortedMembers, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedMembers.length / itemsPerPage);

  const formatRelativeDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 30) return `Hace ${diffDays} días`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
    return `Hace ${Math.floor(diffDays / 365)} años`;
  };

  const formatFullDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div style={{ padding: '32px' }}>
        <div className="max-w-screen-2xl mx-auto">
          <div style={{ marginBottom: '24px' }}>
            <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)', fontSize: '12px' }}>
              Total: {filteredAndSortedMembers.length} miembros
            </p>
          </div>

          <div className="bmw-card mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="bmw-label block mb-1">
                  Buscar:
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Nombre, usuario o tag..."
                  className="bmw-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ minWidth: '200px' }}>
                <label className="bmw-label block mb-1">
                  Filtrar por rol:
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bmw-input"
                  style={{ width: '100%' }}
                >
                  <option value="">Todos los roles</option>
                  {uniqueRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ minWidth: '200px' }}>
                <label className="bmw-label block mb-1">
                  Ordenar por:
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bmw-input"
                    style={{ flex: 1 }}
                  >
                    <option value="name">Nombre</option>
                    <option value="joined">Fecha de ingreso</option>
                    <option value="created">Antigüedad de cuenta</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="bmw-btn-secondary"
                    style={{ padding: '8px 12px' }}
                    title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="bmw-body-sm" style={{ color: 'var(--bmw-body)' }}>Cargando miembros...</div>
            </div>
          ) : (
            <>
              <div className="overflow-hidden" style={{ 
                backgroundColor: 'var(--bmw-canvas)',
                border: '1px solid var(--bmw-hairline)',
                borderRadius: '0'
              }}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={{ 
                      backgroundColor: 'var(--bmw-surface-soft)',
                      borderBottom: '1px solid var(--bmw-hairline)'
                    }}>
                      <tr>
                        <th className="px-4 py-3 text-left bmw-label">
                          Usuario
                        </th>
                        <th className="px-4 py-3 text-left bmw-label">
                          Roles
                        </th>
                        <th className="px-4 py-3 text-left bmw-label">
                          Ingreso
                        </th>
                        <th className="px-4 py-3 text-left bmw-label">
                          Antigüedad
                        </th>
                        <th className="px-4 py-3 text-left bmw-label">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody style={{ borderTop: '1px solid var(--bmw-hairline)' }}>
                      {paginatedMembers.map((member) => (
                        <tr 
                          key={member.id}
                          style={{ borderBottom: '1px solid var(--bmw-hairline)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bmw-surface-soft)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <MemberAvatar
                                avatar={member.avatar}
                                username={member.username}
                                id={member.id}
                                size={40}
                              />
                              <div>
                                <div className="bmw-body-sm" style={{ color: 'var(--bmw-ink)', fontWeight: 500 }}>
                                  {member.display_name}
                                </div>
                                <div className="bmw-body-sm" style={{ color: 'var(--bmw-muted)', fontSize: '12px' }}>
                                  {member.tag}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {member.roles.length > 0 ? (
                                member.roles.slice(0, 3).map((role) => (
                                  <RoleBadge key={role.id} role={role} />
                                ))
                              ) : (
                                <span className="bmw-body-sm" style={{ color: 'var(--bmw-muted)' }}>
                                  Sin roles
                                </span>
                              )}
                              {member.roles.length > 3 && (
                                <span className="bmw-body-sm" style={{ color: 'var(--bmw-muted)' }}>
                                  +{member.roles.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="bmw-body-sm" style={{ color: 'var(--bmw-body)' }}>
                              <span title={formatFullDate(member.joined_at)}>
                                {formatRelativeDate(member.joined_at)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="bmw-body-sm" style={{ color: 'var(--bmw-body)' }}>
                              <span title={formatFullDate(member.created_at)}>
                                {formatRelativeDate(member.created_at)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setViewingMember(member)}
                                className="bmw-btn-text"
                                style={{ 
                                  color: 'var(--bmw-primary)',
                                  fontSize: '14px',
                                  padding: '4px 8px'
                                }}
                                title="Ver detalles"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleEditRoles(member)}
                                className="bmw-btn-text"
                                style={{ 
                                  color: 'var(--bmw-primary)',
                                  fontSize: '14px',
                                  padding: '4px 8px'
                                }}
                                title="Editar roles"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="bmw-btn-secondary"
                    style={{ height: '40px', padding: '8px 24px' }}
                  >
                    Anterior
                  </button>
                  <span className="bmw-body-sm flex items-center" style={{ padding: '0 16px', color: 'var(--bmw-ink)' }}>
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="bmw-btn-secondary"
                    style={{ height: '40px', padding: '8px 24px' }}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {viewingMember && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div className="max-w-3xl w-full max-h-[90vh] overflow-auto" style={{ 
            backgroundColor: 'var(--bmw-surface-card)',
            borderRadius: '0',
            border: '1px solid var(--bmw-hairline)'
          }}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 style={{ fontSize: '32px', lineHeight: '1.15', fontWeight: 700, color: 'var(--bmw-ink)' }}>
                  Detalles del Miembro
                </h2>
                <button
                  onClick={() => setViewingMember(null)}
                  style={{ 
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--bmw-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex items-start gap-6 mb-6 pb-6" style={{ borderBottom: '1px solid var(--bmw-hairline)' }}>
                <MemberAvatar
                  avatar={viewingMember.avatar}
                  username={viewingMember.username}
                  id={viewingMember.id}
                  size={80}
                />
                <div className="flex-1">
                  <h3 style={{ fontSize: '24px', lineHeight: '1.25', fontWeight: 700, color: 'var(--bmw-ink)', marginBottom: '4px' }}>
                    {viewingMember.display_name}
                  </h3>
                  <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)', marginBottom: '8px' }}>
                    {viewingMember.tag}
                  </p>
                  <div className="bmw-body-sm" style={{ color: 'var(--bmw-body)' }}>
                    <span style={{ color: 'var(--bmw-muted)' }}>ID:</span> {viewingMember.id}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="bmw-label block mb-2">Nombre de Usuario</label>
                    <div className="bmw-body-sm" style={{ color: 'var(--bmw-ink)' }}>
                      {viewingMember.username}
                    </div>
                  </div>
                  <div>
                    <label className="bmw-label block mb-2">Nombre en Servidor</label>
                    <div className="bmw-body-sm" style={{ color: 'var(--bmw-ink)' }}>
                      {viewingMember.display_name}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="bmw-label block mb-2">Ingreso al Servidor</label>
                    <div className="bmw-body-sm" style={{ color: 'var(--bmw-ink)' }}>
                      {formatFullDate(viewingMember.joined_at)}
                    </div>
                    <div className="bmw-body-sm" style={{ color: 'var(--bmw-muted)', fontSize: '12px', marginTop: '4px' }}>
                      {formatRelativeDate(viewingMember.joined_at)}
                    </div>
                  </div>
                  <div>
                    <label className="bmw-label block mb-2">Cuenta Creada</label>
                    <div className="bmw-body-sm" style={{ color: 'var(--bmw-ink)' }}>
                      {formatFullDate(viewingMember.created_at)}
                    </div>
                    <div className="bmw-body-sm" style={{ color: 'var(--bmw-muted)', fontSize: '12px', marginTop: '4px' }}>
                      {formatRelativeDate(viewingMember.created_at)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="bmw-label block mb-2">
                    Roles ({viewingMember.roles.length})
                  </label>
                  {viewingMember.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {viewingMember.roles.map((role) => (
                        <RoleBadge key={role.id} role={role} />
                      ))}
                    </div>
                  ) : (
                    <div className="bmw-body-sm" style={{ color: 'var(--bmw-muted)' }}>
                      Sin roles asignados
                    </div>
                  )}
                </div>

                <div>
                  <label className="bmw-label block mb-3">Permisos</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3" style={{ 
                      backgroundColor: viewingMember.permissions.administrator 
                        ? 'var(--bmw-surface-soft)' 
                        : 'transparent',
                      border: '1px solid var(--bmw-hairline)'
                    }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: viewingMember.permissions.administrator 
                          ? 'var(--bmw-primary)' 
                          : 'var(--bmw-muted)'
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L2 7l10 5 10-5-10-5z" />
                          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                      </div>
                      <div>
                        <div className="bmw-body-sm" style={{ fontWeight: 500, color: 'var(--bmw-ink)' }}>
                          Administrator
                        </div>
                        <div className="bmw-body-sm" style={{ fontSize: '12px', color: 'var(--bmw-muted)' }}>
                          {viewingMember.permissions.administrator ? 'Sí' : 'No'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3" style={{ 
                      backgroundColor: viewingMember.permissions.manageGuild 
                        ? 'var(--bmw-surface-soft)' 
                        : 'transparent',
                      border: '1px solid var(--bmw-hairline)'
                    }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: viewingMember.permissions.manageGuild 
                          ? 'var(--bmw-primary)' 
                          : 'var(--bmw-muted)'
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </div>
                      <div>
                        <div className="bmw-body-sm" style={{ fontWeight: 500, color: 'var(--bmw-ink)' }}>
                          Manage Server
                        </div>
                        <div className="bmw-body-sm" style={{ fontSize: '12px', color: 'var(--bmw-muted)' }}>
                          {viewingMember.permissions.manageGuild ? 'Sí' : 'No'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3" style={{ 
                      backgroundColor: viewingMember.permissions.manageRoles 
                        ? 'var(--bmw-surface-soft)' 
                        : 'transparent',
                      border: '1px solid var(--bmw-hairline)'
                    }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: viewingMember.permissions.manageRoles 
                          ? 'var(--bmw-primary)' 
                          : 'var(--bmw-muted)'
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                      </div>
                      <div>
                        <div className="bmw-body-sm" style={{ fontWeight: 500, color: 'var(--bmw-ink)' }}>
                          Manage Roles
                        </div>
                        <div className="bmw-body-sm" style={{ fontSize: '12px', color: 'var(--bmw-muted)' }}>
                          {viewingMember.permissions.manageRoles ? 'Sí' : 'No'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3" style={{ 
                      backgroundColor: viewingMember.permissions.manageChannels 
                        ? 'var(--bmw-surface-soft)' 
                        : 'transparent',
                      border: '1px solid var(--bmw-hairline)'
                    }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: viewingMember.permissions.manageChannels 
                          ? 'var(--bmw-primary)' 
                          : 'var(--bmw-muted)'
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0-7-9-7-9-7s-9 0-9 7c0 3 0 7 9 7s9-4 9-7z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <div>
                        <div className="bmw-body-sm" style={{ fontWeight: 500, color: 'var(--bmw-ink)' }}>
                          Manage Channels
                        </div>
                        <div className="bmw-body-sm" style={{ fontSize: '12px', color: 'var(--bmw-muted)' }}>
                          {viewingMember.permissions.manageChannels ? 'Sí' : 'No'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3" style={{ 
                      backgroundColor: viewingMember.permissions.kickMembers 
                        ? 'var(--bmw-surface-soft)' 
                        : 'transparent',
                      border: '1px solid var(--bmw-hairline)'
                    }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: viewingMember.permissions.kickMembers 
                          ? 'var(--bmw-primary)' 
                          : 'var(--bmw-muted)'
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                      </div>
                      <div>
                        <div className="bmw-body-sm" style={{ fontWeight: 500, color: 'var(--bmw-ink)' }}>
                          Kick Members
                        </div>
                        <div className="bmw-body-sm" style={{ fontSize: '12px', color: 'var(--bmw-muted)' }}>
                          {viewingMember.permissions.kickMembers ? 'Sí' : 'No'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3" style={{ 
                      backgroundColor: viewingMember.permissions.banMembers 
                        ? 'var(--bmw-surface-soft)' 
                        : 'transparent',
                      border: '1px solid var(--bmw-hairline)'
                    }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: viewingMember.permissions.banMembers 
                          ? 'var(--bmw-primary)' 
                          : 'var(--bmw-muted)'
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </svg>
                      </div>
                      <div>
                        <div className="bmw-body-sm" style={{ fontWeight: 500, color: 'var(--bmw-ink)' }}>
                          Ban Members
                        </div>
                        <div className="bmw-body-sm" style={{ fontSize: '12px', color: 'var(--bmw-muted)' }}>
                          {viewingMember.permissions.banMembers ? 'Sí' : 'No'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 flex justify-between items-center" style={{ borderTop: '1px solid var(--bmw-hairline)' }}>
                <button
                  onClick={() => {
                    setViewingMember(null);
                    handleEditRoles(viewingMember);
                  }}
                  className="bmw-btn-secondary"
                  style={{ height: '40px', padding: '8px 24px' }}
                >
                  Editar Roles
                </button>
                <button
                  onClick={() => setViewingMember(null)}
                  className="bmw-btn-primary"
                  style={{ height: '40px', padding: '8px 24px' }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingMember && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div className="max-w-2xl w-full max-h-[90vh] overflow-auto" style={{ 
            backgroundColor: 'var(--bmw-surface-card)',
            borderRadius: '0',
            border: '1px solid var(--bmw-hairline)'
          }}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 style={{ fontSize: '24px', lineHeight: '1.25', fontWeight: 700, color: 'var(--bmw-ink)' }}>
                    Editar Roles
                  </h2>
                  <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)', marginTop: '4px' }}>
                    {editingMember.display_name} ({editingMember.tag})
                  </p>
                </div>
                <button
                  onClick={() => setEditingMember(null)}
                  disabled={updatingRoles}
                  style={{ 
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--bmw-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <label className="bmw-label block mb-2">
                  Servidor:
                </label>
                <select
                  value={selectedGuild}
                  onChange={(e) => setSelectedGuild(e.target.value)}
                  disabled={updatingRoles}
                  className="bmw-input"
                  style={{ width: '100%' }}
                >
                  {guilds.map((guild) => (
                    <option key={guild.id} value={guild.id}>
                      {guild.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="bmw-label block mb-2">
                  Roles disponibles:
                </label>
                <div className="space-y-2" style={{ 
                  maxHeight: '400px', 
                  overflowY: 'auto',
                  border: '1px solid var(--bmw-hairline)',
                  padding: '12px',
                  backgroundColor: 'var(--bmw-surface-soft)'
                }}>
                  {guildRoles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center gap-3 p-2 cursor-pointer"
                      style={{ 
                        backgroundColor: selectedRoleIds.includes(role.id) 
                          ? 'var(--bmw-canvas)' 
                          : 'transparent',
                        borderRadius: '0'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoleIds.includes(role.id)}
                        onChange={() => toggleRole(role.id)}
                        disabled={updatingRoles}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span
                        className="inline-block px-2 py-1 text-xs rounded-full font-medium"
                        style={{ 
                          backgroundColor: role.color && role.color !== '#000000' ? role.color : '#99AAB5',
                          color: role.color && role.color !== '#000000' && parseInt(role.color.slice(1), 16) > 0x888888 ? '#000000' : '#FFFFFF'
                        }}
                      >
                        {role.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setEditingMember(null)}
                  disabled={updatingRoles}
                  className="bmw-btn-secondary"
                  style={{ height: '40px', padding: '8px 24px' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveRoles}
                  disabled={updatingRoles}
                  className="bmw-btn-primary"
                  style={{ height: '40px', padding: '8px 24px' }}
                >
                  {updatingRoles ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
