import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { BarChart3, Crown, AlertCircle, RotateCcw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface UsageIndicatorProps {
  onUpgradePress?: () => void;
}

export const UsageIndicator: React.FC<UsageIndicatorProps> = ({ onUpgradePress }) => {
  const {
    currentPlan,
    usageStats,
    getRemainingComparisons,
    canPerformComparison,
    clearDailyUsage,
  } = useSubscription();

  if (!currentPlan) return null;

  const remaining = getRemainingComparisons();
  const canCompare = canPerformComparison();
  const isUnlimited = remaining === -1;
  const isLowUsage = !isUnlimited && remaining <= 1;

  const handleUpgradePress = () => {
    if (onUpgradePress) {
      onUpgradePress();
    } else {
      Alert.alert(
        'Upgrade Required',
        'You need to upgrade your plan to continue using comparisons.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleClearUsage = () => {
    Alert.alert(
      'Clear Daily Usage',
      'Are you sure you want to reset your daily usage counter? This will give you back your free comparisons for today.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearDailyUsage();
              Alert.alert('Success', 'Daily usage has been cleared!');
            } catch {
              Alert.alert('Error', 'Failed to clear daily usage. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getUsageColor = () => {
    if (isUnlimited) return '#10b981';
    if (!canCompare) return '#ef4444';
    if (isLowUsage) return '#f59e0b';
    return '#667eea';
  };

  const getUsageText = () => {
    if (isUnlimited) return 'Unlimited comparisons';
    if (!canCompare) return 'Daily limit reached';
    return `${remaining} comparison${remaining === 1 ? '' : 's'} remaining today`;
  };

  const getProgressPercentage = () => {
    if (isUnlimited) return 100;
    if (!currentPlan.limits.comparisonsPerDay) return 0;
    
    const used = usageStats.comparisonsToday;
    const total = currentPlan.limits.comparisonsPerDay;
    return Math.min((used / total) * 100, 100);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isUnlimited ? ['#10b981', '#059669'] : ['#1e293b', '#334155']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {isUnlimited ? (
              <Crown size={20} color="white" />
            ) : (
              <BarChart3 size={20} color="white" />
            )}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.planName}>{currentPlan.name} Plan</Text>
            <Text style={styles.usageText}>{getUsageText()}</Text>
          </View>
          <View style={styles.actionButtons}>
            {!isUnlimited && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearUsage}
              >
                <RotateCcw size={16} color="#10b981" />
              </TouchableOpacity>
            )}
            {!canCompare && (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgradePress}
              >
                <AlertCircle size={16} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {!isUnlimited && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${getProgressPercentage()}%`,
                    backgroundColor: getUsageColor(),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {usageStats.comparisonsToday} / {currentPlan.limits.comparisonsPerDay}
            </Text>
          </View>
        )}
        
        {isLowUsage && canCompare && (
          <TouchableOpacity
            style={styles.upgradePrompt}
            onPress={handleUpgradePress}
          >
            <Text style={styles.upgradePromptText}>
              Running low? Upgrade for unlimited comparisons
            </Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradient: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  usageText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  upgradeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    marginTop: 12,
    gap: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  upgradePrompt: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  upgradePromptText: {
    fontSize: 12,
    color: '#fbbf24',
    textAlign: 'center',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});