import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Linking,
  Alert,
  ActivityIndicator,
  TextInput,
  Animated,
  Image,
  Platform,
} from 'react-native';
import { Search, ArrowRight, Edit3, CheckSquare, Square, FileText, Settings } from 'lucide-react-native';
import { useShapeComparison } from '@/hooks/useShapeComparison';
import { SelectionDropdown } from '@/components/SelectionDropdown';
import { SearchResult } from '@/components/SearchResult';

import { ComparisonResult } from '@/components/ComparisonResult';
import { TermsModal } from '@/components/TermsModal';
import { BackgroundDoodles } from '@/components/BackgroundDoodles';
import { UsageIndicator } from '@/components/UsageIndicator';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { router } from 'expo-router';

const SHAPE_OPTIONS = [
  'Star map',
  'Star clusters',
  'Chemical formula symbol',
  'Atomic structure symbol',
  'Ancient symbols',
] as const;

export default function ShapeComparisonScreen() {
  const {
    selection1,
    selection2,
    setSelection1,
    setSelection2,
    searchResults,
    selectedSearchResult,
    setSelectedSearchResult,
    comparisonResult,
    isSearching,
    isComparing,
    searchForFirstSelection,
    searchWithCustomQuery,
    performComparison,
    canCompare,
    resetAll,
    setSelectedImageLoaded,
    setSelectedImageError,
    isImageValid,
  } = useShapeComparison();

  const {
    canPerformComparison,
    incrementComparisons,
    getRemainingComparisons
  } = useSubscription();

  const [customSearchQuery, setCustomSearchQuery] = useState<string>('');
  const [showCustomSearch, setShowCustomSearch] = useState<boolean>(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  
  // Animation for flashing colors
  const colorAnimation = useRef(new Animated.Value(0)).current;
  
  // Simplified animations for web compatibility
  const box1FloatY = useRef(new Animated.Value(0)).current;
  const box1FloatX = useRef(new Animated.Value(0)).current;
  const box1Rotation = useRef(new Animated.Value(0)).current;
  
  const box2FloatY = useRef(new Animated.Value(0)).current;
  const box2FloatX = useRef(new Animated.Value(0)).current;
  const box2Rotation = useRef(new Animated.Value(0)).current;
  
  const arrowFloatY = useRef(new Animated.Value(0)).current;
  const arrowFloatX = useRef(new Animated.Value(0)).current;
  const arrowRotation = useRef(new Animated.Value(0)).current;
  
  const compareButtonFloat = useRef(new Animated.Value(0)).current;
  const compareButtonRotation = useRef(new Animated.Value(0)).current;
  
  const termsBoxFloat = useRef(new Animated.Value(0)).current;
  const termsBoxRotation = useRef(new Animated.Value(0)).current;
  
  const viewTermsFloat = useRef(new Animated.Value(0)).current;
  const viewTermsRotation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Only run animations on native platforms to avoid web bundling issues
    if (Platform.OS === 'web') {
      return;
    }

    const startColorAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(colorAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(colorAnimation, {
            toValue: 2,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(colorAnimation, {
            toValue: 3,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(colorAnimation, {
            toValue: 4,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(colorAnimation, {
            toValue: 0,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };
    
    // Simplified box animations for better performance
    const startBoxAnimations = () => {
      // Box 1 animations
      Animated.loop(
        Animated.sequence([
          Animated.timing(box1FloatY, {
            toValue: -10,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(box1FloatY, {
            toValue: 10,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      ).start();
      
      Animated.loop(
        Animated.timing(box1Rotation, {
          toValue: 360,
          duration: 10000,
          useNativeDriver: false,
        })
      ).start();
      
      // Box 2 animations
      Animated.loop(
        Animated.sequence([
          Animated.timing(box2FloatY, {
            toValue: 8,
            duration: 1800,
            useNativeDriver: false,
          }),
          Animated.timing(box2FloatY, {
            toValue: -8,
            duration: 1800,
            useNativeDriver: false,
          }),
        ])
      ).start();
      
      // Compare button animations
      Animated.loop(
        Animated.sequence([
          Animated.timing(compareButtonFloat, {
            toValue: -4,
            duration: 2500,
            useNativeDriver: false,
          }),
          Animated.timing(compareButtonFloat, {
            toValue: 4,
            duration: 2500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };
    
    startColorAnimation();
    startBoxAnimations();
  }, []);
  
  const animatedColor = colorAnimation.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: ['#ff6b6b', '#4ecdc4', '#ffd93d', '#a78bfa', '#f97316'],
  });

  const handleCompare = async () => {
    if (!canCompare) return;
    
    if (!termsAccepted) {
      Alert.alert(
        'Terms Required',
        'Please accept the Terms and Conditions before using the comparison feature.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Check subscription limits
    if (!canPerformComparison()) {
      const remaining = getRemainingComparisons();
      Alert.alert(
        'Usage Limit Reached',
        remaining === 0 
          ? 'You have reached your daily comparison limit. Upgrade to continue using the service.'
          : 'You need an active subscription to perform comparisons.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Plans', onPress: () => router.push('/subscription') }
        ]
      );
      return;
    }
    
    await performComparison();
    // Increment usage after successful comparison
    await incrementComparisons();
  };

  const handleSearch = async () => {
    await searchForFirstSelection();
  };

  const handleCustomSearch = async () => {
    if (!customSearchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search query');
      return;
    }
    await searchWithCustomQuery(customSearchQuery.trim());
  };

  const toggleSearchMode = () => {
    setShowCustomSearch(!showCustomSearch);
    setCustomSearchQuery('');
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open the link');
    });
  };

  const handleUpgradePress = () => {
    router.push('/subscription');
  };

  const renderContent = () => {
    return (
      <>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Animated.Text style={[styles.headerTitle, Platform.OS === 'web' ? { color: '#ff6b6b' } : { color: animatedColor }]}>
                <Text>Fun of Symbols</Text>
              </Animated.Text>
              <Text style={styles.headerSubtitle}>
                Compare symbols across different domains
              </Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/subscription')}
            >
              <Settings size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <UsageIndicator onUpgradePress={handleUpgradePress} />

        <View style={styles.content}>
        <View style={styles.selectionSection}>
          <Text style={styles.sectionTitle}>Select Shapes to Compare</Text>
          
          <View style={styles.randomContainer}>
            <Animated.View style={[
              styles.selectionBox1,
              Platform.OS === 'web' ? {
                transform: [{ rotate: '-8deg' }]
              } : {
                transform: [
                  { rotate: '-8deg' },
                  { translateX: box1FloatX.interpolate({
                    inputRange: [-8, 8],
                    outputRange: [7, 23]
                  }) },
                  { translateY: box1FloatY.interpolate({
                    inputRange: [-15, 15],
                    outputRange: [-25, 5]
                  }) },
                  { rotate: box1Rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg']
                  }) }
                ]
              }
            ]}>
              <SelectionDropdown
                options={SHAPE_OPTIONS}
                selectedValue={selection1}
                onSelect={setSelection1}
                placeholder="Choose first shape type"
                disabled={isSearching}
              />
            </Animated.View>

            <Animated.View style={[
              styles.arrowBox,
              Platform.OS === 'web' ? {
                transform: [{ rotate: '25deg' }]
              } : {
                transform: [
                  { rotate: '25deg' },
                  { translateX: arrowFloatX.interpolate({
                    inputRange: [-6, 6],
                    outputRange: [2, 14]
                  }) },
                  { translateY: arrowFloatY.interpolate({
                    inputRange: [-8, 8],
                    outputRange: [7, 23]
                  }) },
                  { rotate: arrowRotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg']
                  }) }
                ]
              }
            ]}>
              <ArrowRight size={24} color="#667eea" />
            </Animated.View>

            <Animated.View style={[
              styles.selectionBox2,
              Platform.OS === 'web' ? {
                transform: [{ rotate: '12deg' }]
              } : {
                transform: [
                  { rotate: '12deg' },
                  { translateX: box2FloatX.interpolate({
                    inputRange: [-10, 10],
                    outputRange: [-30, -10]
                  }) },
                  { translateY: box2FloatY.interpolate({
                    inputRange: [-12, 12],
                    outputRange: [13, 37]
                  }) },
                  { rotate: box2Rotation.interpolate({
                    inputRange: [-360, 0],
                    outputRange: ['-360deg', '0deg']
                  }) }
                ]
              }
            ]}>
              <SelectionDropdown
                options={SHAPE_OPTIONS.filter(option => option !== selection1)}
                selectedValue={selection2}
                onSelect={setSelection2}
                placeholder="Choose second shape type"
                disabled={!selection1 || isSearching}
                compact
              />
            </Animated.View>
          </View>

          <View style={styles.searchSection}>
            {!showCustomSearch ? (
              <View style={styles.searchButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.searchButton, 
                    styles.primarySearchButton,
                    !selection1 && styles.disabledSearchButton
                  ]}
                  onPress={handleSearch}
                  disabled={!selection1 || isSearching}
                >
                  <Search size={20} color={!selection1 ? "#64748b" : "white"} />
                  <Text style={[
                    styles.searchButtonText,
                    !selection1 && styles.disabledSearchButtonText
                  ]}>
                    Auto Search {selection1 || "Shape"}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.searchButton, 
                    styles.secondarySearchButton,
                    !selection1 && styles.disabledSecondarySearchButton
                  ]}
                  onPress={toggleSearchMode}
                  disabled={!selection1 || isSearching}
                >
                  <Edit3 size={20} color={!selection1 ? "#64748b" : "#667eea"} />
                  <Text style={[
                    styles.secondarySearchButtonText,
                    !selection1 && styles.disabledSecondarySearchButtonText
                  ]}>
                    Custom Search
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              selection1 && !searchResults && !isSearching && (
                <View style={styles.customSearchContainer}>
                  <Text style={styles.customSearchLabel}>Enter your search query for {selection1}:</Text>
                  <TextInput
                    style={styles.searchInput}
                    value={customSearchQuery}
                    onChangeText={setCustomSearchQuery}
                    placeholder={`e.g., "Eye of Horus ancient Egyptian symbol"`}
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                  />
                  
                  <View style={styles.customSearchButtons}>
                    <TouchableOpacity
                      style={[styles.searchButton, styles.secondarySearchButton]}
                      onPress={toggleSearchMode}
                    >
                      <Text style={styles.secondarySearchButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.searchButton, styles.smallSearchButton, styles.flexButton]}
                      onPress={handleCustomSearch}
                      disabled={!customSearchQuery.trim()}
                    >
                      <Search size={16} color="white" />
                      <Text style={styles.smallSearchButtonText}>Search Online</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            )}
          </View>

          {isSearching && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.loadingText}>Searching for {selection1}...</Text>
            </View>
          )}
        </View>

        {searchResults && (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsTitle}>
              Search Results for &ldquo;{searchResults.query}&rdquo;
            </Text>
            <Text style={styles.searchResultsSubtitle}>
              Select one result to continue with comparison
            </Text>
          </View>
        )}

        {selectedSearchResult && (
          <View style={styles.selectedResultContainer}>
            <Text style={styles.selectedResultTitle}>Selected Symbol</Text>
            <SearchResult
              result={selectedSearchResult}
              onLinkPress={openLink}
              onImageLoad={() => {
                console.log('Selected symbol image loaded, enabling compare button');
                setSelectedImageLoaded(true);
                setSelectedImageError(false);
              }}
              onImageError={() => {
                console.log('Selected symbol image failed, disabling compare button');
                setSelectedImageLoaded(false);
                setSelectedImageError(true);
              }}
            />
          </View>
        )}

        {canCompare && (
          <Animated.View style={Platform.OS === 'web' ? {} : {
            transform: [
              { translateY: compareButtonFloat },
              { rotate: compareButtonRotation.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg']
              }) }
            ]
          }}>
            <TouchableOpacity
              style={[
                styles.compareButton, 
                (isComparing || !termsAccepted) && styles.compareButtonDisabled
              ]}
              onPress={handleCompare}
              disabled={isComparing || !termsAccepted || !selectedSearchResult || !canCompare || !isImageValid}
            >
              {isComparing ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.compareButtonText}>Comparing...</Text>
                </>
              ) : (
                <>
                  <ArrowRight size={20} color="white" />
                  <Text style={styles.compareButtonText}>
                    {!termsAccepted ? 'Accept Terms to Compare' : 
                     !selectedSearchResult ? 'Select Symbol First' :
                     !isImageValid ? 'Image Loading...' :
                     !selection2 ? 'Select Second Shape' :
                     'Compare Shapes'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {comparisonResult && (
          <ComparisonResult
            result={comparisonResult}
            onLinkPress={openLink}
            onCompareAgain={resetAll}
          />
        )}
        
        {/* Terms and Conditions Section */}
        <Animated.View style={[
          styles.termsSection,
          Platform.OS === 'web' ? {
            transform: [{ rotate: '-2deg' }]
          } : {
            transform: [
              { rotate: '-2deg' },
              { translateX: termsBoxFloat.interpolate({
                inputRange: [-8, 8],
                outputRange: [-16, 0]
              }) },
              { rotate: termsBoxRotation.interpolate({
                inputRange: [-360, 0],
                outputRange: ['-360deg', '0deg']
              }) }
            ]
          }
        ]}>
          <TouchableOpacity
            style={styles.termsCheckboxContainer}
            onPress={() => setTermsAccepted(!termsAccepted)}
          >
            {termsAccepted ? (
              <CheckSquare size={24} color="#10b981" />
            ) : (
              <Square size={24} color="#64748b" />
            )}
            <Text style={styles.termsCheckboxText}>
              I Accept the Terms and Conditions
            </Text>
          </TouchableOpacity>
          
          <Animated.View style={Platform.OS === 'web' ? {} : {
            transform: [
              { translateY: viewTermsFloat },
              { rotate: viewTermsRotation.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg']
              }) }
            ]
          }}>
            <TouchableOpacity
              style={styles.viewTermsButton}
              onPress={() => setShowTermsModal(true)}
            >
              <FileText size={16} color="#667eea" />
              <Text style={styles.viewTermsText}>View Terms</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
        
        {/* Copyright Notice */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>
            Copyright (©) 2024 robotiyee@gmail.com
          </Text>
          <Text style={styles.copyrightSubtext}>
            All rights reserved. Unauthorized copying or distribution is prohibited.
          </Text>
        </View>
        </View>
      </>
    );
  };

  const renderSearchResult = ({ item }: { item: any }) => {
    if (!item) return null;
    const isSelected = selectedSearchResult?.name === item.name;
    
    return (
      <TouchableOpacity
        style={[styles.resultCard, isSelected && styles.selectedCard]}
        onPress={() => setSelectedSearchResult(item)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.resultName}>{item.name}</Text>
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
          )}
        </View>
        
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.resultImage}
            resizeMode="cover"
            onLoad={() => {
              console.log('Image loaded successfully:', item.imageUrl);
            }}
            onError={() => {
              console.log('Image failed to load:', item.imageUrl);
            }}
          />
        ) : (
          <View style={[styles.resultImage, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>Image not available</Text>
          </View>
        )}
        
        <Text style={styles.resultDescription}>{item.description}</Text>
        
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => openLink(item.sourceUrl)}
        >
          <Text style={styles.linkText}>🔗 View Source</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const allData = [
    { type: 'content', data: null },
    ...(searchResults?.results || []).map(result => ({ type: 'searchResult', data: result }))
  ];

  const renderItem = ({ item }: { item: any }) => {
    if (!item) return null;
    if (item.type === 'content') {
      return renderContent();
    } else if (item.type === 'searchResult') {
      return renderSearchResult({ item: item.data });
    }
    return null;
  };

  return (
    <View style={styles.wrapper}>
      <BackgroundDoodles />
      <FlatList
        data={allData}
        renderItem={renderItem}
        keyExtractor={(item, index) => 
          item.type === 'content' ? 'content' : `result-${item.data?.name || index}-${index}`
        }
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
      />
      
      <TermsModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
    zIndex: 2,
  },
  flatListContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
    zIndex: 2,
    backgroundColor: '#000000',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  content: {
    padding: 20,
    backgroundColor: 'transparent',
    position: 'relative',
    zIndex: 2,
  },
  selectionSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 20,
  },
  randomContainer: {
    height: 350,
    position: 'relative',
    marginBottom: 20,
  },
  selectionBox1: {
    position: 'absolute',
    top: 25,
    left: 10,
    width: '85%',
    zIndex: 3,
    borderWidth: 8,
    borderColor: '#ff6b6b',
    borderRadius: 16,
    padding: 4,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  selectionBox2: {
    position: 'absolute',
    top: 180,
    right: 15,
    width: '65%',
    zIndex: 2,
    borderWidth: 8,
    borderColor: '#4ecdc4',
    borderRadius: 16,
    padding: 4,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  arrowBox: {
    position: 'absolute',
    top: 110,
    left: '42%',
    zIndex: 1,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    padding: 16,
    borderRadius: 25,
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 6,
    borderColor: '#ffd93d',
  },
  selectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 8,
  },
  searchSection: {
    gap: 16,
  },
  searchButtonsContainer: {
    gap: 12,
    position: 'relative',
    height: 120,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  primarySearchButton: {
    backgroundColor: '#667eea',
    borderRadius: 35,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 25,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 3,
    paddingVertical: 28,
    paddingHorizontal: 40,
    paddingLeft: 24,
    paddingRight: 50,
    transform: [{ skewX: '-8deg' }, { rotate: '3deg' }],
    minWidth: 220,
    maxWidth: 280,
    position: 'absolute',
    top: -60,
    left: 20,
    borderWidth: 8,
    borderColor: '#a78bfa',
  },
  secondarySearchButton: {
    backgroundColor: 'white',
    borderWidth: 8,
    borderColor: '#f97316',
    borderRadius: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 26,
    paddingTop: 8,
    paddingBottom: 18,
    transform: [{ rotate: '-4deg' }, { skewY: '2deg' }],
    minWidth: 140,
    maxWidth: 200,
    position: 'absolute',
    top: 60,
    right: 15,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondarySearchButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  customSearchContainer: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 8,
    borderColor: '#8b5cf6',
  },
  customSearchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  searchInput: {
    borderWidth: 6,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    minHeight: 80,
    backgroundColor: '#000000',
  },
  customSearchButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  flexButton: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
  },
  compareButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 36,
    paddingLeft: 20,
    paddingRight: 45,
    paddingTop: 18,
    paddingBottom: 28,
    borderRadius: 40,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 6,
    marginVertical: 20,
    gap: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    transform: [{ skewY: '-2deg' }, { rotate: '-4deg' }, { skewX: '3deg' }, { translateX: -25 }],
    minWidth: 200,
    maxWidth: 280,
    alignSelf: 'flex-start',
    marginLeft: 30,
    borderWidth: 8,
    borderColor: '#34d399',
  },
  compareButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  compareButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedResultContainer: {
    marginBottom: 20,
  },
  selectedResultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  termsSection: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 16,
    position: 'relative',
    borderWidth: 8,
    borderColor: '#ec4899',
  },
  termsCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  termsCheckboxText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    flex: 1,
  },
  viewTermsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    paddingLeft: 14,
    paddingRight: 30,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: '#000000',
    borderRadius: 22,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 2,
    borderWidth: 8,
    borderColor: '#06b6d4',
    gap: 10,
    transform: [{ rotate: '8deg' }, { skewX: '-2deg' }, { translateX: 15 }],
    minWidth: 120,
    maxWidth: 160,
    alignSelf: 'flex-end',
  },
  viewTermsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#667eea',
  },
  copyrightSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  copyrightText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  copyrightSubtext: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 16,
  },
  searchResultsContainer: {
    marginBottom: 20,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  searchResultsSubtitle: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 16,
    borderWidth: 8,
    borderColor: '#f97316',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  selectedCard: {
    borderColor: '#a78bfa',
    backgroundColor: '#333333',
    borderWidth: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  selectedBadge: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f1f5f9',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  placeholderText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  resultDescription: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
    marginBottom: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  smallSearchButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 6,
    borderColor: '#a78bfa',
  },
  smallSearchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledSearchButton: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
    opacity: 0.6,
  },
  disabledSearchButtonText: {
    color: '#9ca3af',
  },
  disabledSecondarySearchButton: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    opacity: 0.6,
  },
  disabledSecondarySearchButtonText: {
    color: '#9ca3af',
  },
});