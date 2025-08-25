import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { ExternalLink, Check, ImageIcon, RefreshCw } from 'lucide-react-native';
import { SearchResultsType, SearchResultType } from '@/hooks/useShapeComparison';
import { trpc } from '@/lib/trpc';



const getSymbolImages = (name: string): string[] => {
  // Generate symbol-specific images based on the name and category
  const symbolKeywords = name.toLowerCase();
  
  // Specific images for common chemical formulas
  const specificImages: { [key: string]: string[] } = {
    'water': [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Water_molecule_3D.svg/256px-Water_molecule_3D.svg.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Water-2D-flat.png/256px-Water-2D-flat.png'
    ],
    'h2o': [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Water_molecule_3D.svg/256px-Water_molecule_3D.svg.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Water-2D-flat.png/256px-Water-2D-flat.png'
    ],
    'carbon dioxide': [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Carbon-dioxide-3D-vdW.png/256px-Carbon-dioxide-3D-vdW.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Carbon-dioxide-2D.svg/256px-Carbon-dioxide-2D.svg.png'
    ],
    'co2': [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Carbon-dioxide-3D-vdW.png/256px-Carbon-dioxide-3D-vdW.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Carbon-dioxide-2D.svg/256px-Carbon-dioxide-2D.svg.png'
    ],
    'methane': [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Methane-CRC-MW-3D-balls.png/256px-Methane-CRC-MW-3D-balls.png'
    ],
    'ch4': [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Methane-CRC-MW-3D-balls.png/256px-Methane-CRC-MW-3D-balls.png'
    ],
    'ouroboros': [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Serpiente_alquimica.jpg/256px-Serpiente_alquimica.jpg'
    ]
  };
  
  // Check for specific matches first
  for (const [key, images] of Object.entries(specificImages)) {
    if (symbolKeywords.includes(key)) {
      return images;
    }
  }
  
  // Curated image collections for different symbol types
  const symbolImages = {
    // Star and astronomy related
    star: [
      'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=300&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=400&h=300&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=300&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&auto=format&q=80'
    ],
    // Ancient and historical symbols
    ancient: [
      'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=400&h=300&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1471919743851-c4df8b6ee133?w=400&h=300&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=300&fit=crop&auto=format&q=80'
    ],
    // Chemical and scientific symbols
    chemical: [
      'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=300&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=400&h=300&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=400&h=300&fit=crop&auto=format&q=80'
    ],
    // Atomic and molecular structures
    atomic: [
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=400&h=300&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&h=300&fit=crop&auto=format&q=80'
    ],
    // General symbols and patterns
    symbol: [
      'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=300&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1578662015928-3dae4c2f8f82?w=400&h=300&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop&auto=format&q=80'
    ]
  };
  
  // Determine which image set to use based on symbol name
  if (symbolKeywords.includes('star') || symbolKeywords.includes('constellation') || symbolKeywords.includes('galaxy')) {
    return symbolImages.star;
  } else if (symbolKeywords.includes('ancient') || symbolKeywords.includes('egyptian') || symbolKeywords.includes('hieroglyph') || symbolKeywords.includes('rune')) {
    return symbolImages.ancient;
  } else if (symbolKeywords.includes('chemical') || symbolKeywords.includes('formula') || symbolKeywords.includes('molecule')) {
    return symbolImages.chemical;
  } else if (symbolKeywords.includes('atomic') || symbolKeywords.includes('atom') || symbolKeywords.includes('electron') || symbolKeywords.includes('nucleus')) {
    return symbolImages.atomic;
  } else {
    return symbolImages.symbol;
  }
};

interface SearchResultItemProps {
  item: SearchResultType;
  isSelected: boolean;
  onSelectResult: (result: SearchResultType) => void;
  onLinkPress: (url: string) => void;
}

function SearchResultItem({ item, isSelected, onSelectResult, onLinkPress }: SearchResultItemProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [originalImageFailed, setOriginalImageFailed] = useState(false);
  const [allImagesFailed, setAllImagesFailed] = useState(false);
  const [useAiImages, setUseAiImages] = useState(false);

  // AI-powered image search with dynamic category detection
  const getSymbolCategory = (name: string, description: string): string => {
    const text = (name + ' ' + description).toLowerCase();
    if (text.includes('star') || text.includes('constellation') || text.includes('galaxy') || text.includes('nebula')) {
      return 'star clusters';
    } else if (text.includes('chemical') || text.includes('molecule') || text.includes('h2o') || text.includes('co2') || text.includes('formula')) {
      return 'chemical formula symbol';
    } else if (text.includes('atom') || text.includes('electron') || text.includes('nucleus') || text.includes('orbital')) {
      return 'atomic structure symbol';
    } else {
      return 'ancient symbols';
    }
  };

  const aiImageSearch = trpc.symbols.searchImages.useQuery(
    {
      symbolName: item.name,
      symbolDescription: item.description,
      category: getSymbolCategory(item.name, item.description)
    },
    {
      enabled: true, // Always enabled to get curated results
      staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    }
  );

  const symbolImages = getSymbolImages(item.name);
  const currentImageUrl = symbolImages[currentImageIndex];
  
  // Determine which image to use - prioritize AI curated images
  let imageUrlToUse = item.imageUrl;
  
  // Always prefer AI curated images if available
  if (aiImageSearch.data?.images && aiImageSearch.data.images.length > 0) {
    const aiImageIndex = Math.min(currentImageIndex, aiImageSearch.data.images.length - 1);
    const aiImage = aiImageSearch.data.images[aiImageIndex];
    if (aiImage) {
      imageUrlToUse = aiImage.url;
    }
  } else if (originalImageFailed) {
    // Fallback to curated images only if original failed and no AI images
    imageUrlToUse = currentImageUrl;
  }

  const handleImageError = () => {
    console.log('List item image failed to load:', imageUrlToUse);
    console.log('Is original image:', imageUrlToUse === item.imageUrl);
    console.log('Original image failed flag:', originalImageFailed);
    console.log('Using AI images:', useAiImages);
    
    // If the original imageUrl failed, try AI images first
    if (imageUrlToUse === item.imageUrl && !originalImageFailed && !useAiImages) {
      console.log('Original list item image failed, trying AI images');
      setOriginalImageFailed(true);
      setUseAiImages(true);
      return;
    }
    
    // If using AI images, try next AI image
    if (useAiImages && aiImageSearch.data?.images) {
      const nextIndex = currentImageIndex + 1;
      console.log(`Trying next AI image for list item: ${nextIndex}/${aiImageSearch.data.images.length}`);
      if (nextIndex < aiImageSearch.data.images.length) {
        setCurrentImageIndex(nextIndex);
        return;
      }
    }
    
    // Try next curated image
    const nextIndex = currentImageIndex + 1;
    console.log(`Trying next curated image for list item: ${nextIndex}/${symbolImages.length}`);
    if (nextIndex < symbolImages.length) {
      setCurrentImageIndex(nextIndex);
    } else {
      console.log('All list item images failed, showing placeholder');
      setAllImagesFailed(true);
    }
  };

  const handleRefreshImages = () => {
    setCurrentImageIndex(0);
    setOriginalImageFailed(false);
    setAllImagesFailed(false);
    setUseAiImages(true);
    aiImageSearch.refetch();
  };
  
  return (
    <TouchableOpacity
      style={[styles.resultCard, isSelected && styles.selectedCard]}
      onPress={() => onSelectResult(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.resultName}>{item.name}</Text>
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Check size={16} color="white" />
          </View>
        )}
      </View>
      
      {!allImagesFailed ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrlToUse }}
            style={styles.resultImage}
            resizeMode="cover"
            onLoad={() => {
              console.log('List item image loaded successfully:', imageUrlToUse);
            }}
            onError={handleImageError}
          />
          
          {/* AI Image Search Button */}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefreshImages}
            disabled={aiImageSearch.isLoading}
          >
            {aiImageSearch.isLoading ? (
              <ActivityIndicator size="small" color="#667eea" />
            ) : (
              <RefreshCw size={12} color="#667eea" />
            )}
          </TouchableOpacity>
          
          {/* Image source indicator */}
          {aiImageSearch.data?.images && aiImageSearch.data.images.length > 0 && (
            <View style={styles.imageSourceBadge}>
              <Text style={styles.imageSourceText}>
                {aiImageSearch.data.images[currentImageIndex]?.source === 'AI Generated' ? '🤖' : '✓'}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.resultImage, styles.imagePlaceholder]}>
          <ImageIcon size={32} color="#666" />
          <Text style={styles.placeholderText}>Image not available</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRefreshImages}
            disabled={aiImageSearch.isLoading}
          >
            <Text style={styles.retryButtonText}>
              {aiImageSearch.isLoading ? 'Searching...' : 'Try AI'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <Text style={styles.resultDescription}>{item.description}</Text>
      
      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => onLinkPress(item.sourceUrl)}
      >
        <ExternalLink size={16} color="#667eea" />
        <Text style={styles.linkText}>View Source</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

interface SearchResultsListProps {
  searchResults: SearchResultsType;
  selectedResult: SearchResultType | null;
  onSelectResult: (result: SearchResultType) => void;
  onLinkPress: (url: string) => void;
}

export function SearchResultsList({ 
  searchResults, 
  selectedResult, 
  onSelectResult, 
  onLinkPress 
}: SearchResultsListProps) {
  const renderSearchResult = ({ item }: { item: SearchResultType }) => {
    const isSelected = selectedResult?.name === item.name;
    
    return (
      <SearchResultItem
        item={item}
        isSelected={isSelected}
        onSelectResult={onSelectResult}
        onLinkPress={onLinkPress}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Search Results for &ldquo;{searchResults.query}&rdquo;
      </Text>
      <Text style={styles.subtitle}>
        Select one result to continue with comparison
      </Text>
      
      <FlatList
        data={searchResults.results}
        renderItem={renderSearchResult}
        keyExtractor={(item) => item.name}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 16,
  },
  listContainer: {
    gap: 16,
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
  imageContainer: {
    position: 'relative',
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
    fontSize: 12,
    marginTop: 4,
  },
  refreshButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  imageSourceBadge: {
    position: 'absolute',
    bottom: 16,
    left: 4,
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imageSourceText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#667eea',
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
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
});