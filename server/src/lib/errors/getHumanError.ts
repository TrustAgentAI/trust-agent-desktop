/**
 * getHumanError.ts - Phase 6: Human Error Messages
 * Called whenever an error needs to be shown to a user.
 * NEVER show raw error codes or technical messages to users.
 * "Something went wrong on our end - your session data is safe, we promise."
 */

import { prisma } from '../prisma';

export const ERROR_MESSAGES = [
  {
    errorCode: 'session_connection_lost',
    userTitle: 'Connection interrupted',
    userMessage: "Something dropped on our end - it happens sometimes. Your session and everything your companion knows about you is completely safe. Just reconnect and pick up where you left off.",
    safetyNote: 'Your session data is safe. Nothing was lost.',
    actionLabel: 'Reconnect',
    actionUrl: null,
  },
  {
    errorCode: 'session_start_failed',
    userTitle: "Couldn't start session",
    userMessage: "We had trouble starting your session just now - this is on us, not you. Your companion is ready and waiting. Please try again, and if it keeps happening, let us know.",
    safetyNote: null,
    actionLabel: 'Try again',
    actionUrl: null,
  },
  {
    errorCode: 'payment_failed',
    userTitle: 'Payment not processed',
    userMessage: "Your card wasn't charged - the payment didn't go through. This usually means the details need updating. Your access continues until your next billing date.",
    safetyNote: 'You have not been charged.',
    actionLabel: 'Update payment method',
    actionUrl: '/dashboard/billing',
  },
  {
    errorCode: 'voice_unavailable',
    userTitle: 'Voice mode is unavailable right now',
    userMessage: "Voice isn't available at the moment - we're looking into it. Text mode works perfectly and your companion is ready. Switch to text for now?",
    safetyNote: null,
    actionLabel: 'Switch to text',
    actionUrl: null,
  },
  {
    errorCode: 'cloud_sync_failed',
    userTitle: 'Brain sync paused',
    userMessage: "We couldn't sync your Brain to your cloud drive right now. Don't worry - everything is saved on your device and will sync automatically when the connection is restored. Nothing has been lost.",
    safetyNote: 'Your Brain is safe on your device.',
    actionLabel: 'Check connection',
    actionUrl: '/dashboard/settings/brain',
  },
  {
    errorCode: 'companion_unavailable',
    userTitle: 'Companion temporarily unavailable',
    userMessage: "Your companion is being updated and will be back shortly - we make improvements regularly to keep the quality high. Check back in a few minutes.",
    safetyNote: null,
    actionLabel: 'Try another companion',
    actionUrl: '/marketplace',
  },
  {
    errorCode: 'subscription_expired',
    userTitle: 'Your subscription has lapsed',
    userMessage: "Your companions are paused while your subscription is inactive. Your Brain and all your memory notes are safe - they're yours and they'll be here when you're ready to come back.",
    safetyNote: 'Your Brain is preserved. All your memory notes are safe.',
    actionLabel: 'Renew subscription',
    actionUrl: '/dashboard/billing',
  },
  {
    errorCode: 'file_upload_failed',
    userTitle: "Couldn't upload that file",
    userMessage: "Something went wrong with that upload - it might be the file size or format. Try again with a smaller file, or paste the text directly.",
    safetyNote: null,
    actionLabel: 'Try again',
    actionUrl: null,
  },
  {
    errorCode: 'rate_limit',
    userTitle: "You're going fast",
    userMessage: "You've had a lot of sessions today - that's brilliant. We've added a short break to keep things healthy. Come back in a few minutes and your companion will be ready.",
    safetyNote: null,
    actionLabel: 'I understand',
    actionUrl: null,
  },
  {
    errorCode: 'general_error',
    userTitle: 'Something went wrong',
    userMessage: "We've hit an unexpected problem - this is on us. Your data is safe, and our team has been notified. Please try again, or contact us if it persists.",
    safetyNote: 'Your data is safe.',
    actionLabel: 'Try again',
    actionUrl: null,
  },
];

export async function seedErrorMessages() {
  for (const msg of ERROR_MESSAGES) {
    await prisma.errorMessageTemplate.upsert({
      where: { errorCode: msg.errorCode },
      create: msg,
      update: msg,
    });
  }
  console.log(`Seeded ${ERROR_MESSAGES.length} error message templates`);
}

export async function getHumanError(
  errorCode: string,
): Promise<{
  title: string;
  message: string;
  safetyNote: string | null;
  actionLabel: string | null;
  actionUrl: string | null;
}> {
  const template = await prisma.errorMessageTemplate.findFirst({
    where: { errorCode },
  });

  if (template) {
    return {
      title: template.userTitle,
      message: template.userMessage,
      safetyNote: template.safetyNote,
      actionLabel: template.actionLabel,
      actionUrl: template.actionUrl,
    };
  }

  // Fallback - general error
  return {
    title: 'Something went wrong',
    message: "We've hit an unexpected problem - this is on us. Your data is safe.",
    safetyNote: 'Your data is safe.',
    actionLabel: 'Try again',
    actionUrl: null,
  };
}
