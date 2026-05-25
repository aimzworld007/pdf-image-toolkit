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

export default function ImageEnhanceTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [sharpness, setSharpness] = useState(0);
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');

  const onFile = async (picked) => {
    setFile(picked);
    setResult('');
    if (!picked) return;
    const dataUrl = await readAsDataUrl(picked);
    setSrc(dataUrl);
    setStatus('Image loaded. Adjust controls and apply enhancements.');
    setTone('muted');
  };

  const applyEnhance = async () => {
    if (!src) {
      setTone('error');
      setStatus('Please select an image first.');
      return;
    }
    const image = await loadImage(src);
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(image, 0, 0);
    applySharpenToCanvas(canvas, sharpness);
    setResult(canvas.toDataURL('image/jpeg', 0.95));
    setTone('success');
    setStatus('Enhancement applied.');
  };

  return (
    <ToolFrame title="Image Enhance" onBack={onBack}>
      <SectionHeader title="Enhance Photos" subtitle="Brightness, contrast, saturation, and sharpness controls." />
      <div className="row">
        <FileInput accept="image/*" onSelect={onFile} label={file ? file.name : 'Select Image'} />
        <button className="btn" onClick={applyEnhance}>Apply Enhance</button>
      </div>
      <FileInfoCard file={file} />

      <div className="row" style={{ marginTop: 12 }}>
        <div style={{ minWidth: 190 }}>
          <label className="label">Brightness: {brightness}%</label>
          <input className="input" type="range" min="50" max="180" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} />
        </div>
        <div style={{ minWidth: 190 }}>
          <label className="label">Contrast: {contrast}%</label>
          <input className="input" type="range" min="50" max="180" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} />
        </div>
        <div style={{ minWidth: 190 }}>
          <label className="label">Saturation: {saturation}%</label>
          <input className="input" type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} />
        </div>
        <div style={{ minWidth: 190 }}>
          <label className="label">Sharpness: {sharpness}</label>
          <input className="input" type="range" min="0" max="3" step="1" value={sharpness} onChange={(e) => setSharpness(Number(e.target.value))} />
        </div>
      </div>

      {(src || result) ? (
        <div className="output-grid" style={{ marginTop: 12 }}>
          {src ? (
            <div>
              <p className="label">Original</p>
              <img src={src} alt="Original" className="thumb" style={{ width: '100%', height: 'auto' }} />
            </div>
          ) : null}
          {result ? (
            <div>
              <p className="label">Enhanced</p>
              <img src={result} alt="Enhanced" className="thumb" style={{ width: '100%', height: 'auto' }} />
              <button className="btn alt" style={{ marginTop: 8 }} onClick={() => downloadDataUrl(result, randomFilename('enhanced', 'jpg'))}>Download Enhanced</button>
            </div>
          ) : null}
        </div>
      ) : null}

      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}
