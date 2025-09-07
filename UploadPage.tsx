import React from 'react';
import { Header } from './components/Header';
import { ImageInput } from './components/ImageInput';
import { SparklesIcon } from './components/icons';

interface UploadPageProps {
  onImageSelect: (file: File | null) => void;
  onGenerate: () => void;
  imageFile: File | null;
  loadingMessage: string | null;
  error: string | null;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onImageSelect, onGenerate, imageFile, loadingMessage, error }) => {
  return (
    <>
      <Header />
      <main className="mt-8 max-w-lg mx-auto">
        <div className="flex flex-col space-y-6">
          <h2 className="text-2xl font-bold text-yellow-400 text-center">1. Upload a Photo</h2>
          <ImageInput onImageSelect={onImageSelect} />
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center">
              {error}
            </div>
          )}
          <button
            onClick={onGenerate}
            disabled={!imageFile || !!loadingMessage}
            className="w-full flex justify-center items-center gap-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:bg-gray-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900 min-h-[52px]"
          >
            {loadingMessage ? (
               <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{loadingMessage}</span>
              </div>
            ) : (
              <>
                <SparklesIcon />
                Find Objects &amp; Generate
              </>
            )}
          </button>
        </div>
      </main>
    </>
  );
};