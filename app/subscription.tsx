import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SubscriptionPlans } from '@/components/SubscriptionPlans';
import { SignInForm } from '@/components/SignInForm';
import { useUser } from '@/contexts/UserContext';

export default function SubscriptionScreen() {
  const { isSignedIn, isLoading } = useUser();
  const [showSignIn, setShowSignIn] = useState(false);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (!isSignedIn || showSignIn) {
    return (
      <View style={styles.container}>
        <SignInForm 
          onSuccess={() => setShowSignIn(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SubscriptionPlans />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});