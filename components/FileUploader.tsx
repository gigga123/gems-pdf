
import React, { useCallback } from 'react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
}

export function FileUploader({ onFileSelect }: FileUploaderProps) {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    } else {
      alert("Please select a valid PDF file.");
    }
  }, [onFileSelect]);

  return (
    <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg max-w-md mx-auto">
      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <h2 className="mt-4 text-xl font-semibold">Upload a PDF</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Drag & drop or click to select a file.</p>
      <div className="mt-6">
        <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          Select PDF
        </label>
        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} />
      </div>
       <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">Your files are processed locally and never leave your browser.</p>
    </div>
  );
}
