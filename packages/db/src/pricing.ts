export interface ProductPricing {
  priceInCents:     number;
  salePriceInCents: number | null;
}

export function isOnSale(product: ProductPricing): boolean {
  return (
    product.salePriceInCents !== null &&
    product.salePriceInCents > 0 &&
    product.salePriceInCents < product.priceInCents
  );
}

export function getEffectivePriceInCents(product: ProductPricing): number {
  return isOnSale(product) ? product.salePriceInCents! : product.priceInCents;
}
