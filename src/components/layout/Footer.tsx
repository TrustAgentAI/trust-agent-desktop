import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Heart, Lock, Award } from 'lucide-react';

interface FooterLink {
  label: string;
  path: string;
}

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Marketplace', path: '/marketplace' },
      { label: 'Pricing', path: '/pricing' },
      { label: 'How it works', path: '/how-it-works' },
      { label: 'Trust Score', path: '/trust-score' },
      { label: 'Hardware', path: '/hardware' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Centre', path: '/help' },
      { label: 'NHS Referrals', path: '/nhs' },
      { label: 'Schools', path: '/schools' },
      { label: 'Accessibility', path: '/accessibility' },
      { label: 'Contact', path: '/contact' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Mission', path: '/mission' },
      { label: 'Impact', path: '/impact' },
      { label: 'Creator Programme', path: '/creators' },
      { label: 'Careers', path: '/careers' },
      { label: 'Press', path: '/press' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Cookie Policy', path: '/cookies' },
      { label: 'Safeguarding', path: '/safeguarding' },
      { label: 'Data Processing', path: '/data-processing' },
    ],
  },
];

interface TrustSignal {
  icon: React.ReactNode;
  label: string;
}

const trustSignals: TrustSignal[] = [
  { icon: <Shield size={16} />, label: '47 safety checks per role' },
  { icon: <Lock size={16} />, label: 'End-to-end encrypted' },
  { icon: <Award size={16} />, label: 'ICO registered' },
  { icon: <Heart size={16} />, label: 'NHS referral pathway' },
];

export function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      style={{
        background: 'var(--text-primary)',
        color: 'var(--text-inverse)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Trust signals strip */}
      <div
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          padding: 'var(--space-4) var(--space-4)',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 'var(--space-6)',
          }}
        >
          {trustSignals.map((signal) => (
            <div
              key={signal.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontSize: 13,
                fontWeight: 500,
                opacity: 0.85,
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--accent-300)',
                }}
              >
                {signal.icon}
              </span>
              {signal.label}
            </div>
          ))}
        </div>
      </div>

      {/* Main footer content */}
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: 'var(--space-12) var(--space-4) var(--space-8)',
        }}
      >
        {/* Mission statement */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'var(--space-12)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 28,
              fontStyle: 'italic',
              fontWeight: 400,
              opacity: 0.9,
              maxWidth: 600,
              margin: '0 auto',
              lineHeight: 1.4,
            }}
          >
            Everyone deserves an expert who knows them.
          </p>
        </div>

        {/* 4-column link grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--space-8)',
            marginBottom: 'var(--space-12)',
          }}
        >
          {columns.map((col) => (
            <div key={col.title}>
              <h3
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 'var(--space-4)',
                  opacity: 0.6,
                }}
              >
                {col.title}
              </h3>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                }}
              >
                {col.links.map((link) => (
                  <li key={link.path}>
                    <button
                      onClick={() => navigate(link.path)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-inverse)',
                        opacity: 0.75,
                        fontSize: 14,
                        fontWeight: 400,
                        fontFamily: 'var(--font-sans)',
                        cursor: 'pointer',
                        padding: '2px 0',
                        textAlign: 'left',
                        transition: 'opacity var(--transition-fast)',
                        minHeight: 28,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.75';
                      }}
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: 'var(--space-6)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-4)',
            fontSize: 13,
            opacity: 0.6,
          }}
        >
          <span>
            AgentCore LTD - Company No. 17114811 - trust-agent.ai
          </span>
          <span>{currentYear} Trust Agent. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
