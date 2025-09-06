import React from 'react';
import { ExpandIcon, DownloadIcon } from './icons';

interface DrawingOutputProps {
  imageUrl2d: string | null;
  imageUrl3d: string | null;
  onImageClick: (imageUrl: string) => void;
}

const DrawingCard: React.FC<{ title: string; imageUrl: string | null; onImageClick: (imageUrl: string) => void; }> = ({ title, imageUrl, onImageClick }) => {
    
    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent the modal from opening
        if (!imageUrl) return;

        const link = document.createElement('a');
        link.href = imageUrl;
        const fileName = `${title.toLowerCase().replace(/ /g, '_')}.png`;
        link.download = fileName;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-300 mb-3 text-center">{title}</h3>
            <div className="flex-grow bg-white rounded-md p-2 overflow-hidden flex items-center justify-center relative group">
                {imageUrl ? (
                     <>
                        <img src={imageUrl} alt={title} className="w-full h-auto object-contain" />
                        <div 
                            className="absolute inset-0 bg-black/70 flex items-center justify-center space-x-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                            aria-label={`Actions for ${title}`}
                        >
                             <button 
                                onClick={() => onImageClick(imageUrl)}
                                className="text-white flex flex-col items-center gap-1 hover:text-cyan-400 transition-colors"
                                aria-label={`Enlarge ${title}`}
                            >
                                <ExpandIcon className="w-10 h-10" />
                                <span className="text-sm font-semibold">Enlarge</span>
                            </button>
                            <button
                                onClick={handleDownload}
                                className="text-white flex flex-col items-center gap-1 hover:text-green-400 transition-colors"
                                aria-label={`Download ${title}`}
                            >
                                <DownloadIcon className="w-10 h-10" />
                                <span className="text-sm font-semibold">Download</span>
                            </button>
                        </div>
                     </>
                ) : (
                    <div className="text-gray-500">Drawing not available.</div>
                )}
            </div>
        </div>
    );
};

export const DrawingOutput: React.FC<DrawingOutputProps> = ({ imageUrl2d, imageUrl3d, onImageClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <DrawingCard title="2D Process Sequence" imageUrl={imageUrl2d} onImageClick={onImageClick} />
      <DrawingCard title="3D Assembly Sequence" imageUrl={imageUrl3d} onImageClick={onImageClick} />
    </div>
  );
};