'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CATEGORY_PATHS, TOOL_SECTIONS } from './toolkit/toolRegistry';
import { renderTool } from './toolkit/toolComponents';

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
