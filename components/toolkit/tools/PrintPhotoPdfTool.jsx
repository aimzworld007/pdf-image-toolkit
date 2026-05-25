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

export default function PrintPhotoPdfTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [sourcePreview, setSourcePreview] = useState('');
  const [quantity, setQuantity] = useState(30);
  const [previewPage, setPreviewPage] = useState('');
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');
  const [busy, setBusy] = useState(false);

  const PHOTO_W_MM = 35;
  const PHOTO_H_MM = 45;
  const COLS = 5;
  const PAGE = getPageSizeMm('A4');
  const MARGIN_MM = 7;
  const VERTICAL_GAP_MM = 3;

  const layout = useMemo(() => {
    const usableW = Math.max(0, PAGE.width - MARGIN_MM * 2);
    const usableH = Math.max(0, PAGE.height - MARGIN_MM * 2);
    const cols = COLS;
    const horizontalGap = cols > 1 ? Math.max(0, (usableW - cols * PHOTO_W_MM) / (cols - 1)) : 0;
    const rows = Math.max(1, Math.floor((usableH + VERTICAL_GAP_MM) / (PHOTO_H_MM + VERTICAL_GAP_MM)));
    const perPage = Math.max(1, cols * rows);
    const pages = Math.max(1, Math.ceil(quantity / perPage));
    return {
      page: PAGE,
      cols,
      rows,
      perPage,
      pages,
      horizontalGap,
      verticalGap: VERTICAL_GAP_MM,
      usableW,
      usableH,
    };
  }, [quantity]);

  const onSelectFile = async (picked) => {
    setFile(picked);
    setSourcePreview('');
    setPreviewPage('');
    if (!picked) return;
    const src = await readAsDataUrl(picked);
    setSourcePreview(src);
    setStatus('Photo loaded. Configure layout and generate printable PDF.');
    setTone('muted');
  };

  useEffect(() => {
    let cancelled = false;
    const drawPreview = async () => {
      if (!sourcePreview) {
        setPreviewPage('');
        return;
      }

      const canvas = document.createElement('canvas');
      const previewW = 620;
      const previewH = Math.round(previewW * (layout.page.height / layout.page.width));
      canvas.width = previewW;
      canvas.height = previewH;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#d1d5db';
      ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);

      const scaleX = canvas.width / layout.page.width;
      const scaleY = canvas.height / layout.page.height;

      const cellW = PHOTO_W_MM * scaleX;
      const cellH = PHOTO_H_MM * scaleY;
      const gapX = layout.horizontalGap * scaleX;
      const gapY = layout.verticalGap * scaleY;
      const marginX = MARGIN_MM * scaleX;
      const marginY = MARGIN_MM * scaleY;

      const image = await loadImage(sourcePreview);
      for (let row = 0; row < layout.rows; row += 1) {
        for (let col = 0; col < layout.cols; col += 1) {
          const x = marginX + col * (cellW + gapX);
          const y = marginY + row * (cellH + gapY);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(x, y, cellW, cellH);
          ctx.strokeStyle = '#94a3b8';
          ctx.strokeRect(x, y, cellW, cellH);

          const fit = fitContain(cellW, cellH, image.width, image.height);
          ctx.drawImage(image, x + fit.xOffset, y + fit.yOffset, fit.width, fit.height);
        }
      }

      if (!cancelled) {
        setPreviewPage(canvas.toDataURL('image/jpeg', 0.9));
      }
    };

    drawPreview();
    return () => {
      cancelled = true;
    };
  }, [sourcePreview, layout]);

  const buildPdfBlob = async () => {
    if (!file) {
      throw new Error('Please select image first');
    }

    const pdf = await PDFDocument.create();
    const imgDataUrl = await readAsDataUrl(file);
    const image = file.type === 'image/png' ? await pdf.embedPng(imgDataUrl) : await pdf.embedJpg(imgDataUrl);

    const pageSizePt = layout.page.points;
    const marginPt = mmToPt(MARGIN_MM);
    const horizontalGapPt = mmToPt(layout.horizontalGap);
    const verticalGapPt = mmToPt(layout.verticalGap);
    const slotWPt = mmToPt(PHOTO_W_MM);
    const slotHPt = mmToPt(PHOTO_H_MM);

    let placed = 0;
    while (placed < quantity) {
      const page = pdf.addPage(pageSizePt);
      for (let row = 0; row < layout.rows; row += 1) {
        for (let col = 0; col < layout.cols; col += 1) {
          if (placed >= quantity) break;
          const x = marginPt + col * (slotWPt + horizontalGapPt);
          const topY = marginPt + row * (slotHPt + verticalGapPt);
          const y = page.getHeight() - topY - slotHPt;

          const fit = fitContain(slotWPt, slotHPt, image.width, image.height);
          page.drawRectangle({ x, y, width: slotWPt, height: slotHPt, borderWidth: 0.4, borderColor: rgb(0.65, 0.69, 0.76) });
          page.drawImage(image, {
            x: x + fit.xOffset,
            y: y + fit.yOffset,
            width: fit.width,
            height: fit.height,
          });
          placed += 1;
        }
      }
    }

    const bytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
    return new Blob([bytes], { type: 'application/pdf' });
  };

  const generateAndDownload = async () => {
    if (!file) {
      setTone('error');
      setStatus('Please select a photo first.');
      return;
    }
    try {
      setBusy(true);
      const blob = await buildPdfBlob();
      downloadBlob(blob, randomFilename('print_photo_sheet', 'pdf'));
      setTone('success');
      setStatus(`PDF ready. ${layout.perPage} photos/page, ${layout.pages} page(s).`);
    } catch {
      setTone('error');
      setStatus('Failed to generate print PDF.');
    } finally {
      setBusy(false);
    }
  };

  const openForPrint = async () => {
    if (!file) {
      setTone('error');
      setStatus('Please select a photo first.');
      return;
    }
    try {
      setBusy(true);
      const blob = await buildPdfBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setTone('success');
      setStatus('Opened printable PDF preview in new tab.');
    } catch {
      setTone('error');
      setStatus('Could not open print preview.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame title="Print Photo PDF" onBack={onBack}>
      <SectionHeader
        title="Passport Photo Print Sheet"
        subtitle="Upload one photo, enter quantity, and auto-fill A4 pages row-wise (5 per row) in 35x45mm size."
      />
      <div className="row">
        <FileInput accept="image/jpeg,image/png" onSelect={onSelectFile} label={file ? file.name : 'Select Photo'} />
        <div style={{ width: 130 }}>
          <label className="label">Quantity</label>
          <input className="input" type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} />
        </div>
        <button className="btn" onClick={generateAndDownload} disabled={busy}>{busy ? 'Building...' : 'Download Print PDF'}</button>
        <button className="btn alt" onClick={openForPrint} disabled={busy}>{busy ? 'Opening...' : 'Open Print Preview'}</button>
      </div>

      <FileInfoCard file={file} />

      <div style={{ marginTop: 10 }}>
        <span className="kpi" style={{ marginRight: 8 }}>A4 Page</span>
        <span className="kpi" style={{ marginRight: 8 }}>35x45 mm</span>
        <span className="kpi" style={{ marginRight: 8 }}>{layout.cols} columns</span>
        <span className="kpi" style={{ marginRight: 8 }}>{layout.rows} rows</span>
        <span className="kpi" style={{ marginRight: 8 }}>{layout.perPage} photos/page</span>
        <span className="kpi">{layout.pages} page(s) needed</span>
      </div>

      <div className="output-grid" style={{ marginTop: 12 }}>
        <ImagePreview title="Photo Input" src={sourcePreview} />
        <ImagePreview title="Page Layout Preview (Page 1)" src={previewPage} />
      </div>

      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}
