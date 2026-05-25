'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { PDFDocument, PageSizes, StandardFonts, rgb } from 'pdf-lib';
import {
  ToolFrame,
  SectionHeader,
  Status,
  FileInput,
  FileInfoCard,
  ImagePreview,
  PAPER_SIZES,
  PASSPORT_PRESETS,
  applySharpenToCanvas,
  clamp,
  createZipBlob,
  drawQrCanvas,
  embedImageFromFile,
  extractPdfImageEntries,
  fitContain,
  getPageSizeMm,
  getPdfQuickPreview,
  hexToPdfRgb,
  hexToRgb,
  parsePageRanges,
} from '../shared';
import {
  downloadBlob,
  downloadDataUrl,
  loadImage,
  mmToPt,
  randomFilename,
  readAsArrayBuffer,
  readAsDataUrl,
  reorderByDrag,
} from '../../../lib/file-helpers';

export default function PdfToJpgTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [inputPreview, setInputPreview] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');
  const [busy, setBusy] = useState(false);

  const onSelectFile = async (picked) => {
    setFile(picked);
    setImages([]);
    setInputPreview('');
    setPageCount(0);
    setStatus('');
    setTone('muted');
    if (!picked) return;
    try {
      const info = await getPdfQuickPreview(picked, 0.45);
      setInputPreview(info.preview);
      setPageCount(info.pageCount);
    } catch {
      setTone('error');
      setStatus('PDF loaded but preview could not be generated.');
    }
  };

  const convert = async () => {
    if (!file) {
      setTone('error');
      setStatus('Please select a PDF file.');
      return;
    }

    try {
      setBusy(true);
      setImages([]);
      setTone('muted');
      setStatus('Loading PDF...');

      const pdfjsLib = await ensurePdfJs();
      const raw = await readAsArrayBuffer(file);
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(raw) }).promise;
      const output = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        setStatus(`Rendering page ${pageNumber} of ${pdf.numPages}...`);
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.6 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        output.push({
          name: randomFilename(`page_${pageNumber}`, 'jpg'),
          dataUrl: canvas.toDataURL('image/jpeg', 0.92),
        });
      }

      setImages(output);
      setTone('success');
      setStatus(`Done. ${output.length} page(s) extracted.`);
    } catch {
      setTone('error');
      setStatus('Failed to read this PDF. It may be encrypted or corrupted.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame title="PDF To JPG" onBack={onBack}>
      <SectionHeader title="Extract Pages As JPG" subtitle="Each page becomes a downloadable image." />
      <div className="row">
        <FileInput accept="application/pdf" onSelect={onSelectFile} label={file ? file.name : 'Select PDF'} />
        <button className="btn" onClick={convert} disabled={busy}>{busy ? 'Processing...' : 'Convert'}</button>
      </div>
      <FileInfoCard file={file} extras={pageCount ? [`${pageCount} pages`] : []} />
      {inputPreview ? (
        <div className="output-grid" style={{ marginTop: 12 }}>
          <ImagePreview title="PDF First Page Preview" src={inputPreview} />
        </div>
      ) : null}
      <Status message={status} tone={tone} />
      {images.length > 0 ? (
        <div className="output-grid" style={{ marginTop: 14 }}>
          {images.map((item) => (
            <a key={item.name} href={item.dataUrl} download={item.name} title="Download page image">
              <img className="thumb" style={{ width: '100%', height: 150, objectFit: 'cover' }} src={item.dataUrl} alt={item.name} />
            </a>
          ))}
        </div>
      ) : null}
    </ToolFrame>
  );
}
