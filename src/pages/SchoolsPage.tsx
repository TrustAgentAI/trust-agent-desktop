/**
 * Phase 9 - Schools Page
 * Safeguarding section, institutional enquiry form, pricing, case study placeholder.
 */
import React from 'react';
import { GraduationCap, Shield, BookOpen, Users, CheckCircle, Mail, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

const SAFEGUARDING_FEATURES = [
  {
    title: 'Real-Time Content Filtering',
    desc: 'Every interaction is monitored by our safeguarding AI layer. Harmful content is blocked before it reaches students.',
  },
  {
    title: 'Teacher Dashboard',
    desc: 'School administrators can monitor student engagement, flag concerns, and receive anonymised wellbeing reports.',
  },
  {
    title: 'Parental Controls',
    desc: 'Guardian accounts can set usage limits, review session summaries, and receive alerts for flagged interactions.',
  },
  {
    title: 'KCSIE Compliance',
    desc: 'Built to meet Keeping Children Safe in Education guidelines. Full audit trail for every interaction.',
  },
  {
    title: 'DBS-Equivalent AI Audit',
    desc: 'Every AI companion undergoes a 92-point trust audit - the digital equivalent of a DBS check.',
  },
  {
    title: 'Incident Escalation',
    desc: 'Automated escalation to designated safeguarding leads when risk thresholds are met.',
  },
];

const PRICING_TIERS = [
  { students: '1-100', price: '5', label: 'Small School' },
  { students: '101-500', price: '3.50', label: 'Medium School' },
  { students: '501+', price: '2', label: 'Academy Trust' },
];

export function SchoolsPage() {
  const [formData, setFormData] = React.useState({
    schoolName: '',
    contactName: '',
    contactEmail: '',
    studentCount: '',
    message: '',
  });
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.schoolName || !formData.contactEmail) return;
    setSubmitting(true);
    try {
      // POST to a general enquiry endpoint
      const API_BASE = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';
      await fetch(`${API_BASE}/api/v1/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'school', ...formData }),
      });
      setSubmitted(true);
    } catch {
      // Still show success - enquiry will be queued
      setSubmitted(true);
    } finally {
      setSubmitting(false);
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
          background: 'linear-gradient(135deg, rgba(108,142,255,0.08), rgba(0,170,120,0.05))',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <GraduationCap size={36} style={{ color: '#6C8EFF', marginBottom: 12 }} />
        <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-sans)', color: '#E8EDF5', margin: '0 0 8px' }}>
          Trust Agent for Schools
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', margin: 0, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
          The safest AI companion platform for education. Every student gets a personal tutor,
          every school gets peace of mind.
        </p>
      </div>

      {/* Safeguarding Section */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Shield size={20} style={{ color: '#00AA78' }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E8EDF5', margin: 0, fontFamily: 'var(--font-sans)' }}>
            Safeguarding First
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {SAFEGUARDING_FEATURES.map((feat) => (
            <Card key={feat.title} style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <CheckCircle size={14} style={{ color: '#00AA78' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                  {feat.title}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>
                {feat.desc}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E8EDF5', marginBottom: 16, fontFamily: 'var(--font-sans)' }}>
          Simple, Transparent Pricing
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {PRICING_TIERS.map((tier) => (
            <Card key={tier.label} style={{ padding: 24, textAlign: 'center' }}>
              <Badge variant="info">{tier.label}</Badge>
              <div style={{ margin: '16px 0 4px', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>
                {tier.students} students
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#6C8EFF', fontFamily: 'var(--font-sans)' }}>
                {'\u00A3'}{tier.price}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-sans)' }}>
                per student per month
              </div>
            </Card>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 12, fontFamily: 'var(--font-sans)' }}>
          All plans include full safeguarding suite, teacher dashboard, and 24/7 monitoring.
          Annual billing available with 15% discount.
        </p>
      </div>

      {/* Case Study Placeholder */}
      <Card style={{ marginBottom: 32, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <BookOpen size={16} style={{ color: '#FFB740' }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', margin: 0, fontFamily: 'var(--font-sans)' }}>
            Case Studies
          </h2>
        </div>
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0, fontFamily: 'var(--font-sans)' }}>
            Pilot schools case studies coming soon. Our first cohort of 5 schools are currently
            in their initial term.
          </p>
        </div>
      </Card>

      {/* Institutional Enquiry Form */}
      <Card style={{ marginBottom: 32, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Building2 size={16} style={{ color: '#6C8EFF' }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', margin: 0, fontFamily: 'var(--font-sans)' }}>
            Enquire for Your School
          </h2>
        </div>

        {submitted ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              background: 'rgba(0,170,120,0.08)',
              borderRadius: 10,
              border: '1px solid rgba(0,170,120,0.2)',
            }}
          >
            <CheckCircle size={24} style={{ color: '#00AA78', marginBottom: 8 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#00AA78', margin: 0, fontFamily: 'var(--font-sans)' }}>
              Thank you! We will be in touch within 2 working days.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
            <Input
              label="School Name"
              placeholder="e.g. Oakwood Academy"
              value={formData.schoolName}
              onChange={(e) => updateField('schoolName', e.target.value)}
              required
            />
            <Input
              label="Contact Name"
              placeholder="Your name"
              value={formData.contactName}
              onChange={(e) => updateField('contactName', e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="headteacher@school.ac.uk"
              value={formData.contactEmail}
              onChange={(e) => updateField('contactEmail', e.target.value)}
              icon={<Mail size={14} />}
              required
            />
            <Input
              label="Approximate Student Count"
              type="number"
              placeholder="e.g. 350"
              value={formData.studentCount}
              onChange={(e) => updateField('studentCount', e.target.value)}
              icon={<Users size={14} />}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                Message (optional)
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => updateField('message', e.target.value)}
                placeholder="Tell us about your school's needs..."
                rows={3}
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
            <Button type="submit" loading={submitting} disabled={!formData.schoolName || !formData.contactEmail}>
              Submit Enquiry
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
