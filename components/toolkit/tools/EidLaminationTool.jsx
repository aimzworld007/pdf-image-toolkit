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

function EidPhotoEditor({ side, data, setData, targetWidthIn, targetHeightIn, ratio }) {
  const [busy, setBusy] = useState(false);

  const onFile = async (file) => {
    if (!file) return;
    const src = await readAsDataUrl(file);
    const img = await loadImage(src);
    setData((prev) => ({
      ...prev,
      file,
      src,
      rotation: 0,
      crop: { x: 0, y: 0, w: img.width, h: img.height },
      fitMode: prev.fitMode || 'crop',
      processed: '',
      status: `Loaded ${img.width} x ${img.height}px`,
      tone: 'muted',
    }));
  };

  const process = async () => {
    if (!data.src) {
      setData((prev) => ({ ...prev, tone: 'error', status: 'Please upload an image first.' }));
      return;
    }

    const { x, y, w, h } = data.crop;
    const isCropMode = (data.fitMode || 'crop') === 'crop';
    if (isCropMode && (w <= 10 || h <= 10)) {
      setData((prev) => ({ ...prev, tone: 'error', status: 'Crop size must be greater than 10px.' }));
      return;
    }

    try {
      setBusy(true);
      const source = await loadImage(data.src);
      const rotatedCanvas = document.createElement('canvas');
      rotatedCanvas.width = source.width;
      rotatedCanvas.height = source.height;
      const rCtx = rotatedCanvas.getContext('2d');
      rCtx.translate(source.width / 2, source.height / 2);
      rCtx.rotate((data.rotation * Math.PI) / 180);
      rCtx.drawImage(source, -source.width / 2, -source.height / 2);
      rCtx.setTransform(1, 0, 0, 1, 0, 0);

      const targetW = Math.round(targetWidthIn * 600);
      const targetH = Math.round(targetHeightIn * 600);
      const output = document.createElement('canvas');
      output.width = targetW;
      output.height = targetH;
      const outCtx = output.getContext('2d');
      outCtx.fillStyle = '#ffffff';
      outCtx.fillRect(0, 0, targetW, targetH);

      if (isCropMode) {
        let finalCropW;
        let finalCropH;
        if (w / h > ratio) {
          finalCropH = h;
          finalCropW = finalCropH * ratio;
        } else {
          finalCropW = w;
          finalCropH = finalCropW / ratio;
        }

        const finalCropX = x + (w - finalCropW) / 2;
        const finalCropY = y + (h - finalCropH) / 2;

        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = finalCropW;
        croppedCanvas.height = finalCropH;
        croppedCanvas.getContext('2d').drawImage(
          rotatedCanvas,
          finalCropX,
          finalCropY,
          finalCropW,
          finalCropH,
          0,
          0,
          finalCropW,
          finalCropH
        );
        outCtx.drawImage(croppedCanvas, 0, 0, targetW, targetH);
      } else {
        const fit = fitContain(targetW, targetH, rotatedCanvas.width, rotatedCanvas.height);
        outCtx.drawImage(
          rotatedCanvas,
          fit.xOffset,
          fit.yOffset,
          fit.width,
          fit.height
        );
      }

      setData((prev) => ({
        ...prev,
        processed: output.toDataURL('image/png', 1.0),
        tone: 'success',
        status: `Processed at ${targetW} x ${targetH}px (${isCropMode ? 'Crop to Fill' : 'Auto Fit'}).`,
      }));
    } catch {
      setData((prev) => ({ ...prev, tone: 'error', status: 'Processing failed for this side.' }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel" style={{ padding: 14 }}>
      <h3 style={{ marginTop: 0 }}>{side}</h3>
      <div className="row" style={{ alignItems: 'center' }}>
        <FileInput accept="image/*" onSelect={onFile} label={data.file ? data.file.name : 'Upload'} />
        <button className="btn" onClick={process} disabled={busy}>{busy ? 'Processing...' : 'Process Side'}</button>
      </div>

      {data.src ? <img src={data.src} alt={`${side} source`} className="thumb" style={{ marginTop: 10, width: '100%', height: 180, objectFit: 'contain', background: '#f8fafc' }} /> : null}

      <div className="row" style={{ marginTop: 10 }}>
        <div style={{ minWidth: 130 }}>
          <label className="label">Rotation: {data.rotation.toFixed(1)}°</label>
          <input className="input" type="range" min="-180" max="180" step="0.1" value={data.rotation} onChange={(e) => setData((prev) => ({ ...prev, rotation: Number(e.target.value), processed: '' }))} />
        </div>
        <div style={{ minWidth: 230 }}>
          <label className="label">Fit Option</label>
          <select
            className="select"
            value={data.fitMode || 'crop'}
            onChange={(e) => setData((prev) => ({ ...prev, fitMode: e.target.value, processed: '' }))}
          >
            <option value="crop">Crop to Fill Target Size</option>
            <option value="autofit">Auto Fit Full Image</option>
          </select>
        </div>
      </div>

      {(data.fitMode || 'crop') === 'crop' ? (
        <div className="row" style={{ marginTop: 8 }}>
          <div style={{ width: 90 }}><label className="label">X</label><input className="input" type="number" value={data.crop.x} onChange={(e) => setData((prev) => ({ ...prev, crop: { ...prev.crop, x: Number(e.target.value) }, processed: '' }))} /></div>
          <div style={{ width: 90 }}><label className="label">Y</label><input className="input" type="number" value={data.crop.y} onChange={(e) => setData((prev) => ({ ...prev, crop: { ...prev.crop, y: Number(e.target.value) }, processed: '' }))} /></div>
          <div style={{ width: 110 }}><label className="label">Width</label><input className="input" type="number" value={data.crop.w} onChange={(e) => setData((prev) => ({ ...prev, crop: { ...prev.crop, w: Number(e.target.value) }, processed: '' }))} /></div>
          <div style={{ width: 110 }}><label className="label">Height</label><input className="input" type="number" value={data.crop.h} onChange={(e) => setData((prev) => ({ ...prev, crop: { ...prev.crop, h: Number(e.target.value) }, processed: '' }))} /></div>
        </div>
      ) : (
        <p className="status" style={{ marginTop: 8 }}>
          Auto Fit mode uses the full image and fits it into target size without manual crop.
        </p>
      )}

      {data.processed ? (
        <div style={{ marginTop: 10 }}>
          <img src={data.processed} alt={`${side} processed`} className="thumb" style={{ width: '100%', height: 160, objectFit: 'contain', background: '#f8fafc' }} />
          <div style={{ marginTop: 8 }}>
            <button className="btn alt" onClick={() => downloadDataUrl(data.processed, randomFilename(side.toLowerCase().replace(' ', '_'), 'png'))}>Download PNG</button>
          </div>
        </div>
      ) : null}

      <Status message={data.status} tone={data.tone} />
    </div>
  );
}

export default function EidLaminationTool({ onBack }) {
  const [widthIn, setWidthIn] = useState(3.2);
  const [heightIn, setHeightIn] = useState(2.2);
  const [front, setFront] = useState({ file: null, src: '', crop: { x: 0, y: 0, w: 0, h: 0 }, rotation: 0, fitMode: 'crop', processed: '', status: '', tone: 'muted' });
  const [back, setBack] = useState({ file: null, src: '', crop: { x: 0, y: 0, w: 0, h: 0 }, rotation: 0, fitMode: 'crop', processed: '', status: '', tone: 'muted' });
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');

  const ratio = useMemo(() => {
    if (heightIn <= 0) return 1;
    return widthIn / heightIn;
  }, [widthIn, heightIn]);

  const generatePdf = async () => {
    if (!front.processed || !back.processed) {
      setTone('error');
      setStatus('Please process both front and back images first.');
      return;
    }

    try {
      const pdf = await PDFDocument.create();
      const page = pdf.addPage(PageSizes.A4);

      const frontImage = await pdf.embedPng(front.processed);
      const backImage = await pdf.embedPng(back.processed);

      const imageWmm = widthIn * 25.4;
      const imageHmm = heightIn * 25.4;
      const gapMm = 8;

      const imageW = mmToPt(imageWmm);
      const imageH = mmToPt(imageHmm);
      const gap = mmToPt(gapMm);

      const pageW = page.getWidth();
      const pageH = page.getHeight();
      const totalH = imageH * 2 + gap;
      const startX = (pageW - imageW) / 2;
      const startY = (pageH - totalH) / 2;

      page.drawImage(frontImage, { x: startX, y: startY + imageH + gap, width: imageW, height: imageH });
      page.drawImage(backImage, { x: startX, y: startY, width: imageW, height: imageH });

      page.drawRectangle({ x: startX, y: startY + imageH + gap, width: imageW, height: imageH, borderWidth: 0.8, borderColor: rgb(0, 0, 0) });
      page.drawRectangle({ x: startX, y: startY, width: imageW, height: imageH, borderWidth: 0.8, borderColor: rgb(0, 0, 0) });

      downloadBlob(new Blob([await pdf.save()], { type: 'application/pdf' }), 'EID-Lamination-Printout-A4.pdf');
      setTone('success');
      setStatus('A4 lamination PDF generated and downloaded.');
    } catch {
      setTone('error');
      setStatus('Failed to generate lamination PDF.');
    }
  };

  return (
    <ToolFrame title="EID Lamination Tool" onBack={onBack}>
      <SectionHeader title="High-DPI EID Lamination" subtitle="Process front and back, then export a centered A4 print PDF." />

      <div className="row" style={{ marginBottom: 10 }}>
        <div style={{ width: 170 }}>
          <label className="label">Target Width (inches)</label>
          <input className="input" type="number" min="0.1" step="0.1" value={widthIn} onChange={(e) => setWidthIn(Number(e.target.value) || 0)} />
        </div>
        <div style={{ width: 170 }}>
          <label className="label">Target Height (inches)</label>
          <input className="input" type="number" min="0.1" step="0.1" value={heightIn} onChange={(e) => setHeightIn(Number(e.target.value) || 0)} />
        </div>
        <div style={{ display: 'grid', alignContent: 'end' }}>
          <span className="kpi">Ratio: {ratio.toFixed(4)}</span>
        </div>
      </div>

      <div className="eid-grid">
        <EidPhotoEditor side="EID Front Side" data={front} setData={setFront} targetWidthIn={widthIn} targetHeightIn={heightIn} ratio={ratio} />
        <EidPhotoEditor side="EID Back Side" data={back} setData={setBack} targetWidthIn={widthIn} targetHeightIn={heightIn} ratio={ratio} />
      </div>

      <div style={{ marginTop: 14 }}>
        <button className="btn alt" onClick={generatePdf}>Generate A4 Lamination PDF</button>
      </div>
      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}
