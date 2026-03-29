import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { configureGateway } from '@/lib/gateway';
import { Shell } from '@/components/layout/Shell';
import { DashboardPage } from '@/pages/DashboardPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PermissionManager } from '@/components/permissions/PermissionManager';
import { AuditLog } from '@/components/audit/AuditLog';
import { MarketplacePanel } from '@/components/marketplace/MarketplacePanel';
import { StudyGroupList } from '@/components/study/StudyGroupList';
import { StudyGroupDetail } from '@/components/study/StudyGroupDetail';
import { SharedSessionView } from '@/components/study/SharedSessionView';
import { GuardianDashboardPage } from '@/pages/GuardianDashboardPage';
import { OnboardingQuiz, type QuizAnswers } from '@/components/onboarding/OnboardingQuiz';

// Wire gateway to use JWT from auth store
configureGateway({
  getToken: () => useAuthStore.getState().token,
  onTokenExpired: async () => {
    await useAuthStore.getState().refreshSession();
  },
});

// Restore session from localStorage on app start
useAuthStore.getState().restoreSession();

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

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [showQuiz, setShowQuiz] = React.useState(() => {
    try {
      return localStorage.getItem('ta_onboarding_completed') !== 'true';
    } catch {
      return true;
    }
  });

  const handleQuizComplete = (answers: QuizAnswers) => {
    setShowQuiz(false);
    // Navigate to marketplace to hire the recommended role
    window.location.hash = `/marketplace?recommended=${answers.recommendedRoleId}`;
  };

  const handleSkip = () => {
    try {
      localStorage.setItem('ta_onboarding_completed', 'true');
    } catch {
      // Storage might be blocked
    }
    setShowQuiz(false);
  };

  if (showQuiz) {
    return <OnboardingQuiz onComplete={handleQuizComplete} onSkip={handleSkip} />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        <OnboardingGate>
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
          <Route
            path="/study"
            element={
              <Shell>
                <StudyGroupList />
              </Shell>
            }
          />
          <Route
            path="/study/:groupId"
            element={
              <Shell>
                <StudyGroupDetail />
              </Shell>
            }
          />
          <Route
            path="/study/:groupId/session/:sessionId"
            element={<SharedSessionView />}
          />
          <Route
            path="/guardian"
            element={
              <Shell>
                <GuardianDashboardPage />
              </Shell>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </OnboardingGate>
      </AuthGate>
    </BrowserRouter>
  );
}

export default App;
