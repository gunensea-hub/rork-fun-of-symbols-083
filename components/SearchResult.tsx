import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ExternalLink, ImageIcon, RefreshCw } from 'lucide-react-native';
import { SearchResultType } from '@/hooks/useShapeComparison';
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
  } else if (symbolKeywords.includes('ancient') || symbolKeywords.includes('egyptian') || symbolKeywords.includes('hieroglyph') || symbolKeywords.includes('rune') || symbolKeywords.includes('serpent') || symbolKeywords.includes('dragon')) {
    return symbolImages.ancient;
  } else if (symbolKeywords.includes('chemical') || symbolKeywords.includes('formula') || symbolKeywords.includes('molecule')) {
    return symbolImages.chemical;
  } else if (symbolKeywords.includes('atomic') || symbolKeywords.includes('atom') || symbolKeywords.includes('electron') || symbolKeywords.includes('nucleus')) {
    return symbolImages.atomic;
  } else {
    return symbolImages.symbol;
  }
};

interface SearchResultProps {
  result: SearchResultType;
  onLinkPress: (url: string) => void;
  onImageLoad?: () => void;
  onImageError?: () => void;
}

export function SearchResult({ result, onLinkPress, onImageLoad, onImageError }: SearchResultProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [originalImageFailed, setOriginalImageFailed] = useState(false);
  const [allImagesFailed, setAllImagesFailed] = useState(false);
  const [useAiImages, setUseAiImages] = useState(true); // Start with AI images enabled
  const [aiDefinition, setAiDefinition] = useState<string>('');

  // AI-powered image search - always enabled for better results
  const aiImageSearch = trpc.symbols.searchImages.useQuery(
    {
      symbolName: result.name,
      symbolDescription: result.description,
      category: 'ancient symbols' // Default to ancient symbols for better results
    },
    {
      enabled: true, // Always enabled to get curated results
      staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    }
  );

  const symbolImages = getSymbolImages(result.name);
  const currentImageUrl = symbolImages[currentImageIndex];
  
  // Determine which image to use - prioritize AI curated images
  let imageUrlToUse = result.imageUrl;
  let imageDescription = result.description;
  let imageSource = 'Original Source';
  
  // Always prefer AI curated images if available
  if (aiImageSearch.data?.images && aiImageSearch.data.images.length > 0) {
    const aiImageIndex = Math.min(currentImageIndex, aiImageSearch.data.images.length - 1);
    const aiImage = aiImageSearch.data.images[aiImageIndex];
    if (aiImage) {
      imageUrlToUse = aiImage.url;
      imageDescription = aiImage.description;
      imageSource = aiImage.source;
    }
  } else if (originalImageFailed) {
    // Fallback to curated images only if original failed and no AI images
    imageUrlToUse = currentImageUrl;
  }

  // Update AI definition when available
  useEffect(() => {
    if (aiImageSearch.data?.aiDefinition) {
      setAiDefinition(aiImageSearch.data.aiDefinition);
    }
  }, [aiImageSearch.data?.aiDefinition]);

  const handleImageError = () => {
    console.log('Selected symbol image failed to load:', imageUrlToUse);
    console.log('Is original image:', imageUrlToUse === result.imageUrl);
    console.log('Original image failed flag:', originalImageFailed);
    console.log('Using AI images:', useAiImages);
    
    // If the original imageUrl failed, mark it as failed and try AI images
    if (imageUrlToUse === result.imageUrl && !originalImageFailed) {
      console.log('Original selected symbol image failed, switching to AI images');
      setOriginalImageFailed(true);
      setUseAiImages(true);
      onImageError?.(); // Notify parent that original image failed
      return;
    }
    
    // If using AI images, try next AI image
    if (useAiImages && aiImageSearch.data?.images) {
      const nextIndex = currentImageIndex + 1;
      console.log(`Trying next AI image for selected symbol: ${nextIndex}/${aiImageSearch.data.images.length}`);
      if (nextIndex < aiImageSearch.data.images.length) {
        setCurrentImageIndex(nextIndex);
        return;
      }
    }
    
    // Try next curated image
    const nextIndex = currentImageIndex + 1;
    console.log(`Trying next curated image for selected symbol: ${nextIndex}/${symbolImages.length}`);
    if (nextIndex < symbolImages.length) {
      setCurrentImageIndex(nextIndex);
    } else {
      console.log('All selected symbol images failed, showing placeholder');
      setAllImagesFailed(true);
      onImageError?.(); // Notify parent that all images failed
    }
  };

  const handleRefreshImages = () => {
    console.log('Refreshing images for selected symbol');
    setCurrentImageIndex(0);
    setOriginalImageFailed(false);
    setAllImagesFailed(false);
    setUseAiImages(true);
    aiImageSearch.refetch();
    onImageError?.(); // Reset parent state while refreshing
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Found Symbol</Text>
      
      <View style={styles.resultCard}>
        {!allImagesFailed ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUrlToUse }}
              style={styles.image}
              resizeMode="cover"
              onLoad={() => {
                console.log('Selected symbol image loaded successfully:', imageUrlToUse);
                setAllImagesFailed(false);
                if (imageUrlToUse === result.imageUrl) {
                  setOriginalImageFailed(false);
                }
                onImageLoad?.(); // Notify parent that image loaded successfully
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
                <RefreshCw size={16} color="#667eea" />
              )}
            </TouchableOpacity>
            
            {/* Image source indicator */}
            {aiImageSearch.data?.images && aiImageSearch.data.images.length > 0 && (
              <View style={styles.imageSourceBadge}>
                <Text style={styles.imageSourceText}>Verified</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <ImageIcon size={48} color="#666" />
            <Text style={styles.placeholderText}>Image not available</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRefreshImages}
              disabled={aiImageSearch.isLoading}
            >
              <Text style={styles.retryButtonText}>
                {aiImageSearch.isLoading ? 'Searching...' : 'Try AI Search'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.content}>
          <Text style={styles.name}>{result.name}</Text>
          <Text style={styles.description}>
            {aiDefinition || result.description}
          </Text>
          
          {/* Show verified image info if available */}
          {aiImageSearch.data?.images && aiImageSearch.data.images.length > 0 && (
            <View style={styles.aiImageInfo}>
              <Text style={styles.aiImageInfoText}>
                Verified symbol ({currentImageIndex + 1} of {aiImageSearch.data.images.length})
              </Text>
              <Text style={styles.aiImageDescription}>
                {imageDescription}
              </Text>
              <Text style={styles.sourceText}>
                Source: {imageSource}
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => {
              // Use AI image source if available, otherwise use original
              const sourceUrl = aiImageSearch.data?.images && aiImageSearch.data.images.length > 0 
                ? aiImageSearch.data.images[currentImageIndex]?.source || result.sourceUrl
                : result.sourceUrl;
              onLinkPress(sourceUrl);
            }}
          >
            <ExternalLink size={16} color="#667eea" />
            <Text style={styles.linkText}>View Source</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    marginBottom: 12,
  },
  resultCard: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 8,
    borderColor: '#10b981',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f1f5f9',
  },
  imageContainer: {
    position: 'relative',
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
  refreshButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  imageSourceBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageSourceText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#667eea',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  aiImageInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  aiImageInfoText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  aiImageDescription: {
    color: '#ffffff',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 4,
  },
  sourceText: {
    color: '#94a3b8',
    fontSize: 10,
    fontStyle: 'italic',
  },
  content: {
    gap: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  description: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
});