import { Suspense } from 'react';
import ToolkitApp from '../../../components/ToolkitApp';

export default async function PdfToolPage({ params }) {
  const { tool } = await params;

  return (
    <Suspense fallback={null}>
      <ToolkitApp
        category="pdf"
        activeToolId={tool}
        title="PDF Tools"
        subtitle="Dedicated PDF workspace with workbench, editing, combining, and compression."
      />
    </Suspense>
  );
}
