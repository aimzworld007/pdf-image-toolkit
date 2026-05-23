import { Suspense } from 'react';
import ToolkitApp from '../../components/ToolkitApp';

export default function ImageToolsPage() {
  return (
    <Suspense fallback={null}>
      <ToolkitApp
        category="image"
        title="Image Tools"
        subtitle="Dedicated image workspace with drag-drop, previews, and advanced editing options."
      />
    </Suspense>
  );
}
