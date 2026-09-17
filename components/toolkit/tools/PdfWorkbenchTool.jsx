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
  isAcceptedFile,
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
  outputFilename,
  readAsArrayBuffer,
  readAsDataUrl,
  reorderByDrag,
} from '../../../lib/file-helpers';

export default function PdfWorkbenchTool({ onBack }) {
  const [tab, setTab] = useState('images');
  const [files, setFiles] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');
  const inputId = useId();

  const tabs = [
    {
      id: 'images',
      label: 'Image → PDF',
      accept: 'image/*,.avif,.bmp,.gif,.heic,.heif,.jpeg,.jpg,.png,.svg,.tif,.tiff,.webp',
    },
    { id: 'combine', label: 'Combine PDFs', accept: 'application/pdf' },
  ];

  const currentTab = tabs.find((t) => t.id === tab) || tabs[0];

  const setTabAndReset = (nextTab) => {
    setTab(nextTab);
    setFiles([]);
    setActiveIndex(0);
    setStatus('');
    setTone('muted');
  };

  const enrichFiles = async (picked) => {
    const accepted = picked.filter((file) => isAcceptedFile(file, currentTab.accept));
    if (!accepted.length) {
      setTone('error');
      setStatus('No valid file selected for this tab.');
      return;
    }

    const enriched = await Promise.all(accepted.map(async (file, idx) => {
      let preview = '';
      let meta = '';
      if (file.type === 'application/pdf') {
        try {
          const info = await getPdfQuickPreview(file, 0.4);
          preview = info.preview;
          meta = `${info.pageCount} page(s)`;
        } catch {
          preview = '';
        }
      } else {
        try {
          preview = await readAsDataUrl(file);
        } catch {
          preview = '';
        }
      }
      return {
        id: `${Date.now()}_${idx}_${file.name}`,
        file,
        preview,
        meta,
      };
    }));

    setFiles((prev) => [...prev, ...enriched]);
    const total = files.length + enriched.length;
    setStatus(tab === 'images' && total > 1
      ? `${total} images selected. They will be merged into one multi-page PDF.`
      : `${enriched.length} file(s) added.`);
    setTone('success');
  };

  const onPickFiles = async (raw) => {
    const picked = Array.from(raw || []);
    if (!picked.length) return;
    await enrichFiles(picked);
  };

  const onClear = () => {
    setFiles([]);
    setActiveIndex(0);
    setStatus('Selection cleared.');
    setTone('muted');
  };

  const runCombine = async () => {
    if (!files.length) {
      setTone('error');
      setStatus('Please upload files first.');
      return;
    }

    try {
      setBusy(true);
      setTone('muted');
      setStatus('Processing...');

      if (tab === 'combine') {
        const finalPdf = await PDFDocument.create();
        for (const entry of files) {
          const source = await PDFDocument.load(await readAsArrayBuffer(entry.file), { ignoreEncryption: true });
          const copied = await finalPdf.copyPages(source, source.getPageIndices());
          copied.forEach((page) => finalPdf.addPage(page));
        }
        const bytes = await finalPdf.save({ useObjectStreams: true, addDefaultPage: false });
        downloadBlob(new Blob([bytes], { type: 'application/pdf' }), outputFilename(files[0].file.name, 'combined', 'pdf'));
      } else {
        const pdfDoc = await PDFDocument.create();
        for (const entry of files) {
          const { image } = await embedImageFromFile(pdfDoc, entry.file);
          const page = pdfDoc.addPage([image.width, image.height]);
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        }
        const bytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
        const suffix = files.length > 1 ? 'merged' : 'converted';
        downloadBlob(new Blob([bytes], { type: 'application/pdf' }), outputFilename(files[0].file.name, suffix, 'pdf'));
      }

      setTone('success');
      setStatus(tab === 'images' && files.length > 1
        ? `${files.length} images merged into one PDF and downloaded.`
        : 'PDF is ready and downloaded.');
    } catch {
      setTone('error');
      setStatus('Conversion failed. TIFF/SVG support may depend on browser decoding support.');
    } finally {
      setBusy(false);
    }
  };

  const activeItem = files[activeIndex] || null;

  return (
    <ToolFrame title="PDF Workbench" onBack={onBack}>
      <SectionHeader
        title="PDF Workbench"
        subtitle="Convert any supported image to PDF, or upload multiple images to merge them into one PDF."
      />

      <div className="pdf-workbench-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`pdf-workbench-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTabAndReset(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pdf-workbench-shell">
        <div className="pdf-workbench-toolbar">
          <label className="btn alt" htmlFor={inputId}>UPLOAD FILES</label>
          <input
            id={inputId}
            type="file"
            accept={currentTab.accept}
            multiple
            style={{ display: 'none' }}
            onChange={(event) => {
              onPickFiles(event.target.files || []);
              event.target.value = '';
            }}
          />
          <button className="btn danger" onClick={onClear}>CLEAR</button>
        </div>

        <div
          className={`pdf-workbench-dropzone ${dragOver ? 'is-dragover' : ''}`}
          onDragEnter={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setDragOver(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setDragOver(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setDragOver(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setDragOver(false);
            onPickFiles(event.dataTransfer.files);
          }}
        >
          <button
            className="pdf-workbench-nav"
            onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
            disabled={!files.length}
          >
            ‹
          </button>

          <div className="pdf-workbench-preview">
            {activeItem?.preview ? (
              <>
                <img src={activeItem.preview} alt={activeItem.file.name} className="pdf-workbench-preview-image" />
                <div className="pdf-workbench-preview-caption">
                  {activeItem.file.name} {activeItem.meta ? `• ${activeItem.meta}` : ''}
                </div>
              </>
            ) : (
              <div className="pdf-workbench-placeholder">
                <p>Drop Your Files Here</p>
                <small>{tab === 'images' ? 'Accepted: all supported image formats' : 'Accepted: PDF files'}</small>
              </div>
            )}
          </div>

          <button
            className="pdf-workbench-nav"
            onClick={() => setActiveIndex((prev) => Math.min(files.length - 1, prev + 1))}
            disabled={!files.length}
          >
            ›
          </button>
        </div>

        <div className="pdf-workbench-footer">
          <button className="btn" onClick={runCombine} disabled={busy || !files.length}>
            {busy
              ? 'PROCESSING...'
              : tab === 'combine'
                ? 'COMBINE PDFs'
                : files.length > 1
                  ? `MERGE ${files.length} IMAGES TO PDF`
                  : 'CONVERT IMAGE TO PDF'}
          </button>
          {files.length ? (
            <span className="kpi">
              {files.length} {tab === 'images' ? 'image(s)' : 'PDF(s)'}
            </span>
          ) : null}
        </div>
      </div>

      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}
