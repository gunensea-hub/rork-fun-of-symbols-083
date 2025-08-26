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
  
  // Specific images for common symbols with verified Wikipedia URLs
  const specificImages: { [key: string]: string[] } = {
    'eye of horus': [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Eye_of_Horus_bw.svg/512px-Eye_of_Horus_bw.svg.png'
    ],
    'horus': [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Eye_of_Horus_bw.svg/512px-Eye_of_Horus_bw.svg.png'
    ],
    'ankh': [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Ankh.svg/512px-Ankh.svg.png'
    ],
    'water': [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Water_molecule_3D.svg/512px-Water_molecule_3D.svg.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Water-2D-flat.png/512px-Water-2D-flat.png'
    ],
    'h2o': [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Water_molecule_3D.svg/512px-Water_molecule_3D.svg.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Water-2D-flat.png/512px-Water-2D-flat.png'
    ],
    'carbon dioxide': [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Carbon-dioxide-3D-vdW.png/512px-Carbon-dioxide-3D-vdW.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Carbon-dioxide-2D.svg/512px-Carbon-dioxide-2D.svg.png'
    ],
    'co2': [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Carbon-dioxide-3D-vdW.png/512px-Carbon-dioxide-3D-vdW.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Carbon-dioxide-2D.svg/512px-Carbon-dioxide-2D.svg.png'
    ],
    'methane': [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Methane-CRC-MW-3D-balls.png/512px-Methane-CRC-MW-3D-balls.png'
    ],
    'ch4': [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Methane-CRC-MW-3D-balls.png/512px-Methane-CRC-MW-3D-balls.png'
    ],
    'ouroboros': [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Serpiente_alquimica.jpg/512px-Serpiente_alquimica.jpg'
    ],
    'orion': [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Orion_constellation_map.svg/512px-Orion_constellation_map.svg.png'
    ],
    'pleiades': [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Pleiades_large.jpg/512px-Pleiades_large.jpg'
    ]
  };
  
  // Check for specific matches first
  for (const [key, images] of Object.entries(specificImages)) {
    if (symbolKeywords.includes(key)) {
      return images;
    }
  }
  
  // Verified Wikipedia Commons images for different symbol types
  const symbolImages = {
    // Star and astronomy related - verified Wikipedia images
    star: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Orion_constellation_map.svg/512px-Orion_constellation_map.svg.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Pleiades_large.jpg/512px-Pleiades_large.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Messier_13_Hubble_WikiSky.jpg/512px-Messier_13_Hubble_WikiSky.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Ursa_Major_constellation_map.svg/512px-Ursa_Major_constellation_map.svg.png'
    ],
    // Ancient and historical symbols - verified Wikipedia images
    ancient: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Eye_of_Horus_bw.svg/512px-Eye_of_Horus_bw.svg.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Ankh.svg/512px-Ankh.svg.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Serpiente_alquimica.jpg/512px-Serpiente_alquimica.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Yin_yang.svg/512px-Yin_yang.svg.png'
    ],
    // Chemical and scientific symbols - verified Wikipedia images
    chemical: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Water_molecule_3D.svg/512px-Water_molecule_3D.svg.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Carbon-dioxide-3D-vdW.png/512px-Carbon-dioxide-3D-vdW.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Methane-CRC-MW-3D-balls.png/512px-Methane-CRC-MW-3D-balls.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Sodium-chloride-3D-ionic.png/512px-Sodium-chloride-3D-ionic.png'
    ],
    // Atomic and molecular structures - verified Wikipedia images
    atomic: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Hydrogen_Density_Plots.png/512px-Hydrogen_Density_Plots.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Stylised_atom_with_three_Bohr_model_orbits_and_stylised_nucleus.svg/512px-Stylised_atom_with_three_Bohr_model_orbits_and_stylised_nucleus.svg.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Carbon_orbitals.png/512px-Carbon_orbitals.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Electron_shell_008_Oxygen.svg/512px-Electron_shell_008_Oxygen.svg.png'
    ],
    // General symbols and patterns - verified Wikipedia images
    symbol: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Pentagram_green.svg/512px-Pentagram_green.svg.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Yin_yang.svg/512px-Yin_yang.svg.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Ankh.svg/512px-Ankh.svg.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Eye_of_Horus_bw.svg/512px-Eye_of_Horus_bw.svg.png'
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
  const [useAiImages, setUseAiImages] = useState(false); // Start with original image, then fallback to AI
  const [aiDefinition, setAiDefinition] = useState<string>('');

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
      symbolName: result.name,
      symbolDescription: result.description,
      category: getSymbolCategory(result.name, result.description)
    },
    {
      enabled: true, // Always enabled to get curated results
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes (shorter for better refresh)
      refetchOnMount: false, // Don't refetch on mount to avoid unnecessary calls
      refetchOnWindowFocus: false, // Don't refetch on window focus
    }
  );

  const symbolImages = getSymbolImages(result.name);
  const currentImageUrl = symbolImages[currentImageIndex];
  
  // Determine which image to use - prioritize AI curated images
  let imageUrlToUse = result.imageUrl;
  let imageDescription = result.description;
  let imageSource = 'Original Source';
  
  // Use AI curated images if enabled or original failed
  if (useAiImages && aiImageSearch.data?.images && aiImageSearch.data.images.length > 0) {
    const aiImageIndex = Math.min(currentImageIndex, aiImageSearch.data.images.length - 1);
    const aiImage = aiImageSearch.data.images[aiImageIndex];
    if (aiImage) {
      imageUrlToUse = aiImage.url;
      imageDescription = aiImage.description;
      imageSource = aiImage.source;
    }
  } else if (originalImageFailed && !useAiImages) {
    // Fallback to curated images only if original failed and not using AI
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
    
    // If the original imageUrl failed, mark it as failed and try curated images first
    if (imageUrlToUse === result.imageUrl && !originalImageFailed) {
      console.log('Original selected symbol image failed, trying curated images first');
      setOriginalImageFailed(true);
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
    
    // Try next curated image or switch to AI
    const nextIndex = currentImageIndex + 1;
    if (!useAiImages && nextIndex < symbolImages.length) {
      console.log(`Trying next curated image for selected symbol: ${nextIndex}/${symbolImages.length}`);
      setCurrentImageIndex(nextIndex);
    } else if (!useAiImages) {
      console.log('All curated images failed, switching to AI-verified images');
      setUseAiImages(true);
      setCurrentImageIndex(0);
      aiImageSearch.refetch();
    } else {
      console.log('All selected symbol images failed, showing placeholder');
      setAllImagesFailed(true);
      onImageError?.(); // Notify parent that all images failed
    }
  };

  const handleRefreshImages = async () => {
    console.log('🔄 Refreshing images for selected symbol - switching to AI verification');
    console.log('Current state:', { currentImageIndex, originalImageFailed, allImagesFailed, useAiImages });
    
    // Reset all states for fresh AI verification
    setCurrentImageIndex(0);
    setOriginalImageFailed(false);
    setAllImagesFailed(false);
    setUseAiImages(true);
    
    // Force refetch the AI search with fresh data
    console.log('🤖 Triggering AI image search refetch...');
    try {
      await aiImageSearch.refetch();
      console.log('✅ AI image search refetch completed');
    } catch (error) {
      console.error('❌ AI image search refetch failed:', error);
    }
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
              style={[
                styles.refreshButton,
                aiImageSearch.isLoading && styles.refreshButtonLoading
              ]}
              onPress={handleRefreshImages}
              disabled={aiImageSearch.isLoading}
              testID="ai-refresh-button"
            >
              {aiImageSearch.isLoading ? (
                <ActivityIndicator size="small" color="#667eea" />
              ) : (
                <RefreshCw size={16} color="#667eea" />
              )}
            </TouchableOpacity>
            
            {/* Image source indicator */}
            {useAiImages && aiImageSearch.data?.images && aiImageSearch.data.images.length > 0 && (
              <View style={styles.imageSourceBadge}>
                <Text style={styles.imageSourceText}>
                  {aiImageSearch.data.images[Math.min(currentImageIndex, aiImageSearch.data.images.length - 1)]?.source === 'AI Generated' ? '🤖 AI' : '✓ Verified'}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <ImageIcon size={48} color="#666" />
            <Text style={styles.placeholderText}>Image not available</Text>
            <TouchableOpacity
              style={[
                styles.retryButton,
                aiImageSearch.isLoading && styles.retryButtonLoading
              ]}
              onPress={handleRefreshImages}
              disabled={aiImageSearch.isLoading}
              testID="ai-verify-generate-button"
            >
              {aiImageSearch.isLoading && (
                <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.retryButtonText}>
                {aiImageSearch.isLoading ? 'AI Verifying...' : '🤖 AI Verify & Generate'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.content}>
          <Text style={styles.name}>{result.name}</Text>
          <Text style={styles.description}>
            {aiDefinition || result.description}
          </Text>
          
          {/* Show image info if available */}
          {aiImageSearch.data?.images && aiImageSearch.data.images.length > 0 && (
            <View style={styles.aiImageInfo}>
              <Text style={styles.aiImageInfoText}>
                {aiImageSearch.data.images[currentImageIndex]?.source === 'AI Generated' ? 'AI Generated' : 'Verified'} symbol ({currentImageIndex + 1} of {aiImageSearch.data.images.length})
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
  refreshButtonLoading: {
    opacity: 0.7,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  retryButtonLoading: {
    opacity: 0.8,
    backgroundColor: '#5a67d8',
    flexDirection: 'row',
    alignItems: 'center',
  },
});