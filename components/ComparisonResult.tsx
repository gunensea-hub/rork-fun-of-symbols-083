import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ExternalLink, Zap, RotateCcw, ImageIcon, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ComparisonResultType } from '@/hooks/useShapeComparison';
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
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Serpiente_alquimica.jpg/256px-Serpiente_alquimica.jpg',
      'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=400&h=300&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1471919743851-c4df8b6ee133?w=400&h=300&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=300&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop&auto=format&q=80'
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

interface ComparisonResultProps {
  result: ComparisonResultType;
  onLinkPress: (url: string) => void;
  onCompareAgain: () => void;
}

export function ComparisonResult({ result, onLinkPress, onCompareAgain }: ComparisonResultProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [originalImageFailed, setOriginalImageFailed] = useState(false);
  const [allImagesFailed, setAllImagesFailed] = useState(false);
  const [useAiImages, setUseAiImages] = useState(true); // Start with AI images enabled
  const [aiDefinition, setAiDefinition] = useState<string>('');

  // AI-powered image search for the matched symbol
  const aiImageSearch = trpc.symbols.searchImages.useQuery(
    {
      symbolName: result.targetName,
      symbolDescription: result.targetDescription,
      category: 'symbol'
    },
    {
      enabled: useAiImages,
      staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    }
  );

  const symbolImages = getSymbolImages(result.targetName);
  const currentImageUrl = symbolImages[currentImageIndex];
  
  // Determine which image to use
  let imageUrlToUse = result.targetImageUrl;
  if (originalImageFailed || useAiImages) {
    if (aiImageSearch.data?.images && aiImageSearch.data.images.length > 0) {
      const aiImageIndex = Math.min(currentImageIndex, aiImageSearch.data.images.length - 1);
      imageUrlToUse = aiImageSearch.data.images[aiImageIndex]?.url || currentImageUrl;
    } else {
      imageUrlToUse = currentImageUrl;
    }
  }

  // Update AI definition when available
  useEffect(() => {
    if (aiImageSearch.data?.aiDefinition) {
      setAiDefinition(aiImageSearch.data.aiDefinition);
    }
  }, [aiImageSearch.data?.aiDefinition]);

  const handleImageError = () => {
    console.log('Target image failed to load:', imageUrlToUse);
    console.log('Is original image:', imageUrlToUse === result.targetImageUrl);
    console.log('Original image failed flag:', originalImageFailed);
    console.log('Using AI images:', useAiImages);
    
    // If the original targetImageUrl failed, mark it as failed
    if (imageUrlToUse === result.targetImageUrl && !originalImageFailed) {
      console.log('Original target image failed, switching to AI images');
      setOriginalImageFailed(true);
      return;
    }
    
    // If using AI images, try next AI image
    if (useAiImages && aiImageSearch.data?.images) {
      const nextIndex = currentImageIndex + 1;
      console.log(`Trying next AI image for target: ${nextIndex}/${aiImageSearch.data.images.length}`);
      if (nextIndex < aiImageSearch.data.images.length) {
        setCurrentImageIndex(nextIndex);
        return;
      }
    }
    
    // Try next curated image
    const nextIndex = currentImageIndex + 1;
    console.log(`Trying next curated image: ${nextIndex}/${symbolImages.length}`);
    if (nextIndex < symbolImages.length) {
      setCurrentImageIndex(nextIndex);
    } else {
      console.log('All images failed, showing placeholder');
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
  
  const getSimilarityColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getSimilarityLabel = (score: number) => {
    if (score >= 80) return 'High Similarity';
    if (score >= 60) return 'Moderate Similarity';
    return 'Low Similarity';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#10b981', '#059669']}
        style={styles.header}
      >
        <Zap size={24} color="white" />
        <Text style={styles.headerTitle}>Connection Found!</Text>
      </LinearGradient>

      <View style={styles.resultCard}>
        <View style={styles.connectionSection}>
          <Text style={styles.connectionTitle}>Connection</Text>
          <Text style={styles.connectionText}>{result.connection}</Text>
        </View>

        <View style={styles.targetSection}>
          <Text style={styles.targetTitle}>Matched Symbol</Text>
          
          {!allImagesFailed ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: imageUrlToUse }}
                style={styles.targetImage}
                resizeMode="cover"
                onLoad={() => {
                  console.log('Target image loaded successfully:', imageUrlToUse);
                  setAllImagesFailed(false);
                  setOriginalImageFailed(false);
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
              {useAiImages && aiImageSearch.data?.images && (
                <View style={styles.imageSourceBadge}>
                  <Text style={styles.imageSourceText}>AI Enhanced</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.targetImage, styles.imagePlaceholder]}>
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
          
          <Text style={styles.targetName}>{result.targetName}</Text>
          <Text style={styles.targetDescription}>
            {aiDefinition || result.targetDescription}
          </Text>
          
          {/* Show AI image info if available */}
          {useAiImages && aiImageSearch.data?.images && aiImageSearch.data.images.length > 0 && (
            <View style={styles.aiImageInfo}>
              <Text style={styles.aiImageInfoText}>
                Showing AI-curated image ({currentImageIndex + 1} of {aiImageSearch.data.images.length})
              </Text>
              {aiImageSearch.data.images[currentImageIndex]?.description && (
                <Text style={styles.aiImageDescription}>
                  {aiImageSearch.data.images[currentImageIndex].description}
                </Text>
              )}
            </View>
          )}
          
          {result.targetUrl && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => onLinkPress(result.targetUrl)}
            >
              <ExternalLink size={16} color="#667eea" />
              <Text style={styles.linkText}>Learn More</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.similaritySection}>
          <View style={styles.similarityHeader}>
            <Text style={styles.similarityTitle}>Similarity Score</Text>
            <View
              style={[
                styles.scoreBadge,
                { backgroundColor: getSimilarityColor(result.similarityScore) },
              ]}
            >
              <Text style={styles.scoreText}>{result.similarityScore}%</Text>
            </View>
          </View>
          <Text style={[
            styles.similarityLabel,
            { color: getSimilarityColor(result.similarityScore) }
          ]}>
            {getSimilarityLabel(result.similarityScore)}
          </Text>
        </View>

        <View style={styles.explanationSection}>
          <Text style={styles.explanationTitle}>Why They&apos;re Connected</Text>
          <Text style={styles.explanationText}>{result.explanation}</Text>
        </View>

        <TouchableOpacity
          style={styles.compareAgainButton}
          onPress={onCompareAgain}
        >
          <RotateCcw size={20} color="white" />
          <Text style={styles.compareAgainText}>Compare Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  resultCard: {
    backgroundColor: '#000000',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 8,
    borderColor: '#06b6d4',
    borderTopWidth: 0,
  },
  connectionSection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  connectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  connectionText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
  },
  targetSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  targetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  targetImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
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
    bottom: 24,
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
    marginBottom: 8,
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
    textAlign: 'center',
  },
  aiImageDescription: {
    color: '#ffffff',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  targetName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  targetDescription: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 12,
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
  similaritySection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  similarityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  similarityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  similarityLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  explanationSection: {
    marginBottom: 24,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
  },
  compareAgainButton: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 8,
    gap: 8,
    marginTop: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ rotate: '2deg' }],
    borderWidth: 8,
    borderColor: '#a78bfa',
  },
  compareAgainText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});