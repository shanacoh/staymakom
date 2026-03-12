import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { DiagnosticBloc } from '@/hooks/admin/useDiagnostic';
import { useDiagnosticExport } from '@/hooks/admin/useDiagnosticExport';

interface DiagnosticExportProps {
  blocs: DiagnosticBloc[];
}

export const DiagnosticExport = ({ blocs }: DiagnosticExportProps) => {
  const { exportToMarkdown } = useDiagnosticExport();

  return (
    <Button
      onClick={() => exportToMarkdown(blocs)}
      variant="outline"
      size="sm"
    >
      <Download className="h-4 w-4 mr-2" />
      Export MD
    </Button>
  );
};