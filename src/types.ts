import { z } from 'zod';

export interface RetailerConfig {
    name: string;
    startUrl: string;
    type: string;
}

export const ProductSchema = z.object({
    retailer: z.string(),
    scrapedAt: z.string(), // ISO date
    id: z.string(), // SKU or hash
    name: z.string(),
    brand: z.string().optional(),
    price: z.number().nullable(), // unified as number if possible, or string if complex
    promoText: z.string().optional(),
    productUrl: z.string(),
    imageUrl: z.string().optional(),
    category: z.string().optional(),
    sourceType: z.enum(['html', 'json', 'xhr']),
});

export type Product = z.infer<typeof ProductSchema>;

export interface ScrapeResult {
    retailer: string;
    items: Product[];
    timestamp: string;
    durationMs: number;
}
