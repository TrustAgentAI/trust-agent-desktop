import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const personalityRouter = router({
  // ──────────────────────────────────────────────────────────────────────────
  // GET CONFIG - retrieve personality config for a hire
  // ──────────────────────────────────────────────────────────────────────────
  getConfig: protectedProcedure
    .input(
      z.object({
        hireId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id },
        include: { personalityConfig: true },
      });

      if (!hire) {
        return null;
      }

      return hire.personalityConfig ?? {
        verbosity: 'balanced',
        formalityLevel: 'warm',
        encouragement: 'moderate',
        voiceMode: 'text',
        voiceId: null,
        voiceSpeed: 1.0,
        ambientAudio: true,
        ambientVolume: 10,
        highContrast: false,
        largeText: false,
        reducedMotion: false,
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // UPDATE CONFIG - upsert personality config for a hire
  // ──────────────────────────────────────────────────────────────────────────
  updateConfig: protectedProcedure
    .input(
      z.object({
        hireId: z.string(),
        verbosity: z.enum(['concise', 'balanced', 'detailed']).optional(),
        formalityLevel: z.enum(['professional', 'warm', 'friendly']).optional(),
        encouragement: z.enum(['minimal', 'moderate', 'enthusiastic']).optional(),
        voiceMode: z.enum(['text', 'voice', 'voice_preferred']).optional(),
        voiceId: z.string().nullable().optional(),
        voiceSpeed: z.number().min(0.75).max(1.25).optional(),
        ambientAudio: z.boolean().optional(),
        ambientVolume: z.number().int().min(0).max(100).optional(),
        highContrast: z.boolean().optional(),
        largeText: z.boolean().optional(),
        reducedMotion: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify ownership
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id },
      });

      if (!hire) {
        throw new Error('Hire not found');
      }

      const { hireId, ...data } = input;

      const config = await ctx.prisma.companionPersonalityConfig.upsert({
        where: { hireId },
        create: { hireId, ...data },
        update: data,
      });

      return config;
    }),
});
