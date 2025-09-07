import React, { useState, useEffect, useRef } from 'react';
import { RestartIcon, SparklesIcon } from './components/icons';
import type { Part } from '@google/genai';
import type { BoundingBox } from './services/geminiService';
import { InteractiveBoundingBox } from './components/InteractiveBoundingBox';
import { cropImageToPart } from './utils/fileUtils';

interface ObjectSelectionPageProps {
  detectedObjects: BoundingBox[];
  imageFile: File;
  onConfirmSelection: (object: Part) => void;
  onStartOver: () => void;
}

interface ImageLayout {
  // Position of the visible, rendered image relative to its parent container
  finalOffsetTop: number;
  finalOffsetLeft: number;
  // Dimensions of the visible, rendered image
  width: number;
  height: number;
}

export const ObjectSelectionPage: React.FC<ObjectSelectionPageProps> = ({
  detectedObjects,
  imageFile,
  onConfirmSelection,
  onStartOver,
}) => {
  const [boxes, setBoxes] = useState(detectedObjects.map(obj => ({ ...obj, isActive: true })));
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageLayout, setImageLayout] = useState<ImageLayout | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(imageFile);
    setImageSrc(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);
  
  const updateImageBounds = () => {
    if (!imageRef.current || !containerRef.current) return;
        
    const img = imageRef.current;
    const container = containerRef.current;
    const { naturalWidth, naturalHeight } = img;
    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // 1. Calculate rendered image size and offset within its element due to 'object-contain'
    const naturalRatio = naturalWidth / naturalHeight;
    const clientRatio = imgRect.width / imgRect.height;
    let renderedWidth, renderedHeight, renderOffsetX, renderOffsetY;

    if (naturalRatio > clientRatio) {
        renderedWidth = imgRect.width;
        renderedHeight = imgRect.width / naturalRatio;
        renderOffsetX = 0;
        renderOffsetY = (imgRect.height - renderedHeight) / 2;
    } else {
        renderedHeight = imgRect.height;
        renderedWidth = imgRect.height * naturalRatio;
        renderOffsetY = 0;
        renderOffsetX = (imgRect.width - renderedWidth) / 2;
    }

    // 2. Calculate image element's offset from its relative container
    const imgContainerTop = imgRect.top - containerRect.top;
    const imgContainerLeft = imgRect.left - containerRect.left;

    // 3. Combine offsets to get the final position of the visible image area
    setImageLayout({
        finalOffsetTop: imgContainerTop + renderOffsetY,
        finalOffsetLeft: imgContainerLeft + renderOffsetX,
        width: renderedWidth,
        height: renderedHeight,
    });
  };
  
  useEffect(() => {
    window.addEventListener('resize', updateImageBounds);
    return () => window.removeEventListener('resize', updateImageBounds);
  }, []);

  const handleBoxChange = (id: number, newBox: BoundingBox['box_normalized']) => {
    setBoxes(prevBoxes => prevBoxes.map(b => b.id === id ? { ...b, box_normalized: newBox } : b));
  };
  
  const handleToggleBox = (id: number) => {
    setBoxes(prevBoxes => prevBoxes.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b));
  };

  const handleGenerate = async () => {
    const activeBox = boxes.find(b => b.isActive);
    if (activeBox && imageSrc) {
        try {
            const croppedPart = await cropImageToPart(imageSrc, activeBox.box_normalized);
            onConfirmSelection(croppedPart);
        } catch (error) {
            console.error("Failed to crop image:", error);
        }
    }
  };
  
  const activeBoxCount = boxes.filter(b => b.isActive).length;

  return (
    <div className="w-full relative min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="absolute top-0 left-0 z-30 flex items-center gap-4">
        <button
          onClick={onStartOver}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          <RestartIcon />
          Start Over
        </button>
      </div>

      <main className="mt-8 w-full max-w-5xl mx-auto flex-grow flex flex-col">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-yellow-400">2. Adjust & Select Object</h2>
          <p className="text-gray-400">
            Click the <span className="font-bold text-white mx-1">&times;</span> to remove unwanted boxes. Drag or resize the remaining box to be precise.
          </p>
        </div>

        <div ref={containerRef} className="relative w-full flex-grow flex items-center justify-center">
            {imageSrc && (
                <>
                    <img 
                        ref={imageRef}
                        src={imageSrc}
                        alt="Object selection"
                        className="max-w-full max-h-[60vh] object-contain block"
                        onLoad={updateImageBounds}
                    />
                    {imageLayout && boxes.map(box => {
                      if (!box.isActive) return null;

                      const pixelBox = {
                          top: imageLayout.finalOffsetTop + box.box_normalized[0] * imageLayout.height,
                          left: imageLayout.finalOffsetLeft + box.box_normalized[1] * imageLayout.width,
                          width: (box.box_normalized[3] - box.box_normalized[1]) * imageLayout.width,
                          height: (box.box_normalized[2] - box.box_normalized[0]) * imageLayout.height,
                      };

                      return (
                          <InteractiveBoundingBox 
                              key={box.id}
                              pixelBox={pixelBox}
                              label={box.label}
                              onBoxChange={(newPixelBox) => {
                                  // Convert pixel values back to normalized coordinates
                                  const newNormalizedBox: BoundingBox['box_normalized'] = [
                                      (newPixelBox.top - imageLayout.finalOffsetTop) / imageLayout.height,
                                      (newPixelBox.left - imageLayout.finalOffsetLeft) / imageLayout.width,
                                      (newPixelBox.top + newPixelBox.height - imageLayout.finalOffsetTop) / imageLayout.height,
                                      (newPixelBox.left + newPixelBox.width - imageLayout.finalOffsetLeft) / imageLayout.width,
                                  ];
                                  handleBoxChange(box.id, newNormalizedBox);
                              }}
                              onToggle={() => handleToggleBox(box.id)}
                              bounds={{ // The draggable area, relative to the container
                                  top: imageLayout.finalOffsetTop,
                                  left: imageLayout.finalOffsetLeft,
                                  width: imageLayout.width,
                                  height: imageLayout.height,
                              }}
                          />
                      );
                    })}
                </>
            )}
        </div>
        
        <div className="mt-6 text-center">
             <button
                onClick={handleGenerate}
                disabled={activeBoxCount !== 1}
                className="w-full max-w-md mx-auto flex justify-center items-center gap-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:bg-gray-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
                <SparklesIcon />
                {activeBoxCount !== 1 ? 'Select exactly one object to continue' : 'Confirm Selection & Generate'}
            </button>
        </div>

      </main>
    </div>
  );
};