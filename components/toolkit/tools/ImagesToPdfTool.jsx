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

export default function ImagesToPdfTool({ onBack }) {
  const [items, setItems] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');

  const addImages = async (files) => {
    const next = await Promise.all(
      files.map(async (file, index) => ({
        id: `${Date.now()}_${index}_${file.name}`,
        file,
        name: file.name,
        preview: await readAsDataUrl(file),
      }))
    );
    setItems((prev) => [...prev, ...next]);
  };

  const combine = async () => {
    if (!items.length) {
      setTone('error');
      setStatus('Please select images first.');
      return;
    }

    try {
      setBusy(true);
      setTone('muted');
      setStatus('Building PDF...');
      const pdfDoc = await PDFDocument.create();
      for (const item of items) {
        const { image } = await embedImageFromFile(pdfDoc, item.file);
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      }
      downloadBlob(new Blob([await pdfDoc.save()], { type: 'application/pdf' }), randomFilename('images', 'pdf'));
      setTone('success');
      setStatus('Images merged into PDF and downloaded.');
    } catch {
      setTone('error');
      setStatus('Failed to generate PDF from images.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame title="Images To PDF" onBack={onBack}>
      <SectionHeader title="Image Stack To PDF" subtitle="Upload, reorder, then export one PDF." />
      <div className="row">
        <FileInput accept="image/*" multiple onSelect={(files) => addImages(files || [])} label="Add Images" />
        <button className="btn alt" onClick={combine} disabled={busy}>{busy ? 'Combining...' : 'Combine & Download'}</button>
      </div>

      <div className="file-list">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="file-item"
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragIndex === null || dragIndex === index) return;
              setItems((prev) => reorderByDrag(prev, dragIndex, index));
              setDragIndex(null);
            }}
          >
            <img className="thumb" src={item.preview} alt={item.name} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{item.name}</div>
            </div>
            <button className="btn danger" onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}>Remove</button>
          </div>
        ))}
      </div>

      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}
