import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { trpc } from '@/lib/trpc';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  limits: {
    comparisonsPerDay: number;
    searchResults: number;
  };
  popular: boolean;
}

export interface Subscription {
  id: string;
  planId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
}

export interface UsageStats {
  comparisonsToday: number;
  lastResetDate: string;
}

const USAGE_STORAGE_KEY = 'subscription_usage';

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const [usageStats, setUsageStats] = useState<UsageStats>({
    comparisonsToday: 0,
    lastResetDate: new Date().toDateString()
  });

  const subscriptionQuery = trpc.subscription.getSubscription.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false
  });
  const plansQuery = trpc.subscription.getPlans.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false
  });
  const subscribeMutation = trpc.subscription.subscribe.useMutation();

  // Load usage stats from AsyncStorage
  useEffect(() => {
    const loadUsageStats = async () => {
      try {
        const stored = await AsyncStorage.getItem(USAGE_STORAGE_KEY);
        if (stored) {
          const parsedStats: UsageStats = JSON.parse(stored);
          const today = new Date().toDateString();
          
          // Reset daily usage if it's a new day
          if (parsedStats.lastResetDate !== today) {
            const resetStats = {
              comparisonsToday: 0,
              lastResetDate: today
            };
            setUsageStats(resetStats);
            await AsyncStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(resetStats));
          } else {
            setUsageStats(parsedStats);
          }
        }
      } catch (error) {
        console.error('Failed to load usage stats:', error);
      }
    };

    loadUsageStats();
  }, []);

  // Save usage stats to AsyncStorage
  const saveUsageStats = async (stats: UsageStats) => {
    try {
      await AsyncStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(stats));
      setUsageStats(stats);
    } catch (error) {
      console.error('Failed to save usage stats:', error);
    }
  };

  const incrementComparisons = useCallback(async () => {
    const today = new Date().toDateString();
    const newStats = {
      comparisonsToday: usageStats.lastResetDate === today ? usageStats.comparisonsToday + 1 : 1,
      lastResetDate: today
    };
    await saveUsageStats(newStats);
  }, [usageStats]);

  const canPerformComparison = useCallback(() => {
    const currentPlan = subscriptionQuery.data?.plan;
    
    // If no plan data is available (e.g., API error), allow limited usage
    if (!currentPlan) {
      const today = new Date().toDateString();
      const todayUsage = usageStats.lastResetDate === today ? usageStats.comparisonsToday : 0;
      return todayUsage < 3; // Allow 3 comparisons per day as fallback
    }
    
    // Unlimited for paid plans
    if (currentPlan.limits.comparisonsPerDay === -1) return true;
    
    // Check daily limit for free plan
    const today = new Date().toDateString();
    const todayUsage = usageStats.lastResetDate === today ? usageStats.comparisonsToday : 0;
    
    return todayUsage < currentPlan.limits.comparisonsPerDay;
  }, [subscriptionQuery.data?.plan, usageStats]);

  const getRemainingComparisons = useCallback(() => {
    const currentPlan = subscriptionQuery.data?.plan;
    
    // If no plan data is available (e.g., API error), use fallback limit
    if (!currentPlan) {
      const today = new Date().toDateString();
      const todayUsage = usageStats.lastResetDate === today ? usageStats.comparisonsToday : 0;
      return Math.max(0, 3 - todayUsage); // 3 comparisons per day as fallback
    }
    
    // Unlimited for paid plans
    if (currentPlan.limits.comparisonsPerDay === -1) return -1;
    
    // Calculate remaining for free plan
    const today = new Date().toDateString();
    const todayUsage = usageStats.lastResetDate === today ? usageStats.comparisonsToday : 0;
    
    return Math.max(0, currentPlan.limits.comparisonsPerDay - todayUsage);
  }, [subscriptionQuery.data?.plan, usageStats]);

  const clearDailyUsage = useCallback(async () => {
    const today = new Date().toDateString();
    const resetStats = {
      comparisonsToday: 0,
      lastResetDate: today
    };
    await saveUsageStats(resetStats);
    console.log('Daily usage cleared successfully');
  }, []);

  const subscribe = useCallback(async (planId: string, userEmail: string) => {
    try {
      const result = await subscribeMutation.mutateAsync({ planId, userEmail });
      if (result.success) {
        // Refetch subscription data
        await subscriptionQuery.refetch();
      }
      return result;
    } catch (error) {
      console.error('Subscription failed:', error);
      throw error;
    }
  }, [subscribeMutation, subscriptionQuery]);

  return useMemo(() => ({
    // Data
    subscription: subscriptionQuery.data?.subscription || null,
    currentPlan: subscriptionQuery.data?.plan || null,
    plans: plansQuery.data?.plans || [],
    usageStats,
    
    // Loading states
    isLoadingSubscription: subscriptionQuery.isLoading,
    isLoadingPlans: plansQuery.isLoading,
    isSubscribing: subscribeMutation.isPending,
    
    // Actions
    subscribe,
    incrementComparisons,
    canPerformComparison,
    getRemainingComparisons,
    clearDailyUsage,
    
    // Refetch
    refetchSubscription: subscriptionQuery.refetch,
    refetchPlans: plansQuery.refetch,
  }), [
    subscriptionQuery.data?.subscription,
    subscriptionQuery.data?.plan,
    plansQuery.data?.plans,
    usageStats,
    subscriptionQuery.isLoading,
    plansQuery.isLoading,
    subscribeMutation.isPending,
    subscribe,
    incrementComparisons,
    canPerformComparison,
    getRemainingComparisons,
    clearDailyUsage,
    subscriptionQuery.refetch,
    plansQuery.refetch,
  ]);
});