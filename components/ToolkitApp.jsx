'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CATEGORY_PATHS, TOOL_SECTIONS } from './toolkit/toolRegistry';

function ToolLoading() {
  return (
    <div className="panel">
      <p className="status">Loading tool...</p>
    </div>
  );
}

const TOOL_COMPONENTS = {
  'jpg-to-pdf': dynamic(() => import('./toolkit/tools/JpgToPdfTool'), { ssr: false, loading: ToolLoading }),
  'pdf-workbench': dynamic(() => import('./toolkit/tools/PdfWorkbenchTool'), { ssr: false, loading: ToolLoading }),
  'pdf-to-jpg': dynamic(() => import('./toolkit/tools/PdfToJpgTool'), { ssr: false, loading: ToolLoading }),
  'combine-pdfs': dynamic(() => import('./toolkit/tools/CombinePdfsTool'), { ssr: false, loading: ToolLoading }),
  'images-to-pdf': dynamic(() => import('./toolkit/tools/ImagesToPdfTool'), { ssr: false, loading: ToolLoading }),
  'compress-jpg': dynamic(() => import('./toolkit/tools/CompressJpgTool'), { ssr: false, loading: ToolLoading }),
  'resize-image': dynamic(() => import('./toolkit/tools/ResizeImageTool'), { ssr: false, loading: ToolLoading }),
  'resize-by-size': dynamic(() => import('./toolkit/tools/ResizeBySizeTool'), { ssr: false, loading: ToolLoading }),
  'crop-image': dynamic(() => import('./toolkit/tools/CropImageTool'), { ssr: false, loading: ToolLoading }),
  'merge-images': dynamic(() => import('./toolkit/tools/MergeImagesTool'), { ssr: false, loading: ToolLoading }),
  'convert-image': dynamic(() => import('./toolkit/tools/ConvertImageTool'), { ssr: false, loading: ToolLoading }),
  'enhance-image': dynamic(() => import('./toolkit/tools/ImageEnhanceTool'), { ssr: false, loading: ToolLoading }),
  'background-remover': dynamic(() => import('./toolkit/tools/BackgroundRemoverTool'), { ssr: false, loading: ToolLoading }),
  'qr-code-generator': dynamic(() => import('./toolkit/tools/QrCodeGeneratorTool'), { ssr: false, loading: ToolLoading }),
  'signature-generator': dynamic(() => import('./toolkit/tools/SignatureGeneratorTool'), { ssr: false, loading: ToolLoading }),
  'pdf-page-studio': dynamic(() => import('./toolkit/tools/PdfPageStudioTool'), { ssr: false, loading: ToolLoading }),
  'extract-pdf-images': dynamic(() => import('./toolkit/tools/ExtractPdfImagesTool'), { ssr: false, loading: ToolLoading }),
  'certificate-form-filler': dynamic(() => import('./toolkit/tools/CertificateFormFillerTool'), { ssr: false, loading: ToolLoading }),
  'compress-pdf': dynamic(() => import('./toolkit/tools/CompressPdfTool'), { ssr: false, loading: ToolLoading }),
  'print-photo-pdf': dynamic(() => import('./toolkit/tools/PrintPhotoPdfTool'), { ssr: false, loading: ToolLoading }),
  'passport-photo-maker': dynamic(() => import('./toolkit/tools/PassportPhotoMakerTool'), { ssr: false, loading: ToolLoading }),
  'eid-lamination': dynamic(() => import('./toolkit/tools/EidLaminationTool'), { ssr: false, loading: ToolLoading }),
};

function renderTool(activeTool, onBack) {
  const ActiveTool = TOOL_COMPONENTS[activeTool];
  return ActiveTool ? <ActiveTool onBack={onBack} /> : null;
}

export default function ToolkitApp({ category = 'all', title, subtitle, activeToolId = null }) {
  const [activeTool, setActiveTool] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sections = useMemo(() => {
    if (category === 'all') return TOOL_SECTIONS;
    return TOOL_SECTIONS.filter((section) => section.category === category);
  }, [category]);

  const allowedToolIds = useMemo(
    () => sections.flatMap((section) => section.items.map((item) => item.id)),
    [sections]
  );

  useEffect(() => {
    const requested = activeToolId || searchParams.get('tool');
    if (requested && allowedToolIds.includes(requested)) {
      setActiveTool(requested);
    } else {
      setActiveTool(null);
    }
  }, [activeToolId, searchParams, allowedToolIds]);

  const openTool = (toolId) => {
    const basePath = CATEGORY_PATHS[category];
    if (basePath) {
      router.push(`${basePath}/${toolId}`);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set('tool', toolId);
    router.push(`${pathname}?${params.toString()}`);
  };

  const closeTool = () => {
    const basePath = CATEGORY_PATHS[category];
    if (basePath) {
      router.push(basePath);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete('tool');
    const nextQuery = params.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  return (
    <main className="container">
      <header className="hero" style={{ marginBottom: 20 }}>
        <h1>{title || 'PDF & Image Toolkit Pro'}</h1>
        <p>
          {subtitle || 'Modern Next.js toolkit with smooth PDF/image workflows and built-in EID lamination support. Everything runs client-side. No login or registration required.'}
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          <Link href="/" className="btn ghost">Home</Link>
          <Link href="/image-tools" className="btn ghost">Image Tools</Link>
          <Link href="/pdf-tools" className="btn ghost">PDF Tools</Link>
          <Link href="/lamination-tools" className="btn ghost">Lamination Tools</Link>
          <Link href="/photo-print-tools" className="btn ghost">Photo Print Tools</Link>
        </div>
      </header>

      {!activeTool ? (
        <>
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="section-title">{section.title}</h2>
              <div className="tools-grid">
                {section.items.map((tool) => (
                  <article key={tool.id} className="tool-card" onClick={() => openTool(tool.id)}>
                    <h3>{tool.label}</h3>
                    <p>{tool.desc}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </>
      ) : (
        renderTool(activeTool, closeTool)
      )}
    </main>
  );
}
