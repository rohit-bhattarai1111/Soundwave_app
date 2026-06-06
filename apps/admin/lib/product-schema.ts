import { z } from "zod";

export const ProductBodySchema = z
  .object({
    title:      z.string().min(1, "Title is required."),
    artist:     z.string().min(1, "Artist is required."),
    genre:      z.enum(["Rock", "Jazz", "Hip-Hop", "Electronic"] as const),
    price:      z.number().positive("Price must be greater than 0."),
    salePrice:  z.number().positive("Sale price must be greater than 0.").nullable().optional(),
    stock:      z.number().int().min(0, "Stock cannot be negative."),
    imageUrl:   z.string().url().or(z.literal("")),
    previewUrl: z.string().default("/preview-placeholder.mp3"),
  })
  .refine(
    (data) => data.salePrice == null || data.salePrice < data.price,
    { message: "Sale price must be less than the regular price.", path: ["salePrice"] }
  );

export function salePriceToCents(salePrice: number | null | undefined): number | null {
  return salePrice != null ? Math.round(salePrice * 100) : null;
}

export function centsToSalePrice(salePriceInCents: number | null): number | null {
  return salePriceInCents != null ? salePriceInCents / 100 : null;
}
