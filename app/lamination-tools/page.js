import { Suspense } from 'react';
import ToolkitApp from '../../components/ToolkitApp';

export default function LaminationToolsPage() {
  return (
    <Suspense fallback={null}>
      <ToolkitApp
        category="lamination"
        title="Lamination Tools"
        subtitle="Passport/EID lamination workflows prepared for direct PDF printing."
      />
    </Suspense>
  );
}
