/**
 * CompanionCard - 4 elements only per spec.
 * 1. Portrait (category-tinted warm background, emoji, badge, online dot)
 * 2. Name
 * 3. One-line tagline
 * 4. Trust score bar
 * + Hire CTA always visible
 */
import { useNavigate } from 'react-router-dom';

const CATEGORY_COLOURS: Record<string, { accent: string; bg: string }> = {
  education: { accent: 'var(--cat-education)', bg: 'var(--cat-education-bg)' },
  health: { accent: 'var(--cat-health)', bg: 'var(--cat-health-bg)' },
  children: { accent: 'var(--cat-children)', bg: 'var(--cat-children-bg)' },
  language: { accent: 'var(--cat-language)', bg: 'var(--cat-language-bg)' },
  business: { accent: 'var(--cat-business)', bg: 'var(--cat-business-bg)' },
  career: { accent: 'var(--cat-career)', bg: 'var(--cat-career-bg)' },
  elderly: { accent: 'var(--cat-elderly)', bg: 'var(--cat-elderly-bg)' },
  navigation: { accent: 'var(--cat-navigation)', bg: 'var(--cat-navigation-bg)' },
};

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  PLATINUM: { bg: 'var(--accent-600)', color: 'var(--text-inverse)' },
  GOLD: { bg: '#B8860B', color: 'var(--text-inverse)' },
  SILVER: { bg: '#7A7A74', color: 'var(--text-inverse)' },
  BASIC: { bg: 'var(--bg-surface)', color: 'var(--text-secondary)' },
};

interface CompanionCardProps {
  slug: string;
  companionName: string;
  tagline: string;
  category: string;
  emoji?: string | null;
  trustScore: number;
  badge: string;
  priceMonthly: number;
}

function BadgePill({ tier }: { tier: string }) {
  const style = BADGE_STYLES[tier] ?? BADGE_STYLES.BASIC;
  return (
    <span
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        fontSize: 10,
        fontWeight: 700,
        fontFamily: 'var(--font-sans)',
        padding: '2px 8px',
        borderRadius: 'var(--radius-pill)',
        background: style.bg,
        color: style.color,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {tier}
    </span>
  );
}

function OnlineDot() {
  return (
    <span
      aria-label="Online"
      style={{
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 10,
        height: 10,
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-success)',
        border: '2px solid var(--bg-elevated)',
      }}
    />
  );
}

function TrustScoreBar({ score, colour }: { score: number; colour: string }) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Trust score: ${pct}%`}
      style={{
        width: '100%',
        height: 6,
        borderRadius: 'var(--radius-pill)',
        background: 'var(--bg-surface)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 'var(--radius-pill)',
          background: colour,
          transition: 'width var(--transition-normal)',
        }}
      />
    </div>
  );
}

export function CompanionCard({
  slug,
  companionName,
  tagline,
  category,
  emoji,
  trustScore,
  badge,
  priceMonthly,
}: CompanionCardProps) {
  const navigate = useNavigate();
  const cat = CATEGORY_COLOURS[category.toLowerCase()] ?? {
    accent: 'var(--primary-600)',
    bg: 'var(--bg-surface)',
  };

  const firstName = companionName.split(' ')[0];
  const priceGBP = (priceMonthly / 100).toFixed(2);

  return (
    <article
      className="companion-card"
      style={{
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'box-shadow var(--transition-normal), transform var(--transition-normal)',
      }}
      onClick={() => navigate(`/companions/${slug}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/companions/${slug}`);
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`View ${companionName}`}
    >
      {/* 1. Portrait */}
      <div
        style={{
          background: cat.bg,
          height: 120,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 30 }} role="img" aria-hidden="true">
          {emoji ?? '🤖'}
        </span>
        <BadgePill tier={badge} />
        <OnlineDot />
      </div>

      <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1 }}>
        {/* 2. Name */}
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          {companionName}
        </h3>

        {/* 3. One line */}
        <p
          style={{
            fontSize: 13,
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: 1.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {tagline}
        </p>

        {/* 4. Trust score bar */}
        <TrustScoreBar score={trustScore} colour={cat.accent} />
      </div>

      {/* Hire CTA - ALWAYS VISIBLE */}
      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          borderTop: '1px solid var(--border-default)',
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-secondary)',
          }}
        >
          From {'\u00A3'}{priceGBP}/mo
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'var(--font-sans)',
            color: 'var(--primary-600)',
          }}
        >
          Hire {firstName} &rarr;
        </span>
      </footer>
    </article>
  );
}
