import React from 'react';
import { DrawingOutput } from './components/DrawingOutput';
import { Loader } from './components/Loader';
import { RestartIcon } from './components/icons';

interface ResultsPageProps {
  isLoading: boolean;
  error: string | null;
  imageUrl2d: string | null;
  imageUrl3d: string | null;
  onImageClick: (imageUrl: string) => void;
  onStartOver: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  isLoading,
  error,
  imageUrl2d,
  imageUrl3d,
  onImageClick,
  onStartOver,
}) => {
  return (
    <div className="w-full relative min-h-[calc(100vh-4rem)] flex flex-col justify-center">
      <div className="absolute top-0 left-0 z-10">
        <button 
            onClick={onStartOver}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
        >
            <RestartIcon />
            Start Over
        </button>
      </div>
      
      <main className="w-full pt-14">
        {isLoading && <Loader />}
        {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">{error}</div>}
        {(!isLoading && (imageUrl2d || imageUrl3d)) && (
          <DrawingOutput 
            imageUrl2d={imageUrl2d} 
            imageUrl3d={imageUrl3d} 
            onImageClick={onImageClick}
          />
        )}
        {(!isLoading && !imageUrl2d && !imageUrl3d && !error) && (
          <div className="h-full min-h-[300px] flex items-center justify-center bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg">
             <p className="text-gray-500">Something went wrong. No drawings were generated.</p>
          </div>
        )}
      </main>
    </div>
  );
};
