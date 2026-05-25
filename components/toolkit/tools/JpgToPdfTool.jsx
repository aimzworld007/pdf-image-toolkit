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

export default function JpgToPdfTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [inputPreview, setInputPreview] = useState('');
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');
  const [busy, setBusy] = useState(false);

  const onSelectFile = async (picked) => {
    setFile(picked);
    setInputPreview('');
    setStatus('');
    setTone('muted');
    if (!picked) return;
    setInputPreview(await readAsDataUrl(picked));
  };

  const convert = async () => {
    if (!file) {
      setTone('error');
      setStatus('Please select a JPG file.');
      return;
    }

    try {
      setBusy(true);
      const pdfDoc = await PDFDocument.create();
      const jpgImage = await pdfDoc.embedJpg(await readAsArrayBuffer(file));
      const page = pdfDoc.addPage([jpgImage.width, jpgImage.height]);
      page.drawImage(jpgImage, { x: 0, y: 0, width: jpgImage.width, height: jpgImage.height });
      const bytes = await pdfDoc.save();
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), randomFilename('converted', 'pdf'));
      setTone('success');
      setStatus('PDF generated and downloaded.');
    } catch {
      setTone('error');
      setStatus('Failed to convert JPG to PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame title="JPG To PDF" onBack={onBack}>
      <SectionHeader title="Single JPG to PDF" subtitle="Upload one JPG and download a PDF in original dimensions." />
      <div className="row">
        <FileInput accept="image/jpeg" onSelect={onSelectFile} label={file ? file.name : 'Select JPG'} />
        <button className="btn" onClick={convert} disabled={busy}>{busy ? 'Converting...' : 'Convert & Download'}</button>
      </div>
      <FileInfoCard file={file} />
      {inputPreview ? (
        <div className="output-grid" style={{ marginTop: 12 }}>
          <ImagePreview title="Input Preview" src={inputPreview} />
        </div>
      ) : null}
      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}
