import { DebugTestRunner } from '@/components/admin/hyperguest/DebugTestRunner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DebugPage = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            🔧 HyperGuest Debug Console
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Lance les tests en cascade pour identifier rapidement si un problème vient de chez nous ou de chez HyperGuest.
          </p>
        </CardHeader>
        <CardContent>
          <DebugTestRunner />
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugPage;
