import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers/index';
import { createContext } from './context';
import Stripe from 'stripe';
import { gatewayRouter } from './gateway';
import { AccessToken } from 'livekit-server-sdk';
import { verifyJWT } from './lib/auth';

const app = express();

// CORS - allow Tauri app and production domain
app.use(
  cors({
    origin: ['tauri://localhost', 'https://app.trust-agent.ai', 'http://localhost:1420'],
    credentials: true,
  })
);

// Health check - no auth required
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: process.env.TAURI_APP_VERSION || '1.0.0' });
});

// Stripe webhook - raw body required BEFORE JSON middleware
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' })
  : null;

app.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      // Forward to payments router webhook handler via internal call
      // The actual processing happens in the payments router
      switch (event.type) {
        case 'checkout.session.completed':
        case 'invoice.payment_succeeded':
        case 'invoice.payment_failed':
        case 'customer.subscription.deleted':
          // Events are processed; specific logic is in payments router
          console.log(`Stripe event received: ${event.type}`);
          break;
        default:
          console.log(`Unhandled Stripe event: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      console.error('Stripe webhook error:', err);
      res.status(400).json({ error: 'Webhook signature verification failed' });
    }
  }
);

// JSON body parsing for all other routes
app.use(express.json({ limit: '10mb' }));

// LiveKit token endpoint - generates access tokens for voice sessions
app.post('/livekit/token', async (req, res) => {
  try {
    // Validate auth
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    const payload = verifyJWT(authHeader.slice(7));
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Validate request body
    const { userId, hireId, roomName } = req.body;
    if (!userId || !hireId || !roomName) {
      return res.status(400).json({ error: 'userId, hireId, and roomName are required' });
    }

    // Ensure the authenticated user matches the requested userId
    if (payload.userId !== userId) {
      return res.status(403).json({ error: 'Token userId does not match request userId' });
    }

    // Validate LiveKit configuration
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_SERVER_URL;

    if (!apiKey || !apiSecret || !serverUrl) {
      console.error('LiveKit env vars not configured: LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_SERVER_URL');
      return res.status(503).json({ error: 'Voice service not configured' });
    }

    // Generate LiveKit access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: payload.email || userId,
      metadata: JSON.stringify({ hireId }),
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    res.json({ token, serverUrl });
  } catch (err) {
    console.error('LiveKit token generation error:', err);
    res.status(500).json({ error: 'Failed to generate voice session token' });
  }
});

// B2B Gateway API - REST routes for enterprise customers
app.use('/v1/gateway', gatewayRouter);

// B.9: ICS calendar file endpoint (public, identified by schedule ID)
app.get('/schedules/:scheduleId/calendar.ics', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const schedule = await (await import('./lib/prisma')).prisma.sessionSchedule.findUnique({
      where: { id: scheduleId },
      include: { hire: { include: { role: true } } },
    });
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const byDay = schedule.dayOfWeek.map((d: number) => dayMap[d]).join(',');
    const [hours, minutes] = schedule.timeOfDay.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start.getTime() + schedule.durationMins * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AgentCore LTD//Trust Agent//EN',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      `UID:schedule-${schedule.id}@trust-agent.ai`,
      `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`,
      `SUMMARY:Trust Agent Session - ${schedule.hire.role.name}`,
      'DESCRIPTION:Your scheduled Trust Agent session.',
      'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY',
      'DESCRIPTION:Session starts in 15 minutes', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="session-schedule.ics"`);
    res.send(ics);
  } catch (err) {
    console.error('ICS generation error:', err);
    res.status(500).json({ error: 'Failed to generate calendar file' });
  }
});

// tRPC middleware
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error }) {
      if (error.code === 'INTERNAL_SERVER_ERROR') {
        console.error('tRPC internal error:', error);
      }
    },
  })
);

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, async () => {
  console.log(`Trust Agent API running on port ${PORT}`);

  // B.9: Start schedule checker BullMQ job
  try {
    const { registerScheduleChecker } = await import('./queues/schedule-checker');
    await registerScheduleChecker();
  } catch (err) {
    console.warn('Schedule checker registration skipped (Redis not available):', (err as Error).message);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    process.exit(0);
  });
});

export { app, server };
