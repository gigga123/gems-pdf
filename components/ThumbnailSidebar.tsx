
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface ThumbnailSidebarProps {
  pdf: PDFDocumentProxy;
  pageOrder: number[];
  onPageOrderChange: (newOrder: number[]) => void;
  currentPage: number;
  onPageSelect: (page: number) => void;
}

const Thumbnail: React.FC<{
  pdf: PDFDocumentProxy;
  pageNumber: number;
  isActive: boolean;
  onClick: (page: number) => void;
}> = ({ pdf, pageNumber, isActive, onClick }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let mounted = true;
    const renderThumbnail = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 0.2 });
        const canvas = canvasRef.current;
        if (!canvas || !mounted) return;
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d')!;
        // FIX: The type definitions for this version of pdfjs-dist seem to incorrectly require the 'canvas' property.
        // We pass it here to satisfy the compiler. The runtime should use `canvasContext` and ignore `canvas`.
        page.render({ canvasContext: context, viewport: viewport, canvas: canvas }).promise;
      } catch (error) {
        console.error(`Failed to render thumbnail for page ${pageNumber}`, error);
      }
    };
    renderThumbnail();
    return () => { mounted = false; };
  }, [pdf, pageNumber]);
  
  const activeClasses = isActive ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-300 dark:border-gray-600';

  return (
    <div 
        className={`bg-white dark:bg-gray-700 p-1 border-2 rounded-md cursor-pointer hover:border-primary-400 ${activeClasses}`}
        onClick={() => onClick(pageNumber)}
    >
      <canvas ref={canvasRef} className="shadow-md"></canvas>
      <p className="text-center text-xs mt-1">{pageNumber}</p>
    </div>
  );
};

export function ThumbnailSidebar({ pdf, pageOrder, onPageOrderChange, currentPage, onPageSelect }: ThumbnailSidebarProps) {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragOverItem.current = index;
    // This is needed to trigger the drop event.
    e.preventDefault();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (draggedItem === null || dragOverItem.current === null) return;
    
    const newPageOrder = [...pageOrder];
    const draggedPage = newPageOrder.splice(draggedItem, 1)[0];
    newPageOrder.splice(dragOverItem.current, 0, draggedPage);
    
    onPageOrderChange(newPageOrder);
    setDraggedItem(null);
    dragOverItem.current = null;
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    dragOverItem.current = null;
  };

  return (
    <aside className="w-40 bg-white dark:bg-gray-800 p-2 overflow-y-auto shadow-inner">
      <div 
        className="space-y-2"
        onDragOver={handleDragOver}
      >
        {pageOrder.map((pageNumber, index) => (
          <div
            key={`thumb-container-${pageNumber}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            className={`transition-opacity ${draggedItem === index ? 'opacity-30' : 'opacity-100'}`}
          >
            <Thumbnail
              pdf={pdf}
              pageNumber={pageNumber}
              isActive={pageNumber === currentPage}
              onClick={onPageSelect}
            />
          </div>
        ))}
      </div>
    </aside>
  );
}
