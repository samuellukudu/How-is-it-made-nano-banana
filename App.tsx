import React, { useState, useCallback, useEffect } from 'react';
import { UploadPage } from './UploadPage';
import { ResultsPage } from './ResultsPage';
import { ObjectSelectionPage } from './ObjectSelectionPage';
import { ImageModal } from './components/ImageModal';
import type { Part } from '@google/genai';
import { generate2dDrawing, generate3dDrawing, findObjectsInImage } from './services/geminiService';
import { fileToGenerativePart } from './utils/fileUtils';
import type { BoundingBox } from './services/geminiService';

type Page = 'upload' | 'objectSelection' | 'results';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<BoundingBox[]>([]);
  const [selectedObject, setSelectedObject] = useState<Part | null>(null);
  const [drawing2dUrl, setDrawing2dUrl] = useState<string | null>(null);
  const [drawing3dUrl, setDrawing3dUrl] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const handleImageSelect = (file: File | null) => {
    setImageFile(file);
    setDrawing2dUrl(null);
    setDrawing3dUrl(null);
    setError(null);
    setDetectedObjects([]);
    setSelectedObject(null);
  };

  const handleGenerate = useCallback(async () => {
    if (!imageFile) {
      setError('Please select an image first.');
      return;
    }
    setLoadingMessage('Finding objects...');
    setError(null);
    try {
      const imagePart = await fileToGenerativePart(imageFile);
      const objects = await findObjectsInImage(imagePart);

      if (objects.length > 0) {
        setDetectedObjects(objects);
        setCurrentPage('objectSelection');
      } else {
        setError('Could not find any distinct objects in the image. Please try another photo.');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while finding objects.');
    } finally {
      setLoadingMessage(null);
    }
  }, [imageFile]);

  const handleConfirmSelection = (object: Part) => {
    setSelectedObject(object);
    setCurrentPage('results');
  };

  const handleStartOver = () => {
    setCurrentPage('upload');
    setImageFile(null);
    setDetectedObjects([]);
    setSelectedObject(null);
    setDrawing2dUrl(null);
    setDrawing3dUrl(null);
    setError(null);
    setLoadingMessage(null);
  };

  useEffect(() => {
    const performGenerationPipeline = async () => {
      if (currentPage === 'results' && selectedObject) {
        setDrawing2dUrl(null);
        setDrawing3dUrl(null);
        setError(null);

        try {
          setLoadingMessage('Generating 2D orthographic drawings...');
          const result2dPart = await generate2dDrawing(selectedObject);

          if (result2dPart.inlineData) {
            const { data, mimeType } = result2dPart.inlineData;
            setDrawing2dUrl(`data:${mimeType};base64,${data}`);
          } else {
            throw new Error("2D generation did not return a valid image part.");
          }

          setLoadingMessage('Generating 3D model views...');
          const result3dUrl = await generate3dDrawing(selectedObject, result2dPart);
          setDrawing3dUrl(result3dUrl);

        } catch (err) {
          console.error(err);
          setError(err instanceof Error ? err.message : 'An unknown error occurred during generation.');
        } finally {
          setLoadingMessage(null);
        }
      }
    };
    
    performGenerationPipeline();
  }, [currentPage, selectedObject]);
  
  const renderPage = () => {
    switch(currentPage) {
        case 'upload':
            return <UploadPage 
                onImageSelect={handleImageSelect}
                onGenerate={handleGenerate}
                imageFile={imageFile}
                loadingMessage={loadingMessage}
                error={error}
            />;
        case 'objectSelection':
            return <ObjectSelectionPage 
                detectedObjects={detectedObjects}
                imageFile={imageFile!}
                onConfirmSelection={handleConfirmSelection}
                onStartOver={handleStartOver}
            />;
        case 'results':
            return <ResultsPage
                loadingMessage={loadingMessage}
                error={error}
                drawing2dUrl={drawing2dUrl}
                drawing3dUrl={drawing3dUrl}
                onImageClick={setModalImageUrl}
                onStartOver={handleStartOver}
            />;
        default:
            return <UploadPage 
                onImageSelect={handleImageSelect}
                onGenerate={handleGenerate}
                imageFile={imageFile}
                loadingMessage={loadingMessage}
                error={error}
            />;
    }
  }

  return (
    <>
      <div className="min-h-screen bg-transparent text-gray-200 font-sans flex flex-col p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl mx-auto flex-grow flex flex-col">
           {renderPage()}
        </div>
      </div>
      {modalImageUrl && (
        <ImageModal 
          imageUrl={modalImageUrl} 
          onClose={() => setModalImageUrl(null)} 
        />
      )}
    </>
  );
};

export default App;