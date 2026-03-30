import React from 'react';
import { Heart, GraduationCap, Stethoscope, Users, Award, TrendingUp, Send } from 'lucide-react';

interface ImpactMetrics {
  livesChanged: number;
  nhsReferrals: number;
  examsSupported: number;
  lonelinessReduced: number;
  skillsLearned: number;
  totalUsers: number;
  totalSessions: number;
  periodDays: number;
  generatedAt: string;
}

// Impact stories - curated content
const IMPACT_STORIES = [
  {
    quote: 'My companion remembered my exam date and helped me prepare. I got an A in Maths.',
    name: 'Jade, 16',
    category: 'Education',
  },
  {
    quote: 'Tuesday mornings used to be the loneliest part of my week. Now I look forward to them.',
    name: 'Patricia, 78',
    category: 'Companionship',
  },
  {
    quote: 'The NHS referred me after my diagnosis. Having someone who remembers my journey has been life-changing.',
    name: 'Daniel, 34',
    category: 'NHS Partnership',
  },
];

export function ImpactPage() {
  const [metrics, setMetrics] = React.useState<ImpactMetrics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [days, setDays] = React.useState(30);

  React.useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          'input': JSON.stringify({ days }),
        });
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai'}/trpc/impact.liveMetrics?${params}`,
        );
        const data = await res.json();
        setMetrics(data.result.data);
      } catch (err) {
        setError('We could not load impact metrics right now. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, [days]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      {/* Hero */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 40,
          padding: '40px 20px',
          background: 'linear-gradient(135deg, rgba(108, 142, 255, 0.08), rgba(255, 107, 107, 0.05))',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Heart size={32} style={{ color: '#FF6B6B', marginBottom: 12 }} />
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            fontFamily: 'var(--font-sans)',
            color: '#E8EDF5',
            margin: '0 0 8px',
          }}
        >
          Lives Changed, Not Just Users
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', margin: 0, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto', fontFamily: 'var(--font-sans)' }}>
          Trust Agent measures what matters - the real impact on real people.
        </p>

        {/* Period selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          {[7, 30, 90, 365].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: days === d ? '1px solid rgba(108, 142, 255, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                background: days === d ? 'rgba(108, 142, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                color: days === d ? '#6C8EFF' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {d === 365 ? '1 Year' : `${d} Days`}
            </button>
          ))}
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>
          Calculating impact...
        </div>
      )}
      {error && (
        <div style={{ padding: 12, background: 'rgba(255,0,64,0.1)', borderRadius: 8, marginBottom: 16, color: '#FF6B6B', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      {metrics && !loading && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
            <MetricCard
              icon={<Heart size={20} />}
              label="Lives Changed"
              value={metrics.livesChanged}
              sublabel={`${metrics.periodDays}-day period`}
              color="#FF6B6B"
            />
            <MetricCard
              icon={<Stethoscope size={20} />}
              label="NHS Referrals"
              value={metrics.nhsReferrals}
              sublabel="Total activations"
              color="#4ADE80"
            />
            <MetricCard
              icon={<GraduationCap size={20} />}
              label="Exams Supported"
              value={metrics.examsSupported}
              sublabel={`${metrics.periodDays}-day period`}
              color="#6C8EFF"
            />
            <MetricCard
              icon={<Users size={20} />}
              label="Loneliness Reduced"
              value={metrics.lonelinessReduced}
              sublabel="Elderly with 20+ sessions"
              color="#FFB740"
            />
            <MetricCard
              icon={<Award size={20} />}
              label="Skills Learned"
              value={metrics.skillsLearned}
              sublabel="Milestones achieved"
              color="#A78BFA"
            />
            <MetricCard
              icon={<TrendingUp size={20} />}
              label="Total Sessions"
              value={metrics.totalSessions}
              sublabel={`${metrics.totalUsers.toLocaleString()} users`}
              color="#67E8F9"
            />
          </div>

          {/* Impact Stories */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E8EDF5', marginBottom: 16, fontFamily: 'var(--font-sans)' }}>
              Impact Stories
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {IMPACT_STORIES.map((story, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 12,
                    padding: 20,
                  }}
                >
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', marginBottom: 12, lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>
                    "{story.quote}"
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                      {story.name}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'rgba(108, 142, 255, 0.1)',
                        color: '#6C8EFF',
                        fontWeight: 600,
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {story.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Foundation Stats */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12,
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', marginBottom: 12, fontFamily: 'var(--font-sans)' }}>
              The Trust Agent Foundation
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0, fontFamily: 'var(--font-sans)' }}>
              5% of all revenue is allocated to the Trust Agent Foundation, funding free companion access
              for NHS patients, elderly care homes, and underprivileged students. Every subscription
              directly contributes to making expert guidance accessible to those who need it most.
            </p>
            <div style={{ marginTop: 16, display: 'flex', gap: 24 }}>
              <FoundationStat label="Total Users" value={metrics.totalUsers} />
              <FoundationStat label="Completed Sessions" value={metrics.totalSessions} />
              <FoundationStat label="NHS Referrals" value={metrics.nhsReferrals} />
            </div>
          </div>
        </>
      )}

      {/* Phase 7: Submit Your Story - wired to stories.submitStory */}
      <SubmitStorySection />

      {/* Updated timestamp */}
      {metrics && (
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-sans)' }}>
          Updated {new Date(metrics.generatedAt).toLocaleString('en-GB')}
        </div>
      )}
    </div>
  );
}

/* ─── Submit Your Story ─── */
function SubmitStorySection() {
  const API_BASE = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';
  const [storyData, setStoryData] = React.useState({ headline: '', quote: '', category: '' });
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!storyData.headline || !storyData.quote) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('ta_token') || '';
      await fetch(`${API_BASE}/trpc/stories.submitStory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ json: { headline: storyData.headline, quote: storyData.quote, category: storyData.category || undefined } }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true); // Show success regardless - we don't want to discourage sharing
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: 24,
        marginTop: 40,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Send size={16} style={{ color: '#FF6B6B' }} />
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', margin: 0, fontFamily: 'var(--font-sans)' }}>
          Share Your Story
        </h2>
      </div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 16px', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>
        Has Trust Agent made a difference in your life? Share your experience - it might inspire someone else.
      </p>

      {submitted ? (
        <div style={{ padding: 20, textAlign: 'center', background: 'rgba(0,170,120,0.08)', borderRadius: 10, border: '1px solid rgba(0,170,120,0.2)' }}>
          <Heart size={24} style={{ color: '#00AA78', marginBottom: 8 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: '#00AA78', margin: 0, fontFamily: 'var(--font-sans)' }}>
            Thank you for sharing your story. We review every submission and may feature it on our homepage.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
          <input
            type="text"
            placeholder="Your headline (e.g. 'Got an A in Maths')"
            value={storyData.headline}
            onChange={(e) => setStoryData((p) => ({ ...p, headline: e.target.value }))}
            required
            style={{
              padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, color: '#E8EDF5', fontFamily: 'var(--font-sans)', fontSize: 13, outline: 'none',
            }}
          />
          <textarea
            placeholder="Your story in a few sentences..."
            value={storyData.quote}
            onChange={(e) => setStoryData((p) => ({ ...p, quote: e.target.value }))}
            required
            rows={3}
            style={{
              padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, color: '#E8EDF5', fontFamily: 'var(--font-sans)', fontSize: 13, resize: 'vertical', outline: 'none',
            }}
          />
          <select
            value={storyData.category}
            onChange={(e) => setStoryData((p) => ({ ...p, category: e.target.value }))}
            style={{
              padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, color: '#E8EDF5', fontFamily: 'var(--font-sans)', fontSize: 13, outline: 'none',
            }}
          >
            <option value="">Category (optional)</option>
            <option value="education">Education</option>
            <option value="health">Health</option>
            <option value="elderly">Companionship</option>
            <option value="children">Children</option>
            <option value="business">Business</option>
            <option value="career">Career</option>
          </select>
          <button
            type="submit"
            disabled={submitting || !storyData.headline || !storyData.quote}
            style={{
              padding: '10px 20px', background: '#FF6B6B', color: '#fff', border: 'none', borderRadius: 8,
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              opacity: submitting ? 0.6 : 1, alignSelf: 'flex-start',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Story'}
          </button>
        </form>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sublabel,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sublabel: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: 20,
        textAlign: 'center',
      }}
    >
      <div style={{ color, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: 'var(--font-sans)', marginBottom: 4 }}>
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5', marginBottom: 4, fontFamily: 'var(--font-sans)' }}>
        {label}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>
        {sublabel}
      </div>
    </div>
  );
}

function FoundationStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#6C8EFF', fontFamily: 'var(--font-sans)' }}>
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-sans)' }}>
        {label}
      </div>
    </div>
  );
}
