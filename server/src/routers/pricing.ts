import { router, publicProcedure } from '../trpc';

export const pricingRouter = router({
  getTiers: publicProcedure.query(async ({ ctx }) => {
    const tiers = await ctx.prisma.pricingTier.findMany({
      where: { isActive: true },
      orderBy: { priceGBP: 'asc' },
    });
    return tiers;
  }),
});
