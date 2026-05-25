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

export default function CompressJpgTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState('');
  const [quality, setQuality] = useState(0.8);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');

  const compress = async () => {
    if (!file) {
      setTone('error');
      setStatus('Please select a JPG file.');
      return;
    }

    const img = await loadImage(await readAsDataUrl(file));
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    const url = canvas.toDataURL('image/jpeg', quality);
    setPreview(url);
    setTone('success');
    setStatus(`Original: ${(file.size / 1024).toFixed(1)} KB. Estimated new: ${(url.length * 0.75 / 1024).toFixed(1)} KB.`);
  };

  const onSelectFile = async (picked) => {
    setFile(picked);
    setPreview('');
    setOriginalPreview('');
    if (!picked) return;
    setOriginalPreview(await readAsDataUrl(picked));
  };

  return (
    <ToolFrame title="Compress JPG" onBack={onBack}>
      <SectionHeader title="JPG Compressor" subtitle="Client-side quality-based compression." />
      <div className="row" style={{ alignItems: 'center' }}>
        <FileInput accept="image/jpeg" onSelect={onSelectFile} label={file ? file.name : 'Select JPG'} />
        <div style={{ minWidth: 220 }}>
          <label className="label">Quality: {quality.toFixed(1)}</label>
          <input className="input" type="range" min="0.1" max="1" step="0.1" value={quality} onChange={(e) => setQuality(Number(e.target.value))} />
        </div>
        <button className="btn" onClick={compress}>Compress</button>
      </div>
      <FileInfoCard file={file} />

      {(originalPreview || preview) ? (
        <div className="output-grid" style={{ marginTop: 12 }}>
          <ImagePreview title="Original" src={originalPreview} />
          <div>
            <ImagePreview title="Compressed" src={preview} />
            {preview ? (
              <button className="btn alt" style={{ marginTop: 8 }} onClick={() => downloadDataUrl(preview, randomFilename('compressed', 'jpg'))}>Download JPG</button>
            ) : null}
          </div>
        </div>
      ) : null}

      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}
