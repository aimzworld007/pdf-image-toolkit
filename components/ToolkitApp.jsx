'use client';

import { useMemo, useState } from 'react';
import { PDFDocument, PageSizes, rgb } from 'pdf-lib';
import {
  downloadBlob,
  downloadDataUrl,
  ensurePdfJs,
  loadImage,
  mmToPt,
  randomFilename,
  readAsArrayBuffer,
  readAsDataUrl,
  reorderByDrag,
} from '../lib/file-helpers';

const TOOL_SECTIONS = [
  {
    title: 'Image Tools',
    items: [
      { id: 'merge-images', label: 'Merge Images', desc: 'Join two images vertically or horizontally.' },
      { id: 'compress-jpg', label: 'Compress JPG', desc: 'Reduce JPG file size with quality slider.' },
      { id: 'resize-image', label: 'Resize Image', desc: 'Change dimensions and keep aspect ratio.' },
      { id: 'resize-by-size', label: 'Resize By File Size', desc: 'Auto-fit JPG to target KB/MB size.' },
      { id: 'crop-image', label: 'Crop Image', desc: 'Crop using x/y/width/height controls.' },
      { id: 'convert-image', label: 'Image Converter', desc: 'Convert between JPG and PNG formats.' },
      { id: 'enhance-image', label: 'Image Enhance', desc: 'Adjust brightness, contrast, saturation, and sharpness.' },
    ],
  },
  {
    title: 'PDF Tools',
    items: [
      { id: 'jpg-to-pdf', label: 'JPG to PDF', desc: 'Convert one JPG image to PDF.' },
      { id: 'pdf-to-jpg', label: 'PDF to JPG', desc: 'Extract all PDF pages to JPG images.' },
      { id: 'combine-pdfs', label: 'Combine PDFs & Images', desc: 'Reorder and merge PDFs/images into one PDF.' },
      { id: 'images-to-pdf', label: 'Images to PDF', desc: 'Combine many images into one PDF.' },
      { id: 'pdf-page-studio', label: 'PDF Page Studio', desc: 'Remove/rearrange pages, add blank/image pages, and export.' },
      { id: 'compress-pdf', label: 'Compress PDF', desc: 'Optimize PDF streams for smaller file size.' },
    ],
  },
  {
    title: 'Special Tools',
    items: [
      { id: 'eid-lamination', label: 'EID Lamination Tool', desc: 'High-DPI front/back EID lamination print PDF.' },
    ],
  },
];

function ToolFrame({ title, onBack, children }) {
  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button className="btn ghost" onClick={onBack}>Back To Home</button>
        <span className="kpi">{title}</span>
      </div>
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ margin: '0 0 6px 0' }}>{title}</h2>
      {subtitle ? <p style={{ margin: 0, color: 'var(--muted)' }}>{subtitle}</p> : null}
    </div>
  );
}

function Status({ message, tone = 'muted' }) {
  if (!message) return null;
  const className = tone === 'error' ? 'status error' : tone === 'success' ? 'status success' : 'status';
  return <p className={className}>{message}</p>;
}

function FileInput({ accept, multiple = false, onSelect, label = 'Choose File(s)' }) {
  return (
    <label className="btn ghost" style={{ display: 'inline-block' }}>
      {label}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={(event) => {
          const files = Array.from(event.target.files || []);
          onSelect(multiple ? files : files[0] || null);
          event.target.value = '';
        }}
      />
    </label>
  );
}

async function embedImageFromFile(pdfDoc, file) {
  if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
    return { image: await pdfDoc.embedJpg(await readAsArrayBuffer(file)), ext: 'jpg' };
  }

  if (file.type === 'image/png') {
    return { image: await pdfDoc.embedPng(await readAsArrayBuffer(file)), ext: 'png' };
  }

  const src = await readAsDataUrl(file);
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext('2d').drawImage(img, 0, 0);
  const pngUrl = canvas.toDataURL('image/png');
  return { image: await pdfDoc.embedPng(pngUrl), ext: 'png' };
}

function JpgToPdfTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');
  const [busy, setBusy] = useState(false);

  const convert = async () => {
    if (!file) {
      setTone('error');
      setStatus('Please select a JPG file.');
      return;
    }

    try {
      setBusy(true);
      const pdfDoc = await PDFDocument.create();
      const jpgImage = await pdfDoc.embedJpg(await readAsArrayBuffer(file));
      const page = pdfDoc.addPage([jpgImage.width, jpgImage.height]);
      page.drawImage(jpgImage, { x: 0, y: 0, width: jpgImage.width, height: jpgImage.height });
      const bytes = await pdfDoc.save();
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), randomFilename('converted', 'pdf'));
      setTone('success');
      setStatus('PDF generated and downloaded.');
    } catch {
      setTone('error');
      setStatus('Failed to convert JPG to PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame title="JPG To PDF" onBack={onBack}>
      <SectionHeader title="Single JPG to PDF" subtitle="Upload one JPG and download a PDF in original dimensions." />
      <div className="row">
        <FileInput accept="image/jpeg" onSelect={setFile} label={file ? file.name : 'Select JPG'} />
        <button className="btn" onClick={convert} disabled={busy}>{busy ? 'Converting...' : 'Convert & Download'}</button>
      </div>
      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}

function PdfToJpgTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');
  const [busy, setBusy] = useState(false);

  const convert = async () => {
    if (!file) {
      setTone('error');
      setStatus('Please select a PDF file.');
      return;
    }

    try {
      setBusy(true);
      setImages([]);
      setTone('muted');
      setStatus('Loading PDF...');

      const pdfjsLib = await ensurePdfJs();
      const raw = await readAsArrayBuffer(file);
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(raw) }).promise;
      const output = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        setStatus(`Rendering page ${pageNumber} of ${pdf.numPages}...`);
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.6 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        output.push({
          name: randomFilename(`page_${pageNumber}`, 'jpg'),
          dataUrl: canvas.toDataURL('image/jpeg', 0.92),
        });
      }

      setImages(output);
      setTone('success');
      setStatus(`Done. ${output.length} page(s) extracted.`);
    } catch {
      setTone('error');
      setStatus('Failed to read this PDF. It may be encrypted or corrupted.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame title="PDF To JPG" onBack={onBack}>
      <SectionHeader title="Extract Pages As JPG" subtitle="Each page becomes a downloadable image." />
      <div className="row">
        <FileInput accept="application/pdf" onSelect={setFile} label={file ? file.name : 'Select PDF'} />
        <button className="btn" onClick={convert} disabled={busy}>{busy ? 'Processing...' : 'Convert'}</button>
      </div>
      <Status message={status} tone={tone} />
      {images.length > 0 ? (
        <div className="output-grid" style={{ marginTop: 14 }}>
          {images.map((item) => (
            <a key={item.name} href={item.dataUrl} download={item.name} title="Download page image">
              <img className="thumb" style={{ width: '100%', height: 150, objectFit: 'cover' }} src={item.dataUrl} alt={item.name} />
            </a>
          ))}
        </div>
      ) : null}
    </ToolFrame>
  );
}

function CombinePdfsTool({ onBack }) {
  const [items, setItems] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');

  const addFiles = async (files) => {
    const next = await Promise.all(
      files.map(async (file, index) => {
        const isImage = file.type.startsWith('image/');
        return {
          id: `${Date.now()}_${index}_${file.name}`,
          file,
          name: file.name,
          type: file.type,
          preview: isImage ? await readAsDataUrl(file) : '',
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
              <small style={{ color: 'var(--muted)' }}>{item.type || 'unknown'}</small>
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

function ImagesToPdfTool({ onBack }) {
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

function CompressJpgTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(0.8);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');

  const compress = async () => {
    if (!file) {
      setTone('error');
      setStatus('Please select a JPG file.');
      return;
    }

    const img = await loadImage(await readAsDataUrl(file));
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    const url = canvas.toDataURL('image/jpeg', quality);
    setPreview(url);
    setTone('success');
    setStatus(`Original: ${(file.size / 1024).toFixed(1)} KB. Estimated new: ${(url.length * 0.75 / 1024).toFixed(1)} KB.`);
  };

  return (
    <ToolFrame title="Compress JPG" onBack={onBack}>
      <SectionHeader title="JPG Compressor" subtitle="Client-side quality-based compression." />
      <div className="row" style={{ alignItems: 'center' }}>
        <FileInput accept="image/jpeg" onSelect={setFile} label={file ? file.name : 'Select JPG'} />
        <div style={{ minWidth: 220 }}>
          <label className="label">Quality: {quality.toFixed(1)}</label>
          <input className="input" type="range" min="0.1" max="1" step="0.1" value={quality} onChange={(e) => setQuality(Number(e.target.value))} />
        </div>
        <button className="btn" onClick={compress}>Compress</button>
      </div>

      {preview ? (
        <div style={{ marginTop: 12 }}>
          <img className="thumb" style={{ width: '100%', maxWidth: 360, height: 'auto' }} src={preview} alt="Compressed preview" />
          <div style={{ marginTop: 8 }}>
            <button className="btn alt" onClick={() => downloadDataUrl(preview, randomFilename('compressed', 'jpg'))}>Download JPG</button>
          </div>
        </div>
      ) : null}

      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}

function ResizeImageTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [ratio, setRatio] = useState(null);
  const [keepRatio, setKeepRatio] = useState(true);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');

  const onFile = async (picked) => {
    setFile(picked);
    setPreview('');
    if (!picked) return;
    const image = await loadImage(await readAsDataUrl(picked));
    setWidth(String(image.width));
    setHeight(String(image.height));
    setRatio(image.width / image.height);
  };

  const resize = async () => {
    if (!file) {
      setTone('error');
      setStatus('Please choose an image first.');
      return;
    }

    const targetW = Number(width);
    const targetH = Number(height);
    if (!targetW || !targetH || targetW <= 0 || targetH <= 0) {
      setTone('error');
      setStatus('Enter valid width and height.');
      return;
    }

    const image = await loadImage(await readAsDataUrl(file));
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    canvas.getContext('2d').drawImage(image, 0, 0, targetW, targetH);
    const url = canvas.toDataURL(file.type || 'image/png');
    setPreview(url);
    setTone('success');
    setStatus(`Image resized to ${targetW} x ${targetH}px.`);
  };

  const onWidthChange = (next) => {
    setWidth(next);
    if (keepRatio && ratio && next) {
      setHeight(String(Math.round(Number(next) / ratio)));
    }
  };

  const onHeightChange = (next) => {
    setHeight(next);
    if (keepRatio && ratio && next) {
      setWidth(String(Math.round(Number(next) * ratio)));
    }
  };

  return (
    <ToolFrame title="Resize Image" onBack={onBack}>
      <SectionHeader title="Image Resizer" subtitle="Resize to exact dimensions with optional aspect lock." />
      <div className="row" style={{ alignItems: 'center' }}>
        <FileInput accept="image/*" onSelect={onFile} label={file ? file.name : 'Select Image'} />
        <div style={{ minWidth: 150 }}>
          <label className="label">Width (px)</label>
          <input className="input" type="number" value={width} onChange={(e) => onWidthChange(e.target.value)} />
        </div>
        <div style={{ minWidth: 150 }}>
          <label className="label">Height (px)</label>
          <input className="input" type="number" value={height} onChange={(e) => onHeightChange(e.target.value)} />
        </div>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={keepRatio} onChange={(e) => setKeepRatio(e.target.checked)} />
          Keep ratio
        </label>
        <button className="btn" onClick={resize}>Resize</button>
      </div>

      {preview ? (
        <div style={{ marginTop: 12 }}>
          <img className="thumb" style={{ width: '100%', maxWidth: 360, height: 'auto' }} src={preview} alt="Resized preview" />
          <div style={{ marginTop: 8 }}>
            <button className="btn alt" onClick={() => downloadDataUrl(preview, randomFilename('resized', (file.type || 'image/png').split('/')[1] || 'png'))}>Download</button>
          </div>
        </div>
      ) : null}

      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}

function CropImageTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [src, setSrc] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');

  const onFile = async (picked) => {
    setFile(picked);
    setPreview('');
    if (!picked) return;
    const dataUrl = await readAsDataUrl(picked);
    const image = await loadImage(dataUrl);
    setSrc(dataUrl);
    setCrop({ x: 0, y: 0, w: image.width, h: image.height });
    setTone('muted');
    setStatus(`Loaded image ${image.width} x ${image.height}px.`);
  };

  const runCrop = async () => {
    if (!file || !src) {
      setTone('error');
      setStatus('Select an image first.');
      return;
    }

    const { x, y, w, h } = crop;
    if (w <= 0 || h <= 0) {
      setTone('error');
      setStatus('Crop width and height must be greater than 0.');
      return;
    }

    const image = await loadImage(src);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(image, x, y, w, h, 0, 0, w, h);
    setPreview(canvas.toDataURL('image/png'));
    setTone('success');
    setStatus('Crop completed.');
  };

  return (
    <ToolFrame title="Crop Image" onBack={onBack}>
      <SectionHeader title="Crop By Coordinates" subtitle="Set x/y/width/height and crop instantly." />
      <div className="row" style={{ alignItems: 'center' }}>
        <FileInput accept="image/*" onSelect={onFile} label={file ? file.name : 'Select Image'} />
        <button className="btn" onClick={runCrop}>Crop</button>
      </div>

      {src ? <img src={src} alt="Original" className="thumb" style={{ width: '100%', maxWidth: 380, height: 'auto', marginTop: 12 }} /> : null}

      <div className="row" style={{ marginTop: 12 }}>
        <div style={{ width: 100 }}><label className="label">X</label><input className="input" type="number" value={crop.x} onChange={(e) => setCrop((prev) => ({ ...prev, x: Number(e.target.value) }))} /></div>
        <div style={{ width: 100 }}><label className="label">Y</label><input className="input" type="number" value={crop.y} onChange={(e) => setCrop((prev) => ({ ...prev, y: Number(e.target.value) }))} /></div>
        <div style={{ width: 120 }}><label className="label">Width</label><input className="input" type="number" value={crop.w} onChange={(e) => setCrop((prev) => ({ ...prev, w: Number(e.target.value) }))} /></div>
        <div style={{ width: 120 }}><label className="label">Height</label><input className="input" type="number" value={crop.h} onChange={(e) => setCrop((prev) => ({ ...prev, h: Number(e.target.value) }))} /></div>
      </div>

      {preview ? (
        <div style={{ marginTop: 12 }}>
          <img src={preview} alt="Cropped result" className="thumb" style={{ width: '100%', maxWidth: 320, height: 'auto' }} />
          <div style={{ marginTop: 8 }}><button className="btn alt" onClick={() => downloadDataUrl(preview, randomFilename('cropped', 'png'))}>Download</button></div>
        </div>
      ) : null}

      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}

function MergeImagesTool({ onBack }) {
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [vertical, setVertical] = useState('');
  const [horizontal, setHorizontal] = useState('');
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');

  const generate = async () => {
    if (!fileA || !fileB) {
      setTone('error');
      setStatus('Please select two images.');
      return;
    }

    const [img1, img2] = await Promise.all([loadImage(await readAsDataUrl(fileA)), loadImage(await readAsDataUrl(fileB))]);

    const verticalCanvas = document.createElement('canvas');
    verticalCanvas.width = Math.max(img1.width, img2.width);
    verticalCanvas.height = img1.height + img2.height;
    verticalCanvas.getContext('2d').drawImage(img1, 0, 0);
    verticalCanvas.getContext('2d').drawImage(img2, 0, img1.height);

    const horizontalCanvas = document.createElement('canvas');
    horizontalCanvas.width = img1.width + img2.width;
    horizontalCanvas.height = Math.max(img1.height, img2.height);
    horizontalCanvas.getContext('2d').drawImage(img1, 0, 0);
    horizontalCanvas.getContext('2d').drawImage(img2, img1.width, 0);

    setVertical(verticalCanvas.toDataURL('image/png'));
    setHorizontal(horizontalCanvas.toDataURL('image/png'));
    setTone('success');
    setStatus('Generated both merge layouts.');
  };

  return (
    <ToolFrame title="Merge Images" onBack={onBack}>
      <SectionHeader title="Two-Image Merger" subtitle="Generate both vertical and horizontal versions." />
      <div className="row">
        <FileInput accept="image/*" onSelect={setFileA} label={fileA ? fileA.name : 'Select Image 1'} />
        <FileInput accept="image/*" onSelect={setFileB} label={fileB ? fileB.name : 'Select Image 2'} />
        <button className="btn" onClick={generate}>Generate</button>
      </div>

      <Status message={status} tone={tone} />

      {(vertical || horizontal) ? (
        <div className="output-grid" style={{ marginTop: 12 }}>
          {vertical ? (
            <div>
              <img src={vertical} className="thumb" style={{ width: '100%', height: 'auto' }} alt="Vertical merge" />
              <button className="btn alt" style={{ marginTop: 8 }} onClick={() => downloadDataUrl(vertical, randomFilename('merged_vertical', 'png'))}>Download Vertical</button>
            </div>
          ) : null}
          {horizontal ? (
            <div>
              <img src={horizontal} className="thumb" style={{ width: '100%', height: 'auto' }} alt="Horizontal merge" />
              <button className="btn alt" style={{ marginTop: 8 }} onClick={() => downloadDataUrl(horizontal, randomFilename('merged_horizontal', 'png'))}>Download Horizontal</button>
            </div>
          ) : null}
        </div>
      ) : null}
    </ToolFrame>
  );
}

function ConvertImageTool({ onBack }) {
  const [file, setFile] = useState(null);
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

  return (
    <ToolFrame title="Image Converter" onBack={onBack}>
      <SectionHeader title="Convert PNG/JPG" subtitle="Switch formats quickly, fully client-side." />
      <div className="row" style={{ alignItems: 'center' }}>
        <FileInput accept="image/*" onSelect={setFile} label={file ? file.name : 'Select Image'} />
        <select className="select" value={format} onChange={(e) => setFormat(e.target.value)} style={{ maxWidth: 140 }}>
          <option value="png">PNG</option>
          <option value="jpeg">JPG</option>
        </select>
        <button className="btn" onClick={convert}>Convert</button>
      </div>

      {result ? (
        <div style={{ marginTop: 12 }}>
          <img src={result} alt="Converted" className="thumb" style={{ width: '100%', maxWidth: 360, height: 'auto' }} />
          <div style={{ marginTop: 8 }}>
            <button className="btn alt" onClick={() => downloadDataUrl(result, randomFilename('converted', format === 'jpeg' ? 'jpg' : 'png'))}>Download</button>
          </div>
        </div>
      ) : null}

      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}

function parsePageRanges(input, max) {
  const selected = new Set();
  if (!input || !input.trim()) return selected;

  input.split(',').forEach((token) => {
    const part = token.trim();
    if (!part) return;
    if (part.includes('-')) {
      const [left, right] = part.split('-');
      const start = Number(left);
      const end = Number(right);
      if (!Number.isFinite(start) || !Number.isFinite(end)) return;
      const min = Math.max(1, Math.min(start, end));
      const maxRange = Math.min(max, Math.max(start, end));
      for (let p = min; p <= maxRange; p += 1) selected.add(p - 1);
      return;
    }
    const n = Number(part);
    if (Number.isFinite(n) && n >= 1 && n <= max) {
      selected.add(n - 1);
    }
  });

  return selected;
}

function applySharpenToCanvas(canvas, strength = 0) {
  if (strength <= 0) return;
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const src = imageData.data;
  const out = new Uint8ClampedArray(src);
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0,
  ];
  const passes = Math.min(3, Math.max(1, Math.round(strength)));

  for (let pass = 0; pass < passes; pass += 1) {
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const i = (y * width + x) * 4;
        for (let c = 0; c < 3; c += 1) {
          let sum = 0;
          let k = 0;
          for (let ky = -1; ky <= 1; ky += 1) {
            for (let kx = -1; kx <= 1; kx += 1) {
              const srcIdx = ((y + ky) * width + (x + kx)) * 4 + c;
              sum += src[srcIdx] * kernel[k];
              k += 1;
            }
          }
          out[i + c] = Math.max(0, Math.min(255, sum));
        }
      }
    }
    src.set(out);
  }

  imageData.data.set(out);
  ctx.putImageData(imageData, 0, 0);
}

function ImageEnhanceTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [src, setSrc] = useState('');
  const [result, setResult] = useState('');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [sharpness, setSharpness] = useState(0);
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');

  const onFile = async (picked) => {
    setFile(picked);
    setResult('');
    if (!picked) return;
    const dataUrl = await readAsDataUrl(picked);
    setSrc(dataUrl);
    setStatus('Image loaded. Adjust controls and apply enhancements.');
    setTone('muted');
  };

  const applyEnhance = async () => {
    if (!src) {
      setTone('error');
      setStatus('Please select an image first.');
      return;
    }
    const image = await loadImage(src);
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(image, 0, 0);
    applySharpenToCanvas(canvas, sharpness);
    setResult(canvas.toDataURL('image/jpeg', 0.95));
    setTone('success');
    setStatus('Enhancement applied.');
  };

  return (
    <ToolFrame title="Image Enhance" onBack={onBack}>
      <SectionHeader title="Enhance Photos" subtitle="Brightness, contrast, saturation, and sharpness controls." />
      <div className="row">
        <FileInput accept="image/*" onSelect={onFile} label={file ? file.name : 'Select Image'} />
        <button className="btn" onClick={applyEnhance}>Apply Enhance</button>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <div style={{ minWidth: 190 }}>
          <label className="label">Brightness: {brightness}%</label>
          <input className="input" type="range" min="50" max="180" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} />
        </div>
        <div style={{ minWidth: 190 }}>
          <label className="label">Contrast: {contrast}%</label>
          <input className="input" type="range" min="50" max="180" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} />
        </div>
        <div style={{ minWidth: 190 }}>
          <label className="label">Saturation: {saturation}%</label>
          <input className="input" type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} />
        </div>
        <div style={{ minWidth: 190 }}>
          <label className="label">Sharpness: {sharpness}</label>
          <input className="input" type="range" min="0" max="3" step="1" value={sharpness} onChange={(e) => setSharpness(Number(e.target.value))} />
        </div>
      </div>

      {(src || result) ? (
        <div className="output-grid" style={{ marginTop: 12 }}>
          {src ? (
            <div>
              <p className="label">Original</p>
              <img src={src} alt="Original" className="thumb" style={{ width: '100%', height: 'auto' }} />
            </div>
          ) : null}
          {result ? (
            <div>
              <p className="label">Enhanced</p>
              <img src={result} alt="Enhanced" className="thumb" style={{ width: '100%', height: 'auto' }} />
              <button className="btn alt" style={{ marginTop: 8 }} onClick={() => downloadDataUrl(result, randomFilename('enhanced', 'jpg'))}>Download Enhanced</button>
            </div>
          ) : null}
        </div>
      ) : null}

      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}

function ResizeBySizeTool({ onBack }) {
  const [file, setFile] = useState(null);
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

  return (
    <ToolFrame title="Resize By File Size" onBack={onBack}>
      <SectionHeader title="Target Size Compressor" subtitle="Auto-adjust dimensions and quality to hit a target size." />
      <div className="row" style={{ alignItems: 'end' }}>
        <FileInput accept="image/*" onSelect={setFile} label={file ? file.name : 'Select Image'} />
        <div style={{ width: 180 }}>
          <label className="label">Target (KB)</label>
          <input className="input" type="number" value={targetKb} onChange={(e) => setTargetKb(Number(e.target.value) || 0)} />
        </div>
        <button className="btn" onClick={resizeToTarget} disabled={busy}>{busy ? 'Processing...' : 'Resize By Size'}</button>
      </div>
      {result ? (
        <div style={{ marginTop: 12 }}>
          <img src={result} alt="Size resized" className="thumb" style={{ width: '100%', maxWidth: 400, height: 'auto' }} />
          <div style={{ marginTop: 8 }}>
            <button className="btn alt" onClick={() => downloadDataUrl(result, randomFilename('resized_target', 'jpg'))}>Download Result</button>
          </div>
        </div>
      ) : null}
      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}

function PdfPageStudioTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [sourceBytes, setSourceBytes] = useState(null);
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

function CompressPdfTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');
  const [busy, setBusy] = useState(false);

  const compress = async () => {
    if (!file) {
      setTone('error');
      setStatus('Please select a PDF file.');
      return;
    }
    try {
      setBusy(true);
      const originalBytes = await readAsArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(originalBytes, { ignoreEncryption: true });
      const optimizedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        updateFieldAppearances: false,
      });

      downloadBlob(new Blob([optimizedBytes], { type: 'application/pdf' }), randomFilename('compressed_pdf', 'pdf'));
      const oldKb = (originalBytes.byteLength / 1024).toFixed(1);
      const newKb = (optimizedBytes.byteLength / 1024).toFixed(1);
      setTone('success');
      setStatus(`Compressed PDF exported. Size: ${oldKb} KB -> ${newKb} KB.`);
    } catch {
      setTone('error');
      setStatus('Failed to compress/optimize this PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame title="Compress PDF" onBack={onBack}>
      <SectionHeader title="PDF Optimizer" subtitle="Re-save PDF with stream optimization." />
      <div className="row">
        <FileInput accept="application/pdf" onSelect={setFile} label={file ? file.name : 'Select PDF'} />
        <button className="btn alt" onClick={compress} disabled={busy}>{busy ? 'Compressing...' : 'Compress & Download'}</button>
      </div>
      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}

function EidPhotoEditor({ side, data, setData, targetWidthIn, targetHeightIn, ratio }) {
  const [busy, setBusy] = useState(false);

  const onFile = async (file) => {
    if (!file) return;
    const src = await readAsDataUrl(file);
    const img = await loadImage(src);
    setData((prev) => ({
      ...prev,
      file,
      src,
      rotation: 0,
      crop: { x: 0, y: 0, w: img.width, h: img.height },
      processed: '',
      status: `Loaded ${img.width} x ${img.height}px`,
      tone: 'muted',
    }));
  };

  const process = async () => {
    if (!data.src) {
      setData((prev) => ({ ...prev, tone: 'error', status: 'Please upload an image first.' }));
      return;
    }

    const { x, y, w, h } = data.crop;
    if (w <= 10 || h <= 10) {
      setData((prev) => ({ ...prev, tone: 'error', status: 'Crop size must be greater than 10px.' }));
      return;
    }

    try {
      setBusy(true);
      const source = await loadImage(data.src);
      const rotatedCanvas = document.createElement('canvas');
      rotatedCanvas.width = source.width;
      rotatedCanvas.height = source.height;
      const rCtx = rotatedCanvas.getContext('2d');
      rCtx.translate(source.width / 2, source.height / 2);
      rCtx.rotate((data.rotation * Math.PI) / 180);
      rCtx.drawImage(source, -source.width / 2, -source.height / 2);
      rCtx.setTransform(1, 0, 0, 1, 0, 0);

      let finalCropW;
      let finalCropH;
      if (w / h > ratio) {
        finalCropH = h;
        finalCropW = finalCropH * ratio;
      } else {
        finalCropW = w;
        finalCropH = finalCropW / ratio;
      }

      const finalCropX = x + (w - finalCropW) / 2;
      const finalCropY = y + (h - finalCropH) / 2;

      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = finalCropW;
      croppedCanvas.height = finalCropH;
      croppedCanvas.getContext('2d').drawImage(
        rotatedCanvas,
        finalCropX,
        finalCropY,
        finalCropW,
        finalCropH,
        0,
        0,
        finalCropW,
        finalCropH
      );

      const targetW = Math.round(targetWidthIn * 600);
      const targetH = Math.round(targetHeightIn * 600);
      const output = document.createElement('canvas');
      output.width = targetW;
      output.height = targetH;
      output.getContext('2d').drawImage(croppedCanvas, 0, 0, targetW, targetH);

      setData((prev) => ({
        ...prev,
        processed: output.toDataURL('image/png', 1.0),
        tone: 'success',
        status: `Processed at ${targetW} x ${targetH}px.`,
      }));
    } catch {
      setData((prev) => ({ ...prev, tone: 'error', status: 'Processing failed for this side.' }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel" style={{ padding: 14 }}>
      <h3 style={{ marginTop: 0 }}>{side}</h3>
      <div className="row" style={{ alignItems: 'center' }}>
        <FileInput accept="image/*" onSelect={onFile} label={data.file ? data.file.name : 'Upload'} />
        <button className="btn" onClick={process} disabled={busy}>{busy ? 'Processing...' : 'Process Side'}</button>
      </div>

      {data.src ? <img src={data.src} alt={`${side} source`} className="thumb" style={{ marginTop: 10, width: '100%', height: 180, objectFit: 'contain', background: '#f8fafc' }} /> : null}

      <div className="row" style={{ marginTop: 10 }}>
        <div style={{ minWidth: 130 }}>
          <label className="label">Rotation: {data.rotation.toFixed(1)}°</label>
          <input className="input" type="range" min="-180" max="180" step="0.1" value={data.rotation} onChange={(e) => setData((prev) => ({ ...prev, rotation: Number(e.target.value), processed: '' }))} />
        </div>
      </div>

      <div className="row" style={{ marginTop: 8 }}>
        <div style={{ width: 90 }}><label className="label">X</label><input className="input" type="number" value={data.crop.x} onChange={(e) => setData((prev) => ({ ...prev, crop: { ...prev.crop, x: Number(e.target.value) }, processed: '' }))} /></div>
        <div style={{ width: 90 }}><label className="label">Y</label><input className="input" type="number" value={data.crop.y} onChange={(e) => setData((prev) => ({ ...prev, crop: { ...prev.crop, y: Number(e.target.value) }, processed: '' }))} /></div>
        <div style={{ width: 110 }}><label className="label">Width</label><input className="input" type="number" value={data.crop.w} onChange={(e) => setData((prev) => ({ ...prev, crop: { ...prev.crop, w: Number(e.target.value) }, processed: '' }))} /></div>
        <div style={{ width: 110 }}><label className="label">Height</label><input className="input" type="number" value={data.crop.h} onChange={(e) => setData((prev) => ({ ...prev, crop: { ...prev.crop, h: Number(e.target.value) }, processed: '' }))} /></div>
      </div>

      {data.processed ? (
        <div style={{ marginTop: 10 }}>
          <img src={data.processed} alt={`${side} processed`} className="thumb" style={{ width: '100%', height: 160, objectFit: 'contain', background: '#f8fafc' }} />
          <div style={{ marginTop: 8 }}>
            <button className="btn alt" onClick={() => downloadDataUrl(data.processed, randomFilename(side.toLowerCase().replace(' ', '_'), 'png'))}>Download PNG</button>
          </div>
        </div>
      ) : null}

      <Status message={data.status} tone={data.tone} />
    </div>
  );
}

function EidLaminationTool({ onBack }) {
  const [widthIn, setWidthIn] = useState(3.2);
  const [heightIn, setHeightIn] = useState(2.2);
  const [front, setFront] = useState({ file: null, src: '', crop: { x: 0, y: 0, w: 0, h: 0 }, rotation: 0, processed: '', status: '', tone: 'muted' });
  const [back, setBack] = useState({ file: null, src: '', crop: { x: 0, y: 0, w: 0, h: 0 }, rotation: 0, processed: '', status: '', tone: 'muted' });
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState('muted');

  const ratio = useMemo(() => {
    if (heightIn <= 0) return 1;
    return widthIn / heightIn;
  }, [widthIn, heightIn]);

  const generatePdf = async () => {
    if (!front.processed || !back.processed) {
      setTone('error');
      setStatus('Please process both front and back images first.');
      return;
    }

    try {
      const pdf = await PDFDocument.create();
      const page = pdf.addPage(PageSizes.A4);

      const frontImage = await pdf.embedPng(front.processed);
      const backImage = await pdf.embedPng(back.processed);

      const imageWmm = widthIn * 25.4;
      const imageHmm = heightIn * 25.4;
      const gapMm = 8;

      const imageW = mmToPt(imageWmm);
      const imageH = mmToPt(imageHmm);
      const gap = mmToPt(gapMm);

      const pageW = page.getWidth();
      const pageH = page.getHeight();
      const totalH = imageH * 2 + gap;
      const startX = (pageW - imageW) / 2;
      const startY = (pageH - totalH) / 2;

      page.drawImage(frontImage, { x: startX, y: startY + imageH + gap, width: imageW, height: imageH });
      page.drawImage(backImage, { x: startX, y: startY, width: imageW, height: imageH });

      page.drawRectangle({ x: startX, y: startY + imageH + gap, width: imageW, height: imageH, borderWidth: 0.8, borderColor: rgb(0, 0, 0) });
      page.drawRectangle({ x: startX, y: startY, width: imageW, height: imageH, borderWidth: 0.8, borderColor: rgb(0, 0, 0) });

      downloadBlob(new Blob([await pdf.save()], { type: 'application/pdf' }), 'EID-Lamination-Printout-A4.pdf');
      setTone('success');
      setStatus('A4 lamination PDF generated and downloaded.');
    } catch {
      setTone('error');
      setStatus('Failed to generate lamination PDF.');
    }
  };

  return (
    <ToolFrame title="EID Lamination Tool" onBack={onBack}>
      <SectionHeader title="High-DPI EID Lamination" subtitle="Process front and back, then export a centered A4 print PDF." />

      <div className="row" style={{ marginBottom: 10 }}>
        <div style={{ width: 170 }}>
          <label className="label">Target Width (inches)</label>
          <input className="input" type="number" min="0.1" step="0.1" value={widthIn} onChange={(e) => setWidthIn(Number(e.target.value) || 0)} />
        </div>
        <div style={{ width: 170 }}>
          <label className="label">Target Height (inches)</label>
          <input className="input" type="number" min="0.1" step="0.1" value={heightIn} onChange={(e) => setHeightIn(Number(e.target.value) || 0)} />
        </div>
        <div style={{ display: 'grid', alignContent: 'end' }}>
          <span className="kpi">Ratio: {ratio.toFixed(4)}</span>
        </div>
      </div>

      <div className="eid-grid">
        <EidPhotoEditor side="EID Front Side" data={front} setData={setFront} targetWidthIn={widthIn} targetHeightIn={heightIn} ratio={ratio} />
        <EidPhotoEditor side="EID Back Side" data={back} setData={setBack} targetWidthIn={widthIn} targetHeightIn={heightIn} ratio={ratio} />
      </div>

      <div style={{ marginTop: 14 }}>
        <button className="btn alt" onClick={generatePdf}>Generate A4 Lamination PDF</button>
      </div>
      <Status message={status} tone={tone} />
    </ToolFrame>
  );
}

function renderTool(activeTool, onBack) {
  switch (activeTool) {
    case 'jpg-to-pdf':
      return <JpgToPdfTool onBack={onBack} />;
    case 'pdf-to-jpg':
      return <PdfToJpgTool onBack={onBack} />;
    case 'combine-pdfs':
      return <CombinePdfsTool onBack={onBack} />;
    case 'images-to-pdf':
      return <ImagesToPdfTool onBack={onBack} />;
    case 'compress-jpg':
      return <CompressJpgTool onBack={onBack} />;
    case 'resize-image':
      return <ResizeImageTool onBack={onBack} />;
    case 'resize-by-size':
      return <ResizeBySizeTool onBack={onBack} />;
    case 'crop-image':
      return <CropImageTool onBack={onBack} />;
    case 'merge-images':
      return <MergeImagesTool onBack={onBack} />;
    case 'convert-image':
      return <ConvertImageTool onBack={onBack} />;
    case 'enhance-image':
      return <ImageEnhanceTool onBack={onBack} />;
    case 'pdf-page-studio':
      return <PdfPageStudioTool onBack={onBack} />;
    case 'compress-pdf':
      return <CompressPdfTool onBack={onBack} />;
    case 'eid-lamination':
      return <EidLaminationTool onBack={onBack} />;
    default:
      return null;
  }
}

export default function ToolkitApp() {
  const [activeTool, setActiveTool] = useState(null);

  return (
    <main className="container">
      <header className="hero" style={{ marginBottom: 20 }}>
        <h1>PDF & Image Toolkit Pro</h1>
        <p>
          Modern Next.js toolkit with smooth PDF/image workflows and built-in EID lamination support.
          Everything runs client-side. No login or registration required.
        </p>
      </header>

      {!activeTool ? (
        <>
          {TOOL_SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="section-title">{section.title}</h2>
              <div className="tools-grid">
                {section.items.map((tool) => (
                  <article key={tool.id} className="tool-card" onClick={() => setActiveTool(tool.id)}>
                    <h3>{tool.label}</h3>
                    <p>{tool.desc}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </>
      ) : (
        renderTool(activeTool, () => setActiveTool(null))
      )}
    </main>
  );
}
