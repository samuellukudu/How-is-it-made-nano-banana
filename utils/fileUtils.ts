
// FIX: Replaced deprecated `GenerativePart` with `Part`
import type { Part } from '@google/genai';

/**
 * Converts a File object to a GoogleGenAI.Part object.
 * This involves reading the file as a base64 string and extracting the mime type.
 * @param file The image file to convert.
 * @returns A promise that resolves to a Part object.
 */
// FIX: Replaced deprecated `GenerativePart` with `Part`
export const fileToGenerativePart = async (file: File): Promise<Part> => {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // The result includes the data URL prefix (e.g., "data:image/png;base64,"), 
        // which needs to be removed.
        const base64Data = reader.result.split(',')[1];
        resolve(base64Data);
      } else {
        reject(new Error("Failed to read file as string."));
      }
    };
    reader.onerror = (error) => {
        reject(error);
    };
    reader.readAsDataURL(file);
  });

  const base64EncodedData = await base64EncodedDataPromise;

  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};
