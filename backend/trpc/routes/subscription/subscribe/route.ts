import { protectedProcedure } from "../../../create-context";
import { z } from "zod";

// In-memory storage for demo (use a real database in production)
const subscriptions = new Map<string, any>();

export const subscribeRoute = protectedProcedure
  .input(z.object({
    planId: z.string(),
    paymentMethod: z.string().optional(),
    userEmail: z.string().email()
  }))
  .mutation(async ({ input, ctx }) => {
    const { planId, userEmail } = input;
    const userId = ctx.userId;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create subscription
    const subscription = {
      id: `sub_${Date.now()}`,
      userId,
      userEmail,
      planId,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdAt: new Date()
    };
    
    // Store subscription
    subscriptions.set(userId, subscription);
    
    console.log(`Subscription created for user ${userId} (${userEmail}):`, subscription);
    
    return {
      success: true,
      subscription,
      message: 'Subscription activated successfully!'
    };
  });

export { subscriptions };