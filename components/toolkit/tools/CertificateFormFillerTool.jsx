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

export default function CertificateFormFillerTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [fileKind, setFileKind] = useState('');
  const [preview, setPreview] = useState('');
  const [pageCount, setPageCount] = useState(1);
  const [fields, setFields] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');
  const [busy, setBusy] = useState(false);

  const selectedField = fields.find((field) => field.id === selectedId) || null;

  const addField = () => {
    const field = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: 'Your text',
      page: 1,
      x: 18,
      y: 25,
      size: 18,
      color: '#111827',
    };
    setFields((prev) => [...prev, field]);
    setSelectedId(field.id);
  };

  const updateField = (patch) => {
    if (!selectedId) return;
    setFields((prev) => prev.map((field) => (field.id === selectedId ? { ...field, ...patch } : field)));
  };

  const removeField = () => {
    if (!selectedId) return;
    setFields((prev) => prev.filter((field) => field.id !== selectedId));
    setSelectedId('');
  };

  const onSelectFile = async (picked) => {
    setFile(picked);
    setPreview('');
    setFields([]);
    setSelectedId('');
    setPageCount(1);
    setStatus('');
    setTone('muted');
    if (!picked) return;

    try {
      if (picked.type === 'application/pdf') {
        const info = await getPdfQuickPreview(picked, 0.8);
        setPreview(info.preview);
        setPageCount(info.pageCount);
        setFileKind('pdf');
      } else {
        setPreview(await readAsDataUrl(picked));
        setPageCount(1);
        setFileKind('image');
      }
      const field = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        text: 'Your text',
        page: 1,
        x: 18,
        y: 25,
        size: 18,
        color: '#111827',
      };
      setFields([field]);
      setSelectedId(field.id);
    } catch {
      setTone('error');
      setStatus('Could not load this PDF or image.');
    }
  };

  const placeSelectedField = (event) => {
    if (!selectedId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    updateField({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)), page: 1 });
  };

  const exportPdf = async () => {
    if (!file) {
      setTone('error');
      setStatus('Please select a PDF or image first.');
      return;
    }
    if (!fields.some((field) => field.text.trim())) {
      setTone('error');
      setStatus('Add at least one text field.');
      return;
    }

    try {
      setBusy(true);
      let pdfDoc;
      let pages;
      if (fileKind === 'pdf') {
        pdfDoc = await PDFDocument.load(await readAsArrayBuffer(file), { ignoreEncryption: true });
        pages = pdfDoc.getPages();
      } else {
        pdfDoc = await PDFDocument.create();
        const { image } = await embedImageFromFile(pdfDoc, file);
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        pages = [page];
      }

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      fields.forEach((field) => {
        if (!field.text.trim()) return;
        const pageIndex = clamp((Number(field.page) || 1) - 1, 0, pages.length - 1);
        const page = pages[pageIndex];
        const size = clamp(Number(field.size) || 12, 4, 96);
        const x = (clamp(Number(field.x) || 0, 0, 100) / 100) * page.getWidth();
        const y = page.getHeight() - (clamp(Number(field.y) || 0, 0, 100) / 100) * page.getHeight() - size;
        page.drawText(field.text, {
          x,
          y,
          size,
          font,
          color: hexToPdfRgb(field.color),
        });
      });

      const bytes = await pdfDoc.save({ useObjectStreams: true });
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), randomFilename('filled_form', 'pdf'));
      setTone('success');
      setStatus('Filled PDF downloaded.');
    } catch {
      setTone('error');
      setStatus('Could not export the filled PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame title="Certificate / Form Filler" onBack={onBack}>
      <SectionHeader title="Certificate / Form Filler" subtitle="Upload a PDF or image, place text fields, and export a filled PDF." />
      <div className="row">
        <FileInput accept="application/pdf,image/*" onSelect={onSelectFile} label={file ? file.name : 'Select PDF or Image'} />
        <button className="btn" onClick={addField} disabled={!file}>Add Text Field</button>
        <button className="btn danger" onClick={removeField} disabled={!selectedField}>Remove Field</button>
        <button className="btn alt" onClick={exportPdf} disabled={!file || busy}>{busy ? 'Exporting...' : 'Download Filled PDF'}</button>
      </div>

      <FileInfoCard file={file} extras={[fileKind ? fileKind.toUpperCase() : '', pageCount > 1 ? `${pageCount} page(s)` : ''].filter(Boolean)} />

      <div className="row" style={{ marginTop: 12, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 360px', maxWidth: 560 }}>
          {preview ? (
            <div
              onClick={placeSelectedField}
              style={{ position: 'relative', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', background: '#fff', cursor: 'crosshair' }}
            >
              <img src={preview} alt="Form preview" style={{ width: '100%', display: 'block' }} />
              {fields.filter((field) => Number(field.page) === 1).map((field) => (
                <button
                  key={field.id}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedId(field.id);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    transform: 'translate(-2px, -50%)',
                    border: selectedId === field.id ? '2px solid #1d4ed8' : '1px solid #94a3b8',
                    background: 'rgba(255,255,255,0.82)',
                    color: field.color,
                    fontSize: Math.max(10, Math.min(22, field.size * 0.8)),
                    padding: '2px 6px',
                    borderRadius: 6,
                    maxWidth: '70%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                >
                  {field.text || 'Text'}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div style={{ flex: '1 1 320px' }}>
          {selectedField ? (
            <>
              <label className="label">Text</label>
              <textarea className="input" rows={3} value={selectedField.text} onChange={(event) => updateField({ text: event.target.value })} />
              <div className="row" style={{ marginTop: 10 }}>
                <div style={{ width: 90 }}>
                  <label className="label">Page</label>
                  <input className="input" type="number" min="1" max={pageCount} value={selectedField.page} onChange={(event) => updateField({ page: clamp(Number(event.target.value) || 1, 1, pageCount) })} />
                </div>
                <div style={{ width: 90 }}>
                  <label className="label">X %</label>
                  <input className="input" type="number" min="0" max="100" value={selectedField.x} onChange={(event) => updateField({ x: clamp(Number(event.target.value) || 0, 0, 100) })} />
                </div>
                <div style={{ width: 90 }}>
                  <label className="label">Y %</label>
                  <input className="input" type="number" min="0" max="100" value={selectedField.y} onChange={(event) => updateField({ y: clamp(Number(event.target.value) || 0, 0, 100) })} />
                </div>
                <div style={{ width: 100 }}>
                  <label className="label">Size</label>
                  <input className="input" type="number" min="4" max="96" value={selectedField.size} onChange={(event) => updateField({ size: clamp(Number(event.target.value) || 12, 4, 96) })} />
                </div>
                <div style={{ width: 110 }}>
                  <label className="label">Color</label>
                  <input className="input" type="color" value={selectedField.color} onChange={(event) => updateField({ color: event.target.value })} />
                </div>
              </div>
            </>
          ) : (
            <p className="status">Add or select a text field to edit it.</p>
          )}

          {fields.length ? (
            <div className="file-list">
              {fields.map((field, index) => (
                <button
                  key={field.id}
                  type="button"
                  className="file-item"
                  onClick={() => setSelectedId(field.id)}
                  style={{ width: '100%', textAlign: 'left', borderColor: selectedId === field.id ? '#1d4ed8' : 'var(--line)' }}
                >
                  <span className="kpi">#{index + 1}</span>
                  <span style={{ flex: 1 }}>{field.text || 'Text field'}</span>
                  <span className="label" style={{ margin: 0 }}>Page {field.page}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}
