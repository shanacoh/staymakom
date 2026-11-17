// Coût réel des appels à l'IA de la traduction automatique, et plafond de sécurité par passage.
// Prix publics Anthropic (dollars par million de tokens), relevés le 17/11/2026. Un modèle
// inconnu est compté au prix le plus élevé de la liste : le plafond ne peut que se déclencher
// plus tôt, jamais plus tard.

interface Price { input: number; output: number; cacheRead: number; cacheWrite: number }

const PRICES: Record<string, Price> = {
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.1, cacheWrite: 2.5 },
  "claude-sonnet-5": { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
  "claude-opus-5": { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  "claude-opus-4-8": { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  "claude-opus-4-7": { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
};
const UNKNOWN_MODEL_PRICE: Price = { input: 10, output: 50, cacheRead: 1, cacheWrite: 12.5 };

/** Plafond par passage (la tâche de nuit et ses relances comptent comme un seul passage). */
export const DEFAULT_COST_CAP_USD = 2;

export interface CallUsage {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

const priceOf = (model: string): Price => PRICES[model] ?? UNKNOWN_MODEL_PRICE;

/**
 * Coût d'un appel en dollars. Si un modèle de repli a pris le relais (refus du premier), tout
 * l'appel est compté au plus cher des deux modèles.
 */
export function callCostUsd(requestedModel: string, servedModel: string | null | undefined, usage: CallUsage): number {
  const a = priceOf(requestedModel);
  const b = servedModel ? priceOf(servedModel) : a;
  const p = b.output > a.output ? b : a;
  const tokens = (n: number | null | undefined) => (n ?? 0) / 1_000_000;
  return (
    tokens(usage.input_tokens) * p.input +
    tokens(usage.output_tokens) * p.output +
    tokens(usage.cache_read_input_tokens) * p.cacheRead +
    tokens(usage.cache_creation_input_tokens) * p.cacheWrite
  );
}

/** Compteur partagé par tous les appels d'un passage. */
export class CostMeter {
  usd = 0;
  constructor(readonly alreadySpentUsd: number, readonly capUsd: number) {}
  add(usd: number) {
    this.usd += usd;
  }
  /** Total du passage, relances précédentes comprises. */
  get totalUsd() {
    return this.alreadySpentUsd + this.usd;
  }
  get reached() {
    return this.totalUsd >= this.capUsd;
  }
}
