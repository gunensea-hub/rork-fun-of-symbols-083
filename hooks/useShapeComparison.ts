import { useState } from 'react';
import { Alert } from 'react-native';
import { trpcClient } from '@/lib/trpc';

export type ShapeOption = 'Star map' | 'Star clusters' | 'Chemical formula symbol' | 'Atomic structure symbol' | 'Ancient symbols';

export interface SearchResultType {
  name: string;
  description: string;
  imageUrl: string;
  sourceUrl: string;
}

export interface SearchResultsType {
  results: SearchResultType[];
  query: string;
}

export interface ComparisonResultType {
  connection: string;
  targetName: string;
  targetDescription: string;
  targetImageUrl: string;
  targetUrl: string;
  similarityScore: number;
  explanation: string;
}

export function useShapeComparison() {
  const [selection1, setSelection1] = useState<ShapeOption | null>(null);
  const [selection2, setSelection2] = useState<ShapeOption | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResultsType | null>(null);
  const [selectedSearchResult, setSelectedSearchResult] = useState<SearchResultType | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResultType | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [selectedImageLoaded, setSelectedImageLoaded] = useState(false);
  const [selectedImageError, setSelectedImageError] = useState(false);

  const canCompare = Boolean(
    selection1 && 
    selection2 && 
    selectedSearchResult && 
    selectedImageLoaded && 
    !selectedImageError && 
    !isSearching && 
    !isComparing &&
    selectedSearchResult.imageUrl && // Ensure image URL exists
    selectedSearchResult.imageUrl.trim() !== '' // Ensure image URL is not empty
  );

  const resetSelections = () => {
    setSelection2(null);
    setSearchResults(null);
    setSelectedSearchResult(null);
    setComparisonResult(null);
    setSelectedImageLoaded(false);
    setSelectedImageError(false);
  };

  const resetAll = () => {
    setSelection1(null);
    setSelection2(null);
    setSearchResults(null);
    setSelectedSearchResult(null);
    setComparisonResult(null);
    setSelectedImageLoaded(false);
    setSelectedImageError(false);
  };

  const handleSelection1Change = (value: ShapeOption | null) => {
    setSelection1(value);
    if (value !== selection1) {
      resetSelections();
    }
  };

  const searchForFirstSelection = async (retryCount = 0): Promise<void> => {
    if (!selection1) return;

    setIsSearching(true);
    
    try {
      console.log('Searching for:', selection1);
      
      const result = await trpcClient.symbols.searchImages.query({
        symbolName: selection1,
        symbolDescription: `Find specific examples from the category: ${selection1}`,
        category: selection1.toLowerCase()
      });
      
      console.log('Search result:', result);
      
      if (!result.images || result.images.length === 0) {
        throw new Error('No results found');
      }
      
      // Convert the tRPC response format to our expected format
      const searchResults = result.images
        .filter(img => img.url && img.description && img.relevanceScore >= 90) // Only high-relevance results
        .map(img => ({
          name: img.description.includes('(') ? 
            img.description.split('(')[0].trim() : // Extract name before parentheses
            img.description.split('.')[0] || 'Unknown Symbol',
          description: img.description,
          imageUrl: img.url,
          sourceUrl: img.source.startsWith('http') ? img.source : `https://en.wikipedia.org/wiki/${encodeURIComponent(img.source)}`
        }));
      
      console.log('Converted search results:', searchResults);
      setSearchResults({
        results: searchResults,
        query: selection1
      });
    } catch (error) {
      console.error('Search error:', error);
      
      if (retryCount < 2) {
        console.log(`Retrying search (attempt ${retryCount + 2}/3)...`);
        await searchForFirstSelection(retryCount + 1);
        return;
      }
      
      Alert.alert(
        'Search Failed',
        'Unable to find information for the selected shape type. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => searchForFirstSelection() }
        ]
      );
    } finally {
      setIsSearching(false);
    }
  };

  const searchWithCustomQuery = async (customQuery: string, retryCount = 0): Promise<void> => {
    if (!customQuery.trim()) return;

    setIsSearching(true);
    
    try {
      console.log('Custom searching for:', customQuery);
      
      const result = await trpcClient.symbols.searchImages.query({
        symbolName: customQuery,
        symbolDescription: customQuery,
        category: (selection1 || 'General').toLowerCase()
      });
      
      console.log('Custom search result:', result);
      
      if (!result.images || result.images.length === 0) {
        throw new Error('No results found');
      }
      
      // Convert the tRPC response format to our expected format
      const searchResults = result.images
        .filter(img => img.url && img.description && img.relevanceScore >= 90) // Only high-relevance results
        .map(img => ({
          name: img.description.includes('(') ? 
            img.description.split('(')[0].trim() : // Extract name before parentheses
            img.description.split('.')[0] || customQuery,
          description: img.description,
          imageUrl: img.url,
          sourceUrl: img.source.startsWith('http') ? img.source : `https://en.wikipedia.org/wiki/${encodeURIComponent(img.source)}`
        }));
      
      console.log('Converted custom search results:', searchResults);
      setSearchResults({
        results: searchResults,
        query: customQuery
      });
    } catch (error) {
      console.error('Custom search error:', error);
      
      if (retryCount < 2) {
        console.log(`Retrying custom search (attempt ${retryCount + 2}/3)...`);
        await searchWithCustomQuery(customQuery, retryCount + 1);
        return;
      }
      
      Alert.alert(
        'Search Failed',
        'Unable to find information for your search query. Please try a different search term.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => searchWithCustomQuery(customQuery) }
        ]
      );
    } finally {
      setIsSearching(false);
    }
  };

  const performComparison = async (): Promise<void> => {
    if (!selection1 || !selection2 || !selectedSearchResult) return;

    setIsComparing(true);
    
    try {
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an expert at finding creative connections between different types of symbols and shapes across various domains. Given a specific symbol from one category and a target category, find a meaningful connection and suggest a specific symbol from the target category.

Provide a JSON response with:
- connection: Brief explanation of the conceptual connection
- targetName: Specific name of the symbol from the target category
- targetDescription: Brief description of the target symbol
- targetImageUrl: Direct image URL from Unsplash (format: https://images.unsplash.com/photo-[ID]?w=400&h=300&fit=crop&crop=center)
- targetUrl: Wikipedia or educational source URL
- similarityScore: Number from 1-100 indicating strength of connection
- explanation: Detailed explanation of why these symbols are connected

Focus on meaningful connections like: visual similarity, symbolic meaning, cultural significance, scientific relationships, or conceptual parallels.`
            },
            {
              role: 'user',
              content: `I have "${selectedSearchResult.name}" from the category "${selection1}". Find a meaningful connection to something in the category "${selection2}". 

Source symbol details:
- Name: ${selectedSearchResult.name}
- Description: ${selectedSearchResult.description}

Target category: ${selection2}

Return only valid JSON with a specific symbol from the target category and explain the connection.`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Comparison API response:', data);
      
      if (!data.completion) {
        throw new Error('No completion in response');
      }
      
      let result;
      try {
        // Clean the completion text - remove any markdown formatting
        let cleanCompletion = data.completion.trim();
        if (cleanCompletion.startsWith('```json')) {
          cleanCompletion = cleanCompletion.replace(/```json\s*/, '').replace(/```\s*$/, '');
        } else if (cleanCompletion.startsWith('```')) {
          cleanCompletion = cleanCompletion.replace(/```\s*/, '').replace(/```\s*$/, '');
        }
        
        console.log('Cleaned completion:', cleanCompletion);
        result = JSON.parse(cleanCompletion);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw completion:', data.completion);
        throw new Error('Invalid JSON response format');
      }
      
      if (!result.connection || !result.targetName || !result.explanation) {
        console.error('Incomplete comparison result:', result);
        throw new Error('Incomplete comparison result - missing required fields');
      }
      
      console.log('Comparison result:', result);
      setComparisonResult(result);
    } catch (error) {
      console.error('Comparison error:', error);
      Alert.alert(
        'Comparison Failed',
        'Unable to find a connection between the selected shapes. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsComparing(false);
    }
  };

  const handleSelectedSearchResultChange = (result: SearchResultType | null) => {
    console.log('Selected search result changed:', result?.name);
    console.log('Image URL:', result?.imageUrl);
    setSelectedSearchResult(result);
    setSelectedImageLoaded(false);
    setSelectedImageError(false);
    setComparisonResult(null); // Clear previous comparison when selecting new result
    
    // Validate image URL immediately
    if (result && (!result.imageUrl || result.imageUrl.trim() === '')) {
      console.warn('Selected result has no valid image URL');
      setSelectedImageError(true);
    }
  };

  return {
    selection1,
    selection2,
    setSelection1: handleSelection1Change,
    setSelection2,
    searchResults,
    selectedSearchResult,
    setSelectedSearchResult: handleSelectedSearchResultChange,
    comparisonResult,
    isSearching,
    isComparing,
    searchForFirstSelection,
    searchWithCustomQuery,
    performComparison,
    canCompare,
    resetAll,
    selectedImageLoaded,
    selectedImageError,
    setSelectedImageLoaded,
    setSelectedImageError,
    // Helper function to validate if image is relevant and loaded
    isImageValid: selectedSearchResult && selectedImageLoaded && !selectedImageError && selectedSearchResult.imageUrl,
  };
}