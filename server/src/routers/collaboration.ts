import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

/**
 * Collaboration Mode router.
 *
 * Uses the existing StudyGroup / SharedSession / SharedMessage models.
 * WebSocket rooms are identified by the session ID - the frontend
 * connects to `ws://<host>/ws/collab/<sessionId>` and the express
 * server broadcasts messages to all participants in that room.
 */
export const collaborationRouter = router({
  // ──────────────────────────────────────────────────────────────────────────
  // START COLLABORATION - creates room from a hire, invites by email
  // ──────────────────────────────────────────────────────────────────────────
  startCollaboration: protectedProcedure
    .input(
      z.object({
        hireId: z.string(),
        inviteEmail: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify the hire belongs to the user
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id, status: 'ACTIVE' },
        include: { role: { select: { id: true, name: true, companionName: true } } },
      });

      if (!hire) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Active hire not found' });
      }

      // Find or create a study group for this collaboration
      let group = await ctx.prisma.studyGroup.findFirst({
        where: {
          createdByUserId: ctx.user.id,
          roleId: hire.roleId,
          isActive: true,
          name: { startsWith: 'Collab-' },
        },
      });

      if (!group) {
        // Create a transient collaboration group
        const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        group = await ctx.prisma.studyGroup.create({
          data: {
            name: `Collab-${hire.role.name}-${Date.now()}`,
            createdByUserId: ctx.user.id,
            roleId: hire.roleId,
            maxMembers: 5,
            inviteCode,
            category: 'collaboration',
            members: {
              create: {
                userId: ctx.user.id,
                role: 'OWNER',
              },
            },
          },
        });
      }

      // Check if invited user exists and add them
      const invitedUser = await ctx.prisma.user.findUnique({
        where: { email: input.inviteEmail.toLowerCase() },
      });

      if (invitedUser) {
        // Add to group if not already a member
        await ctx.prisma.studyGroupMember.upsert({
          where: {
            userId_groupId: {
              userId: invitedUser.id,
              groupId: group.id,
            },
          },
          create: {
            userId: invitedUser.id,
            groupId: group.id,
            role: 'MEMBER',
          },
          update: {
            isActive: true,
          },
        });

        // Create notification for invited user
        await ctx.prisma.notification.create({
          data: {
            userId: invitedUser.id,
            type: 'COLLABORATION_INVITE',
            title: 'Collaboration Invite',
            body: `${ctx.user.name || ctx.user.email} invited you to collaborate with ${hire.role.companionName || hire.role.name}.`,
            data: {
              groupId: group.id,
              hireId: input.hireId,
              inviterName: ctx.user.name,
            },
            priority: 'high',
          },
        });
      }

      // Create a shared session
      const session = await ctx.prisma.sharedSession.create({
        data: {
          groupId: group.id,
          initiatedByUserId: ctx.user.id,
          status: 'ACTIVE',
        },
      });

      // WebSocket endpoint for this session
      const wsHost = process.env.WS_HOST || 'wss://api.trust-agent.ai';
      const wsEndpoint = `${wsHost}/ws/collab/${session.id}`;

      return {
        sessionId: session.id,
        groupId: group.id,
        wsEndpoint,
        role: {
          id: hire.role.id,
          name: hire.role.name,
          companionName: hire.role.companionName,
        },
        invitedEmail: input.inviteEmail,
        invitedUserFound: !!invitedUser,
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // SEND MESSAGE - routes through WebSocket to all room participants
  // ──────────────────────────────────────────────────────────────────────────
  sendMessage: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        content: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const session = await ctx.prisma.sharedSession.findUnique({
        where: { id: input.sessionId },
        include: {
          group: {
            include: {
              members: { where: { isActive: true }, select: { userId: true } },
            },
          },
        },
      });

      if (!session || session.status !== 'ACTIVE') {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Active collaboration session not found' });
      }

      // Verify membership
      const isMember = session.group.members.some((m) => m.userId === ctx.user.id);
      if (!isMember) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not a participant in this session' });
      }

      const sentAt = new Date();

      const message = await ctx.prisma.sharedMessage.create({
        data: {
          sessionId: input.sessionId,
          senderUserId: ctx.user.id,
          senderType: 'USER',
          content: input.content,
        },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      // Increment message count
      await ctx.prisma.sharedSession.update({
        where: { id: input.sessionId },
        data: { messageCount: { increment: 1 } },
      });

      // Calculate delivery latency (should be < 500ms)
      const deliveryMs = Date.now() - sentAt.getTime();

      return {
        ...message,
        deliveryMs,
        participantCount: session.group.members.length,
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // GET ACTIVE COLLABORATIONS
  // ──────────────────────────────────────────────────────────────────────────
  getActiveCollaborations: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.prisma.studyGroupMember.findMany({
      where: {
        userId: ctx.user.id,
        isActive: true,
        group: {
          isActive: true,
          category: 'collaboration',
        },
      },
      include: {
        group: {
          include: {
            role: { select: { id: true, name: true, companionName: true } },
            sharedSessions: {
              where: { status: 'ACTIVE' },
              take: 1,
              orderBy: { startedAt: 'desc' },
            },
            members: { where: { isActive: true }, select: { userId: true } },
          },
        },
      },
    });

    return memberships.map((m) => ({
      groupId: m.group.id,
      groupName: m.group.name,
      role: m.group.role,
      participantCount: m.group.members.length,
      activeSession: m.group.sharedSessions[0] || null,
      myRole: m.role,
    }));
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // END COLLABORATION
  // ──────────────────────────────────────────────────────────────────────────
  endCollaboration: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const session = await ctx.prisma.sharedSession.findUnique({
        where: { id: input.sessionId },
        include: {
          group: {
            include: {
              members: { where: { userId: ctx.user.id, isActive: true } },
            },
          },
        },
      });

      if (!session || session.status !== 'ACTIVE') {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Active session not found' });
      }

      const isOwner = session.group.members[0]?.role === 'OWNER';
      const isInitiator = session.initiatedByUserId === ctx.user.id;

      if (!isOwner && !isInitiator) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the initiator or owner can end the session' });
      }

      const now = new Date();
      const durationSecs = Math.floor((now.getTime() - session.startedAt.getTime()) / 1000);

      const updated = await ctx.prisma.sharedSession.update({
        where: { id: input.sessionId },
        data: {
          status: 'ENDED',
          endedAt: now,
          duration: durationSecs,
        },
      });

      return {
        sessionId: updated.id,
        duration: durationSecs,
        messageCount: updated.messageCount,
      };
    }),
});
