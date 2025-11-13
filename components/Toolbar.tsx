
import React, { useRef } from 'react';
import { Icon } from './Icon';

interface ToolbarProps {
  onExport: () => void;
  isProcessing: boolean;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onImageAdd: (file: File) => void;
}

export function Toolbar({ onExport, isProcessing, zoom, setZoom, isDarkMode, toggleDarkMode, onUndo, onRedo, canUndo, canRedo, onImageAdd }: ToolbarProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      onImageAdd(file);
    } else {
      alert("Please select a valid PNG or JPG file.");
    }
    // Reset input value to allow uploading the same file again
    event.target.value = '';
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-2 flex items-center justify-between z-10">
      <h1 className="text-lg font-bold text-primary-600 dark:text-primary-400">Zenith PDF Editor</h1>
      <div className="flex items-center space-x-2">
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
          <Icon name="zoom-out" />
        </button>
        <span className="w-12 text-center text-sm font-medium">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
          <Icon name="zoom-in" />
        </button>

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

        <button onClick={() => imageInputRef.current?.click()} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
          <Icon name="image" />
        </button>
        <input
          type="file"
          ref={imageInputRef}
          className="hidden"
          accept="image/png, image/jpeg"
          onChange={handleImageUpload}
        />
        
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>
        
        <button onClick={onUndo} disabled={!canUndo} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
          <Icon name="undo" />
        </button>
        <button onClick={onRedo} disabled={!canRedo} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
          <Icon name="redo" />
        </button>

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

        <button onClick={toggleDarkMode} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
          <Icon name={isDarkMode ? 'sun' : 'moon'} />
        </button>

        <button
          onClick={onExport}
          disabled={isProcessing}
          className="ml-4 px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed flex items-center"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
             <>
              <Icon name="download" className="mr-2" />
              Export PDF
            </>
          )}
        </button>
      </div>
    </header>
  );
}
