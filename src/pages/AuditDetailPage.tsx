/**
 * Phase 5: Trust Transparency - Audit Detail Page
 * Public audit detail page showing full 47-check audit for a role.
 * Accessible via /audit/:roleId
 */

import { useParams, useNavigate } from 'react-router-dom';
import { AuditDetailView } from '@/components/audit/AuditDetailView';

export function AuditDetailPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const navigate = useNavigate();

  if (!roleId) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
        }}
      >
        No role specified.
      </div>
    );
  }

  return (
    <AuditDetailView
      roleId={roleId}
      onBack={() => navigate(-1)}
    />
  );
}

export default AuditDetailPage;
