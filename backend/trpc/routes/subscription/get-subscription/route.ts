import { protectedProcedure } from "../../../create-context";
import { subscriptions } from "../subscribe/route";

// Plan definitions
const plans = {
  free: {
    id: 'free',
    name: 'Free',
    limits: {
      comparisonsPerDay: 5,
      searchResults: 3
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    limits: {
      comparisonsPerDay: -1, // unlimited
      searchResults: 10
    }
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    limits: {
      comparisonsPerDay: -1, // unlimited
      searchResults: 20
    }
  }
};

export const getSubscriptionRoute = protectedProcedure.query(({ ctx }) => {
  const userId = ctx.userId;
  
  if (!userId) {
    // Return free plan for unauthenticated users
    return {
      subscription: null,
      plan: plans.free
    };
  }
  
  // Check if user has an active subscription
  const subscription = subscriptions.get(userId);
  
  if (!subscription || subscription.status !== 'active') {
    return {
      subscription: null,
      plan: plans.free
    };
  }
  
  // Check if subscription is still valid
  const now = new Date();
  const endDate = new Date(subscription.currentPeriodEnd);
  
  if (now > endDate) {
    // Subscription expired
    subscription.status = 'expired';
    subscriptions.set(userId, subscription);
    
    return {
      subscription: null,
      plan: plans.free
    };
  }
  
  // Return active subscription with corresponding plan
  const plan = plans[subscription.planId as keyof typeof plans] || plans.free;
  
  return {
    subscription,
    plan
  };
});

export { plans };