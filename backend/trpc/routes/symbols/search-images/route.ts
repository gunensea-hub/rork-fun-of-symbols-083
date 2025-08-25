import { z } from 'zod';
import { publicProcedure } from '../../../create-context';

const searchImagesInput = z.object({
  symbolName: z.string(),
  symbolDescription: z.string(),
  category: z.string(),
});

const searchImagesOutput = z.object({
  images: z.array(z.object({
    url: z.string(),
    description: z.string(),
    source: z.string(),
    relevanceScore: z.number(),
  })),
  aiDefinition: z.string(),
});

export const searchImagesProcedure = publicProcedure
  .input(searchImagesInput)
  .output(searchImagesOutput)
  .query(async ({ input }: { input: { symbolName: string; symbolDescription: string; category: string } }) => {
    const { symbolName, symbolDescription, category } = input;
    
    try {
      console.log('Searching for images:', { symbolName, symbolDescription, category });
      
      // Use AI to search for relevant images and provide definition
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an expert image curator and symbol researcher. Given a symbol name, description, and category, you need to:

1. Find 3-5 highly relevant, high-quality image URLs for the symbol
2. Provide an enhanced AI-generated definition of the symbol

For images, prioritize REAL, WORKING URLs from:
- Wikipedia Commons (upload.wikimedia.org) - these are most reliable
- Unsplash with specific search terms (images.unsplash.com)
- Educational websites (.edu domains)
- Museum collections
- NASA images (for astronomical symbols)
- Scientific databases

IMPORTANT: Only provide URLs that are likely to work. For astronomical symbols, use NASA or space agency images. For chemical symbols, use educational or scientific sources.

For each image, provide:
- url: Direct image URL that will actually load (prefer .jpg, .png)
- description: What the image shows
- source: Source website/database
- relevanceScore: 1-100 how relevant the image is

For the AI definition:
- Provide a comprehensive, accurate description
- Include historical context, meaning, usage
- Explain significance in its domain
- Keep it informative but accessible

Return JSON format:
{
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "description": "Description of what the image shows",
      "source": "Wikipedia Commons",
      "relevanceScore": 95
    }
  ],
  "aiDefinition": "Comprehensive definition here..."
}`
            },
            {
              role: 'user',
              content: `Find relevant images and provide an enhanced definition for:

Symbol: ${symbolName}
Description: ${symbolDescription}
Category: ${category}

Find the most accurate and relevant images for this specific symbol. Focus on finding REAL, WORKING image URLs. For astronomical objects, use NASA or space agency sources. For chemical formulas, use educational sources. Return only valid JSON.`
            }
          ]
        })
      });

      if (!response.ok) {
        console.error('AI API error:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('AI API response received:', !!data.completion);
      
      if (!data.completion) {
        throw new Error('No completion in response');
      }
      
      let result;
      try {
        // Clean the completion text
        let cleanCompletion = data.completion.trim();
        if (cleanCompletion.startsWith('```json')) {
          cleanCompletion = cleanCompletion.replace(/```json\s*/, '').replace(/```\s*$/, '');
        } else if (cleanCompletion.startsWith('```')) {
          cleanCompletion = cleanCompletion.replace(/```\s*/, '').replace(/```\s*$/, '');
        }
        
        console.log('Parsing AI response...');
        result = JSON.parse(cleanCompletion);
        console.log('AI response parsed successfully, images found:', result.images?.length || 0);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw completion:', data.completion);
        throw new Error('Invalid JSON response format');
      }
      
      // Validate and filter results
      const validImages = (result.images || []).filter((img: any) => {
        const isValid = img.url && img.description && img.source && typeof img.relevanceScore === 'number';
        if (!isValid) {
          console.log('Invalid image filtered out:', img);
        }
        return isValid;
      });
      
      console.log('Valid images after filtering:', validImages.length);
      
      // Add fallback images if no valid images found
      let finalImages = validImages.slice(0, 5);
      
      if (finalImages.length === 0) {
        console.log('No valid images from AI, using fallback images');
        finalImages = getFallbackImages(symbolName, category);
      }
      
      return {
        images: finalImages,
        aiDefinition: result.aiDefinition || symbolDescription
      };
    } catch (error) {
      console.error('Image search error:', error);
      
      // Fallback response with curated images
      const fallbackImages = getFallbackImages(symbolName, category);
      
      return {
        images: fallbackImages,
        aiDefinition: symbolDescription
      };
    }
  });

// Fallback images function
function getFallbackImages(symbolName: string, category: string) {
  const name = symbolName.toLowerCase();
  
  // Specific high-quality images for common symbols
  const specificImages: { [key: string]: any[] } = {
    'messier 13': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Messier_13_Hubble_WikiSky.jpg/512px-Messier_13_Hubble_WikiSky.jpg',
        description: 'Hubble Space Telescope image of Messier 13 (Hercules Globular Cluster)',
        source: 'Wikipedia Commons',
        relevanceScore: 98
      },
      {
        url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=512&h=512&fit=crop&auto=format&q=80',
        description: 'Star cluster in deep space',
        source: 'Unsplash',
        relevanceScore: 85
      }
    ],
    'hercules globular cluster': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Messier_13_Hubble_WikiSky.jpg/512px-Messier_13_Hubble_WikiSky.jpg',
        description: 'Hubble Space Telescope image of Messier 13 (Hercules Globular Cluster)',
        source: 'Wikipedia Commons',
        relevanceScore: 98
      }
    ],
    'water': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Water_molecule_3D.svg/256px-Water_molecule_3D.svg.png',
        description: '3D model of water molecule (H2O)',
        source: 'Wikipedia Commons',
        relevanceScore: 95
      }
    ],
    'h2o': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Water_molecule_3D.svg/256px-Water_molecule_3D.svg.png',
        description: '3D model of water molecule (H2O)',
        source: 'Wikipedia Commons',
        relevanceScore: 95
      }
    ]
  };
  
  // Check for specific matches
  for (const [key, images] of Object.entries(specificImages)) {
    if (name.includes(key) || key.includes(name)) {
      return images;
    }
  }
  
  // Category-based fallbacks
  if (category.includes('star') || name.includes('star') || name.includes('cluster') || name.includes('galaxy')) {
    return [
      {
        url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=512&h=512&fit=crop&auto=format&q=80',
        description: 'Beautiful star cluster in deep space',
        source: 'Unsplash',
        relevanceScore: 80
      },
      {
        url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=512&h=512&fit=crop&auto=format&q=80',
        description: 'Stellar formation and cosmic structures',
        source: 'Unsplash',
        relevanceScore: 75
      }
    ];
  }
  
  if (category.includes('chemical') || name.includes('molecule') || name.includes('formula')) {
    return [
      {
        url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=512&h=512&fit=crop&auto=format&q=80',
        description: 'Molecular structure and chemical bonds',
        source: 'Unsplash',
        relevanceScore: 80
      }
    ];
  }
  
  if (category.includes('ancient') || name.includes('ancient') || name.includes('symbol')) {
    return [
      {
        url: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=512&h=512&fit=crop&auto=format&q=80',
        description: 'Ancient symbols and hieroglyphic inscriptions',
        source: 'Unsplash',
        relevanceScore: 80
      }
    ];
  }
  
  // Default fallback
  return [
    {
      url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=512&h=512&fit=crop&auto=format&q=80',
      description: 'Abstract symbol and pattern',
      source: 'Unsplash',
      relevanceScore: 70
    }
  ];
}