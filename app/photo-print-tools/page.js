import { Suspense } from 'react';
import ToolkitApp from '../../components/ToolkitApp';

export default function PhotoPrintToolsPage() {
  return (
    <Suspense fallback={null}>
      <ToolkitApp
        category="photo-print"
        title="Photo Print Tools"
        subtitle="Photo print sheet generators and printer-ready passport/photo layouts."
      />
    </Suspense>
  );
}
