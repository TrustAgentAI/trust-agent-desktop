import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { getHumanError } from '../lib/errors/getHumanError';

export const systemRouter = router({
  // Phase 6: Human error messages - warm, not "Error 500"
  getErrorMessage: publicProcedure
    .input(z.object({ errorCode: z.string() }))
    .query(async ({ input }) => {
      return getHumanError(input.errorCode);
    }),

  getHealth: publicProcedure.query(async ({ ctx }) => {
    const checks: Record<string, string> = {};

    // Database check
    try {
      await ctx.prisma.$queryRaw`SELECT 1`;
      checks.database = 'healthy';
    } catch {
      checks.database = 'unhealthy';
    }

    // Role count
    try {
      const roleCount = await ctx.prisma.role.count({ where: { isActive: true } });
      checks.roles = `${roleCount} active`;
    } catch {
      checks.roles = 'error';
    }

    return {
      status: checks.database === 'healthy' ? 'operational' : 'degraded',
      database: checks.database,
      roles: checks.roles,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    };
  }),
});
