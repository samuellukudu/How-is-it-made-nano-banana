
import React, { useEffect, useCallback } from 'react';
import { CloseIcon } from './icons';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [handleKeyDown]);

  // Stop propagation to prevent closing modal when clicking on the image itself
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    e.stopPropagation();
  };

  return (
    <div 
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Enlarged image view"
    >
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
        aria-label="Close image view"
      >
        <CloseIcon className="w-8 h-8" />
      </button>
      <div className="max-w-full max-h-full flex items-center justify-center">
        <img 
            src={imageUrl} 
            alt="Enlarged technical drawing" 
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={handleImageClick}
        />
      </div>
    </div>
  );
};
