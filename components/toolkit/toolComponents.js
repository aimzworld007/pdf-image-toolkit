'use client';

import dynamic from 'next/dynamic';

function ToolLoading() {
  return (
    <div className="panel">
      <p className="status">Loading tool...</p>
    </div>
  );
}

const TOOL_COMPONENTS = {
  'jpg-to-pdf': dynamic(() => import('./tools/JpgToPdfTool'), { ssr: false, loading: ToolLoading }),
  'pdf-workbench': dynamic(() => import('./tools/PdfWorkbenchTool'), { ssr: false, loading: ToolLoading }),
  'pdf-to-jpg': dynamic(() => import('./tools/PdfToJpgTool'), { ssr: false, loading: ToolLoading }),
  'combine-pdfs': dynamic(() => import('./tools/CombinePdfsTool'), { ssr: false, loading: ToolLoading }),
  'images-to-pdf': dynamic(() => import('./tools/ImagesToPdfTool'), { ssr: false, loading: ToolLoading }),
  'compress-jpg': dynamic(() => import('./tools/CompressJpgTool'), { ssr: false, loading: ToolLoading }),
  'resize-image': dynamic(() => import('./tools/ResizeImageTool'), { ssr: false, loading: ToolLoading }),
  'resize-by-size': dynamic(() => import('./tools/ResizeBySizeTool'), { ssr: false, loading: ToolLoading }),
  'crop-image': dynamic(() => import('./tools/CropImageTool'), { ssr: false, loading: ToolLoading }),
  'merge-images': dynamic(() => import('./tools/MergeImagesTool'), { ssr: false, loading: ToolLoading }),
  'convert-image': dynamic(() => import('./tools/ConvertImageTool'), { ssr: false, loading: ToolLoading }),
  'enhance-image': dynamic(() => import('./tools/ImageEnhanceTool'), { ssr: false, loading: ToolLoading }),
  'background-remover': dynamic(() => import('./tools/BackgroundRemoverTool'), { ssr: false, loading: ToolLoading }),
  'qr-code-generator': dynamic(() => import('./tools/QrCodeGeneratorTool'), { ssr: false, loading: ToolLoading }),
  'signature-generator': dynamic(() => import('./tools/SignatureGeneratorTool'), { ssr: false, loading: ToolLoading }),
  'pdf-page-studio': dynamic(() => import('./tools/PdfPageStudioTool'), { ssr: false, loading: ToolLoading }),
  'extract-pdf-images': dynamic(() => import('./tools/ExtractPdfImagesTool'), { ssr: false, loading: ToolLoading }),
  'certificate-form-filler': dynamic(() => import('./tools/CertificateFormFillerTool'), { ssr: false, loading: ToolLoading }),
  'compress-pdf': dynamic(() => import('./tools/CompressPdfTool'), { ssr: false, loading: ToolLoading }),
  'print-photo-pdf': dynamic(() => import('./tools/PrintPhotoPdfTool'), { ssr: false, loading: ToolLoading }),
  'passport-photo-maker': dynamic(() => import('./tools/PassportPhotoMakerTool'), { ssr: false, loading: ToolLoading }),
  'eid-lamination': dynamic(() => import('./tools/EidLaminationTool'), { ssr: false, loading: ToolLoading }),
};

export function renderTool(activeTool, onBack) {
  const ActiveTool = TOOL_COMPONENTS[activeTool];
  return ActiveTool ? <ActiveTool onBack={onBack} /> : null;
}
