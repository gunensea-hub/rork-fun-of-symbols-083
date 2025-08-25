import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { getPlansRoute } from "./routes/subscription/get-plans/route";
import { subscribeRoute } from "./routes/subscription/subscribe/route";
import { getSubscriptionRoute } from "./routes/subscription/get-subscription/route";
import { searchImagesProcedure } from "./routes/symbols/search-images/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  subscription: createTRPCRouter({
    getPlans: getPlansRoute,
    subscribe: subscribeRoute,
    getSubscription: getSubscriptionRoute,
  }),
  symbols: createTRPCRouter({
    searchImages: searchImagesProcedure,
  }),
});

export type AppRouter = typeof appRouter;