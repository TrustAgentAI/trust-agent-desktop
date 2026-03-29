import React from 'react';
import { X, Users, BookOpen } from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import { api } from '@/lib/api';

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (group: { id: string; name: string }) => void;
}

export function CreateGroupModal({ open, onClose, onCreated }: CreateGroupModalProps) {
  const { roles } = useAgentStore();
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [selectedRoleId, setSelectedRoleId] = React.useState('');
  const [maxMembers, setMaxMembers] = React.useState(5);
  const [category, setCategory] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Filter to only hired (active) roles
  const hiredRoles = roles.filter((r) => r.hireId);

  React.useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setSelectedRoleId(hiredRoles[0]?.roleId || '');
      setMaxMembers(5);
      setCategory('');
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !selectedRoleId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const group = await api.post<{ id: string; name: string }>('/trpc/studyGroups.createGroup', {
        name: name.trim(),
        description: description.trim() || undefined,
        roleId: selectedRoleId,
        maxMembers,
        category: category.trim() || undefined,
      });
      onCreated(group);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--color-dark-navy)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 480,
          padding: 32,
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <Users size={24} color="var(--color-electric-blue)" />
          <h2 style={{ margin: 0, fontSize: 20, color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}>
            Create Study Group
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Group Name */}
          <div>
            <label style={labelStyle}>Group Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GCSE Maths Study Crew"
              maxLength={100}
              required
              style={inputStyle}
            />
          </div>

          {/* Select Role */}
          <div>
            <label style={labelStyle}>AI Tutor Role *</label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              required
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">Select a role...</option>
              {hiredRoles.map((r) => (
                <option key={r.roleId} value={r.roleId}>
                  {r.name} ({r.companionName})
                </option>
              ))}
            </select>
          </div>

          {/* Max Members */}
          <div>
            <label style={labelStyle}>Max Members: {maxMembers}</label>
            <input
              type="range"
              min={2}
              max={10}
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-electric-blue)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-muted)' }}>
              <span>2</span>
              <span>10</span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Category (optional)</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. gcse-maths, a-level-physics"
              maxLength={100}
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will this group study?"
              maxLength={500}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-sans)' }}
            />
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: 13, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !selectedRoleId}
            style={{
              background: 'var(--color-electric-blue)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '12px 24px',
              fontSize: 15,
              fontWeight: 600,
              cursor: isSubmitting ? 'wait' : 'pointer',
              opacity: isSubmitting || !name.trim() || !selectedRoleId ? 0.5 : 1,
              fontFamily: 'var(--font-sans)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <BookOpen size={16} />
            {isSubmitting ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  marginBottom: 6,
  fontFamily: 'var(--font-sans)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-navy-2)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 14px',
  fontSize: 14,
  color: 'var(--color-text-primary)',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
  boxSizing: 'border-box',
};
