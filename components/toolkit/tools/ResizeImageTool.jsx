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

export default function ResizeImageTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [ratio, setRatio] = useState(null);
  const [keepRatio, setKeepRatio] = useState(true);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');

  const onFile = async (picked) => {
    setFile(picked);
    setPreview('');
    setOriginalPreview('');
    if (!picked) return;
    const src = await readAsDataUrl(picked);
    setOriginalPreview(src);
    const image = await loadImage(src);
    setWidth(String(image.width));
    setHeight(String(image.height));
    setRatio(image.width / image.height);
  };

  const resize = async () => {
    if (!file) {
      setTone('error');
      setStatus('Please choose an image first.');
      return;
    }

    const targetW = Number(width);
    const targetH = Number(height);
    if (!targetW || !targetH || targetW <= 0 || targetH <= 0) {
      setTone('error');
      setStatus('Enter valid width and height.');
      return;
    }

    const image = await loadImage(await readAsDataUrl(file));
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    canvas.getContext('2d').drawImage(image, 0, 0, targetW, targetH);
    const url = canvas.toDataURL(file.type || 'image/png');
    setPreview(url);
    setTone('success');
    setStatus(`Image resized to ${targetW} x ${targetH}px.`);
  };

  const onWidthChange = (next) => {
    setWidth(next);
    if (keepRatio && ratio && next) {
      setHeight(String(Math.round(Number(next) / ratio)));
    }
  };

  const onHeightChange = (next) => {
    setHeight(next);
    if (keepRatio && ratio && next) {
      setWidth(String(Math.round(Number(next) * ratio)));
    }
  };

  return (
    <ToolFrame title="Resize Image" onBack={onBack}>
      <SectionHeader title="Image Resizer" subtitle="Resize to exact dimensions with optional aspect lock." />
      <div className="row" style={{ alignItems: 'center' }}>
        <FileInput accept="image/*" onSelect={onFile} label={file ? file.name : 'Select Image'} />
        <div style={{ minWidth: 150 }}>
          <label className="label">Width (px)</label>
          <input className="input" type="number" value={width} onChange={(e) => onWidthChange(e.target.value)} />
        </div>
        <div style={{ minWidth: 150 }}>
          <label className="label">Height (px)</label>
          <input className="input" type="number" value={height} onChange={(e) => onHeightChange(e.target.value)} />
        </div>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={keepRatio} onChange={(e) => setKeepRatio(e.target.checked)} />
          Keep ratio
        </label>
        <button className="btn" onClick={resize}>Resize</button>
      </div>
      <FileInfoCard file={file} />

      {(originalPreview || preview) ? (
        <div className="output-grid" style={{ marginTop: 12 }}>
          <ImagePreview title="Original" src={originalPreview} />
          <div>
            <ImagePreview title="Resized" src={preview} />
            {preview ? (
              <button className="btn alt" style={{ marginTop: 8 }} onClick={() => downloadDataUrl(preview, randomFilename('resized', (file.type || 'image/png').split('/')[1] || 'png'))}>Download</button>
            ) : null}
          </div>
        </div>
      ) : null}

      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}
