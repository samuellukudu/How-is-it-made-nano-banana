import React from 'react';
import { CubeIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <div className="flex justify-center items-center gap-4">
        <CubeIcon />
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
          Nano banana architect
        </h1>
      </div>
      <p className="mt-2 text-lg text-gray-400">
        Generate 2D & 3D technical drawings from your photos.
      </p>
    </header>
  );
};
