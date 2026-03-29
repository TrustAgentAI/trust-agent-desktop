import { router } from '../trpc';
import { authRouter } from './auth';
import { rolesRouter } from './roles';
import { hiresRouter } from './hires';
import { sessionsRouter } from './sessions';
import { brainRouter } from './brain';
import { marketplaceRouter } from './marketplace';
import { paymentsRouter } from './payments';
import { adminRouter } from './admin';
import { enterpriseRouter } from './enterprise';
import { studyGroupsRouter } from './study-groups';
import { onboardingRouter } from './onboarding';
import { guardianRouter } from './guardian';
import { reportsRouter } from './reports';
import { milestonesRouter } from './milestones';
import { spacedRepetitionRouter } from './spaced-repetition';
import { schedulingRouter } from './scheduling';
import { giftsRouter } from './gifts';
import { notificationsRouter } from './notifications';
import { referralsRouter } from './referrals';
import { collaborationRouter } from './collaboration';
import { schoolRouter } from './school';
import { offlineBrainRouter } from './offline-brain';

export const appRouter = router({
  auth: authRouter,
  roles: rolesRouter,
  hires: hiresRouter,
  sessions: sessionsRouter,
  brain: brainRouter,
  marketplace: marketplaceRouter,
  payments: paymentsRouter,
  admin: adminRouter,
  enterprise: enterpriseRouter,
  studyGroups: studyGroupsRouter,
  onboarding: onboardingRouter,
  guardian: guardianRouter,
  reports: reportsRouter,
  milestones: milestonesRouter,
  'spaced-repetition': spacedRepetitionRouter,
  scheduling: schedulingRouter,
  gifts: giftsRouter,
  notifications: notificationsRouter,
  referrals: referralsRouter,
  collaboration: collaborationRouter,
  school: schoolRouter,
  offlineBrain: offlineBrainRouter,
});

export type AppRouter = typeof appRouter;
