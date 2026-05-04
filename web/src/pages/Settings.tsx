import { useState, useEffect } from 'react';
import { settingsService } from '../services/settings';
import { staffService, StaffMember } from '../services/staff';
import { api, DiscordMember } from '../services/api';
import { Layout } from '../components/ui/Layout';

export default function Settings() {
  const [staffRoleId, setStaffRoleId] = useState<string | null>(null);
  const [roles, setRoles] = useState<Array<{ id: string; name: string; color: string | number }>>([]);
  const [staffPreview, setStaffPreview] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [guildId, setGuildId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'members'>('config');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get guild ID first
      try {
        const guilds = await api.getDiscordGuilds();
        if (!guilds || guilds.length === 0) {
          showMessage('error', 'No se encontraron servidores. Verifica que el bot esté conectado.');
          setLoading(false);
          return;
        }
        const guild = guilds[0];
        setGuildId(guild.id);
        
        // Load roles from Discord (not from database)
        const rolesData = await api.getGuildRoles(guild.id);
        setRoles(rolesData || []);
      } catch (error) {
        console.error('Error loading roles:', error);
        showMessage('error', 'Error al cargar roles de Discord. Verifica que el bot esté corriendo.');
        setLoading(false);
        return;
      }

      // Load settings
      try {
        const settingsData = await settingsService.getSettings();
        const staffRoleSetting = settingsData.find((s) => s.key === 'staff_role_id');
        if (staffRoleSetting?.value) {
          setStaffRoleId(staffRoleSetting.value);
          loadStaffPreview();
        }
      } catch (error) {
        console.error('Error loading settings from database:', error);
        showMessage('error', 'Error al cargar configuración de la base de datos.');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showMessage('error', 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const loadStaffPreview = async () => {
    try {
      const members = await staffService.getStaffMembers();
      setStaffPreview(members);
    } catch (error) {
      console.error('Error loading staff preview:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsService.updateSetting('staff_role_id', staffRoleId);
      await loadStaffPreview();
      showMessage('success', 'Configuración guardada correctamente');
      setActiveTab('members');
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  if (loading) {
    return (
      <Layout>
        <div
          className="flex items-center justify-center h-full"
          style={{ backgroundColor: 'var(--bmw-surface-soft)' }}
        >
          <div className="bmw-body-md" style={{ color: 'var(--bmw-muted)' }}>
            Cargando...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8" style={{ backgroundColor: 'var(--bmw-surface-soft)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="bmw-display-md" style={{ color: 'var(--bmw-ink)', marginBottom: '8px' }}>
            Configuración
          </h1>
          <p className="bmw-body-md" style={{ color: 'var(--bmw-muted)' }}>
            Gestiona la configuración del sistema de staff y asignaciones
          </p>
        </div>

        {message && (
          <div
            className="p-4 mb-6"
            style={{
              backgroundColor:
                message.type === 'success' ? 'var(--bmw-success)' : 'var(--bmw-error)',
              color: 'var(--bmw-on-primary)',
              borderRadius: '0',
            }}
          >
            <p className="bmw-body-sm">{message.text}</p>
          </div>
        )}

        <div
          className="mb-6"
          style={{
            backgroundColor: 'var(--bmw-canvas)',
            border: '1px solid var(--bmw-hairline)',
            borderRadius: '0',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '24px',
              borderBottom: '2px solid var(--bmw-hairline)',
              padding: '0 24px',
            }}
          >
            <button
              onClick={() => setActiveTab('config')}
              style={{
                background: 'none',
                border: 'none',
                padding: '16px 0',
                fontSize: '14px',
                fontWeight: 700,
                color: activeTab === 'config' ? 'var(--bmw-ink)' : 'var(--bmw-muted)',
                cursor: 'pointer',
                borderBottom:
                  activeTab === 'config' ? '2px solid var(--bmw-ink)' : 'none',
                marginBottom: '-2px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Configuración
            </button>
            <button
              onClick={() => setActiveTab('members')}
              style={{
                background: 'none',
                border: 'none',
                padding: '16px 0',
                fontSize: '14px',
                fontWeight: 700,
                color: activeTab === 'members' ? 'var(--bmw-ink)' : 'var(--bmw-muted)',
                cursor: 'pointer',
                borderBottom:
                  activeTab === 'members' ? '2px solid var(--bmw-ink)' : 'none',
                marginBottom: '-2px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Miembros del Staff
            </button>
          </div>

          {activeTab === 'config' ? (
            <div className="p-6">
              <h2
                className="bmw-title-lg mb-4"
                style={{ color: 'var(--bmw-ink)', marginBottom: '16px' }}
              >
                Rol de Staff
              </h2>
          <p className="bmw-body-sm mb-4" style={{ color: 'var(--bmw-body)', marginBottom: '16px' }}>
            Selecciona el rol de Discord que identifica a los miembros del staff. Solo los usuarios
            con este rol podrán ser asignados a leads y tickets.
          </p>

          <div className="mb-4">
            <label
              className="block bmw-label-uppercase mb-2"
              style={{
                color: 'var(--bmw-body-strong)',
                fontSize: '13px',
                marginBottom: '8px',
              }}
            >
              Rol de Staff
            </label>
            <select
              value={staffRoleId || ''}
              onChange={(e) => setStaffRoleId(e.target.value || null)}
              className="w-full bmw-body-md"
              style={{
                backgroundColor: 'var(--bmw-canvas)',
                color: 'var(--bmw-ink)',
                border: '1px solid var(--bmw-hairline)',
                borderRadius: '0',
                padding: '14px 16px',
                height: '48px',
                fontSize: '16px',
                fontWeight: 300,
              }}
            >
              <option value="">Seleccionar rol...</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !staffRoleId}
            className="bmw-button"
            style={{
              backgroundColor: saving || !staffRoleId ? 'var(--bmw-primary-disabled)' : 'var(--bmw-primary)',
              color: 'var(--bmw-on-primary)',
              border: 'none',
              borderRadius: '0',
              padding: '14px 32px',
              height: '48px',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              cursor: saving || !staffRoleId ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!saving && staffRoleId) {
                e.currentTarget.style.backgroundColor = 'var(--bmw-primary-active)';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving && staffRoleId) {
                e.currentTarget.style.backgroundColor = 'var(--bmw-primary)';
              }
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
          </div>
          ) : (
            <div className="p-6">
              <h2
                className="bmw-title-lg mb-4"
                style={{ color: 'var(--bmw-ink)', marginBottom: '16px' }}
              >
                Miembros del Staff ({staffPreview.length})
              </h2>
              {staffPreview.length === 0 ? (
                <div
                  className="p-8 text-center"
                  style={{
                    backgroundColor: 'var(--bmw-surface-soft)',
                    border: '1px solid var(--bmw-hairline)',
                    borderRadius: '0',
                  }}
                >
                  <p className="bmw-body-md" style={{ color: 'var(--bmw-muted)' }}>
                    No hay miembros con el rol de staff seleccionado.
                  </p>
                  <p className="bmw-body-sm mt-2" style={{ color: 'var(--bmw-muted-soft)' }}>
                    Asigna el rol en Discord y el bot sincronizará automáticamente.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {staffPreview.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-4"
                      style={{
                        backgroundColor: 'var(--bmw-surface-soft)',
                        border: '1px solid var(--bmw-hairline)',
                        borderRadius: '0',
                      }}
                    >
                      {member.avatar ? (
                        <img
                          src={`https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}.png`}
                          alt={member.display_name}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--bmw-primary)',
                            color: 'var(--bmw-on-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            fontWeight: 700,
                          }}
                        >
                          {member.display_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="bmw-title-sm" style={{ color: 'var(--bmw-ink)' }}>
                          {member.display_name}
                        </div>
                        <div className="bmw-caption" style={{ color: 'var(--bmw-muted)' }}>
                          @{member.username}
                        </div>
                      </div>
                      <div
                        style={{
                          backgroundColor: 'var(--bmw-success)',
                          color: 'var(--bmw-on-primary)',
                          padding: '4px 12px',
                          borderRadius: '0',
                          fontSize: '12px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Staff
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </Layout>
  );
}
