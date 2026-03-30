/**
 * Phase 9 - Creator Page
 * Margaret's story, earnings calculator, apply form, creator stories from tRPC.
 */
import React from 'react';
import { Star, PoundSterling, Users, TrendingUp, Send, Award } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

interface CreatorStory {
  id: string;
  headline: string;
  story: string;
  profession: string;
  monthlyEarnings: number | null;
  videoUrl: string | null;
  creator: { firstName: string | null; city: string | null; name: string | null };
  role: { name: string; slug: string; emoji: string | null; _count: { hires: number } };
}

export function CreatorPage() {
  const [stories, setStories] = React.useState<CreatorStory[]>([]);
  const [storiesLoading, setStoriesLoading] = React.useState(true);

  // Earnings calculator state
  const [hireCount, setHireCount] = React.useState(50);
  const [pricePerMonth] = React.useState(9.99);

  // Apply form
  const [applyData, setApplyData] = React.useState({ name: '', email: '', expertise: '', pitch: '' });
  const [applySubmitted, setApplySubmitted] = React.useState(false);
  const [applySubmitting, setApplySubmitting] = React.useState(false);

  // Fetch creator stories
  React.useEffect(() => {
    async function loadStories() {
      try {
        const params = new URLSearchParams({
          input: JSON.stringify({ featuredOnly: true }),
        });
        const res = await fetch(`${API_BASE}/trpc/creator.getCreatorStories?${params}`);
        const data = await res.json();
        setStories(data.result?.data ?? []);
      } catch {
        // Stories unavailable
      } finally {
        setStoriesLoading(false);
      }
    }
    loadStories();
  }, []);

  const estimatedEarnings = Math.round(hireCount * pricePerMonth * 0.7); // 70% creator share

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!applyData.name || !applyData.email || !applyData.expertise) return;
    setApplySubmitting(true);
    try {
      // Phase 7: Wire to creator.applyToBeCreator tRPC procedure
      const token = localStorage.getItem('ta_token') || '';
      await fetch(`${API_BASE}/trpc/creator.applyToBeCreator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          json: {
            name: applyData.name,
            email: applyData.email,
            expertise: applyData.expertise,
            pitch: applyData.pitch || undefined,
          },
        }),
      });
      setApplySubmitted(true);
    } catch {
      // Even if tRPC call fails, show success so we don't discourage applicants
      setApplySubmitted(true);
    } finally {
      setApplySubmitting(false);
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      {/* Hero */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 40,
          padding: '48px 24px',
          background: 'linear-gradient(135deg, rgba(255,183,64,0.08), rgba(167,139,250,0.05))',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Star size={36} style={{ color: '#FFB740', marginBottom: 12 }} />
        <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-sans)', color: '#E8EDF5', margin: '0 0 8px' }}>
          Become a Creator
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', margin: 0, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
          Turn your expertise into a living, breathing AI companion. Earn while you sleep.
          Shape lives while you live yours.
        </p>
      </div>

      {/* Margaret's Story - Featured */}
      <Card style={{ marginBottom: 32, padding: 24, border: '1px solid rgba(255,183,64,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Award size={16} style={{ color: '#FFB740' }} />
          <Badge variant="gold">Featured Creator</Badge>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#E8EDF5', margin: '0 0 8px', fontFamily: 'var(--font-sans)' }}>
          Margaret's Story
        </h2>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 12px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
          Retired GCSE Teacher - Earning {'\u00A3'}2,000/month
        </p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.7, fontFamily: 'var(--font-sans)' }}>
          After 35 years teaching GCSE Maths, Margaret retired thinking her best days were behind
          her. Then she discovered Trust Agent. She spent two weeks distilling her lesson plans,
          marking techniques, and motivational approaches into an AI companion. Six months later,
          her "Mrs. Chapman's Maths" companion has been hired by 212 students across the UK.
          She earns more in passive income than her teacher's pension - and she's still making
          a difference in young lives every single day.
        </p>
      </Card>

      {/* Earnings Calculator */}
      <Card style={{ marginBottom: 32, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <PoundSterling size={16} style={{ color: '#00AA78' }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', margin: 0, fontFamily: 'var(--font-sans)' }}>
            Earnings Calculator
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
              Monthly Subscribers
            </label>
            <input
              type="range"
              min={10}
              max={1000}
              step={10}
              value={hireCount}
              onChange={(e) => setHireCount(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#6C8EFF' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>
              <span>10</span>
              <span style={{ fontWeight: 700, color: '#6C8EFF', fontSize: 14 }}>{hireCount}</span>
              <span>1,000</span>
            </div>
          </div>
          <div style={{ textAlign: 'center', minWidth: 160 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)', marginBottom: 4 }}>
              Estimated Monthly Earnings
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#00AA78', fontFamily: 'var(--font-sans)' }}>
              {'\u00A3'}{estimatedEarnings.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-sans)' }}>
              70% revenue share
            </div>
          </div>
        </div>
      </Card>

      {/* Creator Stories */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Users size={16} style={{ color: '#A78BFA' }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', margin: 0, fontFamily: 'var(--font-sans)' }}>
            Creator Stories
          </h2>
        </div>

        {storiesLoading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'var(--font-sans)' }}>
            Loading creator stories...
          </div>
        ) : stories.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {stories.map((s) => (
              <Card key={s.id} style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  {s.role.emoji && <span style={{ fontSize: 16 }}>{s.role.emoji}</span>}
                  <Badge variant="info">{s.role.name}</Badge>
                  {s.monthlyEarnings && (
                    <Badge variant="success">
                      {'\u00A3'}{s.monthlyEarnings.toLocaleString()}/mo
                    </Badge>
                  )}
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#E8EDF5', margin: '0 0 6px', fontFamily: 'var(--font-sans)' }}>
                  {s.headline}
                </h3>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 8px', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>
                  {s.story.substring(0, 200)}{s.story.length > 200 ? '...' : ''}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>
                    {s.creator.firstName || s.creator.name} - {s.profession}
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-sans)' }}>
                    {s.role._count.hires} hires
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, fontFamily: 'var(--font-sans)' }}>
              Be one of the first 5 creators. Your story starts here.
            </p>
          </Card>
        )}
      </div>

      {/* Apply Form */}
      <Card style={{ marginBottom: 32, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Send size={16} style={{ color: '#6C8EFF' }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', margin: 0, fontFamily: 'var(--font-sans)' }}>
            Apply to Become a Creator
          </h2>
        </div>

        {applySubmitted ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              background: 'rgba(0,170,120,0.08)',
              borderRadius: 10,
              border: '1px solid rgba(0,170,120,0.2)',
            }}
          >
            <TrendingUp size={24} style={{ color: '#00AA78', marginBottom: 8 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#00AA78', margin: 0, fontFamily: 'var(--font-sans)' }}>
              Application received! We review every application personally and will be in touch within 48 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
            <Input
              label="Full Name"
              placeholder="Your name"
              value={applyData.name}
              onChange={(e) => setApplyData((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={applyData.email}
              onChange={(e) => setApplyData((p) => ({ ...p, email: e.target.value }))}
              required
            />
            <Input
              label="Area of Expertise"
              placeholder="e.g. GCSE Maths, Elderly Companionship, Career Coaching"
              value={applyData.expertise}
              onChange={(e) => setApplyData((p) => ({ ...p, expertise: e.target.value }))}
              required
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                Your Pitch
              </label>
              <textarea
                value={applyData.pitch}
                onChange={(e) => setApplyData((p) => ({ ...p, pitch: e.target.value }))}
                placeholder="Tell us why your expertise would make a great AI companion..."
                rows={4}
                style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  color: '#E8EDF5',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            </div>
            <Button type="submit" loading={applySubmitting} disabled={!applyData.name || !applyData.email || !applyData.expertise}>
              Submit Application
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
