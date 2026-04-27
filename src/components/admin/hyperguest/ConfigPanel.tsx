import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Server, Key, Globe, Clock, Shield } from 'lucide-react';
import { useHyperGuestAdminEnvironment } from '@/hooks/admin/useAdminEnvironment';

export function ConfigPanel() {
  const [environment] = useHyperGuestAdminEnvironment();
  const isProd = environment === 'prod';

  const dynamicEnv = {
    label: isProd ? 'PRODUCTION' : 'DEV',
    badgeClass: isProd
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
      : 'bg-amber-500 hover:bg-amber-600 text-white',
  };
  const tokenSecret = isProd ? 'HYPERGUEST_TOKEN_PROD' : 'HYPERGUEST_TOKEN_DEV';
  const isTestValue = isProd ? 'false' : 'true';

  const configItems: Array<{
    icon: typeof Globe;
    label: string;
    value: string;
    note: string;
    badgeClass?: string;
  }> = [
    { icon: Globe, label: 'Environment', value: dynamicEnv.label, note: 'Choisi via le toggle Dev/Prod (admin)', badgeClass: dynamicEnv.badgeClass },
    { icon: Key, label: 'Token utilisé', value: tokenSecret, note: 'Secret Supabase — la valeur n\'est jamais exposée au navigateur' },
    { icon: Shield, label: 'isTest', value: isTestValue, note: isProd ? 'false en Prod (vraie réservation)' : 'true en Dev (sandbox HyperGuest)' },
    { icon: Server, label: 'Search URL', value: 'search-api.hyperguest.io/2.0/', note: 'Availability search' },
    { icon: Server, label: 'Book URL', value: 'book-api.hyperguest.com/2.0/', note: 'Booking & cancellation' },
    { icon: Globe, label: 'Property live', value: '113334', note: 'Hotel 1935 Tel Aviv — 4 room types' },
    { icon: Globe, label: 'Property cert', value: '19912', note: 'Certification sandbox' },
    { icon: Clock, label: 'Timeout booking', value: '300s', note: 'AbortController 300000ms' },
    { icon: Globe, label: 'CORS', value: 'staymakom.com', note: 'Allow-Origin: *' },
    { icon: CheckCircle2, label: 'Cancel simulate', value: '✅ Implémenté', note: 'cancelSimulation: true' },
    { icon: Clock, label: 'React Query', value: 'staleTime 2min', note: 'useHyperGuestAvailability' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Configuration HyperGuest</CardTitle>
        <p className="text-sm text-muted-foreground">
          Vue en lecture seule. L'environnement (Dev / Prod) suit le toggle de la page Debug — il n'affecte que tes tests admin, jamais le site public.
        </p>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {configItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.note}</p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className={`font-mono text-xs ${item.badgeClass ?? ''}`}
              >
                {item.value}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
