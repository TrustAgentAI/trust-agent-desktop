import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain } from 'lucide-react';
import { BrainJournal } from '@/components/brain/BrainJournal';
import { Button } from '@/components/ui/Button';

export function BrainJournalPage() {
  const { hireId } = useParams<{ hireId: string }>();
  const navigate = useNavigate();

  if (!hireId) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <Brain size={40} style={{ color: 'var(--color-text-muted)', opacity: 0.4, marginBottom: 16 }} />
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
            No hire selected. Return to the dashboard and select a companion.
          </div>
          <Button variant="ghost" size="md" onClick={() => navigate('/')} style={{ marginTop: 16 }}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {/* Navigation header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={18} style={{ color: 'var(--color-electric-blue)' }} />
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#E8EDF5',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Brain Journal
          </span>
        </div>
      </div>

      {/* Journal content */}
      <BrainJournal hireId={hireId} />
    </div>
  );
}

export default BrainJournalPage;
