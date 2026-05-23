import { Suspense } from 'react';
import ToolkitApp from '../../components/ToolkitApp';

export default function PdfToolsPage() {
  return (
    <Suspense fallback={null}>
      <ToolkitApp
        category="pdf"
        title="PDF Tools"
        subtitle="Dedicated PDF workspace with workbench, editing, combining, and compression."
      />
    </Suspense>
  );
}
