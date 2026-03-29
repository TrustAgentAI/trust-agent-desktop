import React from 'react';
import { Shield, CheckCircle, Zap, ArrowLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export interface RoleDetailData {
  id: string;
  slug: string;
  name: string;
  companionName: string;
  tagline: string;
  description: string;
  category: string;
  subcategory: string;
  trustScore: number;
  trustBadge: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BASIC';
  priceMonthly: number; // pence
  capabilities: string[];
  limitations: string[];
  skills: { skillName: string; skillSlug: string }[];
  avatarUrl?: string;
  accentColor?: string;
  environmentConfig?: {
    colorTemperature?: string;
    sessionMood?: string;
    categoryAccentColor?: string;
  };
  auditSummary?: {
    totalScore: number;
    badge: string;
    auditedAt: string;
  };
}

interface RoleDetailProps {
  role: RoleDetailData;
  onHire: (roleId: string) => void;
  onBack: () => void;
  isHired?: boolean;
}

const BADGE_VARIANT: Record<string, 'platinum' | 'gold' | 'silver' | 'basic'> = {
  PLATINUM: 'platinum',
  GOLD: 'gold',
  SILVER: 'silver',
  BASIC: 'basic',
};

function formatPrice(pence: number): string {
  if (pence === 0) return 'Free';
  const pounds = (pence / 100).toFixed(2);
  return `\u00A3${pounds}/mo`;
}

export function RoleDetail({ role, onHire, onBack, isHired }: RoleDetailProps) {
  const accent = role.accentColor || role.environmentConfig?.categoryAccentColor || 'var(--color-electric-blue)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Hero section */}
      <div
        style={{
          position: 'relative',
          padding: '20px 24px',
          background: `linear-gradient(160deg, ${accent}15 0%, var(--color-dark-navy) 100%)`,
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            padding: 0,
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={14} />
          Back to Marketplace
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          {/* Avatar */}
          {role.avatarUrl ? (
            <img
              src={role.avatarUrl}
              alt={role.name}
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--radius-lg)',
                flexShrink: 0,
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--radius-lg)',
                background: `${accent}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 800,
                color: accent,
                fontFamily: 'var(--font-sans)',
                flexShrink: 0,
              }}
            >
              {role.companionName.charAt(0)}
            </div>
          )}

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#E8EDF5',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {role.name}
              </span>
              <Badge variant={BADGE_VARIANT[role.trustBadge] || 'basic'}>{role.trustBadge}</Badge>
            </div>
            <div
              style={{
                fontSize: 14,
                color: accent,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                marginBottom: 4,
              }}
            >
              {role.companionName}
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {role.tagline}
            </div>
          </div>

          {/* Price and hire CTA */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: role.priceMonthly === 0 ? 'var(--color-success)' : '#E8EDF5',
                fontFamily: 'var(--font-sans)',
                marginBottom: 8,
              }}
            >
              {formatPrice(role.priceMonthly)}
            </div>
            {isHired ? (
              <Badge variant="success" size="md">
                Hired
              </Badge>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={() => onHire(role.id)}
                icon={<Zap size={14} />}
              >
                Hire This Role
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680 }}>
          {/* Description */}
          <Card padding="16px">
            <SectionTitle>About</SectionTitle>
            <div
              style={{
                fontSize: 13,
                color: '#E8EDF5',
                lineHeight: 1.7,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {role.description}
            </div>
          </Card>

          {/* Capabilities */}
          <Card padding="16px">
            <SectionTitle>Capabilities</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {role.capabilities.map((cap, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <CheckCircle
                    size={14}
                    color="var(--color-success)"
                    style={{ flexShrink: 0, marginTop: 2 }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      color: '#E8EDF5',
                      lineHeight: 1.5,
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {cap}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Trust audit summary */}
          {role.auditSummary && (
            <Card padding="16px">
              <SectionTitle icon={<Shield size={14} />}>Trust Audit</SectionTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: accent,
                      fontFamily: 'var(--font-sans)',
                      lineHeight: 1,
                    }}
                  >
                    {role.auditSummary.totalScore}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--color-text-muted)',
                      fontFamily: 'var(--font-sans)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Audit Score
                  </div>
                </div>
                <div>
                  <Badge variant={BADGE_VARIANT[role.auditSummary.badge] || 'basic'} size="md">
                    {role.auditSummary.badge}
                  </Badge>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 6,
                      fontSize: 11,
                      color: 'var(--color-text-muted)',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <Calendar size={10} />
                    Audited {new Date(role.auditSummary.auditedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Skills */}
          {role.skills.length > 0 && (
            <Card padding="16px">
              <SectionTitle>Skills</SectionTitle>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {role.skills.map((skill) => (
                  <Badge key={skill.skillSlug} variant="info" size="md">
                    {skill.skillName}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Limitations */}
          {role.limitations.length > 0 && (
            <Card padding="16px">
              <SectionTitle>Limitations</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {role.limitations.map((lim, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      color: 'var(--color-text-muted)',
                      lineHeight: 1.5,
                      fontFamily: 'var(--font-sans)',
                      paddingLeft: 12,
                      borderLeft: '2px solid var(--color-border)',
                    }}
                  >
                    {lim}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: 700,
        color: '#E8EDF5',
        fontFamily: 'var(--font-sans)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginBottom: 10,
      }}
    >
      {icon && <span style={{ color: 'var(--color-text-muted)', display: 'flex' }}>{icon}</span>}
      {children}
    </div>
  );
}

export default RoleDetail;
