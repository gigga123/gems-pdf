
import React, { useState, useCallback, useEffect } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { FileUploader } from './components/FileUploader';
import { PdfViewer } from './components/PdfViewer';
import { Toolbar } from './components/Toolbar';
import { ThumbnailSidebar } from './components/ThumbnailSidebar';
import { exportWithEdits } from './services/pdfProcessor';
import type { AnyEdit } from './types';
import { downloadBlob } from './utils/download';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [history, setHistory] = useState<Record<number, AnyEdit[]>[]>([{}]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedEditId, setSelectedEditId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const edits = history[currentIndex];
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  useEffect(() => {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    setPdf(null);
    setPageOrder([]);
    setCurrentPage(1);
    setHistory([{}]);
    setCurrentIndex(0);
    setSelectedEditId(null);
  };

  const handlePdfLoaded = (pdfDoc: PDFDocumentProxy) => {
    setPdf(pdfDoc);
    setPageOrder(Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1));
  };
  
  const addEdit = (pageNumber: number, edit: AnyEdit) => {
    const prevEdits = history[currentIndex];
    const newEdits = {
      ...prevEdits,
      [pageNumber]: [...(prevEdits[pageNumber] || []), edit]
    };
    
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newEdits);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
    setSelectedEditId(edit.id); // Select the new edit
  };

  const addText = (pageNumber: number, x: number, y: number) => {
    addEdit(pageNumber, {
      id: Date.now().toString(),
      type: 'text',
      x,
      y,
      text: 'New Text',
      fontSize: 14,
      fontFamily: 'Helvetica',
      width: 100,
      height: 20,
    });
  };

  const handleImageAdd = (imageFile: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const defaultWidth = 200;
        addEdit(currentPage, {
          id: Date.now().toString(),
          type: 'image',
          x: 50,
          y: 50,
          src,
          width: defaultWidth,
          height: defaultWidth / aspectRatio,
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(imageFile);
  };

  const updateEdit = (pageNumber: number, editId: string, newProps: Partial<AnyEdit>) => {
    const prevEdits = history[currentIndex];
    const pageEdits = prevEdits[pageNumber] || [];
    const newEdits = {
      ...prevEdits,
      // FIX: Cast the updated edit object to AnyEdit to preserve the discriminated union type,
      // which can be lost when spreading `edit` and `newProps`.
      [pageNumber]: pageEdits.map(edit => edit.id === editId ? { ...edit, ...newProps } as AnyEdit : edit)
    };

    if (JSON.stringify(prevEdits) === JSON.stringify(newEdits)) {
      return;
    }
    
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newEdits);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (canUndo) {
      setCurrentIndex(currentIndex - 1);
      setSelectedEditId(null);
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      setCurrentIndex(currentIndex + 1);
      setSelectedEditId(null);
    }
  };

  const handleExport = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const originalArrayBuffer = await file.arrayBuffer();
      const blob = await exportWithEdits(originalArrayBuffer, edits, pageOrder);
      downloadBlob(blob, `edited-${file.name}`);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("An error occurred while exporting the PDF. See console for details.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen font-sans text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900">
      <Toolbar
        onExport={handleExport}
        isProcessing={isProcessing}
        zoom={zoom}
        setZoom={setZoom}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(p => !p)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onImageAdd={handleImageAdd}
      />
      <div className="flex-1 flex overflow-hidden">
        {file && pdf ? (
          <>
            <ThumbnailSidebar
              pdf={pdf}
              pageOrder={pageOrder}
              onPageOrderChange={setPageOrder}
              currentPage={currentPage}
              onPageSelect={setCurrentPage}
            />
            <div className="flex-1 overflow-auto p-4 md:p-8 bg-gray-200 dark:bg-gray-800">
              <PdfViewer
                file={file}
                onPdfLoaded={handlePdfLoaded}
                pageNumber={currentPage}
                zoom={zoom}
                edits={edits[currentPage] || []}
                onAddText={addText}
                onUpdateEdit={updateEdit}
                selectedEditId={selectedEditId}
                setSelectedEditId={setSelectedEditId}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <FileUploader onFileSelect={handleFileChange} />
          </div>
        )}
      </div>
    </div>
  );
}
