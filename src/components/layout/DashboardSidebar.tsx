import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Brain,
  FileText,
  Calendar,
  RotateCcw,
  Users,
  Bell,
  Shield,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface SidebarSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: { label: string; path: string }[];
}

const sections: SidebarSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={16} />,
    path: '/',
  },
  {
    id: 'brain',
    label: 'Brain',
    icon: <Brain size={16} />,
    children: [
      { label: 'Journal', path: '/brain/journal' },
      { label: 'Memory notes', path: '/brain/notes' },
      { label: 'Insights', path: '/brain/insights' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <FileText size={16} />,
    path: '/dashboard/reports',
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: <Calendar size={16} />,
    path: '/dashboard/schedule',
  },
  {
    id: 'review',
    label: 'Review',
    icon: <RotateCcw size={16} />,
    path: '/dashboard/review',
  },
  {
    id: 'groups',
    label: 'Groups',
    icon: <Users size={16} />,
    path: '/study',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <Bell size={16} />,
    path: '/notifications',
  },
  {
    id: 'guardian',
    label: 'Guardian',
    icon: <Shield size={16} />,
    children: [
      { label: 'Overview', path: '/guardian' },
      { label: 'Activity', path: '/guardian/activity' },
      { label: 'Alerts', path: '/guardian/alerts' },
      { label: 'Limits', path: '/guardian/limits' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings size={16} />,
    children: [
      { label: 'Profile', path: '/settings' },
      { label: 'Billing', path: '/settings/billing' },
      { label: 'Voice & Audio', path: '/settings/audio' },
      { label: 'Accessibility', path: '/settings/accessibility' },
      { label: 'Notifications', path: '/settings/notifications' },
      { label: 'Privacy', path: '/settings/privacy' },
    ],
  },
];

export function DashboardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isActive = (path: string) => location.pathname === path;

  const isChildActive = (section: SidebarSection) =>
    section.children?.some((c) => location.pathname === c.path) ?? false;

  return (
    <aside
      aria-label="Dashboard navigation"
      style={{
        width: 260,
        minWidth: 260,
        height: '100%',
        background: 'var(--bg-elevated)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-4)',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          height: 60,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 13,
            color: 'var(--text-inverse)',
          }}
        >
          TA
        </div>
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 400,
            fontSize: 18,
            color: 'var(--text-primary)',
          }}
        >
          Trust Agent
        </span>
      </div>

      {/* Navigation tree */}
      <nav
        aria-label="Dashboard sections"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-2) var(--space-2)',
        }}
      >
        {sections.map((section) => {
          const hasChildren = section.children && section.children.length > 0;
          const isOpen = expanded[section.id] || isChildActive(section);
          const sectionActive = section.path
            ? isActive(section.path)
            : isChildActive(section);

          return (
            <div key={section.id} style={{ marginBottom: 2 }}>
              <button
                onClick={() => {
                  if (hasChildren) {
                    toggleSection(section.id);
                  } else if (section.path) {
                    navigate(section.path);
                  }
                }}
                aria-expanded={hasChildren ? isOpen : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  width: '100%',
                  padding: '8px 10px',
                  background: sectionActive
                    ? 'var(--bg-surface)'
                    : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: sectionActive
                    ? 'var(--primary-600)'
                    : 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  fontWeight: sectionActive ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)',
                  minHeight: 36,
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {section.icon}
                </span>
                <span style={{ flex: 1 }}>{section.label}</span>
                {hasChildren && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {isOpen ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </span>
                )}
              </button>

              {/* Children */}
              {hasChildren && isOpen && (
                <div
                  style={{
                    marginLeft: 28,
                    borderLeft: '1px solid var(--border-default)',
                    paddingLeft: 'var(--space-3)',
                    marginTop: 2,
                    marginBottom: 4,
                  }}
                >
                  {section.children?.map((child) => {
                    const childActive = isActive(child.path);
                    return (
                      <button
                        key={child.path}
                        onClick={() => navigate(child.path)}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '6px 8px',
                          background: childActive
                            ? 'var(--bg-surface)'
                            : 'transparent',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          color: childActive
                            ? 'var(--primary-600)'
                            : 'var(--text-muted)',
                          fontFamily: 'var(--font-sans)',
                          fontSize: 13,
                          fontWeight: childActive ? 600 : 400,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all var(--transition-fast)',
                          minHeight: 32,
                        }}
                      >
                        {child.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User profile at bottom */}
      <div
        style={{
          borderTop: '1px solid var(--border-default)',
          padding: 'var(--space-3) var(--space-3)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}
      >
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-full)',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-full)',
              background: 'var(--primary-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <User size={13} style={{ color: 'var(--primary-600)' }} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.name || user?.email || 'User'}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              textTransform: 'capitalize',
            }}
          >
            {user?.plan || 'Free'} plan
          </div>
        </div>
        <button
          onClick={logout}
          aria-label="Sign out"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-md)',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'color var(--transition-fast)',
          }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
