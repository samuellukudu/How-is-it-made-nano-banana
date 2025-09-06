import { GoogleGenAI, Modality } from "@google/genai";
// FIX: Replaced deprecated `GenerativePart` with `Part`
import type { Part } from '@google/genai';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const PROMPTS = {
    '2D': `Based on the provided image, generate a single composite image containing a sequence of three standard 2D orthographic projections of the object.
The style should be a clean, precise, and professional engineering blueprint.
- The final output must be a single wide image file, with the three views arranged horizontally.
- The sequence must show, in order from left to right:
    1. The Front View of the object.
    2. The Top View of the object.
    3. The Right-Side View of the object.
- Use standard line conventions: solid lines for visible edges, dashed lines for hidden features, and center lines for axes of symmetry.
- The background of the generated image must be plain white.
- Do NOT include any dimensions, annotations, text labels, or shadows. Focus purely on the line drawings.`,
    '3D': `Based on the provided image, generate a single composite image that tells a visual story of the object's assembly in a sequence of three 3D technical drawings.
The style must be a clean, precise, and professional technical illustration.
- The final output must be a single wide image file, with the three views arranged horizontally.
- The sequence must show, in order from left to right:
    1. An isometric view of the fully assembled object.
    2. An exploded isometric view, showing the main components pulled apart to reveal how they fit together. Use a slightly different viewing angle than the first step for clarity.
    3. A detailed cutaway or close-up view focusing on a key internal mechanism or joint.
- The background of the generated image must be plain white.
- Do NOT include any dimensions, annotations, text labels, or shadows. Focus purely on the object's form and assembly.`
};

export const generateDrawing = async (
  imagePart: Part,
  dimension: '2D' | '3D'
): Promise<string> => {
  const model = 'gemini-2.5-flash-image-preview';
  const promptText = PROMPTS[dimension];

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [imagePart, { text: promptText }]
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const imagePartResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartResponse && imagePartResponse.inlineData) {
      const { data, mimeType } = imagePartResponse.inlineData;
      return `data:${mimeType};base64,${data}`;
    }

    const textPart = response.candidates?.[0]?.content?.parts?.find(part => part.text);
    const failureReason = textPart?.text || 'The model did not return an image.';
    console.error("Image generation failed:", failureReason, response);
    throw new Error(`Could not generate the ${dimension} drawing. Reason: ${failureReason}`);

  } catch (error) {
    console.error(`Error generating ${dimension} drawing:`, error);
    if (error instanceof Error) {
        if(error.message.startsWith('Could not generate')) {
            throw error;
        }
    }
    throw new Error(`Failed to generate the ${dimension} drawing. The model may have encountered an issue.`);
  }
};