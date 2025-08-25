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

For images, prioritize:
- Wikipedia Commons URLs (upload.wikimedia.org)
- Educational institution websites
- Museum collections
- Scientific databases
- High-quality stock photo sites with specific search terms

For each image, provide:
- url: Direct image URL (prefer .jpg, .png, .svg)
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

Find the most accurate and relevant images for this specific symbol. Return only valid JSON.`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
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
        
        result = JSON.parse(cleanCompletion);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid JSON response format');
      }
      
      // Validate and filter results
      const validImages = (result.images || []).filter((img: any) => 
        img.url && img.description && img.source && typeof img.relevanceScore === 'number'
      );
      
      return {
        images: validImages.slice(0, 5), // Limit to 5 images
        aiDefinition: result.aiDefinition || symbolDescription
      };
    } catch (error) {
      console.error('Image search error:', error);
      
      // Fallback response
      return {
        images: [],
        aiDefinition: symbolDescription
      };
    }
  });