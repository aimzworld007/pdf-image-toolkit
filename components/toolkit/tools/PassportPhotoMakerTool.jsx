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

export default function PassportPhotoMakerTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [sourcePreview, setSourcePreview] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [sheetPreview, setSheetPreview] = useState('');
  const [presetId, setPresetId] = useState('uae');
  const [widthMm, setWidthMm] = useState(35);
  const [heightMm, setHeightMm] = useState(45);
  const [dpi, setDpi] = useState(600);
  const [background, setBackground] = useState('#ffffff');
  const [fitMode, setFitMode] = useState('cover');
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [quantity, setQuantity] = useState(8);
  const [paperId, setPaperId] = useState('A4');
  const [marginMm, setMarginMm] = useState(8);
  const [gapMm, setGapMm] = useState(3);
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');
  const [busy, setBusy] = useState(false);

  const paper = PAPER_SIZES[paperId] || PAPER_SIZES.A4;
  const perPage = useMemo(() => {
    const cols = Math.max(1, Math.floor((paper.widthMm - marginMm * 2 + gapMm) / (widthMm + gapMm)));
    const rows = Math.max(1, Math.floor((paper.heightMm - marginMm * 2 + gapMm) / (heightMm + gapMm)));
    return { cols, rows, count: cols * rows, pages: Math.ceil(quantity / Math.max(1, cols * rows)) };
  }, [paper, widthMm, heightMm, marginMm, gapMm, quantity]);

  const applyPreset = (nextPresetId) => {
    const preset = PASSPORT_PRESETS.find((item) => item.id === nextPresetId) || PASSPORT_PRESETS[0];
    setPresetId(nextPresetId);
    if (preset.id !== 'custom') {
      setWidthMm(preset.widthMm);
      setHeightMm(preset.heightMm);
      setDpi(preset.dpi);
      setBackground(preset.bg);
    }
    setPhotoPreview('');
    setSheetPreview('');
  };

  const onSelectFile = async (picked) => {
    setFile(picked);
    setSourcePreview('');
    setPhotoPreview('');
    setSheetPreview('');
    setStatus('');
    setTone('muted');
    if (!picked) return;
    setSourcePreview(await readAsDataUrl(picked));
  };

  const buildPhotoCanvas = async () => {
    if (!sourcePreview) throw new Error('Please select a photo first.');
    const image = await loadImage(sourcePreview);
    const targetW = Math.max(80, Math.round((widthMm / 25.4) * dpi));
    const targetH = Math.max(80, Math.round((heightMm / 25.4) * dpi));
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, targetW, targetH);

    const baseScale = fitMode === 'contain'
      ? Math.min(targetW / image.width, targetH / image.height)
      : Math.max(targetW / image.width, targetH / image.height);
    const scale = baseScale * zoom;
    const drawW = image.width * scale;
    const drawH = image.height * scale;
    const x = (targetW - drawW) / 2 + (offsetX / 100) * targetW;
    const y = (targetH - drawH) / 2 + (offsetY / 100) * targetH;
    ctx.drawImage(image, x, y, drawW, drawH);
    return canvas;
  };

  const buildSheetPreview = async (photoDataUrl) => {
    const photo = await loadImage(photoDataUrl);
    const scale = 3;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(paper.widthMm * scale);
    canvas.height = Math.round(paper.heightMm * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;

    let placed = 0;
    for (let row = 0; row < perPage.rows; row += 1) {
      for (let col = 0; col < perPage.cols; col += 1) {
        if (placed >= quantity) break;
        const x = (marginMm + col * (widthMm + gapMm)) * scale;
        const y = (marginMm + row * (heightMm + gapMm)) * scale;
        const w = widthMm * scale;
        const h = heightMm * scale;
        ctx.drawImage(photo, x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        placed += 1;
      }
    }

    return canvas.toDataURL('image/jpeg', 0.88);
  };

  const buildPreview = async () => {
    try {
      setBusy(true);
      const canvas = await buildPhotoCanvas();
      const dataUrl = canvas.toDataURL('image/png');
      setPhotoPreview(dataUrl);
      setSheetPreview(await buildSheetPreview(dataUrl));
      setTone('success');
      setStatus(`${widthMm}x${heightMm}mm photo ready. ${perPage.count} per ${paper.label} page.`);
    } catch (error) {
      setTone('error');
      setStatus(error.message || 'Could not build passport photo.');
    } finally {
      setBusy(false);
    }
  };

  const downloadPhoto = async () => {
    try {
      const canvas = await buildPhotoCanvas();
      downloadDataUrl(canvas.toDataURL('image/png'), randomFilename('passport_photo', 'png'));
      setTone('success');
      setStatus('Passport photo PNG downloaded.');
    } catch (error) {
      setTone('error');
      setStatus(error.message || 'Could not download passport photo.');
    }
  };

  const downloadSheetPdf = async () => {
    try {
      setBusy(true);
      const canvas = await buildPhotoCanvas();
      const photoDataUrl = canvas.toDataURL('image/png');
      const pdf = await PDFDocument.create();
      const photo = await pdf.embedPng(photoDataUrl);
      const pageW = mmToPt(paper.widthMm);
      const pageH = mmToPt(paper.heightMm);
      const slotW = mmToPt(widthMm);
      const slotH = mmToPt(heightMm);
      const gap = mmToPt(gapMm);
      const margin = mmToPt(marginMm);
      let placed = 0;

      while (placed < quantity) {
        const page = pdf.addPage([pageW, pageH]);
        for (let row = 0; row < perPage.rows; row += 1) {
          for (let col = 0; col < perPage.cols; col += 1) {
            if (placed >= quantity) break;
            const x = margin + col * (slotW + gap);
            const topY = margin + row * (slotH + gap);
            const y = page.getHeight() - topY - slotH;
            page.drawImage(photo, { x, y, width: slotW, height: slotH });
            page.drawRectangle({ x, y, width: slotW, height: slotH, borderWidth: 0.35, borderColor: rgb(0.65, 0.69, 0.76) });
            placed += 1;
          }
        }
      }

      const bytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), randomFilename('passport_photo_sheet', 'pdf'));
      setTone('success');
      setStatus(`Print sheet PDF downloaded with ${quantity} photo(s).`);
    } catch (error) {
      setTone('error');
      setStatus(error.message || 'Could not generate print sheet.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame title="Passport Photo Maker" onBack={onBack}>
      <SectionHeader title="Passport Photo Maker" subtitle="Choose a country preset, tune crop/background, and export a single photo or print sheet." />
      <div className="row">
        <FileInput accept="image/*" onSelect={onSelectFile} label={file ? file.name : 'Select Portrait'} />
        <button className="btn" onClick={buildPreview} disabled={busy}>{busy ? 'Building...' : 'Build Preview'}</button>
        <button className="btn alt" onClick={downloadPhoto} disabled={!sourcePreview}>Download PNG</button>
        <button className="btn alt" onClick={downloadSheetPdf} disabled={!sourcePreview || busy}>Download Sheet PDF</button>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <div style={{ width: 220 }}>
          <label className="label">Country Preset</label>
          <select className="select" value={presetId} onChange={(event) => applyPreset(event.target.value)}>
            {PASSPORT_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
          </select>
        </div>
        <div style={{ width: 110 }}>
          <label className="label">Width mm</label>
          <input className="input" type="number" min="10" value={widthMm} onChange={(event) => { setPresetId('custom'); setWidthMm(Number(event.target.value) || 35); }} />
        </div>
        <div style={{ width: 110 }}>
          <label className="label">Height mm</label>
          <input className="input" type="number" min="10" value={heightMm} onChange={(event) => { setPresetId('custom'); setHeightMm(Number(event.target.value) || 45); }} />
        </div>
        <div style={{ width: 110 }}>
          <label className="label">DPI</label>
          <select className="select" value={dpi} onChange={(event) => setDpi(Number(event.target.value))}>
            <option value={300}>300</option>
            <option value={600}>600</option>
          </select>
        </div>
        <div style={{ width: 130 }}>
          <label className="label">Background</label>
          <input className="input" type="color" value={background} onChange={(event) => setBackground(event.target.value)} />
        </div>
        <div style={{ width: 130 }}>
          <label className="label">Fit</label>
          <select className="select" value={fitMode} onChange={(event) => setFitMode(event.target.value)}>
            <option value="cover">Crop to fill</option>
            <option value="contain">Fit full image</option>
          </select>
        </div>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <div style={{ width: 170 }}>
          <label className="label">Zoom: {zoom.toFixed(2)}x</label>
          <input className="input" type="range" min="0.6" max="2.2" step="0.02" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
        </div>
        <div style={{ width: 170 }}>
          <label className="label">Move X: {offsetX}</label>
          <input className="input" type="range" min="-50" max="50" value={offsetX} onChange={(event) => setOffsetX(Number(event.target.value))} />
        </div>
        <div style={{ width: 170 }}>
          <label className="label">Move Y: {offsetY}</label>
          <input className="input" type="range" min="-50" max="50" value={offsetY} onChange={(event) => setOffsetY(Number(event.target.value))} />
        </div>
        <div style={{ width: 120 }}>
          <label className="label">Quantity</label>
          <input className="input" type="number" min="1" max="100" value={quantity} onChange={(event) => setQuantity(clamp(Number(event.target.value) || 1, 1, 100))} />
        </div>
        <div style={{ width: 130 }}>
          <label className="label">Paper</label>
          <select className="select" value={paperId} onChange={(event) => setPaperId(event.target.value)}>
            {Object.entries(PAPER_SIZES).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
          </select>
        </div>
        <div style={{ width: 120 }}>
          <label className="label">Margin mm</label>
          <input className="input" type="number" min="0" value={marginMm} onChange={(event) => setMarginMm(Math.max(0, Number(event.target.value) || 0))} />
        </div>
        <div style={{ width: 120 }}>
          <label className="label">Gap mm</label>
          <input className="input" type="number" min="0" value={gapMm} onChange={(event) => setGapMm(Math.max(0, Number(event.target.value) || 0))} />
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <span className="kpi" style={{ marginRight: 8 }}>{perPage.cols} columns</span>
        <span className="kpi" style={{ marginRight: 8 }}>{perPage.rows} rows</span>
        <span className="kpi" style={{ marginRight: 8 }}>{perPage.count} per page</span>
        <span className="kpi">{perPage.pages} page(s)</span>
      </div>

      <FileInfoCard file={file} />
      <div className="output-grid" style={{ marginTop: 12 }}>
        <ImagePreview title="Source" src={sourcePreview} />
        <ImagePreview title="Passport Photo" src={photoPreview} />
        <ImagePreview title="Sheet Preview" src={sheetPreview} />
      </div>
      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}
