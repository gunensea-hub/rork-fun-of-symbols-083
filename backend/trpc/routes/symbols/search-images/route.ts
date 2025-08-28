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
        console.log('🤖 Starting AI search for:', { symbolName, category });
        const response = await fetch('https://toolkit.rork.com/text/llm/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: `You are an expert symbol researcher and historian. Provide comprehensive information about symbols with detailed explanations, historical context, and reliable sources.

RULES:
1. ONLY use verified Wikipedia Commons URLs: https://upload.wikimedia.org/wikipedia/commons/
2. Provide REAL symbols that actually exist with historical accuracy
3. Include detailed explanations with historical context, meaning, and usage
4. Add reliable source links (Wikipedia, Encyclopedia Britannica, academic sources)
5. Use high relevance scores (90-100) for exact matches
6. Format descriptions like encyclopedia entries with rich detail

For "${category}" category, find specific examples:
- Star clusters: Messier 13, Pleiades, Orion Nebula, Helix Nebula, Crab Nebula
- Chemical formulas: H2O, CO2, CH4, NaCl, NH3
- Ancient symbols: Eye of Horus, Ankh, Ouroboros, Yin Yang, Pentagram
- Atomic structures: Hydrogen atom, Bohr model, Carbon orbitals
- Star maps: Orion, Ursa Major, Cassiopeia, Leo, Draco

Return format:
{
  "images": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/...",
      "description": "Symbol Name - Comprehensive description with historical context, meaning, usage, and cultural significance. Include details about origins, symbolism, and common sources like Encyclopedia Britannica, academic references, etc.",
      "source": "https://en.wikipedia.org/wiki/...",
      "relevanceScore": 95
    }
  ],
  "aiDefinition": "Comprehensive definition with historical and cultural context"
}`
              },
              {
                role: 'user',
                content: `Find comprehensive information about "${symbolName}" with detailed explanation like an encyclopedia entry. Include:

1. REAL Wikipedia Commons image URL (https://upload.wikimedia.org/wikipedia/commons/...)
2. Comprehensive explanation with historical context, meaning, and cultural significance
3. Origins, mythology, and usage throughout history
4. Common sources and references (Encyclopedia Britannica, academic sources, etc.)
5. Source links to Wikipedia or reliable educational sources

Symbol context: ${symbolDescription}
Category: ${category}

Provide rich, detailed descriptions like this example:
{
  "images": [{
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Eye_of_Horus_bw.svg/512px-Eye_of_Horus_bw.svg.png",
    "description": "Eye of Horus - Ancient Egyptian symbol of protection, royal power, and good health. Also known as the wedjat, udjat, or Wadjet, it represents the eye of the falcon-headed god Horus. According to Egyptian mythology, Horus lost his left eye in a battle with Set, but it was magically restored by Thoth. This restoration came to symbolize rejuvenation and wholeness. The Eye was popularly used in amulets, funerary art, and temple decorations to invoke its protective and healing powers. Common sources: Encyclopedia Britannica, Egypt Tours Portal, Wikipedia, Ancient History Encyclopedia.",
    "source": "https://en.wikipedia.org/wiki/Eye_of_Horus",
    "relevanceScore": 100
  }],
  "aiDefinition": "The Eye of Horus (wedjat) is one of the most recognizable symbols from ancient Egypt, representing protection, healing, restoration, and royal power. It appears frequently in Egyptian mythology and was commonly used as a protective amulet throughout ancient Egyptian civilization."
}

Provide similar comprehensive detail for the requested symbol.`
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
                         img.relevanceScore >= 80 && // Lower threshold
                         (img.url.includes('wikimedia.org') || img.url.includes('upload.wikimedia.org'));
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
        description: 'Eye of Horus - Ancient Egyptian symbol of protection, royal power, and good health. Also known as the wedjat, udjat, or Wadjet, it represents the eye of the falcon-headed god Horus. According to Egyptian mythology, Horus lost his left eye in a battle with Set, but it was magically restored—often by the gods Hathor or Thoth. This restoration came to symbolize rejuvenation and wholeness. The Eye was popularly used in amulets, funerary art, and temple decorations to invoke its protective and healing powers. Common sources: Encyclopedia Britannica, Egypt Tours Portal, Wikipedia, Ancient History Encyclopedia.',
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
        description: 'Ankh - Ancient Egyptian symbol of life, also known as the key of life or the key of the Nile. It represents the concept of eternal life and was often carried by Egyptian gods and pharaohs in hieroglyphic depictions. The symbol combines a cross with a loop at the top, symbolizing the union of opposites and the eternal cycle of life and death. In Egyptian art, gods are often shown holding the ankh to someone\'s lips, symbolizing the breath of life. The ankh was also used in Christian Coptic art as a symbol of eternal life through Christ. Common sources: Encyclopedia Britannica, Ancient History Encyclopedia, Wikipedia, Egyptology studies.',
        source: 'https://en.wikipedia.org/wiki/Ankh',
        relevanceScore: 100
      }
    ],
    'ouroboros': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Serpiente_alquimica.jpg/512px-Serpiente_alquimica.jpg',
        description: 'Ouroboros - Ancient symbol depicting a serpent or dragon eating its own tail, representing the eternal cycle of life, death, and rebirth. The symbol appears in various cultures including ancient Egypt, Greece, and Norse mythology. In alchemy, it represents the cyclical nature of the universe and the unity of all things. The ouroboros symbolizes self-reflexivity, eternal return, and the idea that the end is the beginning. It has been used in Gnosticism, Hermeticism, and modern psychology (Carl Jung) to represent the integration of opposites. Common sources: Encyclopedia Britannica, Mythology studies, Wikipedia, Alchemical texts.',
        source: 'https://en.wikipedia.org/wiki/Ouroboros',
        relevanceScore: 100
      }
    ],
    'yin yang': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Yin_yang.svg/512px-Yin_yang.svg.png',
        description: 'Yin Yang - Ancient Chinese symbol representing the concept of dualism in Chinese philosophy, describing how seemingly opposite forces may actually be complementary and interconnected in the natural world. Yin (dark) represents femininity, passivity, darkness, and earth, while Yang (light) represents masculinity, activity, light, and heaven. The symbol shows that within each force lies the seed of its opposite, illustrating the dynamic balance of all existence. Central to Taoism and traditional Chinese medicine, it emphasizes harmony and the interdependence of opposites. Common sources: Encyclopedia Britannica, Chinese Philosophy texts, Wikipedia, Taoist literature.',
        source: 'https://en.wikipedia.org/wiki/Yin_and_yang',
        relevanceScore: 100
      }
    ],
    'pentagram': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Pentagram_green.svg/512px-Pentagram_green.svg.png',
        description: 'Pentagram - Ancient five-pointed star symbol with deep mathematical and spiritual significance. Used by the Pythagoreans as a symbol of mathematical perfection and the golden ratio, it represents the five elements (earth, air, fire, water, spirit) in various traditions. In Christianity, it symbolized the five wounds of Christ, while in medieval times it was used as a protective symbol against evil. The pentagram appears in Islamic art, Jewish mysticism (Kabbalah), and modern Wiccan practices. Its geometric properties include the golden ratio and perfect proportions found throughout nature. Common sources: Encyclopedia Britannica, Mathematical studies, Wikipedia, Religious symbolism texts.',
        source: 'https://en.wikipedia.org/wiki/Pentagram',
        relevanceScore: 100
      }
    ],
    'water molecule': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Water_molecule_3D.svg/256px-Water_molecule_3D.svg.png',
        description: 'Water Molecule (H2O) - The most essential compound for life on Earth, consisting of two hydrogen atoms covalently bonded to one oxygen atom. The molecule exhibits a bent molecular geometry with a bond angle of approximately 104.5° due to the two lone pairs of electrons on oxygen. This unique angular structure gives water its polar properties, enabling it to dissolve many ionic and polar substances, earning it the title "universal solvent." Water\'s ability to form hydrogen bonds leads to its unique properties: high boiling point, surface tension, and its role in biological processes. Essential for all known forms of life and covering about 71% of Earth\'s surface. Common sources: Chemistry textbooks, NIST database, Wikipedia, Scientific journals.',
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
        description: 'Carbon Dioxide (CO2) - A linear triatomic molecule consisting of one carbon atom double-bonded to two oxygen atoms. This colorless gas is naturally present in Earth\'s atmosphere and is essential for photosynthesis in plants. CO2 has a linear molecular geometry with bond angles of 180°, making it a nonpolar molecule despite the polar C=O bonds. It plays a crucial role in the carbon cycle, greenhouse effect, and climate regulation. Produced by cellular respiration, combustion, and volcanic activity, while consumed by plants during photosynthesis. Currently a major focus in climate science due to its role as a greenhouse gas. Common sources: Environmental science textbooks, NOAA, Wikipedia, Climate research papers.',
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
        description: 'Orion Constellation - One of the most recognizable constellations in the night sky, named after the hunter in Greek mythology. Located on the celestial equator, Orion is visible worldwide and contains some of the brightest stars including Betelgeuse (red supergiant) and Rigel (blue supergiant). The constellation features the famous "Orion\'s Belt" - three aligned stars (Alnitak, Alnilam, and Mintaka) that have served as navigation aids throughout history. Orion contains the Orion Nebula (M42), a stellar nursery where new stars are born. The constellation has been recognized by virtually every culture, with variations in mythology from the Greek hunter to the Lakota Hand constellation. Common sources: Astronomy textbooks, NASA, Wikipedia, Star atlases.',
        source: 'https://en.wikipedia.org/wiki/Orion_(constellation)',
        relevanceScore: 100
      }
    ],
    'pleiades': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Pleiades_large.jpg/512px-Pleiades_large.jpg',
        description: 'Pleiades Star Cluster (Seven Sisters) - An open star cluster containing hot B-type stars formed from the same molecular cloud approximately 100 million years ago. Located in the constellation Taurus, the cluster is among the nearest star clusters to Earth at about 444 light-years away. While called the "Seven Sisters" after the seven daughters of Atlas in Greek mythology, the cluster actually contains over 1,000 stars. The brightest stars are easily visible to the naked eye and have been recognized by cultures worldwide - known as Subaru in Japan, Matariki in Māori culture, and the Seven Stars in various traditions. The cluster is surrounded by reflection nebulae, creating the beautiful blue haze visible in photographs. Common sources: Astronomy textbooks, NASA, Wikipedia, Stellar catalogs.',
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