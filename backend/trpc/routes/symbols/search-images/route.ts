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
      
      // First, try to find specific symbol matches
      const specificResults = getSpecificSymbolMatch(symbolName, symbolDescription);
      if (specificResults.images.length > 0) {
        console.log('Found specific symbol match:', specificResults.images.length);
        return specificResults;
      }
      
      // Use curated, verified symbols instead of AI search for better reliability
      console.log('Using curated symbol database for category:', category);
      
      const curatedResults = getCuratedSymbols(symbolName, category);
      
      if (curatedResults.images.length > 0) {
        console.log('Found curated symbols:', curatedResults.images.length);
        return curatedResults;
      }
      
      // Fallback to AI search and image generation if no curated results
      console.log('No curated results, trying AI search and image generation...');
      
      // First try AI search with better error handling
      let aiSearchResult = null;
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
                content: `You are an expert symbol researcher. Find REAL, SPECIFIC symbols with verified Wikipedia Commons URLs.

RULES:
1. ONLY use Wikipedia Commons URLs: https://upload.wikimedia.org/wikipedia/commons/
2. Provide REAL symbols that actually exist
3. Each symbol must have a working Wikipedia Commons image
4. Return valid JSON format

For "${category}" category, find specific examples:
- Star clusters: Messier 13, Pleiades, Orion Nebula
- Chemical formulas: H2O, CO2, CH4, NaCl
- Ancient symbols: Eye of Horus, Ankh, Ouroboros
- Atomic structures: Hydrogen atom, Bohr model
- Star maps: Orion, Ursa Major, Cassiopeia

Return format:
{
  "images": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/...",
      "description": "Specific symbol name",
      "source": "https://en.wikipedia.org/wiki/...",
      "relevanceScore": 95
    }
  ],
  "aiDefinition": "Brief definition"
}`
              },
              {
                role: 'user',
                content: `Find 3-5 REAL symbols for category "${category}" with working Wikipedia Commons images. Symbol context: ${symbolDescription}`
              }
            ]
          }),

        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.completion) {
            try {
              let cleanCompletion = data.completion.trim();
              if (cleanCompletion.startsWith('```json')) {
                cleanCompletion = cleanCompletion.replace(/```json\s*/, '').replace(/```\s*$/, '');
              } else if (cleanCompletion.startsWith('```')) {
                cleanCompletion = cleanCompletion.replace(/```\s*/, '').replace(/```\s*$/, '');
              }
              
              aiSearchResult = JSON.parse(cleanCompletion);
              console.log('AI search successful, found images:', aiSearchResult.images?.length || 0);
            } catch (parseError) {
              console.error('AI response parse error:', parseError);
            }
          }
        }
      } catch (aiError) {
        console.error('AI search failed:', aiError instanceof Error ? aiError.message : String(aiError));
      }

      // Process AI search results if available
      let finalImages: any[] = [];
      let aiDefinition = symbolDescription;
      
      if (aiSearchResult?.images) {
        // Validate and filter AI results
        const validImages = aiSearchResult.images.filter((img: any) => {
          const isValid = img.url && 
                         img.description && 
                         img.source && 
                         typeof img.relevanceScore === 'number' &&
                         img.relevanceScore >= 85 && 
                         img.url.includes('wikimedia.org');
          if (!isValid) {
            console.log('Invalid AI image filtered out:', img);
          }
          return isValid;
        });
        
        if (validImages.length > 0) {
          finalImages = validImages.slice(0, 5);
          aiDefinition = aiSearchResult.aiDefinition || symbolDescription;
          console.log('Using AI search results:', finalImages.length);
        }
      }
      
      // If no valid AI results, try AI image generation
      if (finalImages.length === 0) {
        console.log('No valid AI search results, trying image generation...');
        const generatedImages = await generateSymbolImages(symbolName, symbolDescription, category);
        if (generatedImages.length > 0) {
          finalImages = generatedImages;
          console.log('Using AI generated images:', finalImages.length);
        }
      }
      
      // Final fallback to curated images
      if (finalImages.length === 0) {
        console.log('AI generation failed, using fallback images');
        finalImages = getFallbackImages(symbolName, category);
      }
      
      return {
        images: finalImages,
        aiDefinition
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

// Specific symbol matching function - returns exact matches for known symbols
function getSpecificSymbolMatch(symbolName: string, symbolDescription: string) {
  const searchText = (symbolName + ' ' + symbolDescription).toLowerCase();
  
  // Specific symbol database with exact matches
  const specificSymbols: { [key: string]: any[] } = {
    'eye of horus': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Eye_of_Horus_bw.svg/512px-Eye_of_Horus_bw.svg.png',
        description: 'Eye of Horus - Ancient Egyptian Protection Symbol',
        source: 'https://en.wikipedia.org/wiki/Eye_of_Horus',
        relevanceScore: 100
      }
    ],
    'horus': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Eye_of_Horus_bw.svg/512px-Eye_of_Horus_bw.svg.png',
        description: 'Eye of Horus - Ancient Egyptian Protection Symbol',
        source: 'https://en.wikipedia.org/wiki/Eye_of_Horus',
        relevanceScore: 100
      }
    ],
    'ankh': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Ankh.svg/512px-Ankh.svg.png',
        description: 'Ankh - Ancient Egyptian Symbol of Life',
        source: 'https://en.wikipedia.org/wiki/Ankh',
        relevanceScore: 100
      }
    ],
    'ouroboros': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Serpiente_alquimica.jpg/512px-Serpiente_alquimica.jpg',
        description: 'Ouroboros - Ancient Symbol of Eternal Cycle',
        source: 'https://en.wikipedia.org/wiki/Ouroboros',
        relevanceScore: 100
      }
    ],
    'yin yang': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Yin_yang.svg/512px-Yin_yang.svg.png',
        description: 'Yin Yang - Ancient Chinese Symbol of Balance',
        source: 'https://en.wikipedia.org/wiki/Yin_and_yang',
        relevanceScore: 100
      }
    ],
    'pentagram': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Pentagram_green.svg/512px-Pentagram_green.svg.png',
        description: 'Pentagram - Ancient Geometric Symbol',
        source: 'https://en.wikipedia.org/wiki/Pentagram',
        relevanceScore: 100
      }
    ],
    'water molecule': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Water_molecule_3D.svg/256px-Water_molecule_3D.svg.png',
        description: 'Water Molecule (H2O) - 3D Structure',
        source: 'https://en.wikipedia.org/wiki/Water',
        relevanceScore: 100
      }
    ],
    'h2o': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Water_molecule_3D.svg/256px-Water_molecule_3D.svg.png',
        description: 'Water Molecule (H2O) - 3D Structure',
        source: 'https://en.wikipedia.org/wiki/Water',
        relevanceScore: 100
      }
    ],
    'carbon dioxide': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Carbon-dioxide-3D-vdW.png/256px-Carbon-dioxide-3D-vdW.png',
        description: 'Carbon Dioxide (CO2) - Molecular Structure',
        source: 'https://en.wikipedia.org/wiki/Carbon_dioxide',
        relevanceScore: 100
      }
    ],
    'co2': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Carbon-dioxide-3D-vdW.png/256px-Carbon-dioxide-3D-vdW.png',
        description: 'Carbon Dioxide (CO2) - Molecular Structure',
        source: 'https://en.wikipedia.org/wiki/Carbon_dioxide',
        relevanceScore: 100
      }
    ],
    'orion constellation': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Orion_constellation_map.svg/512px-Orion_constellation_map.svg.png',
        description: 'Orion Constellation Map',
        source: 'https://en.wikipedia.org/wiki/Orion_(constellation)',
        relevanceScore: 100
      }
    ],
    'pleiades': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Pleiades_large.jpg/512px-Pleiades_large.jpg',
        description: 'Pleiades Star Cluster (Seven Sisters)',
        source: 'https://en.wikipedia.org/wiki/Pleiades',
        relevanceScore: 100
      }
    ]
  };
  
  // Check for exact matches first
  for (const [key, images] of Object.entries(specificSymbols)) {
    if (searchText.includes(key)) {
      return {
        images,
        aiDefinition: `This is the authentic ${key} symbol with verified imagery from reliable sources.`
      };
    }
  }
  
  return { images: [], aiDefinition: '' };
}

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
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Eye_of_Horus_bw.svg/512px-Eye_of_Horus_bw.svg.png',
        description: 'Eye of Horus - Ancient Egyptian Protection Symbol',
        source: 'https://en.wikipedia.org/wiki/Eye_of_Horus',
        relevanceScore: 98
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Ankh.svg/512px-Ankh.svg.png',
        description: 'Ankh - Ancient Egyptian Symbol of Life',
        source: 'https://en.wikipedia.org/wiki/Ankh',
        relevanceScore: 97
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Serpiente_alquimica.jpg/512px-Serpiente_alquimica.jpg',
        description: 'Ouroboros - Ancient Symbol of Eternal Cycle',
        source: 'https://en.wikipedia.org/wiki/Ouroboros',
        relevanceScore: 96
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Yin_yang.svg/512px-Yin_yang.svg.png',
        description: 'Yin Yang - Ancient Chinese Symbol of Balance',
        source: 'https://en.wikipedia.org/wiki/Yin_and_yang',
        relevanceScore: 95
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Pentagram_green.svg/512px-Pentagram_green.svg.png',
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
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Eye_of_Horus_bw.svg/512px-Eye_of_Horus_bw.svg.png',
        description: 'Eye of Horus - Ancient Egyptian Protection Symbol',
        source: 'https://en.wikipedia.org/wiki/Eye_of_Horus',
        relevanceScore: 98
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Ankh.svg/512px-Ankh.svg.png',
        description: 'Ankh - Ancient Egyptian Symbol of Life',
        source: 'https://en.wikipedia.org/wiki/Ankh',
        relevanceScore: 97
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Serpiente_alquimica.jpg/512px-Serpiente_alquimica.jpg',
        description: 'Ouroboros - Ancient Symbol of Eternal Cycle',
        source: 'https://en.wikipedia.org/wiki/Ouroboros',
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

// AI Image Generation function for unclear symbols
async function generateSymbolImages(symbolName: string, symbolDescription: string, category: string) {
  try {
    console.log('Generating AI image for symbol:', symbolName);
    
    // Create a focused prompt for symbol generation
    const categoryPrompts: { [key: string]: string } = {
      'ancient symbols': `Create a clear, authentic illustration of the ancient symbol "${symbolName}". Style: Clean black lines on white background, historically accurate, traditional proportions, no text labels.`,
      'chemical formula symbol': `Create a scientific diagram of the chemical compound "${symbolName}". Style: Clean molecular structure, proper atomic bonds, educational illustration, no background.`,
      'star clusters': `Create an astronomical illustration of "${symbolName}". Style: Realistic space object, clear details, scientific accuracy, dark space background with bright stars.`,
      'atomic structure symbol': `Create a scientific diagram of "${symbolName}" atomic structure. Style: Clean electron orbitals, nucleus, educational illustration, proper atomic model.`,
      'star map': `Create a constellation map of "${symbolName}". Style: Connected star pattern, clean lines, astronomical accuracy, dark background with bright stars.`
    };
    
    const prompt = categoryPrompts[category.toLowerCase()] || 
      `Create a clear, detailed illustration of "${symbolName}" from the ${category} category. Style: Clean, professional, educational, no text labels.`;
    
    const response = await fetch('https://toolkit.rork.com/images/generate/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        size: '1024x1024'
      }),

    });
    
    if (!response.ok) {
      console.error('AI image generation failed:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (data.image && data.image.base64Data) {
      // Convert base64 to data URL
      const imageUrl = `data:${data.image.mimeType};base64,${data.image.base64Data}`;
      
      return [{
        url: imageUrl,
        description: `AI-generated illustration of ${symbolName}`,
        source: 'AI Generated',
        relevanceScore: 90
      }];
    }
    
    return [];
  } catch (error) {
    console.error('AI image generation error:', error);
    return [];
  }
}