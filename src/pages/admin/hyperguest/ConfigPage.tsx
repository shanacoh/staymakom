import { ConfigPanel } from '@/components/admin/hyperguest/ConfigPanel';
import { HealthWidget } from '@/components/admin/hyperguest/HealthWidget';

const ConfigPage = () => {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <HealthWidget />
      <ConfigPanel />
    </div>
  );
};

export default ConfigPage;
