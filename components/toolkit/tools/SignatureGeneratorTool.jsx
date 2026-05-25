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

export default function SignatureGeneratorTool({ onBack }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const [lineWidth, setLineWidth] = useState(3);
  const [lineColor, setLineColor] = useState('#111827');
  const [format, setFormat] = useState('png');
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const onPointerDown = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    const point = getPoint(event);
    drawingRef.current = true;
    lastRef.current = point;
  };

  const onPointerMove = (event) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = getPoint(event);
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastRef.current = point;
  };

  const onPointerUp = () => {
    drawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setTone('muted');
    setStatus('Canvas cleared.');
  };

  const downloadSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let dataUrl = '';
    if (format === 'jpg') {
      const tmp = document.createElement('canvas');
      tmp.width = canvas.width;
      tmp.height = canvas.height;
      const tctx = tmp.getContext('2d');
      tctx.fillStyle = '#ffffff';
      tctx.fillRect(0, 0, tmp.width, tmp.height);
      tctx.drawImage(canvas, 0, 0);
      dataUrl = tmp.toDataURL('image/jpeg', 0.95);
    } else if (format === 'webp') {
      dataUrl = canvas.toDataURL('image/webp', 0.95);
    } else {
      dataUrl = canvas.toDataURL('image/png');
    }

    downloadDataUrl(dataUrl, randomFilename('signature', format));
    setTone('success');
    setStatus(`Signature downloaded as ${format.toUpperCase()}.`);
  };

  return (
    <ToolFrame title="Signature Generator" onBack={onBack}>
      <SectionHeader title="Draw Signature" subtitle="Draw with mouse or touch and save as image format." />
      <div className="row" style={{ alignItems: 'end' }}>
        <div style={{ width: 160 }}>
          <label className="label">Pen Color</label>
          <input className="input" type="color" value={lineColor} onChange={(e) => setLineColor(e.target.value)} />
        </div>
        <div style={{ width: 160 }}>
          <label className="label">Pen Size</label>
          <input className="input" type="range" min="1" max="12" value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} />
        </div>
        <div style={{ width: 140 }}>
          <label className="label">Format</label>
          <select className="select" value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
            <option value="webp">WEBP</option>
          </select>
        </div>
        <button className="btn ghost" onClick={clearCanvas}>Clear</button>
        <button className="btn alt" onClick={downloadSignature}>Download Signature</button>
      </div>

      <div style={{ marginTop: 12, border: '1px solid var(--line)', borderRadius: 12, background: '#fff', padding: 10 }}>
        <canvas
          ref={canvasRef}
          width={1000}
          height={320}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={{ width: '100%', height: 220, display: 'block', borderRadius: 8, background: '#ffffff', touchAction: 'none', cursor: 'crosshair' }}
        />
      </div>

      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}
