import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { StatusPill } from '../leads/StatusPill';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    {
      name: 'Kanban Board',
      path: '/',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      name: 'Conversaciones',
      path: '/conversations',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <circle cx="15" cy="9" r="2" fill="currentColor" />
        </svg>
      ),
    },
    {
      name: 'Canales Discord',
      path: '/channels',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      name: 'Tickets',
      path: '/metrics',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      name: 'Server Members',
      path: '/members',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      name: 'Roles Discord',
      path: '/roles',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
    },
    {
      name: 'Anuncios',
      path: '/announcements',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
    {
      name: 'Mensajes Auto',
      path: '/auto-messages',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M9 10h.01" />
          <path d="M15 10h.01" />
          <path d="M9.5 14a3.5 3.5 0 0 0 5 0" />
        </svg>
      ),
    },
    {
      name: 'Configuración',
      path: '/settings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
    {
      name: 'System Logs',
      path: '/logs',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--bmw-canvas)' }}>
      <aside
        className="w-64 flex flex-col"
        style={{
          backgroundColor: 'var(--bmw-surface-dark)',
          borderRight: '1px solid var(--bmw-hairline)',
        }}
      >
        <div
          className="flex items-center gap-3 px-6 py-5"
          style={{
            borderBottom: '1px solid var(--bmw-surface-dark-elevated)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'var(--bmw-primary)',
              borderRadius: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: 'var(--bmw-on-primary)',
              fontSize: '16px',
            }}
          >
            C
          </div>
          <div>
            <div
              className="bmw-title-sm"
              style={{
                color: 'var(--bmw-on-dark)',
                fontSize: '16px',
              }}
            >
              CRM Leads
            </div>
            <div
              className="bmw-body-sm"
              style={{
                color: 'var(--bmw-on-dark-soft)',
                fontSize: '12px',
              }}
            >
              Discord Bot
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-3 py-3 mb-1 transition-all"
              style={{
                backgroundColor: isActive(item.path)
                  ? 'var(--bmw-surface-dark-elevated)'
                  : 'transparent',
                color: isActive(item.path)
                  ? 'var(--bmw-on-dark)'
                  : 'var(--bmw-on-dark-soft)',
                borderLeft: isActive(item.path) ? '3px solid var(--bmw-primary)' : '3px solid transparent',
                borderRadius: '0',
                fontSize: '14px',
                fontWeight: isActive(item.path) ? 700 : 400,
                letterSpacing: '0.3px',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div
          className="px-3 py-4"
          style={{
            borderTop: '1px solid var(--bmw-surface-dark-elevated)',
          }}
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 transition-all"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--bmw-on-dark-soft)',
              borderRadius: '0',
              fontSize: '14px',
              fontWeight: 400,
              letterSpacing: '0.3px',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'var(--bmw-on-dark)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--bmw-on-dark-soft)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className="flex items-center justify-between px-6 py-4"
          style={{
            backgroundColor: 'var(--bmw-canvas)',
            borderBottom: '1px solid var(--bmw-hairline)',
            height: '64px',
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="bmw-title-md"
              style={{
                color: 'var(--bmw-ink)',
                fontSize: '18px',
              }}
            >
              {navItems.find((item) => item.path === location.pathname)?.name || 'CRM'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusPill />
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center"
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'transparent',
                border: '1px solid var(--bmw-hairline)',
                borderRadius: '0',
                color: 'var(--bmw-ink)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bmw-surface-soft)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
            >
              {theme === 'light' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <main
          className="flex min-h-0 flex-1 flex-col overflow-auto"
          style={{
            backgroundColor: 'var(--bmw-surface-soft)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
