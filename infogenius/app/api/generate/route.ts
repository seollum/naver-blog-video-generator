import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Interface for the generated prompt
interface GeneratedPrompt {
  style: string;
  prompt: string;
}

// Interface for the API response
interface InfographicResult {
  style: string;
  prompt: string;
  imageUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { text } = await request.json();

    // Validation
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Text input is required' },
        { status: 400 }
      );
    }

    if (text.length < 50) {
      return NextResponse.json(
        { success: false, error: 'Text must be at least 50 characters long' },
        { status: 400 }
      );
    }

    if (text.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Text must not exceed 2000 characters' },
        { status: 400 }
      );
    }

    // Step 1: Generate 3 optimized DALL-E 3 prompts using GPT-4o
    console.log('Step 1: Generating prompts with GPT-4o...');
    
    const promptCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert infographic designer. Convert the user's text into 3 distinct DALL-E 3 prompts for infographic generation.

IMPORTANT RULES:
1. Use minimal text in images - focus on icons, charts, visual metaphors
2. Each prompt should describe a different visual style
3. Optimized for 1024x1024 square format
4. Professional, high-quality design language
5. Describe visual elements, colors, layout, and data representation methods

Style A: Minimalist Flat Vector, Corporate Blue tones, clean layout, simple icons
Style B: Isometric 3D illustration, Vibrant colors, playful modern, depth and shadows
Style C: Futuristic dark theme, Neon accents (#00FFFF, #FF00FF), data visualization, cyberpunk aesthetic

Output ONLY valid JSON in this exact format (no additional text):
{
  "prompts": [
    {"style": "Minimalist", "prompt": "detailed visual description for Style A"},
    {"style": "Isometric", "prompt": "detailed visual description for Style B"},
    {"style": "Futuristic", "prompt": "detailed visual description for Style C"}
  ]
}`,
        },
        {
          role: 'user',
          content: `Create 3 infographic prompts for this content:\n\n${text}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 1500,
    });

    const promptText = promptCompletion.choices[0]?.message?.content;
    
    if (!promptText) {
      throw new Error('Failed to generate prompts from GPT-4o');
    }

    // Parse the JSON response
    let generatedPrompts: GeneratedPrompt[];
    try {
      const parsed = JSON.parse(promptText);
      generatedPrompts = parsed.prompts;
      
      if (!Array.isArray(generatedPrompts) || generatedPrompts.length !== 3) {
        throw new Error('Invalid prompt structure');
      }
    } catch (parseError) {
      console.error('Failed to parse GPT-4o response:', promptText);
      throw new Error('Failed to parse AI response');
    }

    // Step 2: Generate images using DALL-E 3 (parallel execution)
    console.log('Step 2: Generating images with DALL-E 3...');
    
    const imagePromises = generatedPrompts.map(async ({ style, prompt }) => {
      try {
        const imageResponse = await openai.images.generate({
          model: 'dall-e-3',
          prompt: `Create a professional infographic with this description: ${prompt}. The infographic should be visually appealing, use minimal text, and focus on icons and visual data representation.`,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        });

        const imageUrl = imageResponse.data[0]?.url;
        
        if (!imageUrl) {
          throw new Error(`Failed to generate image for ${style} style`);
        }

        return {
          style,
          prompt,
          imageUrl,
        };
      } catch (error) {
        console.error(`Error generating ${style} image:`, error);
        return {
          style,
          prompt,
          imageUrl: '',
          error: error instanceof Error ? error.message : 'Image generation failed',
        };
      }
    });

    const results = await Promise.all(imagePromises);

    // Filter out failed results
    const successfulResults = results.filter(r => r.imageUrl) as InfographicResult[];

    if (successfulResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'All image generations failed' },
        { status: 500 }
      );
    }

    // Return successful results
    return NextResponse.json({
      success: true,
      results: successfulResults,
    });

  } catch (error) {
    console.error('API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
