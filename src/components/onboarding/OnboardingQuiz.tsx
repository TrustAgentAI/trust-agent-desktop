import React from 'react';
import {
  GraduationCap,
  Heart,
  Languages,
  Briefcase,
  Compass,
  MessageCircleHeart,
  User,
  Baby,
  Users,
  Building2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';

// --- Types ---

export type QuizGoal =
  | 'education'
  | 'health'
  | 'language'
  | 'career'
  | 'life-navigation'
  | 'companionship';

export type QuizAudience = 'individual' | 'child' | 'family' | 'enterprise';

export type QuizLevel = 'beginner' | 'intermediate' | 'advanced';

export interface QuizAnswers {
  goal: QuizGoal;
  audience: QuizAudience;
  level: QuizLevel;
  recommendedRoleId: string;
  recommendedRoleName: string;
  firstMessage?: string | null;   // The Aha Moment - personalised first message
  matchScore?: number;
  // Enhanced fields
  subject?: string;
  examDate?: string;
  biggestChallenge?: string;
  availableTime?: string;
  userName?: string;
}

interface OnboardingQuizProps {
  onComplete: (answers: QuizAnswers) => void;
  onSkip?: () => void;
}

// --- Constants ---

const GOAL_OPTIONS: { value: QuizGoal; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'education',
    label: 'Education',
    description: 'GCSE, A-Level, university, or self-study subjects',
    icon: <GraduationCap size={20} />,
  },
  {
    value: 'health',
    label: 'Health & Wellness',
    description: 'Fitness plans, nutrition, mental health support',
    icon: <Heart size={20} />,
  },
  {
    value: 'language',
    label: 'Language Learning',
    description: 'Learn a new language with conversation practice',
    icon: <Languages size={20} />,
  },
  {
    value: 'career',
    label: 'Career & Professional',
    description: 'CV writing, interview prep, career guidance',
    icon: <Briefcase size={20} />,
  },
  {
    value: 'life-navigation',
    label: 'Life Navigation',
    description: 'Financial planning, legal guidance, life decisions',
    icon: <Compass size={20} />,
  },
  {
    value: 'companionship',
    label: 'Daily Companionship',
    description: 'Someone to talk to, daily check-ins, emotional support',
    icon: <MessageCircleHeart size={20} />,
  },
];

const AUDIENCE_OPTIONS: { value: QuizAudience; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'individual',
    label: 'Individual',
    description: 'Setting this up for myself',
    icon: <User size={20} />,
  },
  {
    value: 'child',
    label: 'Child',
    description: 'Parent or guardian setting this up for a child',
    icon: <Baby size={20} />,
  },
  {
    value: 'family',
    label: 'Family',
    description: 'Multiple family members will use this',
    icon: <Users size={20} />,
  },
  {
    value: 'enterprise',
    label: 'Enterprise',
    description: 'For a team or organisation',
    icon: <Building2 size={20} />,
  },
];

const LEVEL_OPTIONS: { value: QuizLevel; label: string; description: string }[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'I am new to this and want to start from the basics',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'I have some experience and want to build on it',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'I am experienced and want expert-level guidance',
  },
];

// Recommended role from the server - no longer hardcoded
interface RecommendedRole {
  id: string;
  slug: string;
  name: string;
  companionName: string;
  category: string;
  tagline: string;
  trustScore: number;
  badge: string;
}

// Get contextual level label based on goal
function getLevelContext(goal: QuizGoal | null): string {
  switch (goal) {
    case 'education':
      return 'What level are you studying at?';
    case 'health':
      return 'What is your fitness or wellness experience?';
    case 'language':
      return 'What is your language proficiency?';
    case 'career':
      return 'Where are you in your career?';
    case 'life-navigation':
      return 'How much guidance do you need?';
    case 'companionship':
      return 'How familiar are you with AI companions?';
    default:
      return 'What is your experience level?';
  }
}

const STEPS = ['Goal', 'Audience', 'Level', 'Your Match'];

// --- Component ---

export function OnboardingQuiz({ onComplete, onSkip }: OnboardingQuizProps) {
  const [step, setStep] = React.useState(0);
  const [goal, setGoal] = React.useState<QuizGoal | null>(null);
  const [audience, setAudience] = React.useState<QuizAudience | null>(null);
  const [level, setLevel] = React.useState<QuizLevel | null>(null);
  const [startTime] = React.useState(Date.now());
  const [submitting, setSubmitting] = React.useState(false);
  const [recommended, setRecommended] = React.useState<RecommendedRole | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [firstMessage, setFirstMessage] = React.useState<string | null>(null);
  const [matchScore, setMatchScore] = React.useState<number>(0);

  const canNext =
    (step === 0 && goal !== null) ||
    (step === 1 && audience !== null) ||
    (step === 2 && level !== null) ||
    step === 3;

  const handleNext = async () => {
    if (step < STEPS.length - 2) {
      // Steps 0 and 1 - just advance
      setStep(step + 1);
    } else if (step === 2 && goal && audience && level) {
      // Submit quiz to server and get recommendation
      setSubmitting(true);
      setSubmitError(null);
      try {
        const result = await api.post<{
          quizResponseId: string;
          recommendedRole: RecommendedRole | null;
          firstMessage: string | null;
          matchScore: number;
        }>('/api/trpc/onboarding.submitQuiz', {
          json: { answers: { goal, audience, level } },
        });
        // Handle tRPC response shape
        const data = (result as any)?.result?.data ?? result;
        if (data.recommendedRole) {
          setRecommended(data.recommendedRole);
        }
        if (data.firstMessage) {
          setFirstMessage(data.firstMessage);
        }
        if (data.matchScore) {
          setMatchScore(data.matchScore);
        }
        setStep(3);
      } catch (err: any) {
        setSubmitError(err?.message || 'Failed to submit quiz');
      } finally {
        setSubmitting(false);
      }
    } else if (step === 3 && goal && audience && level && recommended) {
      // Final step - complete onboarding with Aha Moment first message
      const answers: QuizAnswers = {
        goal,
        audience,
        level,
        recommendedRoleId: recommended.id,
        recommendedRoleName: recommended.name,
        firstMessage,
        matchScore,
      };
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const elapsedLabel = elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-dark-navy)',
        zIndex: 9999,
      }}
    >
      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '20px 32px 0' }}>
        {STEPS.map((_s, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i <= step ? 'var(--color-electric-blue)' : 'var(--color-surface-2)',
              transition: 'background 300ms ease',
            }}
          />
        ))}
      </div>

      {/* Step info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 32px',
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Step {step + 1} of {STEPS.length}
        </span>
        <span
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {elapsedLabel}
        </span>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: step === 3 ? 'center' : 'flex-start',
        }}
      >
        {/* Step 1: Goal */}
        {step === 0 && (
          <div style={{ maxWidth: 520, width: '100%' }}>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#E8EDF5',
                fontFamily: 'var(--font-sans)',
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              What brings you here today?
            </h1>
            <p
              style={{
                fontSize: 13,
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                marginBottom: 24,
                fontFamily: 'var(--font-sans)',
              }}
            >
              We will match you with the right companion for your needs.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {GOAL_OPTIONS.map((opt) => {
                const isSelected = goal === opt.value;
                return (
                  <Card
                    key={opt.value}
                    onClick={() => setGoal(opt.value)}
                    glow={isSelected}
                    style={{
                      border: isSelected
                        ? '1px solid var(--color-electric-blue)'
                        : '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 'var(--radius-md)',
                          background: isSelected ? 'rgba(30,111,255,0.15)' : 'var(--color-surface-2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isSelected ? 'var(--color-electric-blue)' : 'var(--color-text-muted)',
                          flexShrink: 0,
                          transition: 'all 200ms ease',
                        }}
                      >
                        {opt.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#E8EDF5',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {opt.label}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--color-text-muted)',
                            fontFamily: 'var(--font-sans)',
                            marginTop: 2,
                          }}
                        >
                          {opt.description}
                        </div>
                      </div>
                      {isSelected && (
                        <Check size={18} style={{ color: 'var(--color-electric-blue)', flexShrink: 0 }} />
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Audience */}
        {step === 1 && (
          <div style={{ maxWidth: 520, width: '100%' }}>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#E8EDF5',
                fontFamily: 'var(--font-sans)',
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              Who is this for?
            </h1>
            <p
              style={{
                fontSize: 13,
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                marginBottom: 24,
                fontFamily: 'var(--font-sans)',
              }}
            >
              This helps us set the right safety and privacy controls.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {AUDIENCE_OPTIONS.map((opt) => {
                const isSelected = audience === opt.value;
                return (
                  <Card
                    key={opt.value}
                    onClick={() => setAudience(opt.value)}
                    glow={isSelected}
                    style={{
                      border: isSelected
                        ? '1px solid var(--color-electric-blue)'
                        : '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 'var(--radius-md)',
                          background: isSelected ? 'rgba(30,111,255,0.15)' : 'var(--color-surface-2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isSelected ? 'var(--color-electric-blue)' : 'var(--color-text-muted)',
                          flexShrink: 0,
                        }}
                      >
                        {opt.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#E8EDF5',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {opt.label}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--color-text-muted)',
                            fontFamily: 'var(--font-sans)',
                            marginTop: 2,
                          }}
                        >
                          {opt.description}
                        </div>
                      </div>
                      {isSelected && (
                        <Check size={18} style={{ color: 'var(--color-electric-blue)', flexShrink: 0 }} />
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Level */}
        {step === 2 && (
          <div style={{ maxWidth: 520, width: '100%' }}>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#E8EDF5',
                fontFamily: 'var(--font-sans)',
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              {getLevelContext(goal)}
            </h1>
            <p
              style={{
                fontSize: 13,
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                marginBottom: 24,
                fontFamily: 'var(--font-sans)',
              }}
            >
              Your companion will adjust its approach based on your level.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LEVEL_OPTIONS.map((opt) => {
                const isSelected = level === opt.value;
                return (
                  <Card
                    key={opt.value}
                    onClick={() => setLevel(opt.value)}
                    glow={isSelected}
                    padding="20px"
                    style={{
                      border: isSelected
                        ? '1px solid var(--color-electric-blue)'
                        : '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: '50%',
                          background: isSelected ? 'rgba(30,111,255,0.15)' : 'var(--color-surface-2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16,
                          fontWeight: 800,
                          color: isSelected ? 'var(--color-electric-blue)' : 'var(--color-text-muted)',
                          fontFamily: 'var(--font-sans)',
                          flexShrink: 0,
                        }}
                      >
                        {opt.value === 'beginner' ? '1' : opt.value === 'intermediate' ? '2' : '3'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#E8EDF5',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {opt.label}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--color-text-muted)',
                            fontFamily: 'var(--font-sans)',
                            marginTop: 2,
                          }}
                        >
                          {opt.description}
                        </div>
                      </div>
                      {isSelected && (
                        <Check size={18} style={{ color: 'var(--color-electric-blue)', flexShrink: 0 }} />
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading state while submitting quiz */}
        {submitting && (
          <div style={{ maxWidth: 440, width: '100%', textAlign: 'center', paddingTop: 60 }}>
            <Loader2 size={40} style={{ color: 'var(--color-electric-blue)', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
            <div style={{ fontSize: 14, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
              Finding your best match...
            </div>
          </div>
        )}

        {/* Error state */}
        {submitError && (
          <div style={{ maxWidth: 440, width: '100%', textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 14, color: 'var(--color-error)', fontFamily: 'var(--font-sans)', marginBottom: 12 }}>
              {submitError}
            </div>
            <Button variant="primary" size="md" onClick={() => { setSubmitError(null); setStep(2); }}>
              Try Again
            </Button>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 3 && recommended && !submitting && (
          <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(30,111,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <Sparkles size={32} style={{ color: 'var(--color-electric-blue)' }} />
            </div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#E8EDF5',
                fontFamily: 'var(--font-sans)',
                marginBottom: 8,
              }}
            >
              We recommend
            </h1>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: 'var(--color-electric-blue)',
                fontFamily: 'var(--font-sans)',
                marginBottom: 12,
              }}
            >
              {recommended.name}
            </div>
            <p
              style={{
                fontSize: 14,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
                lineHeight: 1.6,
                marginBottom: 32,
                maxWidth: 360,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              Based on your answers, this companion is the best starting point. You can always
              hire additional roles from the Marketplace later.
            </p>

            {/* Summary */}
            <Card padding="16px" style={{ textAlign: 'left', marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--color-ion-cyan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 12,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Your Profile
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <ProfileRow label="Goal" value={GOAL_OPTIONS.find((g) => g.value === goal)?.label || ''} />
                <ProfileRow label="For" value={AUDIENCE_OPTIONS.find((a) => a.value === audience)?.label || ''} />
                <ProfileRow label="Level" value={LEVEL_OPTIONS.find((l) => l.value === level)?.label || ''} />
              </div>
            </Card>

            {audience === 'child' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 12,
                  color: '#F59E0B',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <Baby size={16} style={{ flexShrink: 0 }} />
                <span>
                  Child safety controls are enabled. A 45-minute daily session limit will be enforced.
                  You can monitor usage from the Guardian Dashboard.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 32px 20px',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <div>
          {step > 0 && (
            <Button variant="ghost" size="md" onClick={handleBack} icon={<ChevronLeft size={14} />}>
              Back
            </Button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onSkip && (
            <Button variant="ghost" size="md" onClick={onSkip}>
              Skip for now
            </Button>
          )}
          <Button variant="primary" size="md" onClick={handleNext} disabled={!canNext}>
            {step === STEPS.length - 1 ? 'Get Started' : 'Continue'}
            {step < STEPS.length - 1 && <ChevronRight size={14} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
        {value}
      </span>
    </div>
  );
}

export default OnboardingQuiz;
