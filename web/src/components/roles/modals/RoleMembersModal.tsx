import { useState, useEffect, useMemo } from 'react';
import { discordApi, DiscordMember } from '../../../services/discord';
import { MemberAvatar } from '../../ui/MemberAvatar';
import { RoleBadge } from '../RoleBadge';

interface RoleMembersModalProps {
  roleId: string;
  roleName: string;
  roleColor: string;
  guildId: string;
  onClose: () => void;
}

export function RoleMembersModal({ roleId, roleName, roleColor, guildId: _guildId, onClose }: RoleMembersModalProps) {
  const [members, setMembers] = useState<DiscordMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'joined' | 'created'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingMember, setViewingMember] = useState<DiscordMember | null>(null);
  const itemsPerPage = 20;

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const allMembers = await discordApi.getMembers();
      const roleMembers = allMembers.filter(member =>
        member.roles.some(role => role.id === roleId)
      );
      setMembers(roleMembers);
    } catch (error) {
      console.error('Error cargando miembros:', error);
    } finally {
      setLoading(false);
    }
  };

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
  }, [members, searchQuery, sortBy, sortOrder]);

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
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '90%',
          maxWidth: '1200px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bmw-canvas)',
          border: '1px solid var(--bmw-hairline)',
          borderRadius: '0',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--bmw-hairline)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2
                className="bmw-title-lg"
                style={{
                  color: 'var(--bmw-ink)',
                  marginBottom: '8px',
                }}
              >
                Miembros del Rol
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: roleColor || '#99aab5',
                    borderRadius: '50%',
                  }}
                />
                <span className="bmw-body-md" style={{ color: 'var(--bmw-body)', fontWeight: 700 }}>
                  {roleName}
                </span>
                <span className="bmw-body-sm" style={{ color: 'var(--bmw-muted)' }}>
                  ({filteredAndSortedMembers.length} miembros)
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--bmw-muted)',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div style={{ padding: '24px', borderBottom: '1px solid var(--bmw-hairline)' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label
                className="bmw-label-uppercase"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: 'var(--bmw-body-strong)',
                }}
              >
                Buscar
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Nombre, usuario o tag..."
                className="bmw-text-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ minWidth: '200px' }}>
              <label
                className="bmw-label-uppercase"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: 'var(--bmw-body-strong)',
                }}
              >
                Ordenar por
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bmw-text-input"
                  style={{ flex: 1 }}
                >
                  <option value="name">Nombre</option>
                  <option value="joined">Fecha de ingreso</option>
                  <option value="created">Antigüedad</option>
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

        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <p className="bmw-body-md" style={{ color: 'var(--bmw-muted)' }}>
                Cargando miembros...
              </p>
            </div>
          ) : filteredAndSortedMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <p className="bmw-body-md" style={{ color: 'var(--bmw-muted)' }}>
                {searchQuery ? 'No se encontraron miembros con ese criterio' : 'Este rol no tiene miembros'}
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  backgroundColor: 'var(--bmw-canvas)',
                  border: '1px solid var(--bmw-hairline)',
                  borderRadius: '0',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead
                    style={{
                      backgroundColor: 'var(--bmw-surface-soft)',
                      borderBottom: '1px solid var(--bmw-hairline)',
                    }}
                  >
                    <tr>
                      <th
                        className="bmw-label-uppercase"
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          color: 'var(--bmw-body-strong)',
                        }}
                      >
                        Usuario
                      </th>
                      <th
                        className="bmw-label-uppercase"
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          color: 'var(--bmw-body-strong)',
                        }}
                      >
                        Otros Roles
                      </th>
                      <th
                        className="bmw-label-uppercase"
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          color: 'var(--bmw-body-strong)',
                        }}
                      >
                        Ingreso
                      </th>
                      <th
                        className="bmw-label-uppercase"
                        style={{
                          textAlign: 'right',
                          padding: '12px 16px',
                          color: 'var(--bmw-body-strong)',
                        }}
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMembers.map((member, index) => (
                      <tr
                        key={member.id}
                        style={{
                          borderBottom:
                            index < paginatedMembers.length - 1
                              ? '1px solid var(--bmw-hairline)'
                              : 'none',
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <MemberAvatar
                              avatar={member.avatar}
                              username={member.username}
                              id={member.id}
                              size={36}
                            />
                            <div>
                              <div
                                className="bmw-body-sm"
                                style={{ color: 'var(--bmw-ink)', fontWeight: 500 }}
                              >
                                {member.display_name}
                              </div>
                              <div
                                className="bmw-body-sm"
                                style={{ color: 'var(--bmw-muted)', fontSize: '12px' }}
                              >
                                {member.tag}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {member.roles
                              .filter(role => role.id !== roleId)
                              .slice(0, 3)
                              .map((role) => (
                                <RoleBadge key={role.id} role={role} />
                              ))}
                            {member.roles.filter(role => role.id !== roleId).length > 3 && (
                              <span
                                className="bmw-caption"
                                style={{ color: 'var(--bmw-muted)' }}
                              >
                                +{member.roles.filter(role => role.id !== roleId).length - 3}
                              </span>
                            )}
                            {member.roles.filter(role => role.id !== roleId).length === 0 && (
                              <span
                                className="bmw-body-sm"
                                style={{ color: 'var(--bmw-muted)' }}
                              >
                                -
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div className="bmw-body-sm" style={{ color: 'var(--bmw-body)' }}>
                            <span title={formatFullDate(member.joined_at)}>
                              {formatRelativeDate(member.joined_at)}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => setViewingMember(member)}
                            className="bmw-btn-text"
                            style={{
                              color: 'var(--bmw-primary)',
                              fontSize: '14px',
                              padding: '4px 8px',
                            }}
                            title="Ver detalles"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="bmw-btn-secondary"
                    style={{ padding: '8px 16px' }}
                  >
                    Anterior
                  </button>
                  <span
                    className="bmw-body-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 16px',
                      color: 'var(--bmw-ink)',
                    }}
                  >
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="bmw-btn-secondary"
                    style={{ padding: '8px 16px' }}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div
          style={{
            padding: '24px',
            borderTop: '1px solid var(--bmw-hairline)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button onClick={onClose} className="bmw-btn-primary">
            Cerrar
          </button>
        </div>
      </div>

      {viewingMember && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
          }}
          onClick={() => setViewingMember(null)}
        >
          <div
            style={{
              width: '90%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              backgroundColor: 'var(--bmw-surface-card)',
              borderRadius: '0',
              border: '1px solid var(--bmw-hairline)',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2
                className="bmw-display-sm"
                style={{
                  color: 'var(--bmw-ink)',
                }}
              >
                Detalles del Miembro
              </h2>
              <button
                onClick={() => setViewingMember(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--bmw-muted)',
                  cursor: 'pointer',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'start',
                gap: '24px',
                marginBottom: '24px',
                paddingBottom: '24px',
                borderBottom: '1px solid var(--bmw-hairline)',
              }}
            >
              <MemberAvatar
                avatar={viewingMember.avatar}
                username={viewingMember.username}
                id={viewingMember.id}
                size={80}
              />
              <div style={{ flex: 1 }}>
                <h3
                  className="bmw-title-lg"
                  style={{
                    color: 'var(--bmw-ink)',
                    marginBottom: '4px',
                  }}
                >
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <label
                  className="bmw-label-uppercase"
                  style={{ display: 'block', marginBottom: '8px', color: 'var(--bmw-body-strong)' }}
                >
                  Ingreso al Servidor
                </label>
                <div className="bmw-body-sm" style={{ color: 'var(--bmw-ink)' }}>
                  {formatFullDate(viewingMember.joined_at)}
                </div>
                <div
                  className="bmw-body-sm"
                  style={{ color: 'var(--bmw-muted)', fontSize: '12px', marginTop: '4px' }}
                >
                  {formatRelativeDate(viewingMember.joined_at)}
                </div>
              </div>
              <div>
                <label
                  className="bmw-label-uppercase"
                  style={{ display: 'block', marginBottom: '8px', color: 'var(--bmw-body-strong)' }}
                >
                  Cuenta Creada
                </label>
                <div className="bmw-body-sm" style={{ color: 'var(--bmw-ink)' }}>
                  {formatFullDate(viewingMember.created_at)}
                </div>
                <div
                  className="bmw-body-sm"
                  style={{ color: 'var(--bmw-muted)', fontSize: '12px', marginTop: '4px' }}
                >
                  {formatRelativeDate(viewingMember.created_at)}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                className="bmw-label-uppercase"
                style={{ display: 'block', marginBottom: '12px', color: 'var(--bmw-body-strong)' }}
              >
                Roles ({viewingMember.roles.length})
              </label>
              {viewingMember.roles.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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

            <div
              style={{
                paddingTop: '24px',
                borderTop: '1px solid var(--bmw-hairline)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button onClick={() => setViewingMember(null)} className="bmw-btn-primary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
