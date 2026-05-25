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

export default function CropImageTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [src, setSrc] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');

  const onFile = async (picked) => {
    setFile(picked);
    setPreview('');
    if (!picked) return;
    const dataUrl = await readAsDataUrl(picked);
    const image = await loadImage(dataUrl);
    setSrc(dataUrl);
    setCrop({ x: 0, y: 0, w: image.width, h: image.height });
    setTone('muted');
    setStatus(`Loaded image ${image.width} x ${image.height}px.`);
  };

  const runCrop = async () => {
    if (!file || !src) {
      setTone('error');
      setStatus('Select an image first.');
      return;
    }

    const { x, y, w, h } = crop;
    if (w <= 0 || h <= 0) {
      setTone('error');
      setStatus('Crop width and height must be greater than 0.');
      return;
    }

    const image = await loadImage(src);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(image, x, y, w, h, 0, 0, w, h);
    setPreview(canvas.toDataURL('image/png'));
    setTone('success');
    setStatus('Crop completed.');
  };

  return (
    <ToolFrame title="Crop Image" onBack={onBack}>
      <SectionHeader title="Crop By Coordinates" subtitle="Set x/y/width/height and crop instantly." />
      <div className="row" style={{ alignItems: 'center' }}>
        <FileInput accept="image/*" onSelect={onFile} label={file ? file.name : 'Select Image'} />
        <button className="btn" onClick={runCrop}>Crop</button>
      </div>

      {src ? <img src={src} alt="Original" className="thumb" style={{ width: '100%', maxWidth: 380, height: 'auto', marginTop: 12 }} /> : null}

      <div className="row" style={{ marginTop: 12 }}>
        <div style={{ width: 100 }}><label className="label">X</label><input className="input" type="number" value={crop.x} onChange={(e) => setCrop((prev) => ({ ...prev, x: Number(e.target.value) }))} /></div>
        <div style={{ width: 100 }}><label className="label">Y</label><input className="input" type="number" value={crop.y} onChange={(e) => setCrop((prev) => ({ ...prev, y: Number(e.target.value) }))} /></div>
        <div style={{ width: 120 }}><label className="label">Width</label><input className="input" type="number" value={crop.w} onChange={(e) => setCrop((prev) => ({ ...prev, w: Number(e.target.value) }))} /></div>
        <div style={{ width: 120 }}><label className="label">Height</label><input className="input" type="number" value={crop.h} onChange={(e) => setCrop((prev) => ({ ...prev, h: Number(e.target.value) }))} /></div>
      </div>

      {preview ? (
        <div style={{ marginTop: 12 }}>
          <img src={preview} alt="Cropped result" className="thumb" style={{ width: '100%', maxWidth: 320, height: 'auto' }} />
          <div style={{ marginTop: 8 }}><button className="btn alt" onClick={() => downloadDataUrl(preview, randomFilename('cropped', 'png'))}>Download</button></div>
        </div>
      ) : null}

      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}
