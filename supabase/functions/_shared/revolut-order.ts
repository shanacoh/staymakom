// Lecture d'une commande Revolut et reconnaissance de son origine.
//
// Deux origines possibles pour un paiement reçu :
//  - « site » : la commande a été créée par le site (parcours client, lien acompte/solde du
//    back-office, saisie manuelle). Une réservation doit forcément exister en face.
//  - « hors site » : la commande a été créée directement dans Revolut Business (lien de
//    paiement fait à la main). Le site ne peut pas la relier à une réservation, c'est normal.

/** Étiquette posée sur toutes les commandes créées par le site. */
export const SITE_ORDER_METADATA = { source: 'staymakom-site' } as const;

export type RevolutOrderSummary = {
  state: string;
  amount: number | null;
  currency: string | null;
  description: string | null;
  customerName: string | null;
  customerEmail: string | null;
  isSiteOrder: boolean;
  /** Paiement d'essai lancé depuis les outils de test Revolut du back-office : jamais de réservation en face. */
  isAdminTest: boolean;
};

function getEnvMode(): 'production' | 'dev' {
  const raw = (Deno.env.get('REVOLUT_ENVIRONMENT') || Deno.env.get('ENVIRONMENT') || '').trim().toLowerCase();
  return ['production', 'prod', 'live'].includes(raw) ? 'production' : 'dev';
}

function getRevolutBaseUrl(): string {
  return getEnvMode() === 'production'
    ? 'https://merchant.revolut.com/api'
    : 'https://sandbox-merchant.revolut.com/api';
}

function getSecretKey(): string {
  const isProd = getEnvMode() === 'production';
  return Deno.env.get(isProd ? 'REVOLUT_SECRET_KEY_PROD' : 'REVOLUT_SECRET_KEY') || '';
}

/**
 * Vrai si la commande vient du site. Les commandes créées avant l'étiquette sont reconnues
 * à leur libellé (toujours écrit par le site) ou à leur référence de réservation.
 */
// deno-lint-ignore no-explicit-any
function detectSiteOrder(data: any): boolean {
  if (data?.metadata?.source === SITE_ORDER_METADATA.source) return true;
  if (data?.merchant_order_ext_ref) return true;
  const description = String(data?.description || '').trim();
  return /^(staymakom|acompte —|solde —)/i.test(description);
}

export async function fetchRevolutOrder(orderId: string): Promise<RevolutOrderSummary> {
  const response = await fetch(`${getRevolutBaseUrl()}/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${getSecretKey()}`,
      'Revolut-Api-Version': '2024-09-01',
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Revolut get-order failed: ${response.status} — ${errorText}`);
  }
  const data = await response.json();
  return {
    state: data.state as string,
    // Revolut compte en centimes.
    amount: typeof data.amount === 'number' ? data.amount / 100 : null,
    currency: data.currency ?? null,
    description: data.description ?? null,
    customerName: data.customer?.full_name ?? null,
    customerEmail: data.customer?.email ?? null,
    isSiteOrder: detectSiteOrder(data),
    isAdminTest: /live payment test|debug test/i.test(String(data.description || '')),
  };
}
