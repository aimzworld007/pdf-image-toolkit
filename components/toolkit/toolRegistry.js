export const TOOL_SECTIONS = [
  {
    category: 'image',
    title: 'Image Tools',
    items: [
      { id: 'merge-images', label: 'Merge Images', desc: 'Join two images vertically or horizontally.' },
      { id: 'compress-jpg', label: 'Compress JPG', desc: 'Reduce JPG file size with quality slider.' },
      { id: 'resize-image', label: 'Resize Image', desc: 'Change dimensions and keep aspect ratio.' },
      { id: 'resize-by-size', label: 'Resize By File Size', desc: 'Auto-fit JPG to target KB/MB size.' },
      { id: 'crop-image', label: 'Crop Image', desc: 'Crop using x/y/width/height controls.' },
      { id: 'convert-image', label: 'Image Converter', desc: 'Convert between JPG and PNG formats.' },
      { id: 'enhance-image', label: 'Image Enhance', desc: 'Adjust brightness, contrast, saturation, and sharpness.' },
      { id: 'background-remover', label: 'Background Remover', desc: 'Remove solid or studio backgrounds and export transparent PNG.' },
      { id: 'qr-code-generator', label: 'QR Code Generator', desc: 'Create QR codes and export PNG/PDF files.' },
      { id: 'signature-generator', label: 'Signature Generator', desc: 'Draw signature and save as image file.' },
    ],
  },
  {
    category: 'pdf',
    title: 'PDF Tools',
    items: [
      { id: 'pdf-workbench', label: 'PDF Workbench', desc: 'Tabbed PDF studio like online converter layout.' },
      { id: 'pdf-to-jpg', label: 'PDF to JPG', desc: 'Extract all PDF pages to JPG images.' },
      { id: 'combine-pdfs', label: 'Combine PDFs & Images', desc: 'Reorder and merge PDFs/images into one PDF.' },
      { id: 'pdf-page-studio', label: 'PDF Page Studio', desc: 'Remove/rearrange pages, add blank/image pages, and export.' },
      { id: 'extract-pdf-images', label: 'Extract PDF Images', desc: 'Pull embedded PDF images into a downloadable ZIP.' },
      { id: 'certificate-form-filler', label: 'Certificate / Form Filler', desc: 'Place text on PDFs or images and export a filled PDF.' },
      { id: 'compress-pdf', label: 'Compress PDF', desc: 'Optimize PDF streams for smaller file size.' },
    ],
  },
  {
    category: 'lamination',
    title: 'Lamination Tools',
    items: [
      { id: 'eid-lamination', label: 'EID Lamination Tool', desc: 'High-DPI front/back EID lamination print PDF.' },
    ],
  },
  {
    category: 'photo-print',
    title: 'Photo Print Tools',
    items: [
      { id: 'print-photo-pdf', label: 'Print Photo PDF', desc: 'Auto-grid passport photos on A4/Letter pages for direct print.' },
      { id: 'passport-photo-maker', label: 'Passport Photo Maker', desc: 'Country presets, background color, size presets, and print sheets.' },
    ],
  },
];

export const CATEGORY_PATHS = {
  image: '/image-tools',
  pdf: '/pdf-tools',
  lamination: '/lamination-tools',
  'photo-print': '/photo-print-tools',
};
