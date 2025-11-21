import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export const TitleBar: React.FC = () => {
  return (
    <div className="h-8 bg-windows-bg flex items-center justify-between select-none border-b border-gray-200 w-full z-50">
      <div className="flex items-center px-3 space-x-2 text-xs text-gray-600">
        <img src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" alt="Logo" className="w-4 h-4" />
        <span className="font-medium">Gemini Desktop</span>
      </div>
      
      {/* Simulated Window Controls - purely aesthetic in a web context */}
      <div className="flex h-full">
        <div className="h-full px-4 flex items-center justify-center hover:bg-gray-200 cursor-default text-gray-500 transition-colors">
          <Minus size={14} />
        </div>
        <div className="h-full px-4 flex items-center justify-center hover:bg-gray-200 cursor-default text-gray-500 transition-colors">
          <Square size={12} />
        </div>
        <div className="h-full px-4 flex items-center justify-center hover:bg-red-500 hover:text-white cursor-default text-gray-500 transition-colors">
          <X size={14} />
        </div>
      </div>
    </div>
  );
};