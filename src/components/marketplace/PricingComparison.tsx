/**
 * Phase 12 - Pricing Framing
 * 12.1: Comparison framing on pricing page
 * 12.2: Pricing comparison cards on role detail pages
 *
 * Shows the massive saving vs human equivalent:
 * "A private GCSE tutor costs 60/hour. Trust Agent costs 9.99/month."
 */
import { TrendingDown, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';

// --- Types ---

export interface PricingComparisonData {
  /** Role category for lookup */
  category: string;
  /** Human equivalent title */
  humanTitle: string;
  /** Human equivalent hourly rate in GBP */
  humanHourlyRate: number;
  /** Trust Agent monthly price in GBP */
  trustAgentMonthly: number;
  /** Saving percentage */
  savePercentage: number;
}

// --- Pricing data per role category ---

const PRICING_COMPARISONS: Record<string, PricingComparisonData> = {
  'gcse-tutor': {
    category: 'gcse-tutor',
    humanTitle: 'Private GCSE tutor',
    humanHourlyRate: 60,
    trustAgentMonthly: 9.99,
    savePercentage: 98,
  },
  'a-level-tutor': {
    category: 'a-level-tutor',
    humanTitle: 'Private A-Level tutor',
    humanHourlyRate: 70,
    trustAgentMonthly: 9.99,
    savePercentage: 98,
  },
  'mental-health': {
    category: 'mental-health',
    humanTitle: 'Private therapy session',
    humanHourlyRate: 90,
    trustAgentMonthly: 9.99,
    savePercentage: 99,
  },
  'daily-companion': {
    category: 'daily-companion',
    humanTitle: 'Home care companion',
    humanHourlyRate: 25,
    trustAgentMonthly: 9.99,
    savePercentage: 97,
  },
  'business-advisor': {
    category: 'business-advisor',
    humanTitle: 'Business consultant',
    humanHourlyRate: 150,
    trustAgentMonthly: 9.99,
    savePercentage: 99,
  },
  'career-coach': {
    category: 'career-coach',
    humanTitle: 'Career coach',
    humanHourlyRate: 80,
    trustAgentMonthly: 9.99,
    savePercentage: 99,
  },
  'language-tutor': {
    category: 'language-tutor',
    humanTitle: 'Language tutor',
    humanHourlyRate: 45,
    trustAgentMonthly: 9.99,
    savePercentage: 98,
  },
  'fitness-coach': {
    category: 'fitness-coach',
    humanTitle: 'Personal trainer',
    humanHourlyRate: 50,
    trustAgentMonthly: 9.99,
    savePercentage: 98,
  },
  'elderly-companion': {
    category: 'elderly-companion',
    humanTitle: 'Home visit companion',
    humanHourlyRate: 20,
    trustAgentMonthly: 9.99,
    savePercentage: 96,
  },
  default: {
    category: 'default',
    humanTitle: 'Human expert',
    humanHourlyRate: 60,
    trustAgentMonthly: 9.99,
    savePercentage: 98,
  },
};

export function getPricingComparison(category: string): PricingComparisonData {
  // Try exact match first, then prefix match, then default
  if (PRICING_COMPARISONS[category]) return PRICING_COMPARISONS[category];

  for (const [key, data] of Object.entries(PRICING_COMPARISONS)) {
    if (category.toLowerCase().includes(key) || key.includes(category.toLowerCase())) {
      return data;
    }
  }

  return PRICING_COMPARISONS.default;
}

// --- Phase 12.1: Full pricing comparison section ---

export function PricingComparisonSection() {
  const comparisons = [
    PRICING_COMPARISONS['gcse-tutor'],
    PRICING_COMPARISONS['mental-health'],
    PRICING_COMPARISONS['business-advisor'],
    PRICING_COMPARISONS['daily-companion'],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: '#E8EDF5',
            fontFamily: 'var(--font-sans)',
            margin: '0 0 6px',
          }}
        >
          Why Trust Agent?
        </h3>
        <p
          style={{
            fontSize: 13,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-sans)',
            margin: 0,
            maxWidth: 480,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Expert-level support at a fraction of the cost. Available 24/7, remembers everything, never judges.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {comparisons.map((comp) => (
          <PricingComparisonCard key={comp.category} data={comp} />
        ))}
      </div>
    </div>
  );
}

// --- Phase 12.2: Inline pricing comparison card for role detail pages ---

interface PricingComparisonCardProps {
  data: PricingComparisonData;
  compact?: boolean;
}

export function PricingComparisonCard({ data, compact = false }: PricingComparisonCardProps) {
  return (
    <Card
      padding={compact ? '12px' : '16px'}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Save badge */}
      <div
        style={{
          position: 'absolute',
          top: compact ? 8 : 12,
          right: compact ? 8 : 12,
          background: 'var(--color-success)',
          color: '#fff',
          fontSize: compact ? 11 : 13,
          fontWeight: 800,
          fontFamily: 'var(--font-sans)',
          padding: compact ? '2px 8px' : '3px 10px',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        Save {data.savePercentage}%
      </div>

      {/* Human equivalent */}
      <div style={{ marginBottom: compact ? 8 : 12 }}>
        <div
          style={{
            fontSize: compact ? 10 : 11,
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-sans)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 4,
          }}
        >
          Human equivalent
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span
            style={{
              fontSize: compact ? 16 : 20,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'var(--font-sans)',
              textDecoration: 'line-through',
            }}
          >
            {'\u00A3'}{data.humanHourlyRate}
          </span>
          <span style={{ fontSize: compact ? 10 : 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
            /hour
          </span>
        </div>
        <div style={{ fontSize: compact ? 10 : 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
          {data.humanTitle}
        </div>
      </div>

      {/* Trust Agent price */}
      <div
        style={{
          padding: compact ? '8px 10px' : '10px 12px',
          background: 'rgba(30,111,255,0.06)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(30,111,255,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <Zap size={compact ? 12 : 14} color="var(--color-electric-blue)" />
          <span
            style={{
              fontSize: compact ? 10 : 11,
              fontWeight: 600,
              color: 'var(--color-electric-blue)',
              fontFamily: 'var(--font-sans)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Trust Agent
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span
            style={{
              fontSize: compact ? 18 : 24,
              fontWeight: 800,
              color: '#E8EDF5',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {'\u00A3'}{data.trustAgentMonthly.toFixed(2)}
          </span>
          <span style={{ fontSize: compact ? 10 : 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
            /month
          </span>
        </div>
        <div style={{ fontSize: compact ? 9 : 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', marginTop: 2 }}>
          Unlimited sessions - 24/7 availability
        </div>
      </div>
    </Card>
  );
}

// --- Phase 12.2: Inline comparison for role detail ---

interface RolePricingComparisonProps {
  category: string;
}

export function RolePricingComparison({ category }: RolePricingComparisonProps) {
  const data = getPricingComparison(category);

  return (
    <Card padding="16px">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <TrendingDown size={14} color="var(--color-success)" />
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#E8EDF5',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Pricing comparison
        </span>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {/* Human cost */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
            {data.humanTitle}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-sans)', textDecoration: 'line-through' }}>
            {'\u00A3'}{data.humanHourlyRate}/hr
          </div>
        </div>

        {/* Arrow */}
        <div style={{ fontSize: 20, color: 'var(--color-success)' }}>
          {'\u2192'}
        </div>

        {/* Trust Agent cost */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-electric-blue)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
            Trust Agent
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
            {'\u00A3'}{data.trustAgentMonthly.toFixed(2)}/mo
          </div>
        </div>

        {/* Save badge */}
        <div
          style={{
            padding: '8px 14px',
            background: 'var(--color-success)',
            borderRadius: 'var(--radius-md)',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-sans)', lineHeight: 1 }}>
            {data.savePercentage}%
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Saved
          </div>
        </div>
      </div>
    </Card>
  );
}
