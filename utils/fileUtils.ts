import type { Part } from '@google/genai';
import type { BoundingBox } from '../services/geminiService';

/**
 * Converts a File object to a GoogleGenAI.Part object.
 * This involves reading the file as a base64 string and extracting the mime type.
 * @param file The image file to convert.
 * @returns A promise that resolves to a Part object.
 */
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


/**
 * Crops an image file based on a normalized bounding box and returns a Part.
 * The output format is standardized to PNG to ensure API compatibility.
 * @param imageSrc The source URL of the image to crop (can be from URL.createObjectURL).
 * @param box The normalized bounding box [y_min, x_min, y_max, x_max].
 * @returns A promise that resolves to a cropped Part object in PNG format.
 */
export const cropImageToPart = (
    imageSrc: string, 
    box: BoundingBox['box_normalized']
): Promise<Part> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Failed to get canvas context'));
            }

            const [yMin, xMin, yMax, xMax] = box;
            const cropX = xMin * image.naturalWidth;
            const cropY = yMin * image.naturalHeight;
            const cropWidth = (xMax - xMin) * image.naturalWidth;
            const cropHeight = (yMax - yMin) * image.naturalHeight;
            
            canvas.width = cropWidth;
            canvas.height = cropHeight;

            ctx.drawImage(
                image,
                cropX,
                cropY,
                cropWidth,
                cropHeight,
                0,
                0,
                cropWidth,
                cropHeight
            );

            const outputMimeType = 'image/png';
            const dataUrl = canvas.toDataURL(outputMimeType);
            const base64Data = dataUrl.split(',')[1];
            
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: outputMimeType,
                }
            });
        };
        image.onerror = (error) => {
            reject(error);
        };
        image.src = imageSrc;
    });
};