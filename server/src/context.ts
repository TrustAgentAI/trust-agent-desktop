import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { verifyJWT } from './lib/auth';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
import type { User, HardwareDevice } from '@prisma/client';

export interface Context {
  user: User | null;
  device?: (HardwareDevice & { user: User }) | null;
  apiKey?: string | null;
  keyType?: string | null;
  adminApiKey?: string | null;
  prisma: typeof prisma;
  redis: typeof redis;
}

export async function createContext({ req }: CreateExpressContextOptions): Promise<Context> {
  const baseCtx = { prisma, redis, user: null as User | null, adminApiKey: null as string | null };

  // Admin API key check
  const adminKey = req.headers['x-admin-api-key'] as string | undefined;
  if (adminKey) {
    baseCtx.adminApiKey = adminKey;
  }

  // API key authentication (for B2B gateway and hardware devices)
  const apiKey = req.headers['x-api-key'] as string | undefined;
  if (apiKey) {
    const keyType = apiKey.startsWith('ta_live_')
      ? 'user'
      : apiKey.startsWith('ta_device_')
        ? 'device'
        : null;

    if (keyType === 'user') {
      const user = await prisma.user.findUnique({ where: { apiKey } });
      if (user) return { ...baseCtx, user, apiKey, keyType };
    }

    if (keyType === 'device') {
      const device = await prisma.hardwareDevice.findUnique({
        where: { apiKey },
        include: { user: true },
      });
      if (device) return { ...baseCtx, user: device.user, device, apiKey, keyType };
    }
  }

  // JWT authentication (app users)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = verifyJWT(token);
    if (payload) {
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (user) return { ...baseCtx, user };
    }
  }

  return baseCtx;
}
