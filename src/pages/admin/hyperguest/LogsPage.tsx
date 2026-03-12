import { ApiLogViewer } from '@/components/admin/hyperguest/ApiLogViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LogsPage = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">📋 HyperGuest Logs</CardTitle>
          <p className="text-sm text-muted-foreground">
            Historique des runs de diagnostic. Cliquez sur un run pour voir le détail.
          </p>
        </CardHeader>
        <CardContent>
          <ApiLogViewer />
        </CardContent>
      </Card>
    </div>
  );
};

export default LogsPage;
