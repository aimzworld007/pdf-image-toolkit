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

export default function BackgroundRemoverTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [sourcePreview, setSourcePreview] = useState('');
  const [result, setResult] = useState('');
  const [mode, setMode] = useState('auto');
  const [pickedColor, setPickedColor] = useState('#ffffff');
  const [replacementMode, setReplacementMode] = useState('transparent');
  const [replacementColor, setReplacementColor] = useState('#ffffff');
  const [tolerance, setTolerance] = useState(58);
  const [softness, setSoftness] = useState(24);
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');
  const [busy, setBusy] = useState(false);

  const onSelectFile = async (picked) => {
    setFile(picked);
    setSourcePreview('');
    setResult('');
    setStatus('');
    setTone('muted');
    if (!picked) return;
    setSourcePreview(await readAsDataUrl(picked));
  };

  const estimateBackground = (imageData, width, height) => {
    if (mode === 'manual') return hexToRgb(pickedColor);

    const sample = Math.max(4, Math.round(Math.min(width, height) * 0.08));
    const zones = [
      [0, 0],
      [width - sample, 0],
      [0, height - sample],
      [width - sample, height - sample],
    ];
    const total = { r: 0, g: 0, b: 0, count: 0 };

    zones.forEach(([startX, startY]) => {
      for (let y = startY; y < startY + sample; y += 1) {
        for (let x = startX; x < startX + sample; x += 1) {
          const i = (y * width + x) * 4;
          total.r += imageData[i];
          total.g += imageData[i + 1];
          total.b += imageData[i + 2];
          total.count += 1;
        }
      }
    });

    return {
      r: Math.round(total.r / total.count),
      g: Math.round(total.g / total.count),
      b: Math.round(total.b / total.count),
    };
  };

  const removeBackground = async () => {
    if (!sourcePreview) {
      setTone('error');
      setStatus('Please select an image first.');
      return;
    }

    try {
      setBusy(true);
      const image = await loadImage(sourcePreview);
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frame.data;
      const bg = estimateBackground(data, canvas.width, canvas.height);
      const replacement = hexToRgb(replacementColor);
      const lower = Math.max(0, tolerance - softness);
      const upper = tolerance + softness;

      for (let i = 0; i < data.length; i += 4) {
        const dr = data[i] - bg.r;
        const dg = data[i + 1] - bg.g;
        const db = data[i + 2] - bg.b;
        const distance = Math.sqrt(dr * dr + dg * dg + db * db);
        const keep = clamp((distance - lower) / Math.max(1, upper - lower), 0, 1);
        const alpha = Math.round(keep * 255);

        if (replacementMode === 'color') {
          data[i] = Math.round(data[i] * keep + replacement.r * (1 - keep));
          data[i + 1] = Math.round(data[i + 1] * keep + replacement.g * (1 - keep));
          data[i + 2] = Math.round(data[i + 2] * keep + replacement.b * (1 - keep));
          data[i + 3] = 255;
        } else {
          data[i + 3] = Math.min(data[i + 3], alpha);
        }
      }

      ctx.putImageData(frame, 0, 0);
      setResult(canvas.toDataURL('image/png'));
      setTone('success');
      setStatus(`Background removed using ${mode === 'auto' ? 'corner sampling' : 'manual color'}.`);
    } catch {
      setTone('error');
      setStatus('Background removal failed for this image.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame title="Background Remover" onBack={onBack}>
      <SectionHeader title="Background Remover" subtitle="Remove plain or studio backgrounds, then export transparent PNG or a replacement color." />
      <div className="row">
        <FileInput accept="image/*" onSelect={onSelectFile} label={file ? file.name : 'Select Image'} />
        <button className="btn" onClick={removeBackground} disabled={busy}>{busy ? 'Processing...' : 'Remove Background'}</button>
        {result ? <button className="btn alt" onClick={() => downloadDataUrl(result, randomFilename('background_removed', 'png'))}>Download PNG</button> : null}
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <div style={{ width: 180 }}>
          <label className="label">Detection</label>
          <select className="select" value={mode} onChange={(event) => setMode(event.target.value)}>
            <option value="auto">Auto corners</option>
            <option value="manual">Manual color</option>
          </select>
        </div>
        <div style={{ width: 140 }}>
          <label className="label">Background Color</label>
          <input className="input" type="color" value={pickedColor} onChange={(event) => setPickedColor(event.target.value)} disabled={mode !== 'manual'} />
        </div>
        <div style={{ width: 160 }}>
          <label className="label">Tolerance: {tolerance}</label>
          <input className="input" type="range" min="10" max="150" value={tolerance} onChange={(event) => setTolerance(Number(event.target.value))} />
        </div>
        <div style={{ width: 160 }}>
          <label className="label">Soft Edge: {softness}</label>
          <input className="input" type="range" min="0" max="80" value={softness} onChange={(event) => setSoftness(Number(event.target.value))} />
        </div>
        <div style={{ width: 180 }}>
          <label className="label">Output</label>
          <select className="select" value={replacementMode} onChange={(event) => setReplacementMode(event.target.value)}>
            <option value="transparent">Transparent PNG</option>
            <option value="color">Replace with color</option>
          </select>
        </div>
        <div style={{ width: 140 }}>
          <label className="label">Replacement</label>
          <input className="input" type="color" value={replacementColor} onChange={(event) => setReplacementColor(event.target.value)} disabled={replacementMode !== 'color'} />
        </div>
      </div>

      <FileInfoCard file={file} />
      <div className="output-grid" style={{ marginTop: 12 }}>
        <ImagePreview title="Original" src={sourcePreview} />
        {result ? (
          <div>
            <p className="label">Result</p>
            <img
              src={result}
              alt="Background removed result"
              className="thumb"
              style={{
                width: '100%',
                height: 'auto',
                background: 'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 20px 20px',
              }}
            />
          </div>
        ) : null}
      </div>
      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}
