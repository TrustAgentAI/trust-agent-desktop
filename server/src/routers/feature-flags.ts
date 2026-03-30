import { z } from 'zod';
import { router, publicProcedure, adminProcedure } from '../trpc';

export const featureFlagsRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const flags = await ctx.prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });
    return flags;
  }),

  check: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input, ctx }) => {
      const flag = await ctx.prisma.featureFlag.findUnique({
        where: { key: input.key },
      });
      return {
        key: input.key,
        enabled: flag?.enabled ?? false,
      };
    }),

  update: adminProcedure
    .input(
      z.object({
        key: z.string(),
        enabled: z.boolean().optional(),
        percentage: z.number().int().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const flag = await ctx.prisma.featureFlag.upsert({
        where: { key: input.key },
        update: {
          ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
          ...(input.percentage !== undefined ? { percentage: input.percentage } : {}),
        },
        create: {
          key: input.key,
          name: input.key.replace(/_/g, ' '),
          enabled: input.enabled ?? false,
          percentage: input.percentage ?? 100,
        },
      });
      return flag;
    }),
});
