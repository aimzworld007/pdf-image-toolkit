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

export default function PdfPageStudioTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [sourceBytes, setSourceBytes] = useState(null);
  const [sourcePageCount, setSourcePageCount] = useState(0);
  const [items, setItems] = useState([]);
  const [removeInput, setRemoveInput] = useState('');
  const [blankPreset, setBlankPreset] = useState('A4');
  const [blankWmm, setBlankWmm] = useState(210);
  const [blankHmm, setBlankHmm] = useState(297);
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');
  const [busy, setBusy] = useState(false);

  const loadPdf = async (picked) => {
    setFile(picked);
    setItems([]);
    setSourceBytes(null);
    setSourcePageCount(0);
    if (!picked) return;

    try {
      setBusy(true);
      setStatus('Reading PDF pages...');
      const raw = await readAsArrayBuffer(picked);
      setSourceBytes(raw);
      const pdfjsLib = await ensurePdfJs();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(raw) }).promise;
      const loaded = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 0.35 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        loaded.push({
          id: `pdf_${pageNumber}_${Date.now()}`,
          kind: 'pdf',
          pageIndex: pageNumber - 1,
          label: `Page ${pageNumber}`,
          preview: canvas.toDataURL('image/jpeg', 0.8),
        });
      }

      setItems(loaded);
      setSourcePageCount(loaded.length);
      setTone('success');
      setStatus(`Loaded ${loaded.length} page(s). You can now reorder/remove/add pages.`);
    } catch {
      setTone('error');
      setStatus('Failed to load PDF pages.');
    } finally {
      setBusy(false);
    }
  };

  const removePagesByInput = () => {
    const totalPdfPages = items.filter((item) => item.kind === 'pdf').length;
    const selected = parsePageRanges(removeInput, totalPdfPages);
    if (!selected.size) {
      setTone('error');
      setStatus('No valid page numbers found in the remove input.');
      return;
    }

    let ordinal = -1;
    setItems((prev) => prev.filter((item) => {
      if (item.kind !== 'pdf') return true;
      ordinal += 1;
      return !selected.has(ordinal);
    }));
    setTone('success');
    setStatus(`Removed ${selected.size} page(s) from the queue.`);
  };

  const addBlankPage = () => {
    let size = PageSizes.A4;
    if (blankPreset === 'LETTER') size = PageSizes.Letter;
    if (blankPreset === 'CUSTOM') size = [mmToPt(blankWmm), mmToPt(blankHmm)];

    setItems((prev) => [
      ...prev,
      {
        id: `blank_${Date.now()}`,
        kind: 'blank',
        width: size[0],
        height: size[1],
        label: `Blank ${blankPreset}`,
        preview: '',
      },
    ]);
    setTone('success');
    setStatus('Blank page added.');
  };

  const addImagePages = async (files) => {
    const entries = await Promise.all(
      (files || []).map(async (img, index) => ({
        id: `img_${Date.now()}_${index}`,
        kind: 'image',
        file: img,
        label: img.name,
        preview: await readAsDataUrl(img),
      }))
    );
    setItems((prev) => [...prev, ...entries]);
    setTone('success');
    setStatus(`${entries.length} image page(s) added.`);
  };

  const moveItem = (from, to) => {
    if (to < 0 || to >= items.length) return;
    setItems((prev) => reorderByDrag(prev, from, to));
  };

  const exportEditedPdf = async () => {
    if (!sourceBytes || !items.length) {
      setTone('error');
      setStatus('Please load a PDF and keep at least one page/item in queue.');
      return;
    }
    try {
      setBusy(true);
      setStatus('Building edited PDF...');
      const finalPdf = await PDFDocument.create();
      const sourcePdf = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });

      for (const item of items) {
        if (item.kind === 'pdf') {
          const [copied] = await finalPdf.copyPages(sourcePdf, [item.pageIndex]);
          finalPdf.addPage(copied);
        } else if (item.kind === 'blank') {
          finalPdf.addPage([item.width, item.height]);
        } else if (item.kind === 'image') {
          const { image } = await embedImageFromFile(finalPdf, item.file);
          const page = finalPdf.addPage([image.width, image.height]);
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        }
      }

      const bytes = await finalPdf.save({ useObjectStreams: true, addDefaultPage: false });
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), randomFilename('edited_pdf', 'pdf'));
      setTone('success');
      setStatus('Edited PDF exported.');
    } catch {
      setTone('error');
      setStatus('Failed to export edited PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame title="PDF Page Studio" onBack={onBack}>
      <SectionHeader title="Page Editing Suite" subtitle="Remove, reorder, insert blank pages, add image pages, and export." />
      <div className="row">
        <FileInput accept="application/pdf" onSelect={loadPdf} label={file ? file.name : 'Load PDF'} />
        <FileInput accept="image/*" multiple onSelect={addImagePages} label="Add Image Pages" />
        <button className="btn alt" onClick={exportEditedPdf} disabled={busy}>{busy ? 'Exporting...' : 'Export Edited PDF'}</button>
      </div>
      <FileInfoCard file={file} extras={sourcePageCount ? [`${sourcePageCount} pages`] : []} />

      <div className="row" style={{ marginTop: 10, alignItems: 'end' }}>
        <div style={{ width: 230 }}>
          <label className="label">Remove PDF pages (e.g. 2,4-6)</label>
          <input className="input" value={removeInput} onChange={(e) => setRemoveInput(e.target.value)} />
        </div>
        <button className="btn danger" onClick={removePagesByInput}>Remove Pages</button>
      </div>

      <div className="row" style={{ marginTop: 10, alignItems: 'end' }}>
        <div style={{ width: 180 }}>
          <label className="label">Blank Page Size</label>
          <select className="select" value={blankPreset} onChange={(e) => setBlankPreset(e.target.value)}>
            <option value="A4">A4</option>
            <option value="LETTER">Letter</option>
            <option value="CUSTOM">Custom (mm)</option>
          </select>
        </div>
        {blankPreset === 'CUSTOM' ? (
          <>
            <div style={{ width: 140 }}>
              <label className="label">Width (mm)</label>
              <input className="input" type="number" value={blankWmm} onChange={(e) => setBlankWmm(Number(e.target.value) || 0)} />
            </div>
            <div style={{ width: 140 }}>
              <label className="label">Height (mm)</label>
              <input className="input" type="number" value={blankHmm} onChange={(e) => setBlankHmm(Number(e.target.value) || 0)} />
            </div>
          </>
        ) : null}
        <button className="btn" onClick={addBlankPage}>Add Blank Page</button>
      </div>

      <div className="file-list">
        {items.map((item, index) => (
          <div key={item.id} className="file-item">
            {item.preview ? <img className="thumb" src={item.preview} alt={item.label} /> : <div className="thumb" style={{ display: 'grid', placeItems: 'center' }}>{item.kind.toUpperCase()}</div>}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{item.label}</div>
              <small style={{ color: 'var(--muted)' }}>#{index + 1} in output order</small>
            </div>
            <button className="btn ghost" onClick={() => moveItem(index, index - 1)}>Up</button>
            <button className="btn ghost" onClick={() => moveItem(index, index + 1)}>Down</button>
            <button className="btn danger" onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}>Remove</button>
          </div>
        ))}
      </div>

      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}
