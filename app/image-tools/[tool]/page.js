import { Suspense } from 'react';
import ToolkitApp from '../../../components/ToolkitApp';

export default async function ImageToolPage({ params }) {
  const { tool } = await params;

  return (
    <Suspense fallback={null}>
      <ToolkitApp
        category="image"
        activeToolId={tool}
        title="Image Tools"
        subtitle="Dedicated image workspace with drag-drop, previews, and advanced editing options."
      />
    </Suspense>
  );
}
