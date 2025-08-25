import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Check, Crown, Zap, Star, User, LogOut } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription, SubscriptionPlan } from '@/contexts/SubscriptionContext';
import { useUser } from '@/contexts/UserContext';

interface PlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  onSubscribe: (planId: string) => void;
  isSubscribing: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, isCurrentPlan, onSubscribe, isSubscribing }) => {
  const getIcon = () => {
    switch (plan.id) {
      case 'free':
        return <Star size={24} color="#64748b" />;
      case 'pro':
        return <Zap size={24} color="#f59e0b" />;
      case 'premium':
        return <Crown size={24} color="#8b5cf6" />;
      default:
        return <Star size={24} color="#64748b" />;
    }
  };

  const getGradientColors = (): [string, string] => {
    switch (plan.id) {
      case 'free':
        return ['#f8fafc', '#e2e8f0'];
      case 'pro':
        return ['#fef3c7', '#fbbf24'];
      case 'premium':
        return ['#ede9fe', '#8b5cf6'];
      default:
        return ['#f8fafc', '#e2e8f0'];
    }
  };

  const handleSubscribe = () => {
    if (isCurrentPlan) return;
    
    if (plan.id === 'free') {
      Alert.alert('Already on Free Plan', 'You are already using the free plan.');
      return;
    }
    
    Alert.alert(
      'Confirm Subscription',
      `Subscribe to ${plan.name} for $${plan.price}/${plan.interval}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Subscribe', onPress: () => onSubscribe(plan.id) }
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.planCard,
        plan.popular && styles.popularCard,
        isCurrentPlan && styles.currentPlanCard
      ]}
      onPress={handleSubscribe}
      disabled={isCurrentPlan || isSubscribing}
    >
      <LinearGradient
        colors={getGradientColors()}
        style={styles.cardGradient}
      >
        {plan.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>MOST POPULAR</Text>
          </View>
        )}
        
        <View style={styles.cardHeader}>
          {getIcon()}
          <Text style={styles.planName}>{plan.name}</Text>
          {isCurrentPlan && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentText}>CURRENT</Text>
            </View>
          )}
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            ${plan.price}
            <Text style={styles.interval}>/{plan.interval}</Text>
          </Text>
        </View>
        
        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Check size={16} color="#10b981" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
        
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            isCurrentPlan && styles.currentButton,
            plan.popular && styles.popularButton
          ]}
          onPress={handleSubscribe}
          disabled={isCurrentPlan || isSubscribing}
        >
          {isSubscribing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={[
              styles.subscribeButtonText,
              isCurrentPlan && styles.currentButtonText
            ]}>
              {isCurrentPlan ? 'Current Plan' : plan.id === 'free' ? 'Free Plan' : 'Subscribe'}
            </Text>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const SubscriptionPlans: React.FC = () => {
  const {
    plans,
    currentPlan,
    subscription,
    isLoadingPlans,
    isSubscribing,
    subscribe
  } = useSubscription();
  
  const { user, isSignedIn, signOut } = useUser();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              Alert.alert('Success', 'You have been signed out.');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out.');
            }
          }
        }
      ]
    );
  };

  const handleSubscribe = async (planId: string) => {
    if (!isSignedIn || !user) {
      Alert.alert('Sign In Required', 'Please sign in to subscribe to a plan.');
      return;
    }
    
    try {
      const result = await subscribe(planId, user.email);
      if (result.success) {
        Alert.alert('Success!', result.message);
      }
    } catch {
      Alert.alert('Error', 'Failed to subscribe. Please try again.');
    }
  };

  if (isLoadingPlans) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading subscription plans...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <Text style={styles.headerSubtitle}>
          Unlock the full potential of symbol comparison
        </Text>
        {user && (
          <View style={styles.userInfo}>
            <User size={20} color="white" />
            <Text style={styles.userEmail}>{user.email}</Text>
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
              <LogOut size={16} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
      
      {subscription && (
        <View style={styles.currentSubscriptionInfo}>
          <Text style={styles.currentSubscriptionTitle}>Current Subscription</Text>
          <Text style={styles.currentSubscriptionText}>
            {currentPlan?.name} Plan - Active until {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </Text>
        </View>
      )}
      
      <View style={styles.plansContainer}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={currentPlan?.id === plan.id}
            onSubscribe={handleSubscribe}
            isSubscribing={isSubscribing}
          />
        ))}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          All plans include secure payment processing and can be cancelled anytime.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  currentSubscriptionInfo: {
    backgroundColor: '#1e293b',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  currentSubscriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 4,
  },
  currentSubscriptionText: {
    fontSize: 14,
    color: '#ffffff',
  },
  plansContainer: {
    padding: 20,
    gap: 20,
  },
  planCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  popularCard: {
    borderWidth: 2,
    borderColor: '#f59e0b',
    transform: [{ scale: 1.02 }],
  },
  currentPlanCard: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  cardGradient: {
    padding: 20,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  currentBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  priceContainer: {
    marginBottom: 20,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  interval: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#64748b',
  },
  featuresContainer: {
    marginBottom: 24,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  popularButton: {
    backgroundColor: '#f59e0b',
  },
  currentButton: {
    backgroundColor: '#10b981',
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  currentButtonText: {
    color: 'white',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  userEmail: {
    fontSize: 14,
    color: 'white',
    flex: 1,
  },
  signOutButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});