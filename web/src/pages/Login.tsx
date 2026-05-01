import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bmw-surface-soft)' }}>
      <div className="w-full max-w-md">
        <div className="bmw-card">
          <div className="text-center mb-8">
            <div 
              style={{
                width: '56px',
                height: '56px',
                backgroundColor: 'var(--bmw-primary)',
                borderRadius: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: 'var(--bmw-on-primary)',
                fontSize: '24px',
                margin: '0 auto 24px',
              }}
            >
              C
            </div>
            <h1 style={{ fontSize: '32px', lineHeight: '1.15', fontWeight: 700, marginBottom: '8px', color: 'var(--bmw-ink)' }}>CRM Leads</h1>
            <p className="bmw-body-sm" style={{ color: 'var(--bmw-body)' }}>Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="bmw-label block mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bmw-input w-full"
                placeholder="Ingresa tu usuario"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="bmw-label block mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bmw-input w-full"
                placeholder="Ingresa tu contraseña"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="px-4 py-3 bmw-body-sm" style={{ 
                backgroundColor: '#fee2e2', 
                border: '1px solid var(--bmw-error)', 
                color: 'var(--bmw-error)',
                borderRadius: '0'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bmw-btn-primary w-full flex items-center justify-center"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="bmw-body-sm" style={{ color: 'var(--bmw-muted)', fontSize: '12px' }}>
              Sistema de gestión de leads con Discord
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
