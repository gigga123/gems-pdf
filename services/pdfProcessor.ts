import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { AnyEdit } from '../types';

export async function exportWithEdits(
  originalArrayBuffer: ArrayBuffer,
  edits: Record<number, AnyEdit[]>,
  pageOrder: number[],
): Promise<Blob> {
  const sourcePdfDoc = await PDFDocument.load(originalArrayBuffer);
  const newPdfDoc = await PDFDocument.create();
  
  const helveticaFont = await newPdfDoc.embedFont(StandardFonts.Helvetica);

  const copiedPages = await newPdfDoc.copyPages(sourcePdfDoc, pageOrder.map(p => p - 1));
  copiedPages.forEach(page => newPdfDoc.addPage(page));

  const newPages = newPdfDoc.getPages();

  for (const originalPageStr in edits) {
    const originalPageNum = parseInt(originalPageStr, 10);
    const newPageIndex = pageOrder.indexOf(originalPageNum);
    
    if (newPageIndex === -1) continue;

    const page = newPages[newPageIndex];
    const pageEdits = edits[originalPageNum];

    for (const edit of pageEdits) {
      if (edit.type === 'text') {
        page.drawText(edit.text, {
          x: edit.x,
          y: page.getHeight() - edit.y - (edit.fontSize * 0.8), // approximate height adjustment
          font: helveticaFont,
          size: edit.fontSize,
          color: rgb(0, 0, 0),
        });
      } else if (edit.type === 'image') {
        const imageBytes = edit.src.startsWith('data:image/jpeg')
          ? await newPdfDoc.embedJpg(edit.src)
          : await newPdfDoc.embedPng(edit.src);
        
        page.drawImage(imageBytes, {
          x: edit.x,
          y: page.getHeight() - edit.y - edit.height,
          width: edit.width,
          height: edit.height,
        });
      }
    }
  }

  const pdfBytes = await newPdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}