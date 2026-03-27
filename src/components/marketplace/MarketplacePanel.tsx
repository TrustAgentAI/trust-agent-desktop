import React from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAgentStore } from '@/store/agentStore';
import { gateway } from '@/lib/gateway';

type MarketplaceTab = 'agents' | 'roles' | 'skills';

const tabs: { key: MarketplaceTab; label: string }[] = [
  { key: 'roles', label: 'Roles' },
  { key: 'agents', label: 'Agents' },
  { key: 'skills', label: 'Skills' },
];

export function MarketplacePanel() {
  const {
    agents,
    skills,
    activeTab,
    isLoading,
    error,
    fetchAgents,
    fetchSkills,
    setActiveTab,
  } = useMarketplaceStore();

  const { loadHiredRoles } = useAgentStore();

  React.useEffect(() => {
    if (activeTab === 'agents' && agents.length === 0) {
      fetchAgents().catch(() => {});
    }
    if (activeTab === 'skills' && skills.length === 0) {
      fetchSkills().catch(() => {});
    }
  }, [activeTab, agents.length, skills.length, fetchAgents, fetchSkills]);

  const handleOpenInBrowser = () => {
    window.open('https://app.trust-agent.ai/marketplace', '_blank');
  };

  const handleHire = async (roleId: string) => {
    try {
      await gateway.roles.hire(roleId);
      await loadHiredRoles();
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px 0',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#E8EDF5' }}>
          Marketplace
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<ExternalLink size={12} />}
          onClick={handleOpenInBrowser}
        >
          Open in Browser
        </Button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          padding: '12px 24px 0',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${isActive ? 'var(--color-electric-blue)' : 'transparent'}`,
                color: isActive ? 'var(--color-electric-blue)' : 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              gap: 8,
              color: 'var(--color-text-muted)',
              fontSize: '13px',
            }}
          >
            <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Loading marketplace...
          </div>
        )}

        {error && (
          <div
            style={{
              padding: 16,
              background: 'rgba(204,51,51,0.08)',
              border: '1px solid rgba(204,51,51,0.2)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-error)',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        {!isLoading && activeTab === 'agents' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {agents.map((agent) => (
              <Card key={agent.id} variant="dark" padding="16px">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-md)',
                      background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-ion-cyan))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '14px',
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    {agent.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#E8EDF5' }}>
                      {agent.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {agent.category}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
                  {agent.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Badge variant="default" label={`${agent.rating}/5`} size="sm" />
                    <Badge variant="default" label={`${agent.reviews} reviews`} size="sm" />
                  </div>
                  <Button size="sm" onClick={() => handleHire(agent.id)}>
                    ${agent.price}/mo
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && activeTab === 'roles' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              color: 'var(--color-text-muted)',
              fontSize: '13px',
            }}
          >
            Browse available roles at{' '}
            <a
              href="https://app.trust-agent.ai/roles"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-electric-blue)', marginLeft: 4 }}
            >
              app.trust-agent.ai/roles
            </a>
          </div>
        )}

        {!isLoading && activeTab === 'skills' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {skills.map((skill) => (
              <Card key={skill.id} variant="dark" padding="16px">
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#E8EDF5', marginBottom: 4 }}>
                  {skill.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                  {skill.category}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
                  {skill.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Badge variant="default" label={`${skill.compatibleRoles.length} roles`} size="sm" />
                  <Button size="sm">${skill.price}</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
