import { supabase } from './supabase';

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'inactive' | 'trialing';
export type PlanType = 'free' | 'pro' | 'premium';

export interface SubscriptionData {
  status: SubscriptionStatus;
  planType: PlanType;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  companyName: string;
}

export async function checkSubscription(userId: string): Promise<SubscriptionData | null> {
  try {
    const { data, error } = await supabase
      .from('event_providers')
      .select('subscription_status, plan_type, stripe_customer_id, stripe_subscription_id, company_name')
      .eq('provider_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking subscription:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      status: (data.subscription_status || 'inactive') as SubscriptionStatus,
      planType: (data.plan_type || 'free') as PlanType,
      stripeCustomerId: data.stripe_customer_id,
      stripeSubscriptionId: data.stripe_subscription_id,
      companyName: data.company_name,
    };
  } catch (error) {
    console.error('Error in checkSubscription:', error);
    return null;
  }
}

export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trialing';
}

export function requiresPaymentAction(status: SubscriptionStatus): boolean {
  return status === 'past_due' || status === 'canceled' || status === 'inactive';
}

export function canAccessPremiumFeatures(subscriptionData: SubscriptionData | null): boolean {
  if (!subscriptionData) return false;
  return isSubscriptionActive(subscriptionData.status) &&
         (subscriptionData.planType === 'pro' || subscriptionData.planType === 'premium');
}

export function canAccessProFeatures(subscriptionData: SubscriptionData | null): boolean {
  if (!subscriptionData) return false;
  return isSubscriptionActive(subscriptionData.status) && subscriptionData.planType === 'pro';
}

export function canAccessPremiumOnlyFeatures(subscriptionData: SubscriptionData | null): boolean {
  if (!subscriptionData) return false;
  return isSubscriptionActive(subscriptionData.status) && subscriptionData.planType === 'premium';
}

export function getSubscriptionStatusMessage(status: SubscriptionStatus): string {
  switch (status) {
    case 'active':
      return 'Votre abonnement est actif';
    case 'trialing':
      return 'Vous êtes en période d\'essai';
    case 'past_due':
      return 'Problème de paiement détecté';
    case 'canceled':
      return 'Votre abonnement a été annulé';
    case 'inactive':
      return 'Aucun abonnement actif';
    default:
      return 'Statut inconnu';
  }
}

export function getSubscriptionStatusColor(status: SubscriptionStatus): string {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'text-green-400';
    case 'past_due':
      return 'text-orange-400';
    case 'canceled':
    case 'inactive':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}
