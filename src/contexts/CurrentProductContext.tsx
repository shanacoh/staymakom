import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { ProductLike, ProductType } from "@/lib/analytics";

interface CurrentProduct {
  product: ProductLike;
  productType: ProductType;
}

interface CurrentProductContextValue {
  current: CurrentProduct | null;
  setCurrent: (value: CurrentProduct | null) => void;
}

const CurrentProductContext = createContext<CurrentProductContextValue | null>(null);

export function CurrentProductProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<CurrentProduct | null>(null);
  return (
    <CurrentProductContext.Provider value={{ current, setCurrent }}>
      {children}
    </CurrentProductContext.Provider>
  );
}

export function useCurrentProduct(): CurrentProduct | null {
  const ctx = useContext(CurrentProductContext);
  return ctx?.current ?? null;
}

// À appeler depuis une page produit (expérience, hôtel, bateau) déjà chargée en mémoire —
// alimente le bouton WhatsApp sans re-fetch, et se nettoie au démontage/changement de page.
export function useSetCurrentProduct(product: ProductLike | null, productType: ProductType | null) {
  const ctx = useContext(CurrentProductContext);
  useEffect(() => {
    if (!ctx || !product || !productType) return;
    ctx.setCurrent({ product, productType });
    return () => ctx.setCurrent(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, product?.slug, productType]);
}
