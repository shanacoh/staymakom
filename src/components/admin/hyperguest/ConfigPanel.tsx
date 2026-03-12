import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Server, Key, Globe, Clock, Shield } from 'lucide-react';

const configItems = [
  { icon: Globe, label: 'Environment', value: 'PRODUCTION', note: 'Secret: ENVIRONMENT' },
  { icon: Key, label: 'Token (8 last)', value: '...995b5f4', note: 'Secret: HYPERGUEST_TOKEN_PROD' },
  { icon: Shield, label: 'isTest', value: 'false', note: 'Forcé par ENVIRONMENT=production' },
  { icon: Server, label: 'Search URL', value: 'search-api.hyperguest.io/2.0/', note: 'Availability search' },
  { icon: Server, label: 'Book URL', value: 'book-api.hyperguest.com/2.0/', note: 'Booking & cancellation' },
  { icon: Globe, label: 'Property live', value: '23860', note: 'Production property' },
  { icon: Globe, label: 'Property cert', value: '19912', note: 'Certification sandbox' },
  { icon: Clock, label: 'Timeout booking', value: '300s', note: 'AbortController 300000ms' },
  { icon: Globe, label: 'CORS', value: 'staymakom.com', note: 'Allow-Origin: *' },
  { icon: CheckCircle2, label: 'Cancel simulate', value: '✅ Implémenté', note: 'cancelSimulation: true' },
  { icon: Clock, label: 'React Query', value: 'staleTime 2min', note: 'useHyperGuestAvailability' },
];

export function ConfigPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Configuration HyperGuest</CardTitle>
        <p className="text-sm text-muted-foreground">Vue en lecture seule de la configuration actuelle.</p>
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
              <Badge variant="secondary" className="font-mono text-xs">
                {item.value}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
