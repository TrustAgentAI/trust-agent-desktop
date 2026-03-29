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
});

export type AppRouter = typeof appRouter;
