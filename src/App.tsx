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
import { HumanFollowUpQueue } from '@/components/admin/HumanFollowUpQueue';
import { OnboardingQuiz, type QuizAnswers } from '@/components/onboarding/OnboardingQuiz';
import { AuditDetailPage } from '@/pages/AuditDetailPage';
import { SafeguardingDashboardPage } from '@/pages/SafeguardingDashboardPage';
import { ImpactPage } from '@/pages/ImpactPage';
import { BrainJournalPage } from '@/pages/BrainJournalPage';
import { SettingsProfilePage } from '@/pages/SettingsProfilePage';
import { SettingsVoicePage } from '@/pages/SettingsVoicePage';
import { SettingsAccessibilityPage } from '@/pages/SettingsAccessibilityPage';
import { SettingsNotificationsPage } from '@/pages/SettingsNotificationsPage';
import { SettingsPrivacyPage } from '@/pages/SettingsPrivacyPage';
import { BillingPage } from '@/pages/BillingPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { CheckoutSuccessPage } from '@/pages/CheckoutSuccessPage';
import { GiftPurchasePage } from '@/pages/GiftPurchasePage';
import { GiftActivatePage } from '@/pages/GiftActivatePage';
import { ReferralsPage } from '@/pages/ReferralsPage';
import { PublicSharePage } from '@/pages/PublicSharePage';
import { MySharesPage } from '@/pages/MySharesPage';
// Phase 9: Marketing Pages
import { NHSPage } from '@/pages/NHSPage';
import { SchoolsPage } from '@/pages/SchoolsPage';
import { CreatorPage } from '@/pages/CreatorPage';
import { TrustBoxPage } from '@/pages/hardware/TrustBoxPage';
import { TrustStickPage } from '@/pages/hardware/TrustStickPage';
import { TrustEdgePage } from '@/pages/hardware/TrustEdgePage';
// Phase 10: Admin Panel
import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminRolesPage } from '@/pages/admin/AdminRolesPage';
import { AdminPricingPage } from '@/pages/admin/AdminPricingPage';
import { AdminSystemPage } from '@/pages/admin/AdminSystemPage';
import { AdminFollowUpPage } from '@/pages/admin/AdminFollowUpPage';
import { AdminImpactPage } from '@/pages/admin/AdminImpactPage';

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
    // Store the Aha Moment first message for the first session
    if (answers.firstMessage) {
      try {
        localStorage.setItem('ta_first_message', answers.firstMessage);
        localStorage.setItem('ta_first_message_role', answers.recommendedRoleId);
      } catch {
        // Storage might be blocked
      }
    }
    try {
      localStorage.setItem('ta_onboarding_completed', 'true');
    } catch {
      // Storage might be blocked
    }
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
      <Routes>
        {/* Public route - no auth required */}
        <Route path="/progress/:shareToken" element={<PublicSharePage />} />
        {/* All other routes require auth */}
        <Route path="*" element={
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
          <Route
            path="/audit/:roleId"
            element={
              <Shell>
                <AuditDetailPage />
              </Shell>
            }
          />
          <Route
            path="/safeguarding"
            element={
              <Shell>
                <SafeguardingDashboardPage />
              </Shell>
            }
          />
          <Route
            path="/impact"
            element={
              <Shell>
                <ImpactPage />
              </Shell>
            }
          />
          {/* Phase 11.3: Admin follow-up queue */}
          <Route
            path="/admin/follow-ups"
            element={
              <Shell>
                <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                  <HumanFollowUpQueue />
                </div>
              </Shell>
            }
          />
          {/* Visible Brain - companion relationship journal */}
          <Route
            path="/brain/:hireId"
            element={
              <Shell>
                <BrainJournalPage />
              </Shell>
            }
          />
          {/* Settings sub-pages */}
          <Route
            path="/settings/profile"
            element={
              <Shell>
                <SettingsProfilePage />
              </Shell>
            }
          />
          <Route
            path="/settings/voice"
            element={
              <Shell>
                <SettingsVoicePage />
              </Shell>
            }
          />
          <Route
            path="/settings/accessibility"
            element={
              <Shell>
                <SettingsAccessibilityPage />
              </Shell>
            }
          />
          <Route
            path="/settings/notifications"
            element={
              <Shell>
                <SettingsNotificationsPage />
              </Shell>
            }
          />
          <Route
            path="/settings/privacy"
            element={
              <Shell>
                <SettingsPrivacyPage />
              </Shell>
            }
          />
          {/* Phase 7: Payments and Billing */}
          <Route
            path="/settings/billing"
            element={
              <Shell>
                <BillingPage />
              </Shell>
            }
          />
          <Route
            path="/checkout/success"
            element={
              <Shell>
                <CheckoutSuccessPage />
              </Shell>
            }
          />
          <Route
            path="/checkout/:plan"
            element={
              <Shell>
                <CheckoutPage />
              </Shell>
            }
          />
          <Route
            path="/gift"
            element={
              <Shell>
                <GiftPurchasePage />
              </Shell>
            }
          />
          <Route
            path="/gift/activate/:code"
            element={
              <Shell>
                <GiftActivatePage />
              </Shell>
            }
          />
          <Route
            path="/gift/activate"
            element={
              <Shell>
                <GiftActivatePage />
              </Shell>
            }
          />
          <Route
            path="/dashboard/referrals"
            element={
              <Shell>
                <ReferralsPage />
              </Shell>
            }
          />
          {/* Phase 8: Progress Sharing */}
          <Route
            path="/dashboard/shares"
            element={
              <Shell>
                <MySharesPage />
              </Shell>
            }
          />
          {/* Phase 9: Marketing Pages */}
          <Route
            path="/nhs"
            element={
              <Shell>
                <NHSPage />
              </Shell>
            }
          />
          <Route
            path="/schools"
            element={
              <Shell>
                <SchoolsPage />
              </Shell>
            }
          />
          <Route
            path="/creator"
            element={
              <Shell>
                <CreatorPage />
              </Shell>
            }
          />
          <Route
            path="/hardware/trustbox"
            element={
              <Shell>
                <TrustBoxPage />
              </Shell>
            }
          />
          <Route
            path="/hardware/truststick"
            element={
              <Shell>
                <TrustStickPage />
              </Shell>
            }
          />
          <Route
            path="/hardware/trustedge"
            element={
              <Shell>
                <TrustEdgePage />
              </Shell>
            }
          />
          {/* Phase 10: Admin Panel */}
          <Route
            path="/admin"
            element={
              <Shell>
                <AdminOverviewPage />
              </Shell>
            }
          />
          <Route
            path="/admin/users"
            element={
              <Shell>
                <AdminUsersPage />
              </Shell>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <Shell>
                <AdminRolesPage />
              </Shell>
            }
          />
          <Route
            path="/admin/pricing"
            element={
              <Shell>
                <AdminPricingPage />
              </Shell>
            }
          />
          <Route
            path="/admin/system"
            element={
              <Shell>
                <AdminSystemPage />
              </Shell>
            }
          />
          <Route
            path="/admin/followup"
            element={
              <Shell>
                <AdminFollowUpPage />
              </Shell>
            }
          />
          <Route
            path="/admin/impact"
            element={
              <Shell>
                <AdminImpactPage />
              </Shell>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </OnboardingGate>
      </AuthGate>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
