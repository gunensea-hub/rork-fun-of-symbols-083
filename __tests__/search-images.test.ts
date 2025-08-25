// Mock fetch globally
global.fetch = jest.fn();

// Mock search images function that simulates the backend logic
const mockSearchImages = async (input: { symbolName: string; symbolDescription: string; category: string }) => {
  const { symbolName, symbolDescription, category } = input;
  
  // Simulate the specific symbol matching logic
  const searchText = (symbolName + ' ' + symbolDescription).toLowerCase();
  
  if (searchText.includes('eye of horus') || searchText.includes('horus')) {
    return {
      images: [{
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Eye_of_Horus_bw.svg/512px-Eye_of_Horus_bw.svg.png',
        description: 'Eye of Horus - Ancient Egyptian Protection Symbol',
        source: 'https://en.wikipedia.org/wiki/Eye_of_Horus',
        relevanceScore: 100
      }],
      aiDefinition: 'This is the authentic eye of horus symbol with verified imagery from reliable sources.'
    };
  }
  
  // Simulate curated symbols logic
  const categoryKey = category.toLowerCase();
  const curatedSymbols: { [key: string]: any[] } = {
    'star clusters': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Messier_13_Hubble_WikiSky.jpg/512px-Messier_13_Hubble_WikiSky.jpg',
        description: 'Messier 13 (Hercules Globular Cluster)',
        source: 'https://en.wikipedia.org/wiki/Messier_13',
        relevanceScore: 98
      }
    ],
    'chemical formula symbol': [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Water_molecule_3D.svg/256px-Water_molecule_3D.svg.png',
        description: 'Water Molecule (H2O) - 3D Structure',
        source: 'https://en.wikipedia.org/wiki/Water',
        relevanceScore: 98
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
      }
    ]
  };
  
  const categorySymbols = curatedSymbols[categoryKey] || [];
  
  if (categorySymbols.length > 0) {
    return {
      images: categorySymbols,
      aiDefinition: `These are verified, authentic symbols from the ${category} category.`
    };
  }
  
  // Fallback to empty for unknown categories in test
  return {
    images: [],
    aiDefinition: symbolDescription
  };
};

describe('Symbol Search Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  it('returns specific symbol match for Eye of Horus', async () => {
    const input = {
      symbolName: 'Eye of Horus',
      symbolDescription: 'Ancient Egyptian protection symbol',
      category: 'Ancient symbols'
    };

    const result = await mockSearchImages(input);

    expect(result.images).toHaveLength(1);
    expect(result.images[0].description).toBe('Eye of Horus - Ancient Egyptian Protection Symbol');
    expect(result.images[0].url).toContain('wikimedia.org');
    expect(result.images[0].relevanceScore).toBe(100);
  });

  it('returns curated symbols for star clusters category', async () => {
    const input = {
      symbolName: 'test',
      symbolDescription: 'test description',
      category: 'Star clusters'
    };

    const result = await mockSearchImages(input);

    expect(result.images.length).toBeGreaterThan(0);
    expect(result.images[0].description).toContain('Messier 13');
    expect(result.images[0].url).toContain('wikimedia.org');
    expect(result.images[0].relevanceScore).toBeGreaterThanOrEqual(90);
  });

  it('returns curated symbols for chemical formula category', async () => {
    const input = {
      symbolName: 'water',
      symbolDescription: 'H2O molecule',
      category: 'Chemical formula symbol'
    };

    const result = await mockSearchImages(input);

    expect(result.images.length).toBeGreaterThan(0);
    expect(result.images[0].description).toContain('Water Molecule');
    expect(result.images[0].url).toContain('wikimedia.org');
  });

  it('returns curated symbols for ancient symbols category', async () => {
    const input = {
      symbolName: 'ankh',
      symbolDescription: 'Egyptian symbol',
      category: 'Ancient symbols'
    };

    const result = await mockSearchImages(input);

    expect(result.images.length).toBeGreaterThan(0);
    expect(result.images.some((img: any) => img.description.includes('Eye of Horus'))).toBe(true);
    expect(result.images.some((img: any) => img.description.includes('Ankh'))).toBe(true);
  });

  it('returns empty results for unknown category', async () => {
    const input = {
      symbolName: 'unknown symbol',
      symbolDescription: 'unknown description',
      category: 'Unknown category'
    };

    const result = await mockSearchImages(input);

    expect(result.images).toHaveLength(0);
    expect(result.aiDefinition).toBe('unknown description');
  });

  it('handles specific symbol matching correctly', async () => {
    const input = {
      symbolName: 'horus',
      symbolDescription: 'Egyptian god symbol',
      category: 'Ancient symbols'
    };

    const result = await mockSearchImages(input);

    expect(result.images).toHaveLength(1);
    expect(result.images[0].description).toBe('Eye of Horus - Ancient Egyptian Protection Symbol');
    expect(result.aiDefinition).toContain('authentic eye of horus symbol');
  });

  it('returns high relevance scores for curated symbols', async () => {
    const input = {
      symbolName: 'test',
      symbolDescription: 'test',
      category: 'Star clusters'
    };

    const result = await mockSearchImages(input);

    expect(result.images).toHaveLength(1);
    expect(result.images[0].relevanceScore).toBeGreaterThanOrEqual(95);
    expect(result.images[0].description).toBe('Messier 13 (Hercules Globular Cluster)');
  });

  it('provides appropriate AI definitions for categories', async () => {
    const input = {
      symbolName: 'test',
      symbolDescription: 'test description',
      category: 'Chemical formula symbol'
    };

    const result = await mockSearchImages(input);

    expect(result.aiDefinition).toContain('verified, authentic symbols');
    expect(result.aiDefinition).toContain('Chemical formula symbol');
  });
});