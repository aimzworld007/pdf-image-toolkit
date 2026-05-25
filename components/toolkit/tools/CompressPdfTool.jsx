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

export default function CompressPdfTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [inputPreview, setInputPreview] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');
  const [busy, setBusy] = useState(false);

  const onSelectFile = async (picked) => {
    setFile(picked);
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
      setStatus('PDF selected, but preview generation failed.');
    }
  };

  const compress = async () => {
    if (!file) {
      setTone('error');
      setStatus('Please select a PDF file.');
      return;
    }
    try {
      setBusy(true);
      const originalBytes = await readAsArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(originalBytes, { ignoreEncryption: true });
      const optimizedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        updateFieldAppearances: false,
      });

      downloadBlob(new Blob([optimizedBytes], { type: 'application/pdf' }), randomFilename('compressed_pdf', 'pdf'));
      const oldKb = (originalBytes.byteLength / 1024).toFixed(1);
      const newKb = (optimizedBytes.byteLength / 1024).toFixed(1);
      setTone('success');
      setStatus(`Compressed PDF exported. Size: ${oldKb} KB -> ${newKb} KB.`);
    } catch {
      setTone('error');
      setStatus('Failed to compress/optimize this PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame title="Compress PDF" onBack={onBack}>
      <SectionHeader title="PDF Optimizer" subtitle="Re-save PDF with stream optimization." />
      <div className="row">
        <FileInput accept="application/pdf" onSelect={onSelectFile} label={file ? file.name : 'Select PDF'} />
        <button className="btn alt" onClick={compress} disabled={busy}>{busy ? 'Compressing...' : 'Compress & Download'}</button>
      </div>
      <FileInfoCard file={file} extras={pageCount ? [`${pageCount} pages`] : []} />
      {inputPreview ? (
        <div className="output-grid" style={{ marginTop: 12 }}>
          <ImagePreview title="PDF First Page Preview" src={inputPreview} />
        </div>
      ) : null}
      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}
