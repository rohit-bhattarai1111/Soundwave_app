type OrderItemDisplay = {
  productTitle?: string | null;
  productArtist?: string | null;
  product?: { title: string; artist: string } | null;
};

export function getOrderItemTitle(item: OrderItemDisplay): string {
  return item.product?.title ?? item.productTitle ?? "Deleted product";
}

export function getOrderItemArtist(item: OrderItemDisplay): string {
  return item.product?.artist ?? item.productArtist ?? "";
}