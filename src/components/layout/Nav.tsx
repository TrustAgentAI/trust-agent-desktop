import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Menu,
  X,
  Search,
  LayoutDashboard,
  Store,
  Shield,
  Settings,
  User,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface NavLink {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const publicLinks: NavLink[] = [
  { label: 'Marketplace', path: '/marketplace', icon: <Store size={16} /> },
];

const authLinks: NavLink[] = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={16} /> },
  { label: 'Marketplace', path: '/marketplace', icon: <Store size={16} /> },
  { label: 'Guardian', path: '/guardian', icon: <Shield size={16} /> },
  { label: 'Settings', path: '/settings', icon: <Settings size={16} /> },
];

export function Nav() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [notificationCount] = React.useState(0);

  const links = isAuthenticated ? authLinks : publicLinks;

  const isActive = (path: string) => location.pathname === path;

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)' as unknown as number,
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          height: 60,
          gap: 'var(--space-6)',
        }}
      >
        {/* Logo */}
        <button
          onClick={() => handleNavigate('/')}
          aria-label="Trust Agent home"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 14,
              color: 'var(--text-inverse)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            TA
          </div>
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 400,
              fontSize: 20,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            Trust Agent
          </span>
        </button>

        {/* Desktop links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            flex: 1,
          }}
          className="nav-desktop-links"
        >
          {links.map((link) => (
            <button
              key={link.path}
              onClick={() => handleNavigate(link.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: '6px 12px',
                background: isActive(link.path)
                  ? 'var(--bg-surface)'
                  : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: isActive(link.path)
                  ? 'var(--primary-600)'
                  : 'var(--text-secondary)',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                fontWeight: isActive(link.path) ? 600 : 500,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                minHeight: 36,
              }}
            >
              {link.icon}
              {link.label}
            </button>
          ))}
        </div>

        {/* Right side actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          {/* Search (placeholder for future) */}
          <button
            aria-label="Search"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Search size={18} />
          </button>

          {/* Notification bell */}
          {isAuthenticated && (
            <button
              onClick={() => handleNavigate('/notifications')}
              aria-label={
                notificationCount > 0
                  ? `${notificationCount} notifications`
                  : 'Notifications'
              }
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Bell size={18} />
              {notificationCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 16,
                    height: 16,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-error)',
                    color: 'var(--text-inverse)',
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          )}

          {/* Auth state */}
          {isAuthenticated && user ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <button
                onClick={() => handleNavigate('/settings')}
                aria-label="User profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: '4px 8px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 'var(--radius-full)',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--primary-100)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <User size={12} style={{ color: 'var(--primary-600)' }} />
                  </div>
                )}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    maxWidth: 100,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.name || user.email}
                </span>
              </button>
              <button
                onClick={logout}
                aria-label="Sign out"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleNavigate('/login')}
              style={{
                padding: '8px 20px',
                background: 'var(--primary-600)',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--text-inverse)',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                minHeight: 36,
              }}
            >
              Sign in
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((p) => !p)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="nav-mobile-toggle"
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="nav-mobile-drawer"
          style={{
            borderTop: '1px solid var(--border-default)',
            padding: 'var(--space-4)',
            background: 'var(--bg-elevated)',
            animation: 'ws-slideDown 0.2s ease forwards',
          }}
        >
          {links.map((link) => (
            <button
              key={link.path}
              onClick={() => handleNavigate(link.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                width: '100%',
                padding: 'var(--space-3) var(--space-4)',
                background: isActive(link.path)
                  ? 'var(--bg-surface)'
                  : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: isActive(link.path)
                  ? 'var(--primary-600)'
                  : 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                fontSize: 15,
                fontWeight: isActive(link.path) ? 600 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: 44,
              }}
            >
              {link.icon}
              {link.label}
            </button>
          ))}
        </div>
      )}

      {/* Responsive CSS embedded */}
      <style>{`
        @media (max-width: 768px) {
          .nav-desktop-links { display: none !important; }
          .nav-mobile-toggle { display: flex !important; }
        }
        @media (min-width: 769px) {
          .nav-mobile-drawer { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
