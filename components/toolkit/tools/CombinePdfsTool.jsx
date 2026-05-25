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

export default function CombinePdfsTool({ onBack }) {
  const [items, setItems] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');

  const addFiles = async (files) => {
    const next = await Promise.all(
      files.map(async (file, index) => {
        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';
        let preview = '';
        let pages = 0;
        if (isImage) {
          preview = await readAsDataUrl(file);
        } else if (isPdf) {
          try {
            const info = await getPdfQuickPreview(file, 0.35);
            preview = info.preview;
            pages = info.pageCount;
          } catch {
            preview = '';
          }
        }
        return {
          id: `${Date.now()}_${index}_${file.name}`,
          file,
          name: file.name,
          type: file.type,
          preview,
          pages,
        };
      })
    );

    setItems((prev) => [...prev, ...next]);
  };

  const combine = async () => {
    if (!items.length) {
      setTone('error');
      setStatus('Please add files first.');
      return;
    }

    try {
      setBusy(true);
      setTone('muted');
      setStatus('Combining files...');

      const finalPdf = await PDFDocument.create();
      for (const item of items) {
        if (item.type === 'application/pdf') {
          const source = await PDFDocument.load(await readAsArrayBuffer(item.file), { ignoreEncryption: true });
          const copied = await finalPdf.copyPages(source, source.getPageIndices());
          copied.forEach((page) => finalPdf.addPage(page));
        } else if (item.type.startsWith('image/')) {
          const { image } = await embedImageFromFile(finalPdf, item.file);
          const page = finalPdf.addPage([image.width, image.height]);
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        }
      }

      const bytes = await finalPdf.save();
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), randomFilename('combined_document', 'pdf'));
      setTone('success');
      setStatus('Combined PDF downloaded.');
    } catch {
      setTone('error');
      setStatus('Failed to combine files. Check if one file is unsupported or broken.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame title="Combine PDFs & Images" onBack={onBack}>
      <SectionHeader
        title="Merge And Reorder"
        subtitle="Add PDFs/images, drag to reorder, and combine all into a single PDF."
      />

      <div className="row">
        <FileInput
          accept="application/pdf,image/*"
          multiple
          label="Add Files"
          onSelect={(files) => addFiles(files || [])}
        />
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
            {item.preview ? <img className="thumb" src={item.preview} alt={item.name} /> : <div className="thumb" style={{ display: 'grid', placeItems: 'center' }}>PDF</div>}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{item.name}</div>
              <small style={{ color: 'var(--muted)' }}>
                {item.type || 'unknown'} {item.pages ? `• ${item.pages} page(s)` : ''}
              </small>
            </div>
            <button
              className="btn danger"
              onClick={() => setItems((prev) => prev.filter((current) => current.id !== item.id))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}
