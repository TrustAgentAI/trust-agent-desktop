import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

const MARKETPLACE_URL = 'https://app.trust-agent.ai/marketplace';
const EMBED_URL = `${MARKETPLACE_URL}?embed=desktop`;

export function MarketplacePanel() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-dark-navy)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: '16px',
              fontWeight: 800,
              fontFamily: 'var(--font-sans)',
              color: '#E8EDF5',
            }}
          >
            Marketplace
          </span>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
            }}
          >
            trust-agent.ai
          </span>
        </div>
        <a
          href={MARKETPLACE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            color: 'var(--color-electric-blue)',
            textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}
        >
          Open in browser <ExternalLink size={12} />
        </a>
      </div>

      {/* Content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {loading && !error && (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton height={32} width="40%" />
            <Skeleton height={16} width="70%" />
            <Skeleton height={200} />
            <Skeleton height={200} />
          </div>
        )}

        {error && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 48,
              gap: 16,
              height: '100%',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-ion-cyan))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '20px',
                color: '#fff',
                fontFamily: 'var(--font-sans)',
              }}
            >
              TA
            </div>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                maxWidth: 300,
                lineHeight: 1.6,
              }}
            >
              Embedded marketplace requires an internet connection.
            </p>
            <a
              href={MARKETPLACE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 20px',
                background: 'var(--color-electric-blue)',
                color: '#fff',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '13px',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                transition: 'opacity 0.15s ease',
              }}
            >
              Visit marketplace
            </a>
          </div>
        )}

        {!error && (
          <iframe
            src={EMBED_URL}
            title="Trust Agent Marketplace"
            onLoad={handleLoad}
            onError={handleError}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: 'var(--color-dark-navy)',
              display: loading ? 'none' : 'block',
            }}
          />
        )}
      </div>
    </div>
  );
}
