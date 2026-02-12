'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  checkSubscription,
  isSubscriptionActive,
  canAccessPremiumFeatures,
  canAccessProFeatures,
  canAccessPremiumOnlyFeatures,
  requiresPaymentAction,
  type SubscriptionData,
} from '@/lib/subscription-guard';

export function useSubscription() {
  const { user } = useAuth();
  const router = useRouter();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadSubscription();
  }, [user]);

  async function loadSubscription() {
    if (!user) return;

    try {
      const data = await checkSubscription(user.id);
      setSubscriptionData(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  }

  function redirectToSubscription() {
    router.push('/settings/subscription');
  }

  function guardPremiumFeature(featureName: string = 'cette fonctionnalité'): boolean {
    if (!subscriptionData) {
      redirectToSubscription();
      return false;
    }

    if (!canAccessPremiumFeatures(subscriptionData)) {
      console.warn(`Access denied to ${featureName} - Premium subscription required`);
      redirectToSubscription();
      return false;
    }

    return true;
  }

  function guardProFeature(featureName: string = 'cette fonctionnalité'): boolean {
    if (!subscriptionData) {
      redirectToSubscription();
      return false;
    }

    if (!canAccessProFeatures(subscriptionData)) {
      console.warn(`Access denied to ${featureName} - Pro subscription required`);
      redirectToSubscription();
      return false;
    }

    return true;
  }

  function guardPremiumOnlyFeature(featureName: string = 'cette fonctionnalité'): boolean {
    if (!subscriptionData) {
      redirectToSubscription();
      return false;
    }

    if (!canAccessPremiumOnlyFeatures(subscriptionData)) {
      console.warn(`Access denied to ${featureName} - Premium Only subscription required`);
      redirectToSubscription();
      return false;
    }

    return true;
  }

  return {
    subscriptionData,
    loading,
    isActive: subscriptionData ? isSubscriptionActive(subscriptionData.status) : false,
    canAccessPremium: canAccessPremiumFeatures(subscriptionData),
    canAccessPro: canAccessProFeatures(subscriptionData),
    canAccessPremiumOnly: canAccessPremiumOnlyFeatures(subscriptionData),
    needsPaymentAction: subscriptionData ? requiresPaymentAction(subscriptionData.status) : false,
    guardPremiumFeature,
    guardProFeature,
    guardPremiumOnlyFeature,
    redirectToSubscription,
    refresh: loadSubscription,
  };
}
