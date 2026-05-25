'use client';

import { useId, useState } from 'react';
import { PageSizes, rgb } from 'pdf-lib';
import {
  ensurePdfJs,
  loadImage,
  readAsArrayBuffer,
  readAsDataUrl,
} from '../../lib/file-helpers';

export function ToolFrame({ title, onBack, children }) {
  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button className="btn ghost" onClick={onBack}>Back To Tools</button>
        <span className="kpi">{title}</span>
      </div>
      {children}
    </div>
  );
}

export function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ margin: '0 0 6px 0' }}>{title}</h2>
      {subtitle ? <p style={{ margin: 0, color: 'var(--muted)' }}>{subtitle}</p> : null}
    </div>
  );
}

export function Status({ message, tone = 'muted' }) {
  if (!message) return null;
  const className = tone === 'error' ? 'status error' : tone === 'success' ? 'status success' : 'status';
  return <p className={className}>{message}</p>;
}

export function isAcceptedFile(file, accept) {
  if (!accept) return true;
  const rules = accept.split(',').map((item) => item.trim()).filter(Boolean);
  if (!rules.length) return true;
  return rules.some((rule) => {
    if (rule === '*/*') return true;
    if (rule.endsWith('/*')) {
      const family = rule.slice(0, -1);
      return file.type.startsWith(family);
    }
    if (rule.startsWith('.')) {
      return file.name.toLowerCase().endsWith(rule.toLowerCase());
    }
    return file.type === rule;
  });
}

export function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function FileInfoCard({ file, extras = [] }) {
  if (!file) return null;
  return (
    <div className="panel" style={{ padding: 12, marginTop: 12 }}>
      <p style={{ margin: 0, fontWeight: 700 }}>{file.name}</p>
      <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
        {file.type || 'unknown'} • {formatBytes(file.size)}
      </p>
      {extras.length ? (
        <div style={{ marginTop: 8 }}>
          {extras.map((item) => (
            <span key={item} className="kpi" style={{ marginRight: 8 }}>{item}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ImagePreview({ title, src }) {
  if (!src) return null;
  return (
    <div>
      <p className="label">{title}</p>
      <img src={src} alt={title} className="thumb" style={{ width: '100%', height: 'auto' }} />
    </div>
  );
}

export function FileInput({ accept, multiple = false, onSelect, label = 'Choose File(s)' }) {
  const inputId = useId();
  const [dragOver, setDragOver] = useState(false);
  const [warning, setWarning] = useState('');

  const handlePickedFiles = (rawFiles) => {
    const allFiles = Array.from(rawFiles || []);
    const files = allFiles.filter((file) => isAcceptedFile(file, accept));
    const rejected = allFiles.length - files.length;
    if (rejected > 0) {
      setWarning(`${rejected} file(s) ignored due to file type.`);
    } else {
      setWarning('');
    }
    onSelect(multiple ? files : files[0] || null);
  };

  return (
    <label
      htmlFor={inputId}
      className={`drop-input ${dragOver ? 'is-dragover' : ''}`}
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
        handlePickedFiles(event.dataTransfer.files);
      }}
    >
      <div className="drop-input-title">{label}</div>
      <div className="drop-input-sub">Drag & drop {multiple ? 'files' : 'a file'} here or click to browse</div>
      {warning ? <div className="drop-input-warn">{warning}</div> : null}
      <input
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={(event) => {
          handlePickedFiles(event.target.files || []);
          event.target.value = '';
        }}
      />
    </label>
  );
}

export async function embedImageFromFile(pdfDoc, file) {
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

export async function getPdfQuickPreview(file, scale = 0.5) {
  const pdfjsLib = await ensurePdfJs();
  const raw = await readAsArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(raw) }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  return {
    preview: canvas.toDataURL('image/jpeg', 0.85),
    pageCount: pdf.numPages,
  };
}

export const PAPER_SIZES = {
  A4: { label: 'A4', points: PageSizes.A4, widthMm: 210, heightMm: 297 },
  Letter: { label: 'Letter', points: PageSizes.Letter, widthMm: 215.9, heightMm: 279.4 },
};

export const PASSPORT_PRESETS = [
  { id: 'uae', label: 'UAE Visa / Emirates', widthMm: 35, heightMm: 45, dpi: 600, bg: '#ffffff' },
  { id: 'india', label: 'India Passport', widthMm: 35, heightMm: 45, dpi: 600, bg: '#ffffff' },
  { id: 'us', label: 'US Passport', widthMm: 51, heightMm: 51, dpi: 600, bg: '#ffffff' },
  { id: 'uk', label: 'UK Passport', widthMm: 35, heightMm: 45, dpi: 600, bg: '#f5f7fb' },
  { id: 'schengen', label: 'Schengen Visa', widthMm: 35, heightMm: 45, dpi: 600, bg: '#f3f4f6' },
  { id: 'canada', label: 'Canada Passport', widthMm: 50, heightMm: 70, dpi: 600, bg: '#ffffff' },
  { id: 'custom', label: 'Custom Size', widthMm: 35, heightMm: 45, dpi: 600, bg: '#ffffff' },
];

export const QR_LEVEL_L = {
  1: { dataCodewords: 19, ecCodewords: 7, blocks: [19], align: [] },
  2: { dataCodewords: 34, ecCodewords: 10, blocks: [34], align: [6, 18] },
  3: { dataCodewords: 55, ecCodewords: 15, blocks: [55], align: [6, 22] },
  4: { dataCodewords: 80, ecCodewords: 20, blocks: [80], align: [6, 26] },
  5: { dataCodewords: 108, ecCodewords: 26, blocks: [108], align: [6, 30] },
  6: { dataCodewords: 136, ecCodewords: 18, blocks: [68, 68], align: [6, 34] },
  7: { dataCodewords: 156, ecCodewords: 20, blocks: [78, 78], align: [6, 22, 38] },
  8: { dataCodewords: 194, ecCodewords: 24, blocks: [97, 97], align: [6, 24, 42] },
  9: { dataCodewords: 232, ecCodewords: 30, blocks: [116, 116], align: [6, 26, 46] },
};

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function safeFilename(name, fallback = 'file') {
  return (name || fallback).replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_').slice(0, 90) || fallback;
}

export function hexToRgb(hex) {
  const normalized = (hex || '#000000').replace('#', '').trim();
  const full = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized.padEnd(6, '0').slice(0, 6);
  return {
    r: parseInt(full.slice(0, 2), 16) || 0,
    g: parseInt(full.slice(2, 4), 16) || 0,
    b: parseInt(full.slice(4, 6), 16) || 0,
  };
}

export function hexToPdfRgb(hex) {
  const color = hexToRgb(hex);
  return rgb(color.r / 255, color.g / 255, color.b / 255);
}

export function canvasToBlob(canvas, type = 'image/png', quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas export failed'));
    }, type, quality);
  });
}

export function dataUrlToUint8Array(dataUrl) {
  const [, raw = ''] = dataUrl.split(',');
  const binary = atob(raw);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function littleEndian(value, bytes) {
  const output = new Uint8Array(bytes);
  for (let i = 0; i < bytes; i += 1) {
    output[i] = (value >>> (i * 8)) & 0xff;
  }
  return output;
}

export function zipDateParts() {
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  return { dosTime, dosDate };
}

export async function createZipBlob(entries) {
  const encoder = new TextEncoder();
  const { dosTime, dosDate } = zipDateParts();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(safeFilename(entry.name));
    const data = new Uint8Array(await entry.blob.arrayBuffer());
    const checksum = crc32(data);

    const localHeader = new Uint8Array([
      ...littleEndian(0x04034b50, 4),
      ...littleEndian(20, 2),
      ...littleEndian(0, 2),
      ...littleEndian(0, 2),
      ...littleEndian(dosTime, 2),
      ...littleEndian(dosDate, 2),
      ...littleEndian(checksum, 4),
      ...littleEndian(data.length, 4),
      ...littleEndian(data.length, 4),
      ...littleEndian(nameBytes.length, 2),
      ...littleEndian(0, 2),
    ]);

    const centralHeader = new Uint8Array([
      ...littleEndian(0x02014b50, 4),
      ...littleEndian(20, 2),
      ...littleEndian(20, 2),
      ...littleEndian(0, 2),
      ...littleEndian(0, 2),
      ...littleEndian(dosTime, 2),
      ...littleEndian(dosDate, 2),
      ...littleEndian(checksum, 4),
      ...littleEndian(data.length, 4),
      ...littleEndian(data.length, 4),
      ...littleEndian(nameBytes.length, 2),
      ...littleEndian(0, 2),
      ...littleEndian(0, 2),
      ...littleEndian(0, 2),
      ...littleEndian(0, 2),
      ...littleEndian(0, 4),
      ...littleEndian(offset, 4),
    ]);

    localParts.push(localHeader, nameBytes, data);
    centralParts.push(centralHeader, nameBytes);
    offset += localHeader.length + nameBytes.length + data.length;
  }

  const centralOffset = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endRecord = new Uint8Array([
    ...littleEndian(0x06054b50, 4),
    ...littleEndian(0, 2),
    ...littleEndian(0, 2),
    ...littleEndian(entries.length, 2),
    ...littleEndian(entries.length, 2),
    ...littleEndian(centralSize, 4),
    ...littleEndian(centralOffset, 4),
    ...littleEndian(0, 2),
  ]);

  return new Blob([...localParts, ...centralParts, endRecord], { type: 'application/zip' });
}

export const QR_GF = (() => {
  const exp = new Uint8Array(512);
  const log = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    exp[i] = x;
    log[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) {
    exp[i] = exp[i - 255];
  }
  return { exp, log };
})();

export function qrGfMultiply(a, b) {
  if (a === 0 || b === 0) return 0;
  return QR_GF.exp[QR_GF.log[a] + QR_GF.log[b]];
}

export function qrGeneratorPolynomial(degree) {
  let result = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array(result.length + 1).fill(0);
    for (let j = 0; j < result.length; j += 1) {
      next[j] ^= result[j];
      next[j + 1] ^= qrGfMultiply(result[j], QR_GF.exp[i]);
    }
    result = next;
  }
  return result;
}

export function qrRemainder(data, degree) {
  const generator = qrGeneratorPolynomial(degree);
  const result = new Uint8Array(degree);
  data.forEach((byte) => {
    const factor = byte ^ result[0];
    result.copyWithin(0, 1);
    result[degree - 1] = 0;
    for (let i = 0; i < degree; i += 1) {
      result[i] ^= qrGfMultiply(generator[i + 1], factor);
    }
  });
  return Array.from(result);
}

export function appendBits(target, value, length) {
  for (let i = length - 1; i >= 0; i -= 1) {
    target.push(((value >>> i) & 1) === 1);
  }
}

export function buildQrDataCodewords(text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  const version = Number(Object.keys(QR_LEVEL_L).find((key) => {
    const capacityBits = QR_LEVEL_L[key].dataCodewords * 8;
    return 4 + 8 + bytes.length * 8 <= capacityBits;
  }));

  if (!version) {
    throw new Error('QR content is too long. Keep it below about 230 bytes.');
  }

  const spec = QR_LEVEL_L[version];
  const bits = [];
  appendBits(bits, 0x4, 4);
  appendBits(bits, bytes.length, 8);
  bytes.forEach((byte) => appendBits(bits, byte, 8));

  const capacityBits = spec.dataCodewords * 8;
  const terminator = Math.min(4, capacityBits - bits.length);
  appendBits(bits, 0, terminator);
  while (bits.length % 8 !== 0) bits.push(false);

  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j += 1) {
      byte = (byte << 1) | (bits[i + j] ? 1 : 0);
    }
    data.push(byte);
  }

  const pads = [0xec, 0x11];
  let padIndex = 0;
  while (data.length < spec.dataCodewords) {
    data.push(pads[padIndex % 2]);
    padIndex += 1;
  }

  return { version, spec, data };
}

export function addQrErrorCorrection(spec, data) {
  const blocks = [];
  let offset = 0;
  spec.blocks.forEach((length) => {
    const block = data.slice(offset, offset + length);
    blocks.push({ data: block, ec: qrRemainder(block, spec.ecCodewords) });
    offset += length;
  });

  const codewords = [];
  const maxDataLength = Math.max(...blocks.map((block) => block.data.length));
  for (let i = 0; i < maxDataLength; i += 1) {
    blocks.forEach((block) => {
      if (i < block.data.length) codewords.push(block.data[i]);
    });
  }
  for (let i = 0; i < spec.ecCodewords; i += 1) {
    blocks.forEach((block) => codewords.push(block.ec[i]));
  }
  return codewords;
}

export function qrFormatBits(mask) {
  const data = (1 << 3) | mask;
  let remainder = data;
  for (let i = 0; i < 10; i += 1) {
    remainder = (remainder << 1) ^ (((remainder >>> 9) & 1) ? 0x537 : 0);
  }
  return ((data << 10) | remainder) ^ 0x5412;
}

export function qrVersionBits(version) {
  let remainder = version;
  for (let i = 0; i < 12; i += 1) {
    remainder = (remainder << 1) ^ (((remainder >>> 11) & 1) ? 0x1f25 : 0);
  }
  return (version << 12) | remainder;
}

export function qrMask(mask, row, col) {
  switch (mask) {
    case 1: return row % 2 === 0;
    case 2: return col % 3 === 0;
    case 3: return (row + col) % 3 === 0;
    case 4: return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5: return ((row * col) % 2) + ((row * col) % 3) === 0;
    case 6: return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
    case 7: return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
    default: return (row + col) % 2 === 0;
  }
}

export function createQrMatrix(text) {
  const { version, spec, data } = buildQrDataCodewords(text || ' ');
  const codewords = addQrErrorCorrection(spec, data);
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunction = (row, col, dark) => {
    if (row < 0 || col < 0 || row >= size || col >= size) return;
    modules[row][col] = dark;
    isFunction[row][col] = true;
  };

  const drawFinder = (row, col) => {
    for (let dy = -1; dy <= 7; dy += 1) {
      for (let dx = -1; dx <= 7; dx += 1) {
        const rr = row + dy;
        const cc = col + dx;
        const dark = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6
          && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
        setFunction(rr, cc, dark);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i += 1) {
    setFunction(6, i, i % 2 === 0);
    setFunction(i, 6, i % 2 === 0);
  }

  spec.align.forEach((row) => {
    spec.align.forEach((col) => {
      const nearTop = row < 9;
      const nearLeft = col < 9;
      const nearRight = col > size - 10;
      if ((nearTop && nearLeft) || (nearTop && nearRight) || (row > size - 10 && nearLeft)) return;
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          setFunction(row + dy, col + dx, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    });
  });

  setFunction(size - 8, 8, true);

  if (version >= 7) {
    const versionBits = qrVersionBits(version);
    for (let i = 0; i < 18; i += 1) {
      const dark = ((versionBits >>> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFunction(b, a, dark);
      setFunction(a, b, dark);
    }
  }

  const mask = 0;
  const format = qrFormatBits(mask);
  const bit = (index) => ((format >>> index) & 1) === 1;
  for (let i = 0; i <= 5; i += 1) setFunction(8, i, bit(i));
  setFunction(8, 7, bit(6));
  setFunction(8, 8, bit(7));
  setFunction(7, 8, bit(8));
  for (let i = 9; i < 15; i += 1) setFunction(14 - i, 8, bit(i));
  for (let i = 0; i < 8; i += 1) setFunction(size - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i += 1) setFunction(8, size - 15 + i, bit(i));

  const bits = [];
  codewords.forEach((codeword) => appendBits(bits, codeword, 8));
  let bitIndex = 0;
  let upward = true;
  for (let col = size - 1; col >= 1; col -= 2) {
    if (col === 6) col -= 1;
    for (let rowIndex = 0; rowIndex < size; rowIndex += 1) {
      const row = upward ? size - 1 - rowIndex : rowIndex;
      for (let c = 0; c < 2; c += 1) {
        const currentCol = col - c;
        if (!isFunction[row][currentCol]) {
          const dark = (bits[bitIndex] || false) !== qrMask(mask, row, currentCol);
          modules[row][currentCol] = dark;
          bitIndex += 1;
        }
      }
    }
    upward = !upward;
  }

  return modules;
}

export function drawQrCanvas(text, options = {}) {
  const matrix = createQrMatrix(text);
  const moduleCount = matrix.length;
  const quiet = Number(options.quiet ?? 4);
  const moduleSize = Math.max(2, Number(options.moduleSize || 10));
  const canvas = document.createElement('canvas');
  canvas.width = (moduleCount + quiet * 2) * moduleSize;
  canvas.height = canvas.width;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = options.light || '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = options.dark || '#000000';
  matrix.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) {
        ctx.fillRect((x + quiet) * moduleSize, (y + quiet) * moduleSize, moduleSize, moduleSize);
      }
    });
  });
  return canvas;
}

export async function getPdfObjectFromStore(store, id) {
  if (!store || !id) return null;
  try {
    const value = store.get(id);
    if (value) return value;
  } catch {
    // PDF.js may require the callback form until render-time objects resolve.
  }

  try {
    return await new Promise((resolve) => {
      store.get(id, (value) => resolve(value || null));
    });
  } catch {
    return null;
  }
}

export async function getPdfImageObject(page, id) {
  return (
    await getPdfObjectFromStore(page.objs, id)
    || await getPdfObjectFromStore(page.commonObjs, id)
  );
}

export async function pdfImageObjectToBlob(image) {
  if (!image) return null;

  const width = image.width || image.bitmap?.width || image.naturalWidth;
  const height = image.height || image.bitmap?.height || image.naturalHeight;
  if (!width || !height || width < 4 || height < 4) return null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (image.bitmap || image instanceof HTMLImageElement || image instanceof HTMLCanvasElement) {
    ctx.drawImage(image.bitmap || image, 0, 0);
    return canvasToBlob(canvas, 'image/png');
  }

  const raw = image.data;
  if (!raw) return null;

  const pixelCount = width * height;
  const rgba = new Uint8ClampedArray(pixelCount * 4);

  if (raw.length >= pixelCount * 4) {
    rgba.set(raw.slice(0, pixelCount * 4));
  } else if (raw.length >= pixelCount * 3) {
    for (let i = 0, p = 0; i < pixelCount; i += 1, p += 3) {
      const out = i * 4;
      rgba[out] = raw[p];
      rgba[out + 1] = raw[p + 1];
      rgba[out + 2] = raw[p + 2];
      rgba[out + 3] = 255;
    }
  } else if (raw.length >= pixelCount) {
    for (let i = 0; i < pixelCount; i += 1) {
      const out = i * 4;
      rgba[out] = raw[i];
      rgba[out + 1] = raw[i];
      rgba[out + 2] = raw[i];
      rgba[out + 3] = 255;
    }
  } else {
    const stride = Math.ceil(width / 8);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const packed = raw[y * stride + (x >> 3)] || 0;
        const value = ((packed >> (7 - (x & 7))) & 1) ? 255 : 0;
        const out = (y * width + x) * 4;
        rgba[out] = value;
        rgba[out + 1] = value;
        rgba[out + 2] = value;
        rgba[out + 3] = 255;
      }
    }
  }

  ctx.putImageData(new ImageData(rgba, width, height), 0, 0);
  return canvasToBlob(canvas, 'image/png');
}

export async function extractPdfImageEntries(file, onProgress) {
  const pdfjsLib = await ensurePdfJs();
  const raw = await readAsArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(raw) }).promise;
  const ops = pdfjsLib.OPS || {};
  const imageOps = new Set([
    ops.paintImageXObject,
    ops.paintJpegXObject,
    ops.paintInlineImageXObject,
    ops.paintImageXObjectRepeat,
    ops.paintImageMaskXObject,
    ops.paintImageMaskXObjectRepeat,
  ].filter((value) => value !== undefined));
  const entries = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    onProgress?.(`Scanning page ${pageNumber} of ${pdf.numPages}...`);
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

    const operatorList = await page.getOperatorList();
    const seen = new Set();

    for (let index = 0; index < operatorList.fnArray.length; index += 1) {
      if (!imageOps.has(operatorList.fnArray[index])) continue;

      const args = operatorList.argsArray[index] || [];
      const firstArg = args[0];
      const image = typeof firstArg === 'string'
        ? await getPdfImageObject(page, firstArg)
        : firstArg;
      const key = typeof firstArg === 'string' ? firstArg : `inline_${index}`;
      if (!image || seen.has(key)) continue;
      seen.add(key);

      const blob = await pdfImageObjectToBlob(image);
      if (blob) {
        entries.push({
          name: `page_${pageNumber}_image_${entries.length + 1}.png`,
          blob,
        });
      }
    }
  }

  return entries;
}

export function parsePageRanges(input, max) {
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

export function applySharpenToCanvas(canvas, strength = 0) {
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

export function getPageSizeMm(pageSize) {
  if (pageSize === 'LETTER') return { width: 215.9, height: 279.4, points: PageSizes.Letter };
  return { width: 210, height: 297, points: PageSizes.A4 };
}

export function fitContain(boxW, boxH, imgW, imgH) {
  const ratio = imgW / imgH;
  const boxRatio = boxW / boxH;
  if (ratio > boxRatio) {
    const width = boxW;
    const height = width / ratio;
    return { width, height, xOffset: 0, yOffset: (boxH - height) / 2 };
  }
  const height = boxH;
  const width = height * ratio;
  return { width, height, xOffset: (boxW - width) / 2, yOffset: 0 };
}
