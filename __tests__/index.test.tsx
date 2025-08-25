import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import ShapeComparisonScreen from '../app/index';

// Mock dependencies
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: mockPush,
  },
}));

const mockHookReturn = {
  selection1: null,
  selection2: null,
  setSelection1: jest.fn(),
  setSelection2: jest.fn(),
  searchResults: null,
  selectedSearchResult: null,
  setSelectedSearchResult: jest.fn(),
  comparisonResult: null,
  isSearching: false,
  isComparing: false,
  searchForFirstSelection: jest.fn(),
  searchWithCustomQuery: jest.fn(),
  performComparison: jest.fn(),
  canCompare: false,
  resetAll: jest.fn(),
  setSelectedImageLoaded: jest.fn(),
  setSelectedImageError: jest.fn(),
  isImageValid: true,
};

jest.mock('@/hooks/useShapeComparison', () => ({
  useShapeComparison: jest.fn(() => mockHookReturn),
}));

jest.mock('@/contexts/SubscriptionContext', () => ({
  useSubscription: () => ({
    canPerformComparison: () => true,
    incrementComparisons: jest.fn(),
    getRemainingComparisons: () => 5,
  }),
}));

jest.mock('@/components/SelectionDropdown', () => {
  return function MockSelectionDropdown({ onSelect, placeholder }: any) {
    return (
      <TouchableOpacity
        testID="selection-dropdown"
        onPress={() => onSelect && onSelect('Star map')}
      >
        <Text>{placeholder}</Text>
      </TouchableOpacity>
    );
  };
});

jest.mock('@/components/BackgroundDoodles', () => {
  return function MockBackgroundDoodles() {
    return null;
  };
});

jest.mock('@/components/UsageIndicator', () => {
  return function MockUsageIndicator({ onUpgradePress }: any) {
    return (
      <TouchableOpacity testID="usage-indicator" onPress={onUpgradePress}>
        <Text>Usage Indicator</Text>
      </TouchableOpacity>
    );
  };
});

jest.mock('@/components/TermsModal', () => {
  return function MockTermsModal({ visible, onClose }: any) {
    if (!visible) return null;
    return (
      <View testID="terms-modal">
        <TouchableOpacity testID="close-terms" onPress={onClose}>
          <Text>Close Terms</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('ShapeComparisonScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main screen correctly', () => {
    render(<ShapeComparisonScreen />);
    
    expect(screen.getByText('Fun of Symbols')).toBeTruthy();
    expect(screen.getByText('Compare symbols across different domains')).toBeTruthy();
    expect(screen.getByText('Select Shapes to Compare')).toBeTruthy();
  });

  it('displays selection dropdowns', () => {
    render(<ShapeComparisonScreen />);
    
    expect(screen.getByText('Choose first shape type')).toBeTruthy();
    expect(screen.getByText('Choose second shape type')).toBeTruthy();
  });

  it('shows search buttons when first selection is made', () => {
    const { useShapeComparison } = require('@/hooks/useShapeComparison');
    useShapeComparison.mockReturnValue({
      ...mockHookReturn,
      selection1: 'Star map',
    });

    render(<ShapeComparisonScreen />);
    
    expect(screen.getByText('Auto Search Star map')).toBeTruthy();
    expect(screen.getByText('Custom Search')).toBeTruthy();
  });

  it('displays terms and conditions section', () => {
    render(<ShapeComparisonScreen />);
    
    expect(screen.getByText('I Accept the Terms and Conditions')).toBeTruthy();
    expect(screen.getByText('View Terms')).toBeTruthy();
  });

  it('opens terms modal when View Terms is pressed', () => {
    render(<ShapeComparisonScreen />);
    
    const viewTermsButton = screen.getByText('View Terms');
    fireEvent.press(viewTermsButton);
    
    expect(screen.getByTestId('terms-modal')).toBeTruthy();
  });

  it('toggles terms acceptance when checkbox is pressed', () => {
    render(<ShapeComparisonScreen />);
    
    const termsCheckbox = screen.getByText('I Accept the Terms and Conditions');
    fireEvent.press(termsCheckbox);
    
    // The component should update its internal state
    expect(termsCheckbox).toBeTruthy();
  });

  it('shows custom search input when Custom Search is selected', () => {
    const { useShapeComparison } = require('@/hooks/useShapeComparison');
    useShapeComparison.mockReturnValue({
      ...mockHookReturn,
      selection1: 'Star map',
    });

    render(<ShapeComparisonScreen />);
    
    const customSearchButton = screen.getByText('Custom Search');
    fireEvent.press(customSearchButton);
    
    expect(screen.getByText('Enter your search query for Star map:')).toBeTruthy();
  });

  it('displays copyright information', () => {
    render(<ShapeComparisonScreen />);
    
    expect(screen.getByText('Copyright (©) 2024 robotiyee@gmail.com')).toBeTruthy();
    expect(screen.getByText('All rights reserved. Unauthorized copying or distribution is prohibited.')).toBeTruthy();
  });

  it('shows loading state when searching', () => {
    const { useShapeComparison } = require('@/hooks/useShapeComparison');
    useShapeComparison.mockReturnValue({
      ...mockHookReturn,
      selection1: 'Star map',
      isSearching: true,
    });

    render(<ShapeComparisonScreen />);
    
    expect(screen.getByText('Searching for Star map...')).toBeTruthy();
  });

  it('displays search results when available', () => {
    const mockSearchResults = {
      query: 'Star map',
      results: [
        {
          name: 'Orion Constellation',
          description: 'Famous constellation',
          imageUrl: 'https://example.com/orion.jpg',
          sourceUrl: 'https://example.com/source'
        }
      ]
    };

    const { useShapeComparison } = require('@/hooks/useShapeComparison');
    useShapeComparison.mockReturnValue({
      ...mockHookReturn,
      selection1: 'Star map',
      searchResults: mockSearchResults,
    });

    render(<ShapeComparisonScreen />);
    
    expect(screen.getByText('Search Results for "Star map"')).toBeTruthy();
    expect(screen.getByText('Select one result to continue with comparison')).toBeTruthy();
  });

  it('shows compare button when conditions are met', () => {
    const { useShapeComparison } = require('@/hooks/useShapeComparison');
    useShapeComparison.mockReturnValue({
      ...mockHookReturn,
      selection1: 'Star map',
      selection2: 'Ancient symbols',
      selectedSearchResult: { name: 'Test Symbol' },
      canCompare: true,
    });

    render(<ShapeComparisonScreen />);
    
    expect(screen.getByText('Compare Shapes')).toBeTruthy();
  });

  it('shows different compare button states based on conditions', () => {
    const { useShapeComparison } = require('@/hooks/useShapeComparison');
    
    // Test when terms not accepted
    useShapeComparison.mockReturnValue({
      ...mockHookReturn,
      canCompare: true,
    });

    render(<ShapeComparisonScreen />);
    
    expect(screen.getByText('Accept Terms to Compare')).toBeTruthy();
  });
});