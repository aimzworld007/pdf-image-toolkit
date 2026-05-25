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

export default function ResizeBySizeTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState('');
  const [targetKb, setTargetKb] = useState(300);
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');
  const [busy, setBusy] = useState(false);

  const resizeToTarget = async () => {
    if (!file) {
      setTone('error');
      setStatus('Please select an image first.');
      return;
    }
    if (targetKb <= 10) {
      setTone('error');
      setStatus('Target size must be above 10 KB.');
      return;
    }

    try {
      setBusy(true);
      const targetBytes = targetKb * 1024;
      const image = await loadImage(await readAsDataUrl(file));
      let scale = 1;
      let best = '';
      let bestBytes = Number.MAX_SAFE_INTEGER;

      while (scale >= 0.25) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);

        let low = 0.2;
        let high = 0.95;
        let passBest = '';
        let passBestBytes = Number.MAX_SAFE_INTEGER;

        for (let i = 0; i < 8; i += 1) {
          const mid = (low + high) / 2;
          const url = canvas.toDataURL('image/jpeg', mid);
          const bytes = Math.round(url.length * 0.75);
          if (bytes < passBestBytes) {
            passBest = url;
            passBestBytes = bytes;
          }
          if (bytes > targetBytes) high = mid;
          else low = mid;
        }

        if (passBestBytes < bestBytes) {
          best = passBest;
          bestBytes = passBestBytes;
        }

        if (passBestBytes <= targetBytes) break;
        scale -= 0.1;
      }

      setResult(best);
      setTone('success');
      setStatus(`Result size: ${(bestBytes / 1024).toFixed(1)} KB (target: ${targetKb} KB).`);
    } catch {
      setTone('error');
      setStatus('Could not resize by target file size.');
    } finally {
      setBusy(false);
    }
  };

  const onSelectFile = async (picked) => {
    setFile(picked);
    setResult('');
    setOriginalPreview('');
    if (!picked) return;
    setOriginalPreview(await readAsDataUrl(picked));
  };

  return (
    <ToolFrame title="Resize By File Size" onBack={onBack}>
      <SectionHeader title="Target Size Compressor" subtitle="Auto-adjust dimensions and quality to hit a target size." />
      <div className="row" style={{ alignItems: 'end' }}>
        <FileInput accept="image/*" onSelect={onSelectFile} label={file ? file.name : 'Select Image'} />
        <div style={{ width: 180 }}>
          <label className="label">Target (KB)</label>
          <input className="input" type="number" value={targetKb} onChange={(e) => setTargetKb(Number(e.target.value) || 0)} />
        </div>
        <button className="btn" onClick={resizeToTarget} disabled={busy}>{busy ? 'Processing...' : 'Resize By Size'}</button>
      </div>
      <FileInfoCard file={file} />
      {(originalPreview || result) ? (
        <div className="output-grid" style={{ marginTop: 12 }}>
          <ImagePreview title="Original" src={originalPreview} />
          <div>
            <ImagePreview title="Resized To Target Size" src={result} />
            {result ? (
              <button className="btn alt" style={{ marginTop: 8 }} onClick={() => downloadDataUrl(result, randomFilename('resized_target', 'jpg'))}>Download Result</button>
            ) : null}
          </div>
        </div>
      ) : null}
      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}
