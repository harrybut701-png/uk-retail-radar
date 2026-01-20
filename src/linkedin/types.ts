
import { z } from 'zod';

export const RetailersEnum = z.enum([
    "Holland and Barrett",
    "Boots",
    "Sainsbury's",
    "Ocado",
    "Tesco",
    "Waitrose",
    "Asda",
    "Morrisons"
]);

export const ProductSchema = z.object({
    product_name: z.string(),
    brand: z.string().nullable(),
    is_new_claim: z.boolean(),
    confidence: z.enum(["High", "Medium", "Low"]),
    category: z.string().describe("e.g. Drinks, Snacks, Beauty, Health, Frozen, etc."),
    evidence: z.string(),
    date_posted: z.string().nullable(),
    post_url: z.string().nullable()
});

export const ExtractionResultSchema = z.object({
    retailer: RetailersEnum.nullable(),
    products: z.array(ProductSchema)
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
export type ProductExtraction = z.infer<typeof ProductSchema>;
