import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { Part } from '@google/genai';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface BoundingBox {
  id: number;
  label: string;
  box_normalized: [number, number, number, number]; // y_min, x_min, y_max, x_max
}

const PROMPT_2D = `Generate a professional-grade 2D technical drawing of the provided object, adhering to engineering drafting standards. The final output must be a single composite image, wide enough to contain three views arranged horizontally on a plain white background.

The sequence of views, from left to right, must be:

1.  **Front View:** This is the primary view, showing the object's most representative face. It must clearly depict all visible edges with solid lines and all hidden internal features with dashed lines. This view establishes the height and width.
2.  **Top View (Plan View):** This view shows the object as seen from directly above, establishing the width and depth. It must be drawn to the same scale as the Front View and accurately represent all visible and hidden features from this perspective.
3.  **Most Informative Third View:** Based on the object's geometry, provide the most useful third view for understanding its construction. This will typically be a **Right Side View**, but if the object has a particularly complex or important mechanism, provide an enlarged **Detail View** of that mechanism instead.

The entire drawing must be clean, precise, and use standard drafting line weights. Do not include any dimensions, text annotations, or perspective elements. The background must be plain white.`;

const PROMPT_3D = `Generate a professional-grade 3D technical illustration of the provided object, inspired by the clear, explanatory style of "How It's Made" animation stills.

The final output must be a single composite image, wide enough to contain three distinct views arranged horizontally on a plain white background.

The sequence of views, from left to right, must be:

1.  **Assembled Isometric View:** A clear, solid 3D model of the complete object from an isometric perspective. This view should accurately represent the object's overall form and proportions as if it were fully assembled.
2.  **Exploded Isometric View:** An exploded view from the same isometric angle. Deconstruct the object into its primary components. Separate the parts along their assembly axes and include faint dashed lines or vectors to clearly show how they connect and fit together. This view is essential for understanding the object's construction.
3.  **Cutaway Isometric View:** A cutaway view, also from the same isometric angle. Create a cross-section by removing a significant portion of the object's exterior to reveal the internal mechanisms and functional parts. This view must make the inner workings easy to comprehend.

**Crucial Constraints:**
- The background for the entire composite image must be plain white.
- The rendering style must be clean, clear, and technically precise.
- Do NOT include any text, dimensions, annotations, labels, or distracting shadows in the image. The illustrations should be purely visual.`;

const FIND_OBJECTS_PROMPT = `Your task is to act as an object detection tool. Analyze the provided image and identify all primary, distinct physical objects. For each object you find, provide its name and a precise bounding box.
- The output MUST be a JSON object.
- The JSON object should contain a single key, "objects", which is an array.
- Each element in the "objects" array should be an object with two keys:
    1. "label": A short, descriptive name for the object (e.g., "red toy car", "coffee mug").
    2. "box_normalized": A four-element array representing the bounding box coordinates [y_min, x_min, y_max, x_max]. The coordinates must be normalized, with values between 0.0 and 1.0.
- If no distinct objects are found, return an empty "objects" array.`;

const findObjectsSchema = {
    type: Type.OBJECT,
    properties: {
        objects: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING },
                    box_normalized: {
                        type: Type.ARRAY,
                        items: { type: Type.NUMBER }
                    }
                },
                required: ['label', 'box_normalized']
            }
        }
    },
    required: ['objects']
};


export const findObjectsInImage = async (imagePart: Part): Promise<BoundingBox[]> => {
  const model = 'gemini-2.5-flash'; // Using a text model with image input for JSON capabilities
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [imagePart, { text: FIND_OBJECTS_PROMPT }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: findObjectsSchema,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        console.warn("Object detection returned an empty text response.");
        return [];
    }

    const result = JSON.parse(jsonText);
    if (result && Array.isArray(result.objects)) {
        return result.objects.map((obj: any, index: number) => ({ ...obj, id: index }));
    }
    
    return [];

  } catch (error) {
    console.error(`Error finding objects in image:`, error);
    throw new Error('Failed to analyze the image for objects. The model may have encountered an issue.');
  }
};

export const generate2dDrawing = async (objectPart: Part): Promise<Part> => {
  const model = 'gemini-2.5-flash-image-preview';
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [objectPart, { text: PROMPT_2D }]
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const imagePartResponse = response.candidates?.[0]?.content?.parts?.find((p): p is Part => !!p.inlineData);

    if (imagePartResponse) {
      return imagePartResponse;
    }

    const textPart = response.candidates?.[0]?.content?.parts?.find(part => part.text);
    const failureReason = textPart?.text || 'The model did not return an image.';
    console.error("2D Image generation failed:", failureReason, response);
    throw new Error(`Could not generate the 2D drawing. Reason: ${failureReason}`);
  } catch (error) {
    console.error(`Error generating 2D drawing:`, error);
    if (error instanceof Error && error.message.startsWith('Could not generate')) {
        throw error;
    }
    throw new Error('Failed to generate the 2D drawing. The model may have encountered an issue.');
  }
};

export const generate3dDrawing = async (objectPart: Part, drawing2dPart: Part): Promise<string> => {
  const model = 'gemini-2.5-flash-image-preview';
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [objectPart, drawing2dPart, { text: PROMPT_3D }]
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
    console.error("3D Image generation failed:", failureReason, response);
    throw new Error(`Could not generate the 3D drawing. Reason: ${failureReason}`);
  } catch (error) {
    console.error(`Error generating 3D drawing:`, error);
     if (error instanceof Error && error.message.startsWith('Could not generate')) {
        throw error;
    }
    throw new Error('Failed to generate the 3D drawing. The model may have encountered an issue.');
  }
};