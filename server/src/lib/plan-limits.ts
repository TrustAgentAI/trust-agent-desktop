import type { UserPlan } from '@prisma/client';

export const PLAN_LIMITS: Record<UserPlan, { maxHires: number; label: string; priceMonthly: number }> = {
  FREE: { maxHires: 0, label: 'Free', priceMonthly: 0 },
  STARTER: { maxHires: 1, label: 'Starter', priceMonthly: 999 },
  ESSENTIAL: { maxHires: 3, label: 'Essential', priceMonthly: 1999 },
  FAMILY: { maxHires: 5, label: 'Family', priceMonthly: 2499 },
  PROFESSIONAL: { maxHires: 10, label: 'Professional', priceMonthly: 3999 },
  ENTERPRISE: { maxHires: 9999, label: 'Enterprise', priceMonthly: 0 },
};

export function getMaxHires(plan: UserPlan): number {
  return PLAN_LIMITS[plan]?.maxHires ?? 0;
}
