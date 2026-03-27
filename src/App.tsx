import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Shell } from '@/components/layout/Shell';
import { DashboardPage } from '@/pages/DashboardPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PermissionManager } from '@/components/permissions/PermissionManager';
import { AuditLog } from '@/components/audit/AuditLog';
import { MarketplacePanel } from '@/components/marketplace/MarketplacePanel';

const LoginPageLazy = React.lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <React.Suspense
        fallback={
          <div
            style={{
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-dark-navy)',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Loading...
          </div>
        }
      >
        <LoginPageLazy />
      </React.Suspense>
    );
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        <Routes>
          <Route
            path="/"
            element={
              <Shell>
                <DashboardPage />
              </Shell>
            }
          />
          <Route
            path="/permissions"
            element={
              <Shell>
                <PermissionManager />
              </Shell>
            }
          />
          <Route
            path="/audit"
            element={
              <Shell>
                <AuditLog />
              </Shell>
            }
          />
          <Route
            path="/settings"
            element={
              <Shell>
                <SettingsPage />
              </Shell>
            }
          />
          <Route
            path="/marketplace"
            element={
              <Shell>
                <MarketplacePanel />
              </Shell>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthGate>
    </BrowserRouter>
  );
}

export default App;
