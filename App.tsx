import React, { useState, useCallback, useEffect } from 'react';
import { UploadPage } from './UploadPage';
import { ResultsPage } from './ResultsPage';
import { ImageModal } from './components/ImageModal';
import { generateDrawing } from './services/geminiService';
import { fileToGenerativePart } from './utils/fileUtils';

type Page = 'upload' | 'results';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [drawing2d, setDrawing2d] = useState<string | null>(null);
  const [drawing3d, setDrawing3d] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const handleImageSelect = (file: File | null) => {
    setImageFile(file);
    setDrawing2d(null);
    setDrawing3d(null);
    setError(null);
  };

  const handleGenerate = useCallback(() => {
    if (!imageFile) {
      setError('Please select an image first.');
      return;
    }
    setCurrentPage('results');
  }, [imageFile]);

  const handleStartOver = () => {
    setCurrentPage('upload');
    setImageFile(null);
    setDrawing2d(null);
    setDrawing3d(null);
    setError(null);
    setIsLoading(false);
  };

  useEffect(() => {
    const performGeneration = async () => {
      if (currentPage === 'results' && imageFile) {
        setIsLoading(true);
        setError(null);
        setDrawing2d(null);
        setDrawing3d(null);

        try {
          const imagePart = await fileToGenerativePart(imageFile);
          
          const [result2d, result3d] = await Promise.all([
            generateDrawing(imagePart, '2D'),
            generateDrawing(imagePart, '3D')
          ]);

          setDrawing2d(result2d);
          setDrawing3d(result3d);

        } catch (err) {
          console.error(err);
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    performGeneration();
  }, [currentPage, imageFile]);

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl">
           {currentPage === 'upload' ? (
            <UploadPage 
              onImageSelect={handleImageSelect}
              onGenerate={handleGenerate}
              imageFile={imageFile}
              // FIX: This comparison was causing a TypeScript error because `currentPage` can't be 'results'
              // inside this block. The original expression always evaluated to false.
              // Passing `isLoading` directly is equivalent at runtime here and fixes the type error.
              isLoading={isLoading}
            />
          ) : (
            <ResultsPage
              isLoading={isLoading}
              error={error}
              imageUrl2d={drawing2d}
              imageUrl3d={drawing3d}
              onImageClick={setModalImageUrl}
              onStartOver={handleStartOver}
            />
          )}
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
