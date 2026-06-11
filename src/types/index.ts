// ADASwift Types
// System tag is HARD-CODED to: adaswift-signuppage

export type PlanId = 'basic' | 'business' | 'agency';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  system_tag: 'adaswift-signuppage'; // Hard-coded!
  plan_id: PlanId;
  mintbird_customer_id: string;
  subscription_status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  email: string;
  planId: PlanId;
  mintbirdCustomerId: string;
}

// Hard-coded system tag - cannot be changed
export const SYSTEM_TAG = 'adaswift-signuppage' as const;
export const VALID_PLANS: PlanId[] = ['basic', 'business', 'agency'];

// MintBird plan configuration
export const PLANS = [
  {
    id: 'basic' as PlanId,
    name: 'Basic',
    price: '$97/mo',
    features: ['1 Website', 'Basic ADA compliance', 'Email support'],
  },
  {
    id: 'business' as PlanId,
    name: 'Business',
    price: '$197/mo',
    features: ['5 Websites', 'Advanced compliance', 'Priority support', 'Monthly reports'],
    featured: true,
  },
  {
    id: 'agency' as PlanId,
    name: 'Agency',
    price: '$497/mo',
    features: ['Unlimited Websites', 'White-label', 'Reseller rights', 'Dedicated support'],
  },
];
