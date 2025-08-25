import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
}

const USER_STORAGE_KEY = 'user_data';

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from AsyncStorage on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (stored) {
          const userData = JSON.parse(stored);
          setUser({
            ...userData,
            createdAt: new Date(userData.createdAt)
          });
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const saveUser = async (userData: User) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Failed to save user:', error);
      throw error;
    }
  };

  const signIn = useCallback(async (email: string, name?: string) => {
    const userData: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase().trim(),
      name: name?.trim(),
      createdAt: new Date()
    };

    await saveUser(userData);
    return userData;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem('subscription_data');
      await AsyncStorage.removeItem('subscription_usage');
      setUser(null);
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw error;
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<Omit<User, 'id' | 'createdAt'>>) => {
    if (!user) throw new Error('No user signed in');
    
    const updatedUser = { ...user, ...updates };
    await saveUser(updatedUser);
    return updatedUser;
  }, [user]);

  return {
    user,
    isLoading,
    isSignedIn: !!user,
    signIn,
    signOut,
    updateUser
  };
});