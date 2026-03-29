import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import crypto from 'crypto';

/**
 * Generate an 8-char alphanumeric invite code.
 */
function generateInviteCode(): string {
  return crypto.randomBytes(6).toString('base64url').slice(0, 8).toUpperCase();
}

export const studyGroupsRouter = router({
  // ──────────────────────────────────────────────────────────────────────────
  // CREATE GROUP
  // ──────────────────────────────────────────────────────────────────────────
  createGroup: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        roleId: z.string().optional(),
        hireId: z.string().optional(),
        maxMembers: z.number().int().min(2).max(10).default(5),
        category: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user has an active hire - accept either roleId or hireId
      const hire = await ctx.prisma.hire.findFirst({
        where: {
          userId: ctx.user.id,
          status: 'ACTIVE',
          ...(input.hireId ? { id: input.hireId } : { roleId: input.roleId }),
        },
        include: { role: true },
      });
      if (!hire) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'You must have an active hire for this role to create a study group',
        });
      }

      // Generate unique invite code (retry on collision)
      let inviteCode = generateInviteCode();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await ctx.prisma.studyGroup.findUnique({ where: { inviteCode } });
        if (!existing) break;
        inviteCode = generateInviteCode();
        attempts++;
      }

      const group = await ctx.prisma.studyGroup.create({
        data: {
          name: input.name,
          description: input.description,
          createdByUserId: ctx.user.id,
          roleId: hire.roleId,
          maxMembers: input.maxMembers,
          inviteCode,
          category: input.category,
          members: {
            create: {
              userId: ctx.user.id,
              role: 'OWNER',
            },
          },
        },
        include: {
          role: { select: { id: true, name: true, companionName: true, environmentSlug: true, environmentConfig: true } },
          members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        },
      });

      return group;
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // JOIN GROUP via invite code
  // ──────────────────────────────────────────────────────────────────────────
  joinGroup: protectedProcedure
    .input(z.object({ inviteCode: z.string().min(1).max(8) }))
    .mutation(async ({ input, ctx }) => {
      const group = await ctx.prisma.studyGroup.findUnique({
        where: { inviteCode: input.inviteCode.toUpperCase() },
        include: {
          members: { where: { isActive: true } },
          role: { select: { id: true, name: true } },
        },
      });

      if (!group || !group.isActive) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid or inactive invite code' });
      }

      // Check if already a member
      const existing = await ctx.prisma.studyGroupMember.findUnique({
        where: { userId_groupId: { userId: ctx.user.id, groupId: group.id } },
      });
      if (existing) {
        if (existing.isActive) {
          throw new TRPCError({ code: 'CONFLICT', message: 'You are already a member of this group' });
        }
        // Reactivate membership
        await ctx.prisma.studyGroupMember.update({
          where: { id: existing.id },
          data: { isActive: true, joinedAt: new Date() },
        });
        return { groupId: group.id, name: group.name, roleName: group.role.name };
      }

      // Check max members
      if (group.members.length >= group.maxMembers) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'This study group is full' });
      }

      await ctx.prisma.studyGroupMember.create({
        data: {
          userId: ctx.user.id,
          groupId: group.id,
          role: 'MEMBER',
        },
      });

      return { groupId: group.id, name: group.name, roleName: group.role.name };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // LEAVE GROUP
  // ──────────────────────────────────────────────────────────────────────────
  leaveGroup: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const member = await ctx.prisma.studyGroupMember.findUnique({
        where: { userId_groupId: { userId: ctx.user.id, groupId: input.groupId } },
      });

      if (!member || !member.isActive) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'You are not a member of this group' });
      }

      if (member.role === 'OWNER') {
        // Transfer ownership to longest-standing member or deactivate group
        const nextOwner = await ctx.prisma.studyGroupMember.findFirst({
          where: { groupId: input.groupId, userId: { not: ctx.user.id }, isActive: true },
          orderBy: { joinedAt: 'asc' },
        });

        if (nextOwner) {
          await ctx.prisma.studyGroupMember.update({
            where: { id: nextOwner.id },
            data: { role: 'OWNER' },
          });
        } else {
          // No other members - deactivate group
          await ctx.prisma.studyGroup.update({
            where: { id: input.groupId },
            data: { isActive: false },
          });
        }
      }

      await ctx.prisma.studyGroupMember.update({
        where: { id: member.id },
        data: { isActive: false },
      });

      return { success: true };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // GET MY GROUPS
  // ──────────────────────────────────────────────────────────────────────────
  getMyGroups: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.prisma.studyGroupMember.findMany({
      where: { userId: ctx.user.id, isActive: true },
      include: {
        group: {
          include: {
            role: { select: { id: true, name: true, companionName: true, category: true } },
            members: { where: { isActive: true }, select: { id: true } },
            sharedSessions: {
              orderBy: { startedAt: 'desc' },
              take: 1,
              select: { startedAt: true, status: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships
      .filter((m) => m.group.isActive)
      .map((m) => ({
        id: m.group.id,
        name: m.group.name,
        description: m.group.description,
        category: m.group.category,
        role: m.group.role,
        memberCount: m.group.members.length,
        maxMembers: m.group.maxMembers,
        myRole: m.role,
        inviteCode: m.group.inviteCode,
        lastSession: m.group.sharedSessions[0] || null,
        createdAt: m.group.createdAt,
      }));
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // GET GROUP DETAIL (must be member)
  // ──────────────────────────────────────────────────────────────────────────
  getGroupDetail: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Verify membership
      const member = await ctx.prisma.studyGroupMember.findUnique({
        where: { userId_groupId: { userId: ctx.user.id, groupId: input.groupId } },
      });
      if (!member || !member.isActive) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not a member of this group' });
      }

      const group = await ctx.prisma.studyGroup.findUnique({
        where: { id: input.groupId },
        include: {
          role: {
            select: {
              id: true, name: true, companionName: true, category: true,
              environmentSlug: true, environmentConfig: true,
            },
          },
          members: {
            where: { isActive: true },
            include: { user: { select: { id: true, name: true, avatarUrl: true, email: true } } },
            orderBy: { joinedAt: 'asc' },
          },
          sharedSessions: {
            orderBy: { startedAt: 'desc' },
            take: 10,
            select: {
              id: true, status: true, startedAt: true, endedAt: true,
              messageCount: true, duration: true,
              initiatedBy: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Group not found' });
      }

      return {
        ...group,
        myRole: member.role,
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // START SHARED SESSION
  // ──────────────────────────────────────────────────────────────────────────
  startSharedSession: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Verify membership
      const member = await ctx.prisma.studyGroupMember.findUnique({
        where: { userId_groupId: { userId: ctx.user.id, groupId: input.groupId } },
      });
      if (!member || !member.isActive) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not a member of this group' });
      }

      // Check no active session already running
      const activeSession = await ctx.prisma.sharedSession.findFirst({
        where: { groupId: input.groupId, status: 'ACTIVE' },
      });
      if (activeSession) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A shared session is already active for this group',
        });
      }

      const group = await ctx.prisma.studyGroup.findUnique({
        where: { id: input.groupId },
        include: {
          role: {
            select: {
              id: true, name: true, companionName: true,
              environmentSlug: true, environmentConfig: true,
            },
          },
        },
      });

      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Group not found' });
      }

      const session = await ctx.prisma.sharedSession.create({
        data: {
          groupId: input.groupId,
          initiatedByUserId: ctx.user.id,
          status: 'ACTIVE',
        },
      });

      return {
        sessionId: session.id,
        groupId: group.id,
        groupName: group.name,
        role: group.role,
        startedAt: session.startedAt,
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // SEND SHARED MESSAGE
  // ──────────────────────────────────────────────────────────────────────────
  sendSharedMessage: protectedProcedure
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
              members: { where: { isActive: true } },
            },
          },
        },
      });

      if (!session || session.status !== 'ACTIVE') {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Active shared session not found' });
      }

      // Verify membership
      const isMember = session.group.members.some((m) => m.userId === ctx.user.id);
      if (!isMember) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not a member of this group' });
      }

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

      return message;
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // GET SESSION MESSAGES
  // ──────────────────────────────────────────────────────────────────────────
  getSessionMessages: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      const session = await ctx.prisma.sharedSession.findUnique({
        where: { id: input.sessionId },
        include: {
          group: {
            include: { members: { where: { isActive: true }, select: { userId: true } } },
          },
        },
      });

      if (!session) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
      }

      const isMember = session.group.members.some((m) => m.userId === ctx.user.id);
      if (!isMember) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not a member of this group' });
      }

      const messages = await ctx.prisma.sharedMessage.findMany({
        where: {
          sessionId: input.sessionId,
          isVisible: true,
          ...(input.cursor ? { id: { gt: input.cursor } } : {}),
        },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: input.limit,
      });

      return {
        messages,
        nextCursor: messages.length === input.limit ? messages[messages.length - 1]?.id : null,
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // END SHARED SESSION (owner or initiator only)
  // ──────────────────────────────────────────────────────────────────────────
  endSharedSession: protectedProcedure
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

      // Only owner or initiator can end
      const memberEntry = session.group.members[0];
      const isOwner = memberEntry?.role === 'OWNER';
      const isInitiator = session.initiatedByUserId === ctx.user.id;

      if (!isOwner && !isInitiator) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the group owner or session initiator can end the session',
        });
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

      return updated;
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // REGENERATE INVITE CODE (owner only)
  // ──────────────────────────────────────────────────────────────────────────
  generateInviteCode: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const member = await ctx.prisma.studyGroupMember.findUnique({
        where: { userId_groupId: { userId: ctx.user.id, groupId: input.groupId } },
      });

      if (!member || !member.isActive || member.role !== 'OWNER') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the group owner can regenerate the invite code',
        });
      }

      let newCode = generateInviteCode();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await ctx.prisma.studyGroup.findUnique({ where: { inviteCode: newCode } });
        if (!existing) break;
        newCode = generateInviteCode();
        attempts++;
      }

      const updated = await ctx.prisma.studyGroup.update({
        where: { id: input.groupId },
        data: { inviteCode: newCode },
      });

      return { inviteCode: updated.inviteCode };
    }),
});
