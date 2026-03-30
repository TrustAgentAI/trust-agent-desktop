/**
 * HeroSection - Phase 15: Homepage Emotional Resonance
 *
 * Quote-first hero that makes visitors feel something before they read anything.
 * Rotating quotes from different user archetypes.
 * The first 3 seconds must either make someone recognise themselves
 * or think of someone they love.
 */
import React from 'react';

interface TestimonialQuote {
  text: string;
  attribution: string;
}

const HERO_QUOTES: TestimonialQuote[] = [
  {
    text: "I've been on the NHS waiting list for 14 months. Dr. Patel was there within an hour.",
    attribution: 'Alicia, Manchester',
  },
  {
    text: "Miss Davies helped Jade go from D to B in 6 weeks. We could never have afforded a private tutor.",
    attribution: 'Helen, Birmingham',
  },
  {
    text: "Dorothy calls me by name. That sounds small. It isn't.",
    attribution: 'Frank, 81, Norfolk',
  },
  {
    text: "My GP referred me. I didn't even know this existed. Now I talk to someone every morning.",
    attribution: 'Patricia, Liverpool',
  },
  {
    text: "I was failing A-Level Maths. Three weeks with Mr. Khan and I got a B. A real B.",
    attribution: 'Jade, 17, London',
  },
];

const SOCIAL_PROOF_LINES = [
  "7-day free trial - No credit card - Cancel anytime",
  "151 verified companions - Every one independently audited",
  "Trusted by GPs, schools, and families across the UK",
];

export function HeroSection() {
  const [activeQuoteIndex, setActiveQuoteIndex] = React.useState(0);
  const [activeSocialIndex, setActiveSocialIndex] = React.useState(0);
  const [fadeState, setFadeState] = React.useState<'in' | 'out'>('in');

  // Rotate quotes every 5 seconds with fade
  React.useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('out');
      setTimeout(() => {
        setActiveQuoteIndex((prev) => (prev + 1) % HERO_QUOTES.length);
        setFadeState('in');
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Rotate social proof every 4 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveSocialIndex((prev) => (prev + 1) % SOCIAL_PROOF_LINES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const currentQuote = HERO_QUOTES[activeQuoteIndex];

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 480,
        textAlign: 'center',
        marginBottom: 32,
      }}
    >
      {/* Opening quote - emotional resonance */}
      <div
        style={{
          minHeight: 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <blockquote
          style={{
            margin: 0,
            padding: '0 16px',
            opacity: fadeState === 'in' ? 1 : 0,
            transition: 'opacity 400ms ease',
          }}
        >
          <p
            style={{
              fontSize: '18px',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              color: '#E8EDF5',
              lineHeight: 1.6,
              fontStyle: 'italic',
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            &ldquo;{currentQuote.text}&rdquo;
          </p>
          <footer
            style={{
              marginTop: 10,
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-ion-cyan)',
              fontWeight: 500,
              fontStyle: 'normal',
            }}
          >
            - {currentQuote.attribution}
          </footer>
        </blockquote>
      </div>

      {/* Quote dots indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
          marginBottom: 20,
        }}
      >
        {HERO_QUOTES.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setFadeState('out');
              setTimeout(() => {
                setActiveQuoteIndex(i);
                setFadeState('in');
              }, 200);
            }}
            aria-label={`Quote ${i + 1}`}
            style={{
              width: i === activeQuoteIndex ? 20 : 6,
              height: 6,
              borderRadius: 3,
              border: 'none',
              background:
                i === activeQuoteIndex
                  ? 'var(--color-electric-blue)'
                  : 'rgba(255,255,255,0.15)',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 300ms ease',
            }}
          />
        ))}
      </div>

      {/* Product headline */}
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 800,
          fontFamily: 'var(--font-sans)',
          color: '#E8EDF5',
          lineHeight: 1.25,
          letterSpacing: '-0.02em',
          margin: '0 0 8px',
        }}
      >
        The expert you always{' '}
        <span style={{ color: 'var(--color-electric-blue)' }}>wished you could afford.</span>
      </h1>

      {/* Subheadline */}
      <p
        style={{
          fontSize: '13px',
          fontFamily: 'var(--font-sans)',
          color: 'var(--color-text-muted)',
          lineHeight: 1.6,
          margin: '0 0 14px',
          padding: '0 8px',
        }}
      >
        Every companion on Trust Agent is independently audited, cryptographically verified,
        and built by qualified experts. And they remember everything about you.
      </p>

      {/* Rotating social proof strip */}
      <div
        style={{
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-ion-cyan)',
          minHeight: 16,
          transition: 'opacity 300ms ease',
        }}
      >
        {SOCIAL_PROOF_LINES[activeSocialIndex]}
      </div>
    </div>
  );
}

export default HeroSection;
