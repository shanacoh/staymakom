// Coût fournisseur d'une réservation d'expérience payée en ligne : ce que STAYMAKOM devra au
// prestataire, calculé avec les prix fournisseur de la fiche au moment du paiement.
// Il est enregistré sur la réservation (jamais montré au client) pour que la page Réservations
// n'affiche plus « Saisir le coût fournisseur » sur une réservation dont la fiche connaît le prix.
// Même logique de calcul que le prix de vente de process-standalone-payment, en prix fournisseur.

export interface SupplierPrices {
  adult: number | null;
  child: number | null;
}

export interface SupplierCostInput {
  adults: number;
  children: number;
  /** "fixed" = forfait : le prix fournisseur adulte est le prix du forfait entier. */
  priceType: string | null;
  hasChildPrice: boolean;
  /** Prix fournisseur de la fiche, ou de l'option tarifaire choisie s'il y en a une. */
  prices: SupplierPrices | null;
  /** Des extras ont été pris : leur coût fournisseur n'est pas connu. */
  hasExtras: boolean;
}

/**
 * Le coût fournisseur, ou null quand on ne peut pas le connaître sans risque de se tromper
 * (prix fournisseur absent ou à 0, extras dont le coût n'est pas connu) : la réservation reste
 * alors « à compléter » à la main, plutôt que d'afficher un chiffre faux.
 */
export function supplierCostOf(input: SupplierCostInput): number | null {
  if (input.hasExtras || !input.prices) return null;
  const adultPrice = input.prices.adult;
  if (adultPrice == null || adultPrice <= 0) return null;

  if (input.priceType === "fixed") return round(adultPrice);

  const childPrice = input.hasChildPrice && input.prices.child != null ? input.prices.child : adultPrice;
  return round(adultPrice * input.adults + childPrice * input.children);
}

const round = (value: number) => Math.round(value * 100) / 100;

// Le strict nécessaire du client base de données, pour ne pas dépendre de sa bibliothèque ici.
interface MaybeSingleQuery {
  eq(column: string, value: string): { maybeSingle(): Promise<{ data: Record<string, unknown> | null }> };
}
interface DbClient {
  from(table: string): { select(columns: string): MaybeSingleQuery };
}

const toNumber = (value: unknown): number | null => (value == null ? null : Number(value));

/** Lit les prix fournisseur (tables internes, réservées au serveur et aux admins). */
export async function loadSupplierPrices(
  db: DbClient,
  experienceId: string,
  rateOptionId: string | null,
): Promise<SupplierPrices | null> {
  const { data } = rateOptionId
    ? await db
        .from("standalone_rate_option_internal")
        .select("supplier_price_adult, supplier_price_child")
        .eq("rate_option_id", rateOptionId)
        .maybeSingle()
    : await db
        .from("standalone_experience_internal")
        .select("supplier_price_adult, supplier_price_child")
        .eq("experience_id", experienceId)
        .maybeSingle();
  if (!data) return null;
  return { adult: toNumber(data.supplier_price_adult), child: toNumber(data.supplier_price_child) };
}
