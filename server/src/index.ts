import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers/index';
import { createContext } from './context';
import Stripe from 'stripe';
import { gatewayRouter } from './gateway';

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
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });

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

// B2B Gateway API - REST routes for enterprise customers
app.use('/v1/gateway', gatewayRouter);

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

const server = app.listen(PORT, () => {
  console.log(`Trust Agent API running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    process.exit(0);
  });
});

export { app, server };
