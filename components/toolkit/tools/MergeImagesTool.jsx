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
  outputFilename,
  readAsArrayBuffer,
  readAsDataUrl,
  reorderByDrag,
} from '../../../lib/file-helpers';

export default function MergeImagesTool({ onBack }) {
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [previewA, setPreviewA] = useState('');
  const [previewB, setPreviewB] = useState('');
  const [vertical, setVertical] = useState('');
  const [horizontal, setHorizontal] = useState('');
  const [matchSizes, setMatchSizes] = useState(true);
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');

  const generate = async () => {
    if (!fileA || !fileB) {
      setTone('error');
      setStatus('Please select two images.');
      return;
    }

    const [img1, img2] = await Promise.all([loadImage(await readAsDataUrl(fileA)), loadImage(await readAsDataUrl(fileB))]);

    const targetWidth = matchSizes ? Math.max(img1.width, img2.width) : null;
    const targetHeight = matchSizes ? Math.max(img1.height, img2.height) : null;
    const firstWidth = targetWidth || img1.width;
    const firstHeight = targetHeight || img1.height;
    const secondWidth = targetWidth || img2.width;
    const secondHeight = targetHeight || img2.height;

    const verticalCanvas = document.createElement('canvas');
    verticalCanvas.width = Math.max(firstWidth, secondWidth);
    verticalCanvas.height = firstHeight + secondHeight;
    verticalCanvas.getContext('2d').drawImage(img1, 0, 0, firstWidth, firstHeight);
    verticalCanvas.getContext('2d').drawImage(img2, 0, firstHeight, secondWidth, secondHeight);

    const horizontalCanvas = document.createElement('canvas');
    horizontalCanvas.width = firstWidth + secondWidth;
    horizontalCanvas.height = Math.max(firstHeight, secondHeight);
    horizontalCanvas.getContext('2d').drawImage(img1, 0, 0, firstWidth, firstHeight);
    horizontalCanvas.getContext('2d').drawImage(img2, firstWidth, 0, secondWidth, secondHeight);

    setVertical(verticalCanvas.toDataURL('image/png'));
    setHorizontal(horizontalCanvas.toDataURL('image/png'));
    setTone('success');
    setStatus(matchSizes
      ? `Generated both layouts with each image resized to ${targetWidth} × ${targetHeight}px.`
      : 'Generated both merge layouts using the original image sizes.');
  };

  const onSelectA = async (picked) => {
    setFileA(picked);
    setVertical('');
    setHorizontal('');
    setPreviewA('');
    if (!picked) return;
    setPreviewA(await readAsDataUrl(picked));
  };

  const onSelectB = async (picked) => {
    setFileB(picked);
    setVertical('');
    setHorizontal('');
    setPreviewB('');
    if (!picked) return;
    setPreviewB(await readAsDataUrl(picked));
  };

  return (
    <ToolFrame title="Merge Images" onBack={onBack}>
      <SectionHeader title="Two-Image Merger" subtitle="Generate both vertical and horizontal versions." />
      <div className="row">
        <FileInput accept="image/*" onSelect={onSelectA} label={fileA ? fileA.name : 'Select Image 1'} />
        <FileInput accept="image/*" onSelect={onSelectB} label={fileB ? fileB.name : 'Select Image 2'} />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={matchSizes}
            onChange={(event) => {
              setMatchSizes(event.target.checked);
              setVertical('');
              setHorizontal('');
              setStatus('');
            }}
          />
          Make both images the same size
        </label>
        <button className="btn" onClick={generate}>Generate</button>
      </div>
      <div className="output-grid" style={{ marginTop: 12 }}>
        <ImagePreview title="Input Image 1" src={previewA} />
        <ImagePreview title="Input Image 2" src={previewB} />
      </div>

      <Status message={status} tone={tone} />

      {(vertical || horizontal) ? (
        <div className="output-grid" style={{ marginTop: 12 }}>
          {vertical ? (
            <div>
              <img src={vertical} className="thumb" style={{ width: '100%', height: 'auto' }} alt="Vertical merge" />
              <button className="btn alt" style={{ marginTop: 8 }} onClick={() => downloadDataUrl(vertical, outputFilename(fileA?.name, 'merged_vertical', 'png'))}>Download Vertical</button>
            </div>
          ) : null}
          {horizontal ? (
            <div>
              <img src={horizontal} className="thumb" style={{ width: '100%', height: 'auto' }} alt="Horizontal merge" />
              <button className="btn alt" style={{ marginTop: 8 }} onClick={() => downloadDataUrl(horizontal, outputFilename(fileA?.name, 'merged_horizontal', 'png'))}>Download Horizontal</button>
            </div>
          ) : null}
        </div>
      ) : null}
    </ToolFrame>
  );
}
