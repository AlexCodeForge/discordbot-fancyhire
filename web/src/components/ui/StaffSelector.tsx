import { useState, useEffect } from 'react';
import { staffService, StaffMember } from '../../services/staff';

interface StaffSelectorProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
}

export function StaffSelector({
  value,
  onChange,
  placeholder = 'Seleccionar staff...',
  disabled = false,
  allowClear = true,
}: StaffSelectorProps) {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStaffMembers();
  }, []);

  const loadStaffMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const members = await staffService.getStaffMembers();
      setStaffMembers(members);
    } catch (err) {
      console.error('Error loading staff members:', err);
      setError('Error al cargar staff');
    } finally {
      setLoading(false);
    }
  };

  const selectedMember = staffMembers.find((m) => m.id === value);

  if (loading) {
    return (
      <div
        className="w-full bmw-body-md flex items-center"
        style={{
          backgroundColor: 'var(--bmw-canvas)',
          color: 'var(--bmw-muted)',
          border: '1px solid var(--bmw-hairline)',
          borderRadius: '0',
          padding: '14px 16px',
          height: '48px',
        }}
      >
        Cargando staff...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="w-full bmw-body-sm"
        style={{
          backgroundColor: 'var(--bmw-surface-soft)',
          color: 'var(--bmw-error)',
          border: '1px solid var(--bmw-error)',
          borderRadius: '0',
          padding: '14px 16px',
        }}
      >
        {error}
      </div>
    );
  }

  if (staffMembers.length === 0) {
    return (
      <div
        className="w-full bmw-body-sm"
        style={{
          backgroundColor: 'var(--bmw-surface-soft)',
          color: 'var(--bmw-muted)',
          border: '1px solid var(--bmw-hairline)',
          borderRadius: '0',
          padding: '14px 16px',
        }}
      >
        No hay staff configurado. Configure el rol de staff en Configuración.
      </div>
    );
  }

  return (
    <div className="w-full">
      {selectedMember && (
        <div
          className="flex items-center gap-3 p-3 mb-2"
          style={{
            backgroundColor: 'var(--bmw-surface-soft)',
            border: '1px solid var(--bmw-hairline)',
            borderRadius: '0',
          }}
        >
          {selectedMember.avatar ? (
            <img
              src={`https://cdn.discordapp.com/avatars/${selectedMember.id}/${selectedMember.avatar}.png`}
              alt={selectedMember.display_name}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--bmw-primary)',
                color: 'var(--bmw-on-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              {selectedMember.display_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="bmw-body-md" style={{ color: 'var(--bmw-ink)' }}>
              {selectedMember.display_name}
            </div>
            <div className="bmw-caption" style={{ color: 'var(--bmw-muted)' }}>
              @{selectedMember.username}
            </div>
          </div>
          {allowClear && (
            <button
              onClick={() => onChange(null)}
              disabled={disabled}
              className="bmw-caption"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--bmw-muted)',
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                padding: '4px 8px',
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.color = 'var(--bmw-error)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--bmw-muted)';
              }}
            >
              Quitar
            </button>
          )}
        </div>
      )}

      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
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
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <option value="">{placeholder}</option>
        {staffMembers.map((member) => (
          <option key={member.id} value={member.id}>
            {member.display_name} (@{member.username})
          </option>
        ))}
      </select>
    </div>
  );
}
