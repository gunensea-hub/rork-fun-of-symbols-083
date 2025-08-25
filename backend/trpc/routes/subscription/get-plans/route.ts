import { publicProcedure } from "../../../create-context";

export const getPlansRoute = publicProcedure.query(() => {
  return {
    plans: [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: [
          '5 comparisons per day',
          'Basic symbol search',
          'Standard support'
        ],
        limits: {
          comparisonsPerDay: 5,
          searchResults: 3
        },
        popular: false
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 29.97,
        currency: 'USD',
        interval: 'month',
        features: [
          'Unlimited comparisons',
          'Advanced symbol search',
          'Priority support',
          'Export results',
          'Custom search queries'
        ],
        limits: {
          comparisonsPerDay: -1, // unlimited
          searchResults: 10
        },
        popular: true
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 59.97,
        currency: 'USD',
        interval: 'month',
        features: [
          'Everything in Pro',
          'AI-powered insights',
          'Batch comparisons',
          'API access',
          'White-label options',
          '24/7 support'
        ],
        limits: {
          comparisonsPerDay: -1, // unlimited
          searchResults: 20
        },
        popular: false
      }
    ]
  };
});