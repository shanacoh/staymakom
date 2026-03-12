/**
 * Utilitaires pour les modèles HyperGuest
 */

/**
 * Formate un prix avec sa devise
 */
export function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/**
 * Labels pour les types de pension
 */
export const BOARD_LABELS: Record<string, string> = {
  'RO': 'Room Only',
  'BB': 'Bed & Breakfast',
  'HB': 'Half Board',
  'FB': 'Full Board',
  'AI': 'All Inclusive',
  'SC': 'Self Catering',
};

/**
 * Obtient le label d'un type de pension
 */
export function getBoardTypeLabel(code: string): string {
  return BOARD_LABELS[code] || code || '';
}

/**
 * Formate les guests pour une requête HyperGuest
 * Exemple: [{adults: 2, children: [5, 7]}] => "2-5,7"
 */
export function formatGuests(guests: Array<{ adults: number; children?: number[] }>): string {
  return guests.map(room => {
    const parts = [room.adults.toString()];
    if (room.children && room.children.length > 0) {
      parts.push(room.children.join(','));
    }
    return parts.join('-');
  }).join('|');
}

/**
 * Calcule la date de checkout à partir du checkin et du nombre de nuits
 */
export function calculateCheckout(checkin: string, nights: number): string {
  const date = new Date(checkin);
  date.setDate(date.getDate() + nights);
  return date.toISOString().split('T')[0];
}

/**
 * Calcule le nombre de nuits entre deux dates
 */
export function calculateNights(checkin: string, checkout: string): number {
  const start = new Date(checkin);
  const end = new Date(checkout);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
