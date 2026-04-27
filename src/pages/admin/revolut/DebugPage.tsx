import { RevolutDebugTestRunner } from '@/components/admin/revolut/RevolutDebugTestRunner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RevolutDebugPage = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            💳 Revolut Debug Console
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Lance les tests en cascade pour identifier rapidement si un problème vient de chez nous, de la configuration des secrets, ou de l'API Revolut.
          </p>
        </CardHeader>
        <CardContent>
          <RevolutDebugTestRunner />
        </CardContent>
      </Card>
    </div>
  );
};

export default RevolutDebugPage;
