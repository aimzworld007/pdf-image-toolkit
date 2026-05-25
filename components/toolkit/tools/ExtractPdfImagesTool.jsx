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

export default function ExtractPdfImagesTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [imageCount, setImageCount] = useState(0);
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');
  const [busy, setBusy] = useState(false);

  const onSelectFile = async (picked) => {
    setFile(picked);
    setPreview('');
    setPageCount(0);
    setImageCount(0);
    setStatus('');
    setTone('muted');
    if (!picked) return;
    try {
      const info = await getPdfQuickPreview(picked, 0.45);
      setPreview(info.preview);
      setPageCount(info.pageCount);
    } catch {
      setTone('error');
      setStatus('PDF selected, but the preview could not be rendered.');
    }
  };

  const extract = async () => {
    if (!file) {
      setTone('error');
      setStatus('Please select a PDF file.');
      return;
    }

    try {
      setBusy(true);
      setImageCount(0);
      setTone('muted');
      const entries = await extractPdfImageEntries(file, setStatus);
      setImageCount(entries.length);
      if (!entries.length) {
        setTone('error');
        setStatus('No embedded images were found in this PDF.');
        return;
      }

      setStatus('Building ZIP...');
      const zip = await createZipBlob(entries);
      downloadBlob(zip, randomFilename('pdf_images', 'zip'));
      setTone('success');
      setStatus(`${entries.length} image(s) extracted and downloaded as ZIP.`);
    } catch {
      setTone('error');
      setStatus('Image extraction failed for this PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame title="Extract PDF Images" onBack={onBack}>
      <SectionHeader title="Extract Embedded Images" subtitle="Upload a PDF, scan its pages, and download found images as a ZIP file." />
      <div className="row">
        <FileInput accept="application/pdf" onSelect={onSelectFile} label={file ? file.name : 'Select PDF'} />
        <button className="btn" onClick={extract} disabled={busy}>{busy ? 'Extracting...' : 'Extract Images ZIP'}</button>
      </div>
      <FileInfoCard file={file} extras={[pageCount ? `${pageCount} page(s)` : '', imageCount ? `${imageCount} image(s)` : ''].filter(Boolean)} />
      {preview ? (
        <div className="output-grid" style={{ marginTop: 12 }}>
          <ImagePreview title="First Page Preview" src={preview} />
        </div>
      ) : null}
      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}
