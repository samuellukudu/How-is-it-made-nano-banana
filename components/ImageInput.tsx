
import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon, CameraIcon } from './icons';

interface ImageInputProps {
  onImageSelect: (file: File | null) => void;
}

export const ImageInput: React.FC<ImageInputProps> = ({ onImageSelect }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        onImageSelect(file);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
      onImageSelect(null);
    }
  }, [onImageSelect]);

  return (
    <div className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-lg flex flex-col items-center space-y-4">
      <div className="w-full h-64 bg-gray-800 rounded-md flex items-center justify-center overflow-hidden">
        {preview ? (
          <img src={preview} alt="Selected preview" className="w-full h-full object-contain" />
        ) : (
          <div className="text-gray-500 flex flex-col items-center">
             <UploadIcon className="w-12 h-12" />
            <span className="mt-2">Image preview will appear here</span>
          </div>
        )}
      </div>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <input
          type="file"
          ref={cameraInputRef}
          onChange={handleFileChange}
          accept="image/*"
          capture="environment"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          <UploadIcon />
          Upload Image
        </button>
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          <CameraIcon />
          Use Camera
        </button>
      </div>
    </div>
  );
};
