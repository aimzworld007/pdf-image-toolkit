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

export default function ConvertImageTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState('');
  const [format, setFormat] = useState('png');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');

  const convert = async () => {
    if (!file) {
      setTone('error');
      setStatus('Please choose an image first.');
      return;
    }

    const image = await loadImage(await readAsDataUrl(file));
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');

    if (format === 'jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(image, 0, 0);
    const dataUrl = canvas.toDataURL(`image/${format}`);
    setResult(dataUrl);
    setTone('success');
    setStatus(`Image converted to ${format.toUpperCase()}.`);
  };

  const onSelectFile = async (picked) => {
    setFile(picked);
    setOriginalPreview('');
    setResult('');
    if (!picked) return;
    setOriginalPreview(await readAsDataUrl(picked));
  };

  return (
    <ToolFrame title="Image Converter" onBack={onBack}>
      <SectionHeader title="Convert PNG/JPG" subtitle="Switch formats quickly, fully client-side." />
      <div className="row" style={{ alignItems: 'center' }}>
        <FileInput accept="image/*" onSelect={onSelectFile} label={file ? file.name : 'Select Image'} />
        <select className="select" value={format} onChange={(e) => setFormat(e.target.value)} style={{ maxWidth: 140 }}>
          <option value="png">PNG</option>
          <option value="jpeg">JPG</option>
        </select>
        <button className="btn" onClick={convert}>Convert</button>
      </div>
      <FileInfoCard file={file} />

      {(originalPreview || result) ? (
        <div className="output-grid" style={{ marginTop: 12 }}>
          <ImagePreview title="Original" src={originalPreview} />
          <div>
            <ImagePreview title="Converted" src={result} />
            {result ? (
              <button className="btn alt" style={{ marginTop: 8 }} onClick={() => downloadDataUrl(result, randomFilename('converted', format === 'jpeg' ? 'jpg' : 'png'))}>Download</button>
            ) : null}
          </div>
        </div>
      ) : null}

      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}
