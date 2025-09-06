
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageInput } from './components/ImageInput';
import { DrawingOutput } from './components/DrawingOutput';
import { Loader } from './components/Loader';
import { ImageModal } from './components/ImageModal';
import { SparklesIcon } from './components/icons';
import { generateDrawing } from './services/geminiService';
import { fileToGenerativePart } from './utils/fileUtils';

const App: React.FC = () => {
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

  const handleGenerate = useCallback(async () => {
    if (!imageFile) {
      setError('Please select an image first.');
      return;
    }

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
  }, [imageFile]);

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl">
          <Header />
          <main className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="flex flex-col space-y-6">
                <h2 className="text-2xl font-bold text-cyan-400">1. Upload Photo</h2>
                <ImageInput onImageSelect={handleImageSelect} />
                <button
                  onClick={handleGenerate}
                  disabled={!imageFile || isLoading}
                  className="w-full flex justify-center items-center gap-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg shadow-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  {isLoading ? (
                    'Generating Drawings...'
                  ) : (
                    <>
                      <SparklesIcon />
                      Generate Drawings
                    </>
                  )}
                </button>
              </div>
              
              <div className="flex flex-col space-y-6">
                 <h2 className="text-2xl font-bold text-purple-400">2. View Results</h2>
                 {isLoading && <Loader />}
                 {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">{error}</div>}
                 {(!isLoading && (drawing2d || drawing3d)) && (
                   <DrawingOutput 
                     imageUrl2d={drawing2d} 
                     imageUrl3d={drawing3d} 
                     onImageClick={setModalImageUrl}
                   />
                 )}
                 {(!isLoading && !drawing2d && !drawing3d && !error) && (
                   <div className="h-full min-h-[300px] flex items-center justify-center bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg">
                      <p className="text-gray-500">AI-generated drawings will appear here.</p>
                   </div>
                 )}
              </div>
            </div>
          </main>
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
