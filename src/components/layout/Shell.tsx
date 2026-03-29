import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Shield,
  ScrollText,
  Settings,
  Plus,
  LogOut,
  User,
} from 'lucide-react';
import { TitleBar } from '@/components/layout/TitleBar';
import { ConnectionStatus } from '@/components/layout/ConnectionStatus';
import { AgentCard } from '@/components/agent/AgentCard';
import { useAgentStore } from '@/store/agentStore';
import { useAuthStore } from '@/store/authStore';
import type { HiredRole } from '@/store/agentStore';

type NavKey = 'dashboard' | 'permissions' | 'audit' | 'settings';

const navItems: { key: NavKey; label: string; path: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/', icon: <LayoutDashboard size={16} /> },
  { key: 'permissions', label: 'Permissions', path: '/permissions', icon: <Shield size={16} /> },
  { key: 'audit', label: 'Audit Log', path: '/audit', icon: <ScrollText size={16} /> },
  { key: 'settings', label: 'Settings', path: '/settings', icon: <Settings size={16} /> },
];

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const { roles, activeRoleId, setActiveRole } = useAgentStore();
  const { user, logout } = useAuthStore();
  const [rightPanelOpen, setRightPanelOpen] = React.useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const activeRole = roles.find((r) => r.hireId === activeRoleId) || null;

  const handleSelectRole = (hireId: string) => {
    setActiveRole(hireId);
  };

  const currentNav = navItems.find((item) => item.path === location.pathname)?.key || 'dashboard';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <TitleBar
        rightPanelOpen={rightPanelOpen}
        onToggleRightPanel={() => setRightPanelOpen((p) => !p)}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar - 240px */}
        <div
          style={{
            width: 240,
            minWidth: 240,
            height: '100%',
            background: 'var(--color-dark-navy)',
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Logo */}
          <div
            style={{
              padding: '16px 16px 12px',
              borderBottom: '1px solid var(--color-border)',
              height: 60,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-ion-cyan))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 14,
                color: '#fff',
              }}
            >
              TA
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: '#E8EDF5',
                letterSpacing: '-0.01em',
              }}
            >
              Trust Agent
            </span>
          </div>

          {/* Active Roles section */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
            <div
              style={{
                padding: '0 8px 8px',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-ion-cyan)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Active Roles
            </div>

            {roles.length === 0 && (
              <div
                style={{
                  padding: '12px 8px',
                  fontSize: 12,
                  color: 'var(--color-text-mid)',
                  textAlign: 'center',
                }}
              >
                No roles hired yet.
              </div>
            )}

            {roles.map((role) => (
              <SidebarRoleCard
                key={role.hireId}
                role={role}
                isActive={role.hireId === activeRoleId}
                onClick={() => handleSelectRole(role.hireId)}
              />
            ))}

            {/* Hire a Role button */}
            <button
              onClick={() => navigate('/marketplace')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                width: '100%',
                padding: 8,
                marginTop: 8,
                background: 'transparent',
                border: '1px solid var(--color-electric-blue)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-electric-blue)',
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <Plus size={14} />
              Hire a Role
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--color-border)' }} />

          {/* Nav items */}
          <div style={{ padding: 8 }}>
            {navItems.map((item) => {
              const isActive = currentNav === item.key;
              return (
                <SidebarNavButton
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  isActive={isActive}
                  onClick={() => navigate(item.path)}
                />
              );
            })}
          </div>

          {/* User profile + logout at very bottom */}
          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {/* Avatar */}
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(30,111,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <User size={14} style={{ color: 'var(--color-electric-blue)' }} />
              </div>
            )}

            {/* Name / plan */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#E8EDF5',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {user?.name || user?.email || 'User'}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'capitalize',
                }}
              >
                {user?.plan || 'Free'} plan
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              title="Sign out"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                borderRadius: 'var(--radius-sm)',
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-error)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
            >
              <LogOut size={14} />
            </button>
          </div>

          {/* Connection status */}
          <div style={{ borderTop: '1px solid var(--color-border)' }}>
            <ConnectionStatus />
          </div>
        </div>

        {/* Main content - flex */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'var(--color-navy-2)',
          }}
        >
          {children}
        </div>

        {/* Right panel - 320px, collapsible */}
        {rightPanelOpen && (
          <div
            style={{
              width: 320,
              minWidth: 320,
              height: '100%',
              background: 'var(--color-dark-navy)',
              borderLeft: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: 16, borderBottom: '1px solid var(--color-border)' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 12,
                }}
              >
                Context
              </div>
              {activeRole ? (
                <AgentCard role={activeRole} />
              ) : (
                <div style={{ fontSize: 12, color: 'var(--color-text-mid)' }}>
                  No role selected
                </div>
              )}
            </div>

            <div style={{ padding: 16, borderBottom: '1px solid var(--color-border)' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                }}
              >
                Permissions
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-mid)' }}>
                {activeRole
                  ? 'Manage folder access in the Permissions tab.'
                  : 'Select a role to manage permissions.'}
              </div>
            </div>

            <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                }}
              >
                Audit Log
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-mid)' }}>
                Agent activity will appear here as actions are performed.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarRoleCard({
  role,
  isActive,
  onClick,
}: {
  role: HiredRole;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);

  const badgeConfig = {
    PLATINUM: { bg: 'rgba(0,212,255,0.15)', color: 'var(--color-ion-cyan)' },
    GOLD: { bg: 'rgba(255,183,64,0.15)', color: '#FFB740' },
    SILVER: { bg: 'rgba(192,200,216,0.15)', color: '#C0C8D8' },
    BASIC: { bg: 'rgba(136,153,187,0.15)', color: 'var(--color-text-muted)' },
  }[role.trustBadge];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 8,
        marginBottom: 2,
        borderRadius: 'var(--radius-md)',
        background: isActive
          ? 'rgba(30,111,255,0.1)'
          : hovered
          ? 'var(--color-navy-2)'
          : 'transparent',
        cursor: 'pointer',
        position: 'relative',
        borderLeft: isActive ? '3px solid var(--color-electric-blue)' : '3px solid transparent',
        transition: 'all 150ms ease',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#fff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {role.roleName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <span
            style={{
              fontSize: 10,
              color: 'var(--color-text-muted)',
            }}
          >
            {role.roleCategory}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: 100,
              background: badgeConfig.bg,
              color: badgeConfig.color,
              letterSpacing: '0.04em',
            }}
          >
            {role.trustBadge}
          </span>
        </div>
      </div>
    </div>
  );
}

function SidebarNavButton({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '7px 10px',
        marginBottom: 1,
        background: isActive
          ? 'rgba(30,111,255,0.1)'
          : hovered
          ? 'rgba(255,255,255,0.03)'
          : 'transparent',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        color: isActive ? 'var(--color-electric-blue)' : 'var(--color-text-muted)',
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: isActive ? 600 : 500,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 150ms ease',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      {label}
    </button>
  );
}
