import React from 'react';
import { Header } from './components/Header';
import { ImageInput } from './components/ImageInput';
import { SparklesIcon } from './components/icons';

interface UploadPageProps {
  onImageSelect: (file: File | null) => void;
  onGenerate: () => void;
  imageFile: File | null;
  isLoading: boolean;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onImageSelect, onGenerate, imageFile, isLoading }) => {
  return (
    <>
      <Header />
      <main className="mt-8 max-w-lg mx-auto">
        <div className="flex flex-col space-y-6">
          <h2 className="text-2xl font-bold text-yellow-400 text-center">1. Upload a Photo</h2>
          <ImageInput onImageSelect={onImageSelect} />
          <button
            onClick={onGenerate}
            disabled={!imageFile || isLoading}
            className="w-full flex justify-center items-center gap-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg shadow-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            {isLoading ? (
              'Please wait...'
            ) : (
              <>
                <SparklesIcon />
                Generate Drawings
              </>
            )}
          </button>
        </div>
      </main>
    </>
  );
};
