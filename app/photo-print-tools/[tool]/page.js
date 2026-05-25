import { Suspense } from 'react';
import ToolkitApp from '../../../components/ToolkitApp';

export default async function PhotoPrintToolPage({ params }) {
  const { tool } = await params;

  return (
    <Suspense fallback={null}>
      <ToolkitApp
        category="photo-print"
        activeToolId={tool}
        title="Photo Print Tools"
        subtitle="Photo print sheet generators and printer-ready passport/photo layouts."
      />
    </Suspense>
  );
}
