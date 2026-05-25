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

export default function QrCodeGeneratorTool({ onBack }) {
  const [text, setText] = useState('https://example.com');
  const [dark, setDark] = useState('#111827');
  const [light, setLight] = useState('#ffffff');
  const [moduleSize, setModuleSize] = useState(12);
  const [pdfSizeMm, setPdfSizeMm] = useState(70);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');

  useEffect(() => {
    try {
      const canvas = drawQrCanvas(text, { dark, light, moduleSize });
      setPreview(canvas.toDataURL('image/png'));
      setTone('muted');
      setStatus('');
    } catch (error) {
      setPreview('');
      setTone('error');
      setStatus(error.message || 'QR code could not be generated.');
    }
  }, [text, dark, light, moduleSize]);

  const downloadPng = () => {
    if (!preview) return;
    downloadDataUrl(preview, randomFilename('qr_code', 'png'));
    setTone('success');
    setStatus('PNG QR code downloaded.');
  };

  const downloadPdf = async () => {
    if (!preview) return;
    try {
      const pdf = await PDFDocument.create();
      const page = pdf.addPage(PageSizes.A4);
      const qr = await pdf.embedPng(preview);
      const sizePt = mmToPt(clamp(pdfSizeMm, 20, 180));
      const x = (page.getWidth() - sizePt) / 2;
      const y = (page.getHeight() - sizePt) / 2;
      page.drawImage(qr, { x, y, width: sizePt, height: sizePt });
      const bytes = await pdf.save({ useObjectStreams: true });
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), randomFilename('qr_code', 'pdf'));
      setTone('success');
      setStatus('PDF QR code downloaded.');
    } catch {
      setTone('error');
      setStatus('Could not export QR code PDF.');
    }
  };

  return (
    <ToolFrame title="QR Code Generator" onBack={onBack}>
      <SectionHeader title="QR Code Generator" subtitle="Create QR codes for links, text, phone numbers, or Wi-Fi notes and export PNG/PDF." />
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 320px' }}>
          <label className="label">QR Content</label>
          <textarea className="input" rows={5} value={text} onChange={(event) => setText(event.target.value)} />
          <div className="row" style={{ marginTop: 10 }}>
            <div style={{ width: 120 }}>
              <label className="label">Dark Color</label>
              <input className="input" type="color" value={dark} onChange={(event) => setDark(event.target.value)} />
            </div>
            <div style={{ width: 120 }}>
              <label className="label">Background</label>
              <input className="input" type="color" value={light} onChange={(event) => setLight(event.target.value)} />
            </div>
            <div style={{ width: 150 }}>
              <label className="label">PNG Detail</label>
              <input className="input" type="number" min="6" max="24" value={moduleSize} onChange={(event) => setModuleSize(clamp(Number(event.target.value) || 12, 6, 24))} />
            </div>
            <div style={{ width: 150 }}>
              <label className="label">PDF Size (mm)</label>
              <input className="input" type="number" min="20" max="180" value={pdfSizeMm} onChange={(event) => setPdfSizeMm(clamp(Number(event.target.value) || 70, 20, 180))} />
            </div>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" onClick={downloadPng} disabled={!preview}>Download PNG</button>
            <button className="btn alt" onClick={downloadPdf} disabled={!preview}>Download PDF</button>
          </div>
        </div>

        <div style={{ width: 260, maxWidth: '100%' }}>
          {preview ? (
            <img src={preview} alt="QR code preview" className="thumb" style={{ width: '100%', height: 'auto', imageRendering: 'pixelated', background: light }} />
          ) : null}
        </div>
      </div>
      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}
