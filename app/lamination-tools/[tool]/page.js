import { Suspense } from 'react';
import ToolkitApp from '../../../components/ToolkitApp';

export default async function LaminationToolPage({ params }) {
  const { tool } = await params;

  return (
    <Suspense fallback={null}>
      <ToolkitApp
        category="lamination"
        activeToolId={tool}
        title="Lamination Tools"
        subtitle="Passport/EID lamination workflows prepared for direct PDF printing."
      />
    </Suspense>
  );
}
