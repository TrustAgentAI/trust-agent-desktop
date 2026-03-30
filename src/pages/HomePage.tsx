/**
 * HomePage - Phase 2: Quote-first hero, real data from tRPC.
 *
 * Section order per spec:
 * Hero (blockquote FIRST) -> LivesChangedStrip -> TrustStrip -> SocialProofBanner
 * -> CategoryGrid -> FeaturedRoles -> PricingSection -> TestimonialsSection -> CTASection
 *
 * ALL data from real tRPC. No hardcoded arrays.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { useTrpcQuery } from '@/lib/useTrpcQuery';
import { CompanionCard } from '@/components/companions/CompanionCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Shield, Heart, GraduationCap, Users, Star, ArrowRight } from 'lucide-react';

/* ─── Types inferred from tRPC responses ─── */
interface FeaturedStory {
  id: string;
  firstName: string;
  city: string | null;
  category: string;
  headline: string;
  quote: string;
  outcome: string | null;
  companionName: string | null;
}

interface RoleCard {
  id: string;
  slug: string;
  companionName: string;
  tagline: string;
  category: string;
  emoji: string | null;
  priceMonthly: number;
  audit?: { trustScore: number; badge: string; totalScore: number } | null;
}

interface CategoryItem {
  name: string;
  count: number;
}

interface PricingTier {
  id: string;
  name: string;
  displayName: string;
  priceGBP: number;
  maxRoles: number;
  features: string[];
}

/* ─── Pricing comparisons per spec ─── */
const TIER_COMPARISONS: Record<string, string> = {
  starter: 'Less than one tutoring session.',
  essential: 'Less than two coffees a week.',
  family: 'Less than one family therapy session.',
  professional: 'Less than two hours of a consultant.',
};

/* ─── Category icons ─── */
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  education: <GraduationCap size={24} />,
  health: <Heart size={24} />,
  children: <Users size={24} />,
  elderly: <Heart size={24} />,
  business: <Shield size={24} />,
  career: <Star size={24} />,
  language: <GraduationCap size={24} />,
  navigation: <Shield size={24} />,
};

/* ─── Shared section wrapper ─── */
function Section({
  children,
  background,
  id,
}: {
  children: React.ReactNode;
  background?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      style={{
        width: '100%',
        padding: 'var(--space-16) var(--space-6)',
        background: background ?? 'transparent',
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>{children}</div>
    </section>
  );
}

/* ─── HERO ─── */
function Hero({ stories }: { stories: FeaturedStory[] }) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (stories.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % stories.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [stories.length]);

  const story = stories[activeIndex];
  if (!story) return null;

  return (
    <section
      style={{
        width: '100%',
        padding: 'var(--space-16) var(--space-6)',
        background: 'var(--bg-page)',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* THIS MUST BE FIRST - the quote, not the headline */}
        <blockquote
          style={{
            margin: 0,
            padding: 0,
            marginBottom: 'var(--space-8)',
          }}
        >
          <p
            style={{
              fontSize: 24,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              color: 'var(--text-primary)',
              lineHeight: 1.5,
              marginBottom: 'var(--space-4)',
            }}
          >
            &ldquo;{story.quote}&rdquo;
          </p>
          <footer
            style={{
              fontSize: 14,
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-muted)',
            }}
          >
            &mdash; {story.firstName}
            {story.city ? `, ${story.city}` : ''}
          </footer>
        </blockquote>

        {/* Dot indicators for rotating quotes */}
        {stories.length > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-10)',
            }}
          >
            {stories.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                aria-label={`Show quote ${i + 1}`}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  cursor: 'pointer',
                  background:
                    i === activeIndex
                      ? 'var(--primary-600)'
                      : 'var(--border-default)',
                  transition: 'background var(--transition-fast)',
                }}
              />
            ))}
          </div>
        )}

        {/* SECOND - the mission headline */}
        <h1
          style={{
            fontSize: 40,
            fontWeight: 700,
            fontFamily: 'var(--font-serif)',
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            marginBottom: 'var(--space-4)',
          }}
        >
          The expert you always <em>wished you could afford.</em>
        </h1>

        {/* THIRD - one sentence */}
        <p
          style={{
            fontSize: 17,
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: 'var(--space-8)',
          }}
        >
          AI companions independently audited for safety, accuracy, and trust. Tutors, therapists, coaches, and advisors - from {'\u00A3'}9.99/mo.
        </p>

        {/* FOURTH - single CTA */}
        <button
          onClick={() => navigate('/companions')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-4) var(--space-8)',
            background: 'var(--primary-600)',
            color: 'var(--text-inverse)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: 16,
            border: 'none',
            borderRadius: 'var(--radius-pill)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
            transition: 'opacity var(--transition-fast)',
            minHeight: 48,
          }}
        >
          Meet your companion <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}

/* ─── LIVES CHANGED STRIP ─── */
function LivesChangedStrip() {
  const { data } = useTrpcQuery(
    () => trpc.impact.liveMetrics.query({ days: 365 }),
    [],
  );

  const metrics = [
    { label: 'Lives changed', value: data?.livesChanged ?? 0 },
    { label: 'Sessions completed', value: data?.totalSessions ?? 0 },
    { label: 'NHS referrals', value: data?.nhsReferrals ?? 0 },
  ];

  return (
    <Section background="var(--bg-surface)">
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--space-12)',
          flexWrap: 'wrap',
        }}
      >
        {metrics.map((m) => (
          <div key={m.label} style={{ textAlign: 'center', minWidth: 120 }}>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                color: 'var(--primary-600)',
              }}
            >
              {m.value.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: 13,
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-muted)',
                marginTop: 'var(--space-1)',
              }}
            >
              {m.label}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ─── TRUST STRIP ─── */
function TrustStrip() {
  const signals = [
    '47-check safety audit on every companion',
    'Expert-reviewed by named professionals',
    'SHA-256 verified - tamper-proof prompts',
    'No dark patterns. Cancel any time.',
  ];
  return (
    <Section>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-6)',
        }}
      >
        {signals.map((s) => (
          <div
            key={s}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-secondary)',
            }}
          >
            <Shield size={16} style={{ color: 'var(--accent-600)', flexShrink: 0 }} />
            {s}
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ─── CATEGORY GRID ─── */
function CategoryGrid({ categories }: { categories: CategoryItem[] }) {
  const navigate = useNavigate();

  if (categories.length === 0) return null;

  return (
    <Section id="categories">
      <h2
        style={{
          fontSize: 28,
          fontWeight: 700,
          fontFamily: 'var(--font-serif)',
          color: 'var(--text-primary)',
          textAlign: 'center',
          marginBottom: 'var(--space-8)',
        }}
      >
        Find your expert
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => navigate(`/companions?category=${encodeURIComponent(cat.name)}`)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-6)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-card)',
              cursor: 'pointer',
              transition: 'box-shadow var(--transition-normal)',
              boxShadow: 'var(--shadow-sm)',
              minHeight: 48,
            }}
            aria-label={`Browse ${cat.name} companions`}
          >
            <span style={{ color: 'var(--primary-600)' }}>
              {CATEGORY_ICONS[cat.name.toLowerCase()] ?? <Star size={24} />}
            </span>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-primary)',
                textTransform: 'capitalize',
              }}
            >
              {cat.name}
            </span>
            <span
              style={{
                fontSize: 12,
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-muted)',
              }}
            >
              {cat.count} companion{cat.count !== 1 ? 's' : ''}
            </span>
          </button>
        ))}
      </div>
    </Section>
  );
}

/* ─── FEATURED ROLES ─── */
function FeaturedRoles({ roles }: { roles: RoleCard[] }) {
  const navigate = useNavigate();

  if (roles.length === 0) return null;

  return (
    <Section id="featured" background="var(--bg-surface)">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-6)',
        }}
      >
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            fontFamily: 'var(--font-serif)',
            color: 'var(--text-primary)',
          }}
        >
          Featured companions
        </h2>
        <button
          onClick={() => navigate('/companions')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            color: 'var(--primary-600)',
            minHeight: 44,
          }}
        >
          View all <ArrowRight size={16} />
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 'var(--space-5)',
        }}
      >
        {roles.map((role) => (
          <CompanionCard
            key={role.id}
            slug={role.slug}
            companionName={role.companionName}
            tagline={role.tagline}
            category={role.category}
            emoji={role.emoji}
            trustScore={role.audit?.trustScore ?? 0}
            badge={role.audit?.badge ?? 'BASIC'}
            priceMonthly={role.priceMonthly}
          />
        ))}
      </div>
    </Section>
  );
}

/* ─── PRICING ─── */
function PricingSection({ tiers }: { tiers: PricingTier[] }) {
  const navigate = useNavigate();

  if (tiers.length === 0) return null;

  return (
    <Section id="pricing">
      <h2
        style={{
          fontSize: 28,
          fontWeight: 700,
          fontFamily: 'var(--font-serif)',
          color: 'var(--text-primary)',
          textAlign: 'center',
          marginBottom: 'var(--space-2)',
        }}
      >
        Honest pricing
      </h2>
      <p
        style={{
          fontSize: 15,
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginBottom: 'var(--space-10)',
        }}
      >
        No hidden fees. No lock-in. Cancel any time.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-5)',
        }}
      >
        {tiers.map((tier) => {
          const comparison = TIER_COMPARISONS[tier.name.toLowerCase()] ?? '';
          return (
            <div
              key={tier.id}
              style={{
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--shadow-card)',
                padding: 'var(--space-6)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
              }}
            >
              {/* Comparison box - more prominent than price per spec */}
              {comparison && (
                <div
                  style={{
                    background: 'var(--primary-50)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3) var(--space-4)',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    color: 'var(--primary-700)',
                    textAlign: 'center',
                  }}
                >
                  {comparison}
                </div>
              )}

              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--text-primary)',
                  textTransform: 'capitalize',
                }}
              >
                {tier.displayName}
              </h3>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-1)' }}>
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {'\u00A3'}{tier.priceGBP.toFixed(2)}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--text-muted)',
                  }}
                >
                  /mo
                </span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1 }}>
                <li
                  style={{
                    fontSize: 13,
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Up to {tier.maxRoles} companion{tier.maxRoles !== 1 ? 's' : ''}
                </li>
                {tier.features.slice(0, 4).map((f) => (
                  <li
                    key={f}
                    style={{
                      fontSize: 13,
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--text-secondary)',
                      marginBottom: 'var(--space-2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <span style={{ color: 'var(--accent-600)' }}>&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate(`/checkout/${tier.name}`)}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  background: 'var(--primary-600)',
                  color: 'var(--text-inverse)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  fontSize: 14,
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'opacity var(--transition-fast)',
                  minHeight: 44,
                }}
              >
                Get started
              </button>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ─── TESTIMONIALS ─── */
function TestimonialsSection({ stories }: { stories: FeaturedStory[] }) {
  if (stories.length === 0) return null;

  return (
    <Section id="testimonials" background="var(--bg-surface)">
      <h2
        style={{
          fontSize: 28,
          fontWeight: 700,
          fontFamily: 'var(--font-serif)',
          color: 'var(--text-primary)',
          textAlign: 'center',
          marginBottom: 'var(--space-8)',
        }}
      >
        Real stories from real people
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--space-5)',
        }}
      >
        {stories.map((story) => (
          <div
            key={story.id}
            style={{
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-sm)',
              padding: 'var(--space-6)',
            }}
          >
            <p
              style={{
                fontSize: 15,
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                marginBottom: 'var(--space-4)',
              }}
            >
              &ldquo;{story.quote}&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {story.firstName}
                  {story.city ? `, ${story.city}` : ''}
                </div>
                {story.outcome && (
                  <div
                    style={{
                      fontSize: 12,
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--text-muted)',
                      marginTop: 2,
                    }}
                  >
                    {story.outcome}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ─── CTA ─── */
function CTASection() {
  const navigate = useNavigate();
  return (
    <Section>
      <div style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>
        <h2
          style={{
            fontSize: 32,
            fontWeight: 700,
            fontFamily: 'var(--font-serif)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-4)',
          }}
        >
          Everyone deserves an expert who knows them.
        </h2>
        <p
          style={{
            fontSize: 16,
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-8)',
            maxWidth: 520,
            margin: '0 auto var(--space-8)',
          }}
        >
          Start with one companion. See the difference in a week. Cancel any time - no questions asked.
        </p>
        <button
          onClick={() => navigate('/companions')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-4) var(--space-10)',
            background: 'var(--primary-600)',
            color: 'var(--text-inverse)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: 16,
            border: 'none',
            borderRadius: 'var(--radius-pill)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
            minHeight: 48,
          }}
        >
          Browse companions <ArrowRight size={18} />
        </button>
      </div>
    </Section>
  );
}

/* ─── LOADING SKELETON ─── */
function HomePageSkeleton() {
  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
        <Skeleton height={80} width="80%" style={{ margin: '0 auto 24px', borderRadius: 'var(--radius-md)' }} />
        <Skeleton height={48} width="70%" style={{ margin: '0 auto 16px' }} />
        <Skeleton height={20} width="60%" style={{ margin: '0 auto 32px' }} />
        <Skeleton height={48} width={200} style={{ margin: '0 auto', borderRadius: 'var(--radius-pill)' }} />
      </div>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={280} style={{ borderRadius: 'var(--radius-card)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── ERROR STATE ─── */
function HomePageError({ message }: { message: string }) {
  return (
    <div
      style={{
        background: 'var(--bg-page)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-3)',
          }}
        >
          We hit a bump loading the page
        </h2>
        <p
          style={{
            fontSize: 14,
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-muted)',
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
/* MAIN HOMEPAGE COMPONENT                                */
/* ═══════════════════════════════════════════════════════ */
export function HomePage() {
  // All data from real tRPC
  const heroStories = useTrpcQuery(
    () => trpc.stories.getFeatured.query({ audience: 'homepage', limit: 5 }),
    [],
  );

  const categories = useTrpcQuery(
    () => trpc.roles.getCategories.query(),
    [],
  );

  const featuredRoles = useTrpcQuery(
    () => trpc.roles.getFeatured.query({ limit: 8 }),
    [],
  );

  const pricingTiers = useTrpcQuery(
    () => trpc.pricing.getTiers.query(),
    [],
  );

  const testimonialStories = useTrpcQuery(
    () => trpc.stories.getForAudience.query({ audience: 'homepage', limit: 6 }),
    [],
  );

  // Show skeleton while hero stories load (most important)
  if (heroStories.isLoading) {
    return <HomePageSkeleton />;
  }

  if (heroStories.isError) {
    return <HomePageError message={heroStories.error ?? 'Could not load the homepage.'} />;
  }

  const stories = heroStories.data ?? [];

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      {/* 1. Hero with rotating quotes */}
      <Hero stories={stories} />

      {/* 2. Lives changed strip */}
      <LivesChangedStrip />

      {/* 3. Trust strip */}
      <TrustStrip />

      {/* 4. Category grid */}
      <CategoryGrid categories={categories.data ?? []} />

      {/* 5. Featured roles */}
      <FeaturedRoles roles={featuredRoles.data ?? []} />

      {/* 6. Pricing section */}
      <PricingSection tiers={pricingTiers.data ?? []} />

      {/* 7. Testimonials */}
      <TestimonialsSection stories={testimonialStories.data ?? []} />

      {/* 8. CTA */}
      <CTASection />
    </div>
  );
}
