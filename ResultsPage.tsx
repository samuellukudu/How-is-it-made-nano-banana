import React, { useState } from 'react';
import { Loader } from './components/Loader';
import { RestartIcon, ExpandIcon, DownloadIcon, CubeIcon, ViewGridIcon } from './components/icons';

interface ResultsPageProps {
  loadingMessage: string | null;
  error: string | null;
  drawing2dUrl: string | null;
  drawing3dUrl: string | null;
  onImageClick: (imageUrl: string) => void;
  onStartOver: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  loadingMessage,
  error,
  drawing2dUrl,
  drawing3dUrl,
  onImageClick,
  onStartOver,
}) => {
  const [activeView, setActiveView] = useState<'2d' | '3d'>('2d');

  const currentUrl = activeView === '2d' ? drawing2dUrl : drawing3dUrl;
  const currentTitle = activeView === '2d' ? '2D Orthographic Views' : '3D Model Views';

  const handleDownload = () => {
    if (!currentUrl) return;

    const link = document.createElement('a');
    link.href = currentUrl;
    const fileName = `${currentTitle.toLowerCase().replace(/ /g, '_')}.png`;
    link.download = fileName;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => {
    if (loadingMessage) {
        return <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-20"><Loader message={loadingMessage} /></div>;
    }
    if (error) {
        return <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-20"><div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center">{error}</div></div>;
    }
    if (!drawing2dUrl && !drawing3dUrl) {
        return (
            <div className="h-full min-h-[300px] flex items-center justify-center bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg">
                <p className="text-gray-500">Something went wrong. No drawings were generated.</p>
            </div>
        )
    }

    return (
        <div className="w-full flex-grow flex items-center justify-center relative group bg-black/20 rounded-lg p-2 sm:p-4">
            {currentUrl ? (
                <>
                    <img src={currentUrl} alt={currentTitle} className="max-w-full max-h-full object-contain" />
                    <div 
                        className="absolute inset-0 bg-black/70 flex items-center justify-center space-x-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        aria-label={`Actions for ${currentTitle}`}
                    >
                         <button 
                            onClick={() => onImageClick(currentUrl)}
                            className="text-white flex flex-col items-center gap-1 hover:text-cyan-400 transition-colors"
                            aria-label={`Enlarge ${currentTitle}`}
                        >
                            <ExpandIcon className="w-10 h-10" />
                            <span className="text-sm font-semibold">Enlarge</span>
                        </button>
                        <button
                            onClick={handleDownload}
                            className="text-white flex flex-col items-center gap-1 hover:text-green-400 transition-colors"
                            aria-label={`Download ${currentTitle}`}
                        >
                            <DownloadIcon className="w-10 h-10" />
                            <span className="text-sm font-semibold">Download</span>
                        </button>
                    </div>
                </>
            ) : (
                <div className="text-gray-500">{currentTitle} not available.</div>
            )}
        </div>
    );
  };

  return (
    <div className="w-full relative flex-grow flex flex-col">
      <div className="absolute top-0 left-0 z-10">
        <button 
            onClick={onStartOver}
            className="flex items-center gap-2 bg-gray-700/80 hover:bg-gray-600/80 text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
        >
            <RestartIcon />
            Start Over
        </button>
      </div>

      <main className="w-full flex-grow flex flex-col items-center pt-8">
        <div className="flex justify-center p-1 bg-gray-800 rounded-lg space-x-1 mb-6">
            <button
                onClick={() => setActiveView('2d')}
                disabled={!drawing2dUrl}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${activeView === '2d' ? 'bg-yellow-500 text-gray-900' : 'text-gray-300 hover:bg-gray-700/50 disabled:text-gray-500 disabled:hover:bg-transparent'}`}
            >
                <ViewGridIcon className="w-5 h-5" />
                2D Orthographic
            </button>
            <button
                onClick={() => setActiveView('3d')}
                disabled={!drawing3dUrl}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${activeView === '3d' ? 'bg-yellow-500 text-gray-900' : 'text-gray-300 hover:bg-gray-700/50 disabled:text-gray-500 disabled:hover:bg-transparent'}`}
            >
                <CubeIcon className="w-5 h-5 text-current" />
                3D Model
            </button>
        </div>

        {renderContent()}

      </main>
    </div>
  );
};