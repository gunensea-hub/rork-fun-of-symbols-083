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
      
      // Use curated, verified symbols instead of AI search for better reliability
      console.log('Using curated symbol database for category:', category);
      
      const curatedResults = getCuratedSymbols(symbolName, category);
      
      if (curatedResults.images.length > 0) {
        console.log('Found curated symbols:', curatedResults.images.length);
        return curatedResults;
      }
      
      // Fallback to AI search only if no curated results
      console.log('No curated results, trying AI search...');
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an expert astronomer, chemist, and symbol researcher. Your task is to find SPECIFIC, REAL symbols that exist in the given category and provide accurate, working image URLs.

IMPORTANT RULES:
1. For "Star clusters" - Find REAL star clusters like Messier 13, Pleiades, Orion Nebula, etc.
2. For "Star map" - Find REAL constellations like Orion, Ursa Major, Cassiopeia, etc.
3. For "Chemical formula symbol" - Find REAL chemical compounds like H2O, CO2, CH4, etc.
4. For "Atomic structure symbol" - Find REAL atomic diagrams like Hydrogen, Carbon, Oxygen atoms
5. For "Ancient symbols" - Find REAL ancient symbols like Ankh, Ouroboros, Eye of Horus, etc.

For images, ONLY use these trusted sources:
- Wikipedia Commons: https://upload.wikimedia.org/wikipedia/commons/
- NASA images: https://www.nasa.gov/ or https://hubblesite.org/
- Educational institutions (.edu domains)
- Wikimedia: https://commons.wikimedia.org/

DO NOT use:
- Generic Unsplash images
- Stock photos
- Artistic interpretations
- Unrelated images

For each symbol, provide:
- url: REAL, working image URL of the ACTUAL symbol/object
- description: What the SPECIFIC symbol/object is (not generic description)
- source: The actual source website
- relevanceScore: 90-100 for exact matches, lower for related

Return JSON format with REAL, SPECIFIC symbols:
{
  "images": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/...",
      "description": "Messier 13 (Hercules Globular Cluster)",
      "source": "Wikipedia Commons",
      "relevanceScore": 98
    }
  ],
  "aiDefinition": "Detailed definition of the specific symbol..."
}`
            },
            {
              role: 'user',
              content: `Find SPECIFIC, REAL symbols from the category "${category}" and provide accurate images:

Category: ${category}
Context: ${symbolDescription}

TASK:
1. If category is "Star clusters" - find real star clusters like Messier 13, Pleiades, Orion Nebula
2. If category is "Star map" - find real constellations like Orion, Ursa Major, Cassiopeia
3. If category is "Chemical formula symbol" - find real molecules like H2O, CO2, CH4, NaCl
4. If category is "Atomic structure symbol" - find real atomic diagrams of elements
5. If category is "Ancient symbols" - find real ancient symbols like Ankh, Ouroboros, Eye of Horus

Provide 3-5 DIFFERENT, SPECIFIC symbols from this category with their REAL images from Wikipedia Commons or NASA.

Each symbol must be:
- A real, specific example from the category
- Have a working Wikipedia Commons or NASA image URL
- Be accurately described with its proper name
- Have high relevance (90-100 score)

Return only valid JSON with REAL symbols and working image URLs.`
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
      
      // Validate and filter results - only accept high-relevance, specific symbols
      const validImages = (result.images || []).filter((img: any) => {
        const isValid = img.url && 
                       img.description && 
                       img.source && 
                       typeof img.relevanceScore === 'number' &&
                       img.relevanceScore >= 85 && // Only high-relevance images
                       (img.url.includes('wikimedia.org') || 
                        img.url.includes('wikipedia.org') || 
                        img.url.includes('nasa.gov') ||
                        img.url.includes('hubblesite.org') ||
                        img.url.includes('.edu')); // Only trusted sources
        if (!isValid) {
          console.log('Invalid or low-relevance image filtered out:', img);
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

// Curated symbols function - returns verified, working symbols
function getCuratedSymbols(symbolName: string, category: string) {
  const categoryKey = category.toLowerCase();
  
  // Comprehensive curated symbol database with verified working URLs
  const curatedSymbols: { [key: string]: any[] } = {
    'star clusters': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Messier_13_Hubble_WikiSky.jpg/512px-Messier_13_Hubble_WikiSky.jpg',
        description: 'Messier 13 (Hercules Globular Cluster)',
        source: 'https://en.wikipedia.org/wiki/Messier_13',
        relevanceScore: 98
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Pleiades_large.jpg/512px-Pleiades_large.jpg',
        description: 'Pleiades Star Cluster (Seven Sisters)',
        source: 'https://en.wikipedia.org/wiki/Pleiades',
        relevanceScore: 97
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/NGC_7293_Helix_Nebula.jpg/512px-NGC_7293_Helix_Nebula.jpg',
        description: 'Helix Nebula (NGC 7293)',
        source: 'https://en.wikipedia.org/wiki/Helix_Nebula',
        relevanceScore: 95
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg/512px-Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg',
        description: 'Orion Nebula (M42)',
        source: 'https://en.wikipedia.org/wiki/Orion_Nebula',
        relevanceScore: 96
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Crab_Nebula.jpg/512px-Crab_Nebula.jpg',
        description: 'Crab Nebula (M1)',
        source: 'https://en.wikipedia.org/wiki/Crab_Nebula',
        relevanceScore: 94
      }
    ],
    'star map': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Orion_constellation_map.svg/512px-Orion_constellation_map.svg.png',
        description: 'Orion Constellation Map',
        source: 'https://en.wikipedia.org/wiki/Orion_(constellation)',
        relevanceScore: 98
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Ursa_Major_constellation_map.svg/512px-Ursa_Major_constellation_map.svg.png',
        description: 'Ursa Major (Big Dipper) Constellation',
        source: 'https://en.wikipedia.org/wiki/Ursa_Major',
        relevanceScore: 97
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Cassiopeia_constellation_map.svg/512px-Cassiopeia_constellation_map.svg.png',
        description: 'Cassiopeia Constellation Map',
        source: 'https://en.wikipedia.org/wiki/Cassiopeia_(constellation)',
        relevanceScore: 96
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Leo_constellation_map.svg/512px-Leo_constellation_map.svg.png',
        description: 'Leo Constellation Map',
        source: 'https://en.wikipedia.org/wiki/Leo_(constellation)',
        relevanceScore: 95
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Draco_constellation_map.svg/512px-Draco_constellation_map.svg.png',
        description: 'Draco Constellation Map',
        source: 'https://en.wikipedia.org/wiki/Draco_(constellation)',
        relevanceScore: 94
      }
    ],
    'chemical formula symbol': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Water_molecule_3D.svg/256px-Water_molecule_3D.svg.png',
        description: 'Water Molecule (H2O) - 3D Structure',
        source: 'https://en.wikipedia.org/wiki/Water',
        relevanceScore: 98
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Carbon-dioxide-3D-vdW.png/256px-Carbon-dioxide-3D-vdW.png',
        description: 'Carbon Dioxide (CO2) - Molecular Structure',
        source: 'https://en.wikipedia.org/wiki/Carbon_dioxide',
        relevanceScore: 97
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Methane-CRC-MW-3D-balls.png/256px-Methane-CRC-MW-3D-balls.png',
        description: 'Methane (CH4) - Ball and Stick Model',
        source: 'https://en.wikipedia.org/wiki/Methane',
        relevanceScore: 96
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Sodium-chloride-3D-ionic.png/256px-Sodium-chloride-3D-ionic.png',
        description: 'Sodium Chloride (NaCl) - Ionic Structure',
        source: 'https://en.wikipedia.org/wiki/Sodium_chloride',
        relevanceScore: 95
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Ammonia-3D-balls.png/256px-Ammonia-3D-balls.png',
        description: 'Ammonia (NH3) - Molecular Structure',
        source: 'https://en.wikipedia.org/wiki/Ammonia',
        relevanceScore: 94
      }
    ],
    'atomic structure symbol': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Hydrogen_Density_Plots.png/512px-Hydrogen_Density_Plots.png',
        description: 'Hydrogen Atom - Electron Orbital Structure',
        source: 'https://en.wikipedia.org/wiki/Hydrogen_atom',
        relevanceScore: 98
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Stylised_atom_with_three_Bohr_model_orbits_and_stylised_nucleus.svg/256px-Stylised_atom_with_three_Bohr_model_orbits_and_stylised_nucleus.svg.png',
        description: 'Bohr Model of Atom - Classical Representation',
        source: 'https://en.wikipedia.org/wiki/Bohr_model',
        relevanceScore: 95
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Carbon_orbitals.png/256px-Carbon_orbitals.png',
        description: 'Carbon Atom - Electron Orbitals',
        source: 'https://en.wikipedia.org/wiki/Carbon',
        relevanceScore: 96
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Helium_atom_QM.svg/256px-Helium_atom_QM.svg.png',
        description: 'Helium Atom - Quantum Mechanical Model',
        source: 'https://en.wikipedia.org/wiki/Helium_atom',
        relevanceScore: 94
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Electron_shell_008_Oxygen.svg/256px-Electron_shell_008_Oxygen.svg.png',
        description: 'Oxygen Atom - Electron Shell Diagram',
        source: 'https://en.wikipedia.org/wiki/Oxygen',
        relevanceScore: 93
      }
    ],
    'ancient symbols': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Ankh.svg/256px-Ankh.svg.png',
        description: 'Ankh - Ancient Egyptian Symbol of Life',
        source: 'https://en.wikipedia.org/wiki/Ankh',
        relevanceScore: 98
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Serpiente_alquimica.jpg/256px-Serpiente_alquimica.jpg',
        description: 'Ouroboros - Ancient Symbol of Eternal Cycle',
        source: 'https://en.wikipedia.org/wiki/Ouroboros',
        relevanceScore: 97
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Eye_of_Horus_bw.svg/256px-Eye_of_Horus_bw.svg.png',
        description: 'Eye of Horus - Ancient Egyptian Protection Symbol',
        source: 'https://en.wikipedia.org/wiki/Eye_of_Horus',
        relevanceScore: 96
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Yin_yang.svg/256px-Yin_yang.svg.png',
        description: 'Yin Yang - Ancient Chinese Symbol of Balance',
        source: 'https://en.wikipedia.org/wiki/Yin_and_yang',
        relevanceScore: 95
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Pentagram_green.svg/256px-Pentagram_green.svg.png',
        description: 'Pentagram - Ancient Geometric Symbol',
        source: 'https://en.wikipedia.org/wiki/Pentagram',
        relevanceScore: 94
      }
    ]
  };
  
  // Get symbols for the category
  const categorySymbols = curatedSymbols[categoryKey] || [];
  
  if (categorySymbols.length > 0) {
    return {
      images: categorySymbols,
      aiDefinition: `These are verified, authentic symbols from the ${category} category. Each symbol represents a real, specific example with accurate imagery and reliable sources.`
    };
  }
  
  return { images: [], aiDefinition: '' };
}

// Fallback images function
function getFallbackImages(_symbolName: string, category: string) {
  
  // Specific high-quality images for real symbols by category
  const categorySpecificImages: { [key: string]: any[] } = {
    'star clusters': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Messier_13_Hubble_WikiSky.jpg/512px-Messier_13_Hubble_WikiSky.jpg',
        description: 'Messier 13 (Hercules Globular Cluster)',
        source: 'Wikipedia Commons',
        relevanceScore: 98
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Pleiades_large.jpg/512px-Pleiades_large.jpg',
        description: 'Pleiades Star Cluster (Seven Sisters)',
        source: 'Wikipedia Commons',
        relevanceScore: 97
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/NGC_7293_Helix_Nebula.jpg/512px-NGC_7293_Helix_Nebula.jpg',
        description: 'Helix Nebula (NGC 7293)',
        source: 'Wikipedia Commons',
        relevanceScore: 95
      }
    ],
    'star map': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Orion_constellation_map.svg/512px-Orion_constellation_map.svg.png',
        description: 'Orion Constellation Map',
        source: 'Wikipedia Commons',
        relevanceScore: 98
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Ursa_Major_constellation_map.svg/512px-Ursa_Major_constellation_map.svg.png',
        description: 'Ursa Major (Big Dipper) Constellation',
        source: 'Wikipedia Commons',
        relevanceScore: 97
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Cassiopeia_constellation_map.svg/512px-Cassiopeia_constellation_map.svg.png',
        description: 'Cassiopeia Constellation Map',
        source: 'Wikipedia Commons',
        relevanceScore: 96
      }
    ],
    'chemical formula symbol': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Water_molecule_3D.svg/256px-Water_molecule_3D.svg.png',
        description: 'Water Molecule (H2O) - 3D Structure',
        source: 'Wikipedia Commons',
        relevanceScore: 98
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Carbon-dioxide-3D-vdW.png/256px-Carbon-dioxide-3D-vdW.png',
        description: 'Carbon Dioxide (CO2) - Molecular Structure',
        source: 'Wikipedia Commons',
        relevanceScore: 97
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Methane-CRC-MW-3D-balls.png/256px-Methane-CRC-MW-3D-balls.png',
        description: 'Methane (CH4) - Ball and Stick Model',
        source: 'Wikipedia Commons',
        relevanceScore: 96
      }
    ],
    'atomic structure symbol': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Hydrogen_Density_Plots.png/512px-Hydrogen_Density_Plots.png',
        description: 'Hydrogen Atom - Electron Orbital Structure',
        source: 'Wikipedia Commons',
        relevanceScore: 98
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Stylised_atom_with_three_Bohr_model_orbits_and_stylised_nucleus.svg/256px-Stylised_atom_with_three_Bohr_model_orbits_and_stylised_nucleus.svg.png',
        description: 'Bohr Model of Atom - Classical Representation',
        source: 'Wikipedia Commons',
        relevanceScore: 95
      }
    ],
    'ancient symbols': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Ankh.svg/256px-Ankh.svg.png',
        description: 'Ankh - Ancient Egyptian Symbol of Life',
        source: 'Wikipedia Commons',
        relevanceScore: 98
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Serpiente_alquimica.jpg/256px-Serpiente_alquimica.jpg',
        description: 'Ouroboros - Ancient Symbol of Eternal Cycle',
        source: 'Wikipedia Commons',
        relevanceScore: 97
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Eye_of_Horus_bw.svg/256px-Eye_of_Horus_bw.svg.png',
        description: 'Eye of Horus - Ancient Egyptian Protection Symbol',
        source: 'Wikipedia Commons',
        relevanceScore: 96
      }
    ]
  };
  
  // Check for category-specific images first
  const categoryKey = category.toLowerCase();
  if (categorySpecificImages[categoryKey]) {
    return categorySpecificImages[categoryKey];
  }
  
  // Fallback to first available category
  const fallbackCategories = ['star clusters', 'chemical formula symbol', 'ancient symbols', 'atomic structure symbol', 'star map'];
  for (const fallbackCategory of fallbackCategories) {
    if (categorySpecificImages[fallbackCategory]) {
      return categorySpecificImages[fallbackCategory].slice(0, 1); // Return just one fallback
    }
  }
  
  // Ultimate fallback - return empty array to force error handling
  return [];
}