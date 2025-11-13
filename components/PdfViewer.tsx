
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { AnyEdit } from '../types';

// Use a CDN for the worker to simplify setup. In a real project, this would be hosted locally.
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${'3.11.174'}/pdf.worker.min.js`;

interface PdfViewerProps {
  file: File;
  pageNumber: number;
  zoom: number;
  edits: AnyEdit[];
  onPdfLoaded: (pdf: PDFDocumentProxy) => void;
  onAddText: (pageNumber: number, x: number, y: number) => void;
  onUpdateEdit: (pageNumber: number, editId: string, newProps: Partial<AnyEdit>) => void;
  selectedEditId: string | null;
  setSelectedEditId: (id: string | null) => void;
}

type ResizeHandlePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'right' | 'bottom' | 'left';
const resizeHandles: ResizeHandlePosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'right', 'bottom', 'left'];

const DraggableResizableItem: React.FC<{
  edit: AnyEdit,
  pageNumber: number,
  onUpdate: (pageNumber: number, editId: string, newProps: Partial<AnyEdit>) => void,
  isSelected: boolean,
  onSelect: (e: React.MouseEvent) => void,
}> = ({ edit, pageNumber, onUpdate, isSelected, onSelect }) => {
  const handleDragStart = (e: React.MouseEvent) => {
    onSelect(e); // Select item on drag start
    e.stopPropagation();

    const startX = e.clientX - edit.x;
    const startY = e.clientY - edit.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newX = moveEvent.clientX - startX;
      const newY = moveEvent.clientY - startY;
      onUpdate(pageNumber, edit.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeStart = (e: React.MouseEvent, handle: ResizeHandlePosition) => {
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const { x, y, width, height } = edit;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      let newX = x, newY = y, newWidth = width, newHeight = height;

      if (handle.includes('right')) newWidth = width + dx;
      if (handle.includes('left')) {
        newWidth = width - dx;
        newX = x + dx;
      }
      if (handle.includes('bottom')) newHeight = height + dy;
      if (handle.includes('top')) {
        newHeight = height - dy;
        newY = y + dy;
      }

      // Prevent negative dimensions
      if (newWidth > 10 && newHeight > 10) {
        onUpdate(pageNumber, edit.id, { x: newX, y: newY, width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  
  const getCursorForHandle = (handle: ResizeHandlePosition) => {
    switch (handle) {
      case 'top-left':
      case 'bottom-right':
        return 'nwse-resize';
      case 'top-right':
      case 'bottom-left':
        return 'nesw-resize';
      case 'top':
      case 'bottom':
        return 'ns-resize';
      case 'left':
      case 'right':
        return 'ew-resize';
    }
  };

  const itemStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${edit.x}px`,
    top: `${edit.y}px`,
    width: `${edit.width}px`,
    height: `${edit.height}px`,
    cursor: 'grab',
    border: isSelected ? '2px solid #3b82f6' : '1px dashed transparent',
    transition: 'border-color 0.2s',
  };
  
  return (
    <div style={itemStyle} onMouseDown={handleDragStart}>
      {edit.type === 'text' ? (
        <textarea
          value={edit.text}
          onChange={(e) => onUpdate(pageNumber, edit.id, { text: e.target.value })}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            height: '100%',
            fontSize: `${edit.fontSize}px`,
            fontFamily: edit.fontFamily,
            background: 'transparent',
            border: 'none',
            resize: 'none',
            overflow: 'hidden',
            color: 'black',
            padding: 0,
            margin: 0,
            lineHeight: '1.2',
            outline: 'none',
            cursor: 'text',
          }}
          className="p-0 m-0 leading-tight focus:outline-none"
        />
      ) : (
        <img src={edit.src} alt="user upload" style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />
      )}

      {isSelected && (
        <>
          {resizeHandles.map(handle => (
            <div
              key={handle}
              onMouseDown={(e) => handleResizeStart(e, handle)}
              style={{
                position: 'absolute',
                width: '10px',
                height: '10px',
                background: '#3b82f6',
                border: '1px solid white',
                borderRadius: '50%',
                ...getHandlePosition(handle),
                cursor: getCursorForHandle(handle),
              }}
            />
          ))}
        </>
      )}
    </div>
  );
};

function getHandlePosition(handle: ResizeHandlePosition): React.CSSProperties {
  const pos = {
    top: { top: '-5px' },
    bottom: { bottom: '-5px' },
    left: { left: '-5px' },
    right: { right: '-5px' },
    centerVertical: { top: '50%', transform: 'translateY(-50%)' },
    centerHorizontal: { left: '50%', transform: 'translateX(-50%)' },
  };

  switch (handle) {
    case 'top-left': return { ...pos.top, ...pos.left };
    case 'top-right': return { ...pos.top, ...pos.right };
    case 'bottom-left': return { ...pos.bottom, ...pos.left };
    case 'bottom-right': return { ...pos.bottom, ...pos.right };
    case 'top': return { ...pos.top, ...pos.centerHorizontal };
    case 'bottom': return { ...pos.bottom, ...pos.centerHorizontal };
    case 'left': return { ...pos.left, ...pos.centerVertical };
    case 'right': return { ...pos.right, ...pos.centerVertical };
  }
}

export function PdfViewer({ file, onPdfLoaded, pageNumber, zoom, edits, onAddText, onUpdateEdit, selectedEditId, setSelectedEditId }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);

  const renderPage = useCallback(async (page: PDFPageProxy) => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;

    const viewport = page.getViewport({ scale: zoom });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    overlay.style.width = `${viewport.width}px`;
    overlay.style.height = `${viewport.height}px`;

    const renderContext = {
      canvasContext: canvas.getContext('2d')!,
      viewport: viewport,
    };
    await page.render({ ...renderContext, canvas }).promise;
  }, [zoom]);

  useEffect(() => {
    const loadPdf = async () => {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      pdfRef.current = pdfDoc;
      onPdfLoaded(pdfDoc);
    };
    loadPdf();
  }, [file, onPdfLoaded]);
  
  useEffect(() => {
    const drawPage = async () => {
      if (pdfRef.current) {
        const page = await pdfRef.current.getPage(pageNumber);
        renderPage(page);
      }
    };
    drawPage();
  }, [pageNumber, renderPage, zoom]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Deselect if clicking on the background
    if (e.target === e.currentTarget) {
      setSelectedEditId(null);
    }
    
    // Add text on double click on background
    if (e.detail === 2 && e.target === e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      onAddText(pageNumber, x, y);
    }
  };

  return (
    <div className="relative shadow-lg w-fit mx-auto">
      <div 
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        onMouseDown={handleOverlayClick}
      >
        <canvas ref={canvasRef} />
        <div 
          ref={overlayRef} 
          className="absolute top-0 left-0 cursor-text"
        >
          {edits.map(edit => (
            <DraggableResizableItem
              key={edit.id}
              edit={edit}
              pageNumber={pageNumber}
              onUpdate={onUpdateEdit}
              isSelected={edit.id === selectedEditId}
              onSelect={(e) => {
                e.stopPropagation();
                setSelectedEditId(edit.id);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
