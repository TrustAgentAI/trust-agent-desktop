import React from 'react';
import {
  MessageSquare,
  ListChecks,
  Store,
  Shield,
  Settings,
  Plus,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { HiredRole } from '@/lib/roleConfig';

type NavItem = 'chat' | 'tasks' | 'marketplace' | 'permissions' | 'settings';

interface SidebarProps {
  hiredRoles: HiredRole[];
  activeRoleId: string | null;
  activeNav: NavItem;
  onSelectRole: (roleId: string) => void;
  onNavigate: (nav: NavItem) => void;
}

const navItems: { key: NavItem; label: string; icon: React.ReactNode }[] = [
  { key: 'chat', label: 'Chat', icon: <MessageSquare size={16} /> },
  { key: 'tasks', label: 'Tasks', icon: <ListChecks size={16} /> },
  { key: 'marketplace', label: 'Marketplace', icon: <Store size={16} /> },
  { key: 'permissions', label: 'Permissions', icon: <Shield size={16} /> },
  { key: 'settings', label: 'Settings', icon: <Settings size={16} /> },
];

function getTierLabel(tier: string): string {
  if (tier === 'professional') return 'PRO';
  if (tier === 'enterprise') return 'ENT';
  return 'FREE';
}

export function Sidebar({
  hiredRoles,
  activeRoleId,
  activeNav,
  onSelectRole,
  onNavigate,
}: SidebarProps) {
  return (
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
      {/* Logo area */}
      <div
        style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            T
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
      </div>

      {/* Your Roles */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        <div
          style={{
            padding: '0 8px 8px',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Your Roles
        </div>

        {hiredRoles.length === 0 && (
          <div
            style={{
              padding: '12px 8px',
              fontSize: '12px',
              color: 'var(--color-text-mid)',
              textAlign: 'center',
            }}
          >
            No agents hired yet.
            <br />
            Visit the Marketplace to get started.
          </div>
        )}

        {hiredRoles.map((role) => {
          const isActive = role.id === activeRoleId;
          return (
            <RoleItem
              key={role.id}
              role={role}
              isActive={isActive}
              onClick={() => onSelectRole(role.id)}
            />
          );
        })}
      </div>

      {/* Navigation */}
      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          padding: '8px',
        }}
      >
        {navItems.map((item) => {
          const isActive = activeNav === item.key;
          return (
            <NavButton
              key={item.key}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
              onClick={() => onNavigate(item.key)}
            />
          );
        })}
      </div>

      {/* Marketplace CTA */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={() => onNavigate('marketplace')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            width: '100%',
            padding: '8px',
            background: 'rgba(30,111,255,0.08)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-electric-blue)',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          <Plus size={14} />
          Hire New Agent
        </button>
      </div>
    </div>
  );
}

function RoleItem({
  role,
  isActive,
  onClick,
}: {
  role: HiredRole;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px',
        marginBottom: 2,
        borderRadius: 'var(--radius-md)',
        background: isActive ? 'rgba(30,111,255,0.1)' : hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 150ms ease',
      }}
    >
      {/* Active indicator */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 3,
            height: 20,
            borderRadius: 2,
            background: 'var(--color-electric-blue)',
          }}
        />
      )}

      {/* Avatar */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 700,
          color: 'var(--color-electric-blue)',
          flexShrink: 0,
        }}
      >
        {role.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: isActive ? '#E8EDF5' : 'var(--color-text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {role.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Badge variant="tier" label={getTierLabel(role.tier)} size="sm" />
        </div>
      </div>
    </div>
  );
}

function NavButton({
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
        background: isActive ? 'rgba(30,111,255,0.1)' : hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        color: isActive ? 'var(--color-electric-blue)' : 'var(--color-text-muted)',
        fontFamily: 'var(--font-sans)',
        fontSize: '13px',
        fontWeight: isActive ? 600 : 500,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 150ms ease',
        position: 'relative',
      }}
    >
      {isActive && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 3,
            height: 16,
            borderRadius: 2,
            background: 'var(--color-electric-blue)',
          }}
        />
      )}
      <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      {label}
    </button>
  );
}
