export function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadDataUrl(url, filename) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function outputFilename(sourceName, suffix, ext) {
  const rawName = (sourceName || 'file').split(/[\\/]/).pop();
  const extensionIndex = rawName.lastIndexOf('.');
  const baseName = extensionIndex > 0 ? rawName.slice(0, extensionIndex) : rawName;
  const safeBase = (baseName || 'file')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/^\.+|\.+$/g, '') || 'file';
  const safeSuffix = suffix ? `_${String(suffix).replace(/[^a-z0-9_-]+/gi, '_')}` : '';
  const safeExtension = String(ext || 'bin').replace(/^\.+/, '').toLowerCase();
  return `${safeBase}${safeSuffix}.${safeExtension}`;
}

export async function ensurePdfJs() {
  if (typeof window === 'undefined') {
    throw new Error('PDF.js is browser-only');
  }

  if (window.pdfjsLib) {
    return window.pdfjsLib;
  }

  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load PDF.js'));
    document.head.appendChild(script);
  });

  if (!window.pdfjsLib) {
    throw new Error('PDF.js not available after load');
  }

  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

  return window.pdfjsLib;
}

export function reorderByDrag(list, fromIndex, toIndex) {
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function mmToPt(mm) {
  return mm * 2.834645669;
}
